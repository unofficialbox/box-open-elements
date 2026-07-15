// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxItemDetailsPanelElement,
  defineBoxItemDetailsPanelElement,
} from "../../../src/patterns/item/item-details-panel.js";

describe("BoxItemDetailsPanelElement", () => {
  beforeEach(() => {
    defineBoxItemDetailsPanelElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders title, owner, and metadata rows", () => {
    const element = document.createElement("box-item-details-panel") as BoxItemDetailsPanelElement;
    element.heading = "Brand Strategy.pdf";
    element.owner = {
      name: "Morgan Lee",
      description: "Content Designer",
      status: "Owner",
    };
    element.meta = [
      { label: "Classification", value: "Internal" },
      { label: "Updated", value: "Today" },
    ];

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Brand Strategy.pdf");
    expect(element.shadowRoot?.textContent).toContain("Morgan Lee");
    expect(element.shadowRoot?.textContent).toContain("Classification");
    expect(element.shadowRoot?.textContent).toContain("Internal");
  });

  it("emits action when an action button is clicked", () => {
    const element = document.createElement("box-item-details-panel") as BoxItemDetailsPanelElement;
    const action = vi.fn();
    element.heading = "Brand Strategy.pdf";
    element.actions = [
      { id: "open", label: "Open", tone: "primary" },
      { id: "share", label: "Share" },
    ];
    element.addEventListener("action", action);

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Brand Strategy.pdf");

    const button = element.shadowRoot?.querySelector('[data-action-id="share"]') as HTMLButtonElement | null;
    button?.click();

    expect(action).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { action: "share" },
      }),
    );
  });
});
