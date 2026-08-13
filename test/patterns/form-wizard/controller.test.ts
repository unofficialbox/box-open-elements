import { describe, expect, it, vi } from "vitest";

import { FormWizardController } from "../../../src/patterns/form-wizard/controller.js";
import type { WizardSessionConfig } from "../../../src/patterns/form-wizard/types.js";

const threeSteps = (overrides: Partial<WizardSessionConfig> = {}): WizardSessionConfig => ({
  steps: [
    { id: "details", label: "Details" },
    { id: "terms", label: "Terms" },
    { id: "review", label: "Review" },
  ],
  ...overrides,
});

describe("FormWizardController navigation", () => {
  it("requires at least one step", () => {
    expect(() => new FormWizardController({ steps: [] })).toThrow("at least one step");
  });

  it("starts on the first step and walks forward and back", () => {
    const wizard = new FormWizardController(threeSteps());
    const changed = vi.fn();
    wizard.subscribe("stepChanged", changed);

    expect(wizard.getState().currentStepId).toBe("details");
    expect(wizard.isFirstStep).toBe(true);

    expect(wizard.next()).toBe(true);
    expect(wizard.getState().currentStepId).toBe("terms");
    expect(wizard.previous()).toBe(true);
    expect(wizard.getState().currentStepId).toBe("details");
    expect(wizard.previous()).toBe(false);
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it("tracks visited steps and allows jumping back to them without validation", () => {
    const validator = vi.fn().mockReturnValue({ valid: true });
    const wizard = new FormWizardController(threeSteps({ validators: { details: validator } }));

    wizard.next();
    wizard.next();
    expect(wizard.getState().visitedStepIds).toEqual(["details", "terms", "review"]);

    validator.mockClear();
    expect(wizard.goTo("details")).toBe(true);
    expect(validator).not.toHaveBeenCalled();
    // Jumping forward to an already-visited step also skips validation.
    expect(wizard.goTo("review")).toBe(true);
    expect(validator).not.toHaveBeenCalled();
  });

  it("gates forward navigation on the current step's validator", () => {
    const wizard = new FormWizardController(
      threeSteps({
        validators: {
          details: values =>
            values.name ? { valid: true } : { valid: false, message: "Name is required." },
        },
      }),
    );
    const invalid = vi.fn();
    wizard.subscribe("stepInvalid", invalid);

    expect(wizard.next()).toBe(false);
    expect(wizard.getState().currentStepId).toBe("details");
    expect(wizard.getState().stepError).toEqual({ valid: false, message: "Name is required." });
    expect(invalid).toHaveBeenCalledWith({
      stepId: "details",
      validation: { valid: false, message: "Name is required." },
    });

    wizard.setValue("name", "MSA_Acme_v4");
    expect(wizard.getState().stepError).toBeNull();
    expect(wizard.next()).toBe(true);
  });

  it("gates every intermediate step when jumping forward and stops on the first failure", () => {
    const wizard = new FormWizardController(
      threeSteps({
        validators: {
          terms: () => ({ valid: false, message: "Pick a term." }),
        },
      }),
    );

    expect(wizard.goTo("review")).toBe(false);
    // Passed details, stopped on terms.
    expect(wizard.getState().currentStepId).toBe("terms");
    expect(wizard.getState().stepError?.message).toBe("Pick a term.");
  });

  it("skips validation for optional steps", () => {
    const wizard = new FormWizardController({
      steps: [
        { id: "details", label: "Details" },
        { id: "attachments", label: "Attachments", optional: true },
        { id: "review", label: "Review" },
      ],
      validators: {
        attachments: () => ({ valid: false, message: "never called on next()" }),
      },
    });

    wizard.next();
    expect(wizard.getState().currentStepId).toBe("attachments");
    expect(wizard.next()).toBe(true);
    expect(wizard.getState().currentStepId).toBe("review");
  });
});

describe("FormWizardController values, drafts, and submit", () => {
  it("merges values and emits valuesChanged", () => {
    const wizard = new FormWizardController(threeSteps({ initialValues: { priority: "high" } }));
    const changed = vi.fn();
    wizard.subscribe("valuesChanged", changed);

    wizard.setValue("counterparty", "Acme");
    wizard.setValues({ type: "MSA", priority: "urgent" });

    expect(wizard.getState().values).toEqual({ counterparty: "Acme", type: "MSA", priority: "urgent" });
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it("saves drafts without validating", () => {
    const wizard = new FormWizardController(
      threeSteps({ validators: { details: () => ({ valid: false }) } }),
    );
    const drafted = vi.fn();
    wizard.subscribe("draftSaved", drafted);

    wizard.setValue("partial", true);
    wizard.saveDraft();

    expect(drafted).toHaveBeenCalledWith({ values: { partial: true } });
  });

  it("submit validates every required step and navigates to the first failure", () => {
    const wizard = new FormWizardController(
      threeSteps({
        validators: {
          terms: values => (values.term ? { valid: true } : { valid: false, message: "Pick a term." }),
        },
      }),
    );
    const submitted = vi.fn();
    wizard.subscribe("submitted", submitted);

    wizard.next();
    wizard.setValue("term", "3y");
    wizard.next();

    // Break the earlier step, then submit from the last one.
    wizard.setValue("term", "");
    expect(wizard.submit()).toBe(false);
    expect(wizard.getState().currentStepId).toBe("terms");
    expect(submitted).not.toHaveBeenCalled();

    wizard.setValue("term", "3y");
    wizard.goTo("review");
    expect(wizard.submit()).toBe(true);
    expect(wizard.getState().submitted).toBe(true);
    expect(submitted).toHaveBeenCalledWith({ values: { term: "3y" } });
  });

  it("submit ignores optional steps", () => {
    const wizard = new FormWizardController({
      steps: [
        { id: "details", label: "Details" },
        { id: "attachments", label: "Attachments", optional: true },
      ],
      validators: { attachments: () => ({ valid: false }) },
    });

    expect(wizard.submit()).toBe(true);
  });

  it("reset restores the initial state", () => {
    const wizard = new FormWizardController(threeSteps({ initialValues: { seed: 1 } }));
    wizard.setValue("extra", true);
    wizard.next();

    wizard.reset();

    expect(wizard.getState().currentStepId).toBe("details");
    expect(wizard.getState().values).toEqual({ seed: 1 });
    expect(wizard.getState().visitedStepIds).toEqual(["details"]);
    expect(wizard.getState().submitted).toBe(false);
  });
});
