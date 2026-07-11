// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxGovernancePanelElement,
  defineBoxGovernancePanelElement,
} from "../../../src/patterns/governance/governance-panel.js";

describe("BoxGovernancePanelElement", () => {
  beforeEach(() => {
    defineBoxGovernancePanelElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders governance signals and policies", () => {
    const element = document.createElement("box-governance-panel") as BoxGovernancePanelElement;
    element.title = "Governance";
    element.status = "Compliant";
    element.signals = [
      { label: "External sharing", tone: "warning" },
    ];
    element.policies = [
      { label: "Retention policy", value: "FY26 Launch", description: "7-year retention schedule." },
    ];

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Compliant");
    expect(element.shadowRoot?.textContent).toContain("External sharing");
    expect(element.shadowRoot?.textContent).toContain("Retention policy");
  });

  it("emits action and policy-selected events", () => {
    const element = document.createElement("box-governance-panel") as BoxGovernancePanelElement;
    const action = vi.fn();
    const policySelected = vi.fn();
    element.actions = [
      { id: "open-retention", label: "Open retention", tone: "primary" },
    ];
    element.policies = [
      { label: "Classification", value: "Restricted", description: "Applies to launch-sensitive content." },
    ];
    element.addEventListener("action", action);
    element.addEventListener("policy-selected", policySelected);

    document.body.append(element);

    const actionButton = element.shadowRoot?.querySelector('[data-action-id="open-retention"]') as HTMLButtonElement | null;
    const policyButton = element.shadowRoot?.querySelector('[data-policy-label="Classification"]') as HTMLButtonElement | null;

    actionButton?.click();
    policyButton?.click();

    expect(action).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { action: "open-retention" },
      }),
    );
    expect(policySelected).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          label: "Classification",
          value: "Restricted",
        }),
      }),
    );
  });
});
