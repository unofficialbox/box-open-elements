import { afterEach, describe, expect, it, vi } from "vitest";

import { WizardSummary } from "../../../src/patterns/form-wizard/wizard-summary.js";
import {
  formatWizardValue,
  summarizeWizardValues,
} from "../../../src/patterns/form-wizard/types.js";
import type {
  WizardStepConfig,
  WizardSummaryField,
} from "../../../src/patterns/form-wizard/types.js";

WizardSummary.register();

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
};

const steps: WizardStepConfig[] = [
  { id: "parties", label: "Parties" },
  { id: "terms", label: "Terms" },
  { id: "review", label: "Review" },
];

// Declared out of step order on purpose: the summary must read back in step
// order, not in the order the fields happen to be listed.
const fields: WizardSummaryField[] = [
  { key: "cap", label: "Liability cap", stepId: "terms" },
  { key: "counterparty", label: "Counterparty", stepId: "parties" },
  { key: "autoRenew", label: "Auto-renew", stepId: "terms" },
  { key: "owner", label: "Contract owner", stepId: "parties" },
];

const values: Record<string, unknown> = {
  counterparty: "Acme Corp",
  owner: "Morgan Lee",
  cap: "2x fees",
  autoRenew: false,
};

const mount = async (
  configure: (element: WizardSummary) => void = () => {},
): Promise<WizardSummary> => {
  const element = document.createElement("box-wizard-summary") as WizardSummary;
  element.steps = steps;
  element.fields = fields;
  element.values = values;
  configure(element);
  document.body.append(element);
  await flush();
  return element;
};

const all = (element: WizardSummary, selector: string): HTMLElement[] =>
  Array.from(element.shadowRoot!.querySelectorAll(selector));

const q = (element: WizardSummary, selector: string): HTMLElement | null =>
  element.shadowRoot!.querySelector(selector);

afterEach(() => {
  document.body.innerHTML = "";
});

describe("formatWizardValue", () => {
  it("renders false as an answer, not as a blank", () => {
    // `false` is a real answer — rendering it blank would read as unanswered.
    expect(formatWizardValue(false)).toBe("No");
    expect(formatWizardValue(true)).toBe("Yes");
  });

  it("treats nothing-collected cases as empty", () => {
    expect(formatWizardValue(null)).toBe("");
    expect(formatWizardValue(undefined)).toBe("");
    expect(formatWizardValue("")).toBe("");
    expect(formatWizardValue([])).toBe("");
    expect(formatWizardValue(Number.NaN)).toBe("");
  });

  it("joins arrays and formats scalars", () => {
    expect(formatWizardValue(["Legal", "Finance"])).toBe("Legal, Finance");
    expect(formatWizardValue(0)).toBe("0");
    expect(formatWizardValue(new Date("2026-08-13T12:00:00.000Z"))).toBe("2026-08-13");
  });
});

describe("summarizeWizardValues", () => {
  it("orders sections by step, not by field declaration order", () => {
    const sections = summarizeWizardValues(fields, values, steps);
    expect(sections.map(section => section.stepId)).toEqual(["parties", "terms"]);
    expect(sections[0]!.rows.map(row => row.key)).toEqual(["counterparty", "owner"]);
  });

  it("keeps a field whose step does not exist, in a trailing section", () => {
    // Dropping it would let someone confirm a submission without ever seeing
    // the value — the one failure mode a review card must not have.
    const strays: WizardSummaryField[] = [
      ...fields,
      { key: "notes", label: "Internal notes", stepId: "typo-step" },
    ];
    const sections = summarizeWizardValues(strays, values, steps);

    expect(sections.map(section => section.stepId)).toEqual(["parties", "terms", "typo-step"]);
    expect(sections.at(-1)?.unknownStep).toBe(true);
    expect(sections.at(-1)?.label).toBe("Other answers");
    expect(sections.flatMap(section => section.rows.map(row => row.key))).toContain("notes");
  });

  it("marks uncollected fields empty rather than omitting the row", () => {
    const sections = summarizeWizardValues(fields, { counterparty: "Acme Corp" }, steps);
    const rows = sections.flatMap(section => section.rows);
    expect(rows).toHaveLength(4);
    expect(rows.filter(row => row.empty).map(row => row.key)).toEqual(["owner", "cap", "autoRenew"]);
  });

  it("uses a field's format override", () => {
    const sections = summarizeWizardValues(
      [{ key: "cap", label: "Liability cap", stepId: "terms", format: value => `USD ${String(value)}` }],
      { cap: 250000 },
      steps,
    );
    expect(sections[0]!.rows[0]!.value).toBe("USD 250000");
  });

  it("returns nothing when there are no fields", () => {
    expect(summarizeWizardValues([], values, steps)).toEqual([]);
  });
});

