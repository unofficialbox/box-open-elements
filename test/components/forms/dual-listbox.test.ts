// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxDualListboxElement,
  defineBoxDualListboxElement,
} from "../../../src/components/forms/dual-listbox.js";

describe("BoxDualListboxElement", () => {
  beforeEach(() => {
    defineBoxDualListboxElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders available and chosen lists", () => {
    const element = document.createElement("box-dual-listbox") as BoxDualListboxElement;
    element.options = [
      { label: "Preview", value: "preview" },
      { label: "Download", value: "download" },
      { label: "Share", value: "share" },
    ];
    element.value = ["download"];

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Available");
    expect(element.shadowRoot?.textContent).toContain("Chosen");
    expect(element.shadowRoot?.textContent).toContain("Download");
  });

  it("moves selected available options to the chosen list", () => {
    const element = document.createElement("box-dual-listbox") as BoxDualListboxElement;
    const changed = vi.fn();
    element.options = [
      { label: "Preview", value: "preview" },
      { label: "Download", value: "download" },
    ];
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const option = element.shadowRoot?.querySelector('[part="option"][data-list="available"][data-value="preview"]') as HTMLButtonElement | null;
    option?.click();
    const moveRight = element.shadowRoot?.querySelector('[part="move-right"]') as HTMLButtonElement | null;
    moveRight?.click();

    expect(element.value).toEqual(["preview"]);
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: ["preview"] },
      }),
    );
  });

  it("moves selected chosen options back to the available list", () => {
    const element = document.createElement("box-dual-listbox") as BoxDualListboxElement;
    element.options = [
      { label: "Preview", value: "preview" },
      { label: "Download", value: "download" },
    ];
    element.value = ["preview"];

    document.body.append(element);

    const option = element.shadowRoot?.querySelector('[part="option"][data-list="selected"][data-value="preview"]') as HTMLButtonElement | null;
    option?.click();
    const moveLeft = element.shadowRoot?.querySelector('[part="move-left"]') as HTMLButtonElement | null;
    moveLeft?.click();

    expect(element.value).toEqual([]);
  });

  it("supports disabled state", () => {
    const element = document.createElement("box-dual-listbox") as BoxDualListboxElement;
    element.options = [{ label: "Preview", value: "preview" }];
    element.disabled = true;

    document.body.append(element);

    const moveRight = element.shadowRoot?.querySelector('[part="move-right"]') as HTMLButtonElement | null;
    expect(moveRight?.disabled).toBe(true);
  });
});
