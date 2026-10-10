import { afterEach, describe, expect, it, vi } from "vitest";

import { FormWizard } from "../../../src/patterns/form-wizard/form-wizard.js";

FormWizard.register();

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
};

const stepPanel = (slot: string, text: string): HTMLElement => {
  const node = document.createElement("div");
  node.slot = slot;
  node.textContent = text;
  return node;
};

const mountWizard = async (configure?: (element: FormWizard) => void): Promise<FormWizard> => {
  const element = document.createElement("box-form-wizard") as FormWizard;
  element.steps = [
    { id: "details", label: "Details" },
    { id: "terms", label: "Terms" },
    { id: "review", label: "Review" },
  ];
  element.append(stepPanel("details", "Details form"), stepPanel("terms", "Terms form"), stepPanel("review", "Review summary"));
  configure?.(element);
  document.body.append(element);
  await flush();
  return element;
};

const visiblePanelId = (element: FormWizard): string | undefined =>
  Array.from(element.shadowRoot?.querySelectorAll<HTMLElement>('[part="panel"]') ?? []).find(
    panel => !panel.hidden,
  )?.dataset.stepId;

afterEach(() => {
  document.body.innerHTML = "";
});

describe("box-form-wizard", () => {
  it("shows only the active step's panel and syncs the rail", async () => {
    const element = await mountWizard();

    expect(visiblePanelId(element)).toBe("details");
    const rail = element.shadowRoot?.querySelector('[part="rail"]') as HTMLElement & { value: string };
    expect(rail.value).toBe("details");

    (element.shadowRoot?.querySelector('[part="next"]') as HTMLButtonElement).click();
    await flush();

    expect(visiblePanelId(element)).toBe("terms");
    expect(rail.value).toBe("terms");
  });

  it("names the wizard by its heading and focuses the new panel after Next", async () => {
    const element = await mountWizard(el => { el.heading = "Your first load test"; });
    const wizard = element.shadowRoot?.querySelector('[part="wizard"]');
    expect(wizard?.getAttribute("aria-labelledby")).toBe("wizard-title");
    expect(wizard?.hasAttribute("aria-label")).toBe(false);
    (element.shadowRoot?.querySelector('[part="next"]') as HTMLButtonElement).click();
    await flush();
    expect(element.shadowRoot?.activeElement).toBe(
      element.shadowRoot?.querySelector('[part="panel"][data-step-id="terms"]'),
    );
    expect(element.shadowRoot?.querySelector("style")?.textContent).toContain("--boe-token-text-status-text-error");
  });

  it("keeps Back disabled on the first step and swaps Next for Submit on the last", async () => {
    const element = await mountWizard(el => {
      el.submitLabel = "Submit request";
    });

    const back = element.shadowRoot?.querySelector('[part="back"]') as HTMLButtonElement;
    const next = element.shadowRoot?.querySelector('[part="next"]') as HTMLButtonElement;
    const submit = element.shadowRoot?.querySelector('[part="submit"]') as HTMLButtonElement;
    expect(back.disabled).toBe(true);
    expect(next.hidden).toBe(false);
    expect(submit.hidden).toBe(true);

    next.click();
    next.click();
    await flush();

    expect(back.disabled).toBe(false);
    expect(next.hidden).toBe(true);
    expect(submit.hidden).toBe(false);
    expect(submit.textContent).toBe("Submit request");
  });

  it("blocks Next on a failing validator and shows the message as an alert", async () => {
    const element = await mountWizard(el => {
      el.validators = {
        details: values =>
          values.name ? { valid: true } : { valid: false, message: "Name is required." },
      };
    });
    const invalid = vi.fn();
    element.addEventListener("step-invalid", invalid);

    (element.shadowRoot?.querySelector('[part="next"]') as HTMLButtonElement).click();
    await flush();

    const error = element.shadowRoot?.querySelector('[part="error"]') as HTMLElement;
    expect(visiblePanelId(element)).toBe("details");
    expect(error.hidden).toBe(false);
    expect(error.textContent).toBe("Name is required.");
    expect(error.getAttribute("role")).toBe("alert");
    expect(invalid).toHaveBeenCalledTimes(1);

    element.setValue("name", "MSA_Acme_v4");
    (element.shadowRoot?.querySelector('[part="next"]') as HTMLButtonElement).click();
    await flush();
    expect(visiblePanelId(element)).toBe("terms");
    expect((element.shadowRoot?.querySelector('[part="error"]') as HTMLElement).hidden).toBe(true);
  });

  it("routes rail clicks through gating and re-syncs on refusal", async () => {
    const element = await mountWizard(el => {
      el.validators = { details: () => ({ valid: false, message: "Blocked." }) };
    });

    const rail = element.shadowRoot?.querySelector('[part="rail"]') as HTMLElement & { value: string };
    const reviewStep = rail.shadowRoot?.querySelector('[data-value="review"]') as HTMLButtonElement;
    reviewStep.click();
    await flush();

    expect(visiblePanelId(element)).toBe("details");
    expect(rail.value).toBe("details");
    expect((element.shadowRoot?.querySelector('[part="error"]') as HTMLElement).textContent).toBe("Blocked.");
  });

  it("renders a full-width path with independent states and accessible step details", async () => {
    const element = await mountWizard(el => {
      el.stepsLayout = "path";
      el.steps = [
        { id: "details", label: "Details", description: "For a live run" },
        { id: "terms", label: "Terms", optional: true },
        { id: "review", label: "Review" },
      ];
      el.stepStatuses = { terms: "complete", review: "visited" };
    });

    const layout = element.shadowRoot?.querySelector<HTMLElement>('[part="layout"]');
    const path = element.shadowRoot?.querySelector<HTMLElement>('[part="path"]');
    const rail = element.shadowRoot?.querySelector<HTMLElement>('[part="rail"]');
    const buttons = path?.querySelectorAll<HTMLButtonElement>('[part="path-step"]');
    expect(layout?.dataset.stepsLayout).toBe("path");
    expect(rail?.hasAttribute("data-container-compact")).toBe(true);
    expect(rail?.shadowRoot?.querySelector('[data-value="terms"]')?.textContent).toContain("Optional");
    expect(buttons).toHaveLength(3);
    expect(buttons?.[0]?.getAttribute("aria-current")).toBe("step");
    expect(buttons?.[0]?.getAttribute("aria-describedby")).toBe("wizard-path-description-0");
    expect(path?.querySelector("#wizard-path-description-0")?.textContent).toBe("For a live run");
    expect(buttons?.[1]?.dataset.state).toBe("complete");
    expect(buttons?.[1]?.textContent).toContain("Optional");
    expect(buttons?.[2]?.dataset.state).toBe("visited");
    expect(buttons?.[2]?.querySelector('[part="path-state"]')?.textContent).toBe("Visited");
    const styles = element.shadowRoot?.querySelector("style")?.textContent;
    expect(styles).toContain("min-height: 1.75rem;");
    expect(styles).toContain("padding: 0.45em 1.35rem;");
    expect(styles).toContain('@container boe-wizard-path (max-width: 820px)');
    expect(styles).toContain('@container boe-wizard-path (max-width: 720px)');
    expect(element.shadowRoot?.querySelector("style")?.textContent).toContain(
      '[part="layout"][data-steps-layout="path"] [part="path-nav"] { display: none; }',
    );
  });

  it("removes the container-compact hook from the default vertical rail", async () => {
    const element = await mountWizard(el => { el.stepsLayout = "path"; });
    const rail = element.shadowRoot?.querySelector<HTMLElement>('[part="rail"]');
    expect(rail?.hasAttribute("data-container-compact")).toBe(true);
    element.stepsLayout = "rail";
    await flush();
    expect(rail?.hasAttribute("data-container-compact")).toBe(false);
  });

  it("gates path clicks, reports errors, and keeps completed stages after going back", async () => {
    const element = await mountWizard(el => {
      el.stepsLayout = "path";
      el.validators = { details: values => values.name
        ? { valid: true }
        : { valid: false, message: "Name is required." } };
    });
    const pathButton = (stepId: string): HTMLButtonElement =>
      element.shadowRoot?.querySelector<HTMLButtonElement>(`[part="path-step"][data-step-id="${stepId}"]`)!;

    pathButton("review").click();
    await flush();
    expect(visiblePanelId(element)).toBe("details");
    expect(pathButton("details").dataset.state).toBe("failed");
    expect(pathButton("details").getAttribute("aria-invalid")).toBe("true");
    expect(pathButton("details").getAttribute("aria-current")).toBe("step");
    expect((element.shadowRoot?.querySelector('[part="error"]') as HTMLElement).textContent).toBe("Name is required.");

    element.setValue("name", "Acme");
    pathButton("review").click();
    await flush();
    expect(visiblePanelId(element)).toBe("review");
    pathButton("details").click();
    await flush();
    expect(pathButton("terms").dataset.state).toBe("complete");
    expect(pathButton("review").dataset.state).toBe("visited");
    expect(pathButton("details").tabIndex).toBe(0);
  });

  it("uses rail-style arrow and Home/End navigation in the path", async () => {
    const element = await mountWizard(el => { el.stepsLayout = "path"; });
    const pathButton = (stepId: string): HTMLButtonElement =>
      element.shadowRoot?.querySelector<HTMLButtonElement>(`[part="path-step"][data-step-id="${stepId}"]`)!;
    pathButton("details").dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    await flush();
    expect(visiblePanelId(element)).toBe("review");
    expect(pathButton("review").getAttribute("aria-current")).toBe("step");

    pathButton("review").dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    await flush();
    expect(visiblePanelId(element)).toBe("details");
    pathButton("details").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await flush();
    expect(visiblePanelId(element)).toBe("terms");
  });

  it("updates display overrides without replacing the wizard session or its validation gates", async () => {
    const element = await mountWizard(el => {
      el.stepsLayout = "path";
      el.validators = { details: () => ({ valid: false, message: "Still required." }) };
    });
    const controller = element.wizardController;
    element.stepStatuses = { terms: "complete", review: "failed" };
    expect(element.wizardController).toBe(controller);
    expect(element.shadowRoot?.querySelector('[data-step-id="terms"]')?.getAttribute("data-state")).toBe("complete");
    expect(element.shadowRoot?.querySelector('[data-step-id="review"]')?.getAttribute("aria-invalid")).toBe("true");

    element.shadowRoot?.querySelector<HTMLButtonElement>('[part="path-step"][data-step-id="review"]')?.click();
    await flush();
    expect(visiblePanelId(element)).toBe("details");
    expect(element.wizardController).toBe(controller);
    expect(element.stepStatuses).toEqual({ terms: "complete", review: "failed" });
  });

  it("preserves completed and visited rail states when navigating backward", async () => {
    const element = await mountWizard();
    element.goTo("review");
    element.goTo("details");
    await flush();

    const rail = element.shadowRoot?.querySelector('[part="rail"]') as HTMLElement;
    const stateOf = (stepId: string): string | undefined =>
      rail.shadowRoot?.querySelector<HTMLElement>(`[data-value="${stepId}"]`)?.dataset.state;
    const statusOf = (stepId: string): string | undefined =>
      rail.shadowRoot?.querySelector<HTMLElement>(`[data-value="${stepId}"] [part="step-status"]`)?.textContent ?? undefined;

    expect(stateOf("details")).toBe("current");
    expect(stateOf("terms")).toBe("complete");
    expect(statusOf("terms")).toBe("Complete");
    expect(stateOf("review")).toBe("visited");
    expect(statusOf("review")).toBe("Visited");

    element.reset();
    await flush();
    expect(stateOf("terms")).toBe("upcoming");
    expect(stateOf("review")).toBe("upcoming");
  });

  it("treats a visited optional step and a submitted final step as complete", async () => {
    const optional = await mountWizard(el => {
      el.steps = [
        { id: "details", label: "Details" },
        { id: "terms", label: "Terms", optional: true },
        { id: "review", label: "Review" },
      ];
    });
    optional.goTo("terms");
    optional.goTo("details");
    const optionalRail = optional.shadowRoot?.querySelector('[part="rail"]') as HTMLElement;
    expect(optionalRail.shadowRoot?.querySelector('[data-value="terms"]')?.getAttribute("data-state")).toBe("complete");

    const submitted = await mountWizard();
    submitted.goTo("review");
    submitted.submit();
    submitted.goTo("details");
    const submittedRail = submitted.shadowRoot?.querySelector('[part="rail"]') as HTMLElement;
    expect(submittedRail.shadowRoot?.querySelector('[data-value="review"]')?.getAttribute("data-state")).toBe("complete");
  });

  it("renders the Save draft button only when draft-label is set and emits draft-saved", async () => {
    const element = await mountWizard(el => {
      el.draftLabel = "Save draft";
      el.initialValues = { priority: "high" };
    });
    const drafted = vi.fn();
    element.addEventListener("draft-saved", drafted);

    const draft = element.shadowRoot?.querySelector('[part="draft"]') as HTMLButtonElement;
    expect(draft.hidden).toBe(false);
    expect(draft.textContent).toBe("Save draft");

    draft.click();
    expect(drafted.mock.calls[0]?.[0]?.detail).toEqual({ values: { priority: "high" } });
  });

  it("hides the Save draft button by default", async () => {
    const element = await mountWizard();

    expect((element.shadowRoot?.querySelector('[part="draft"]') as HTMLButtonElement).hidden).toBe(true);
  });

  it("emits submitted with the collected values", async () => {
    const element = await mountWizard();
    const submitted = vi.fn();
    element.addEventListener("submitted", submitted);

    element.setValues({ counterparty: "Acme", type: "MSA" });
    element.goTo("review");
    await flush();
    (element.shadowRoot?.querySelector('[part="submit"]') as HTMLButtonElement).click();
    await flush();

    expect(submitted).toHaveBeenCalledTimes(1);
    expect(submitted.mock.calls[0]?.[0]?.detail).toEqual({
      values: { counterparty: "Acme", type: "MSA" },
    });
  });

  it("ignores malformed steps payloads", async () => {
    const element = document.createElement("box-form-wizard") as FormWizard;
    element.setAttribute("steps", '[{"id":1,"label":"Bad"}]');
    document.body.append(element);
    await flush();

    expect(element.steps).toEqual([]);
    expect(element.wizardController).toBeNull();

    element.setAttribute("steps", '[{"id":"valid","label":"Valid","description":42}]');
    await flush();
    expect(element.steps).toEqual([]);
    expect(element.wizardController).toBeNull();
  });
});