describe("box-wizard-summary", () => {
  it("renders one section per contributing step, in step order", async () => {
    const element = await mount();

    expect(all(element, '[part="section"]').map(n => n.getAttribute("data-step-id"))).toEqual([
      "parties",
      "terms",
    ]);
    expect(all(element, '[part="section-label"]').map(n => n.textContent)).toEqual([
      "Parties",
      "Terms",
    ]);
  });

  it("pairs each label with its value as a description list", async () => {
    const element = await mount();

    expect(all(element, "dt").map(n => n.textContent)).toEqual([
      "Counterparty",
      "Contract owner",
      "Liability cap",
      "Auto-renew",
    ]);
    expect(all(element, "dd").map(n => n.textContent)).toEqual([
      "Acme Corp",
      "Morgan Lee",
      "2x fees",
      "No",
    ]);
  });

  it("shows a placeholder for an uncollected value", async () => {
    const element = await mount(el => {
      el.values = { counterparty: "Acme Corp" };
    });

    const owner = all(element, "dd").find(n => n.getAttribute("data-key") === "owner");
    expect(owner?.textContent).toBe("Not provided");
    expect(owner?.getAttribute("data-empty")).toBe("true");
  });

  it("names each Edit control by its step", async () => {
    const element = await mount();

    const edits = all(element, '[part="edit"]');
    // Five buttons all called "Edit" tell a screen-reader user nothing.
    expect(edits.map(n => n.getAttribute("aria-label"))).toEqual(["Edit Parties", "Edit Terms"]);
    expect(edits.map(n => n.textContent)).toEqual(["Edit", "Edit"]);
  });

  it("emits edit-requested with the step id rather than navigating", async () => {
    const element = await mount();
    const requested = vi.fn();
    element.addEventListener("edit-requested", requested);

    (all(element, '[part="edit"]')[1] as HTMLButtonElement).click();
    await flush();

    expect(requested).toHaveBeenCalledTimes(1);
    expect((requested.mock.calls[0]![0] as CustomEvent<{ stepId: string }>).detail).toEqual({
      stepId: "terms",
    });
  });

  it("offers no Edit control for a section with no step to return to", async () => {
    const element = await mount(el => {
      el.fields = [{ key: "notes", label: "Internal notes", stepId: "typo-step" }];
      el.values = { notes: "Escalated by legal" };
    });

    const section = q(element, '[part="section"]');
    expect(section?.getAttribute("data-unknown-step")).toBe("true");
    expect(q(element, '[part="edit"]')).toBeNull();
    // Still rendered — the value is visible even though its step is not.
    expect(q(element, "dd")?.textContent).toBe("Escalated by legal");
  });

  it("shows an empty state when there is nothing to review", async () => {
    const element = await mount(el => {
      el.fields = [];
    });

    expect(q(element, '[part="empty"]')).not.toBeNull();
    expect(all(element, '[part="section"]')).toHaveLength(0);
  });

  it("re-renders when values change", async () => {
    const element = await mount();
    element.values = { ...values, counterparty: "Globex Ltd" };
    await flush();

    expect(all(element, "dd")[0]?.textContent).toBe("Globex Ltd");
  });

  it("escapes hostile field and value content", async () => {
    const element = await mount(el => {
      el.steps = [{ id: "s1", label: "<i>step</i>" }];
      el.fields = [{ key: "x", label: "<script>alert('label')</script>", stepId: "s1" }];
      el.values = { x: "<img src=x onerror=alert(1)>" };
    });

    expect(element.shadowRoot!.querySelector("script")).toBeNull();
    expect(element.shadowRoot!.querySelector("img")).toBeNull();
    expect(element.shadowRoot!.querySelector("i")).toBeNull();
    expect(q(element, "dt")?.textContent).toBe("<script>alert('label')</script>");
    expect(q(element, "dd")?.textContent).toBe("<img src=x onerror=alert(1)>");
  });

  it("ignores a malformed fields payload", async () => {
    const element = document.createElement("box-wizard-summary") as WizardSummary;
    element.setAttribute("fields", '[{"key":"ok","label":"Fine","stepId":"s1"},{"label":"no key"}]');
    document.body.append(element);
    await flush();

    expect(element.fields).toEqual([]);
    expect(q(element, '[part="empty"]')).not.toBeNull();
  });

  it("accepts fields, steps and values as JSON attributes", async () => {
    const element = document.createElement("box-wizard-summary") as WizardSummary;
    element.setAttribute("steps", JSON.stringify(steps));
    element.setAttribute("fields", JSON.stringify(fields));
    element.setAttribute("values", JSON.stringify(values));
    document.body.append(element);
    await flush();

    expect(all(element, '[part="section"]').map(n => n.getAttribute("data-step-id"))).toEqual([
      "parties",
      "terms",
    ]);
  });
});
