// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxBulkActionBarElement,
  defineBoxBulkActionBarElement,
} from "../../../src/patterns/item/bulk-action-bar.js";

describe("BoxBulkActionBarElement", () => {
  beforeEach(() => {
    defineBoxBulkActionBarElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the selection count and item labels", () => {
    const element = document.createElement("box-bulk-action-bar") as BoxBulkActionBarElement;
    element.items = [
      { id: "1", label: "Brand Strategy.pdf", description: "PDF" },
      { id: "2", label: "Launch Plan", description: "Doc" },
    ];

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("2 selected");
    expect(element.shadowRoot?.textContent).toContain("Brand Strategy.pdf");
    expect(element.shadowRoot?.textContent).toContain("Launch Plan");
  });

  it("emits action with count and items", () => {
    const element = document.createElement("box-bulk-action-bar") as BoxBulkActionBarElement;
    const action = vi.fn();
    element.items = [{ id: "1", label: "Brand Strategy.pdf" }];
    element.actions = [
      { id: "download", label: "Download", tone: "primary" },
      { id: "share", label: "Share" },
    ];
    element.addEventListener("action", action);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[data-action-id="share"]') as HTMLButtonElement | null;
    button?.click();

    expect(action).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          action: "share",
          count: 1,
          items: [{ id: "1", label: "Brand Strategy.pdf" }],
        },
      }),
    );
  });

  it("emits clear when the clear button is clicked", () => {
    const element = document.createElement("box-bulk-action-bar") as BoxBulkActionBarElement;
    const clear = vi.fn();
    element.count = 3;
    element.addEventListener("clear", clear);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="clear"]') as HTMLButtonElement | null;
    button?.click();

    expect(clear).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          count: 3,
          items: [],
        },
      }),
    );
  });
});

