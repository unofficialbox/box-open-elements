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
  });
});
