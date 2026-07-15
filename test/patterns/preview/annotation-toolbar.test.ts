// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxAnnotationToolbarElement,
  defineBoxAnnotationToolbarElement,
} from "../../../src/patterns/preview/annotation-toolbar.js";

describe("BoxAnnotationToolbarElement", () => {
  beforeEach(() => {
    defineBoxAnnotationToolbarElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders tools, colors, and actions", () => {
    const element = document.createElement("box-annotation-toolbar") as BoxAnnotationToolbarElement;
    element.label = "Review annotations";
    element.tools = [
      { id: "highlight", label: "Highlight", icon: "H" },
      { id: "comment", label: "Comment", icon: "C" },
    ];
    element.colorOptions = [
      { id: "amber", label: "Amber", value: "#f59e0b" },
      { id: "blue", label: "Blue", value: "#3b82f6" },
    ];
    element.actions = [{ id: "undo", label: "Undo" }];

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Review annotations");
    expect(element.shadowRoot?.textContent).toContain("Highlight");
    expect(element.shadowRoot?.textContent).toContain("Comment");
    expect(element.shadowRoot?.textContent).toContain("Undo");
  });

  it("emits tool-selected when a tool is clicked", () => {
    const element = document.createElement("box-annotation-toolbar") as BoxAnnotationToolbarElement;
    const selected = vi.fn();
    element.tools = [{ id: "draw", label: "Draw", icon: "D" }];
    element.addEventListener("tool-selected", selected);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="tool"][data-tool-id="draw"]') as HTMLButtonElement | null;
    button?.click();

    expect(selected).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          id: "draw",
          label: "Draw",
          icon: "D",
        },
      }),
    );
    expect(element.activeToolId).toBe("draw");
  });

  it("emits color-selected when a swatch is clicked", () => {
    const element = document.createElement("box-annotation-toolbar") as BoxAnnotationToolbarElement;
    const selected = vi.fn();
    element.colorOptions = [{ id: "amber", label: "Amber", value: "#f59e0b" }];
    element.addEventListener("color-selected", selected);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="color"][data-color-id="amber"]') as HTMLButtonElement | null;
    button?.click();

    expect(selected).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          id: "amber",
          label: "Amber",
          value: "#f59e0b",
        },
      }),
    );
    expect(element.currentColor).toBe("#f59e0b");
  });

  it("includes brand focus-visible and interactive states for tools", () => {
    const element = document.createElement("box-annotation-toolbar") as BoxAnnotationToolbarElement;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part="tool"]:focus-visible');
    expect(styles).toContain('[part="action"]:hover:not(:disabled)');
    expect(styles).toContain('[part="color"]:active:not(:disabled)');
    expect(styles).toContain('[part="tool"]:disabled');
    expect(styles).toContain("--boe-token-surface-surface-brand");
  });
});
