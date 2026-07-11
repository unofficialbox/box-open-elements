// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxSavedViewPickerElement,
  defineBoxSavedViewPickerElement,
} from "../../../src/patterns/search/saved-view-picker.js";

describe("BoxSavedViewPickerElement", () => {
  beforeEach(() => {
    defineBoxSavedViewPickerElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders saved views", () => {
    const element = document.createElement("box-saved-view-picker") as BoxSavedViewPickerElement;
    element.views = [
      { id: "launch", label: "Launch Review", description: "Assets due this week", resultCount: 12 },
    ];

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Launch Review");
    expect(element.shadowRoot?.textContent).toContain("Assets due this week");
    expect(element.shadowRoot?.textContent).toContain("12 results");
  });

  it("emits value-changed when a view is selected", () => {
    const element = document.createElement("box-saved-view-picker") as BoxSavedViewPickerElement;
    const changed = vi.fn();
    element.views = [
      { id: "launch", label: "Launch Review" },
      { id: "approvals", label: "Approvals" },
    ];
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[data-view-id="approvals"]') as HTMLButtonElement | null;
    button?.click();

    expect(element.value).toBe("approvals");
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "approvals" },
      }),
    );
  });
});

