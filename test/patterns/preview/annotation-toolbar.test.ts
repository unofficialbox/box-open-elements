// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AnnotationToolbar,
} from "../../../src/patterns/preview/annotation-toolbar.js";

describe("AnnotationToolbar", () => {
  beforeEach(() => {
    AnnotationToolbar.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders tools, colors, and actions", () => {
    const element = document.createElement("box-annotation-toolbar") as AnnotationToolbar;
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
    const element = document.createElement("box-annotation-toolbar") as AnnotationToolbar;
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
    const element = document.createElement("box-annotation-toolbar") as AnnotationToolbar;
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

  it("keeps focus on the clicked tool button and patches aria-pressed in place", () => {
    const element = document.createElement("box-annotation-toolbar") as AnnotationToolbar;
    element.tools = [
      { id: "highlight", label: "Highlight", icon: "H" },
      { id: "comment", label: "Comment", icon: "C" },
    ];

    document.body.append(element);

    const comment = element.shadowRoot?.querySelector('[part="tool"][data-tool-id="comment"]') as HTMLButtonElement;
    const highlight = element.shadowRoot?.querySelector('[part="tool"][data-tool-id="highlight"]') as HTMLButtonElement;
    comment.focus();
    comment.click();

    expect(element.activeToolId).toBe("comment");
    expect(element.shadowRoot?.activeElement).toBe(comment);
    expect(element.shadowRoot?.querySelector('[part="tool"][data-tool-id="comment"]')).toBe(comment);
    expect(comment.getAttribute("aria-pressed")).toBe("true");
    expect(highlight.getAttribute("aria-pressed")).toBe("false");
    expect(comment.tabIndex).toBe(0);
    expect(highlight.tabIndex).toBe(-1);
  });

  it("keeps focus on the clicked color swatch after selection", () => {
    const element = document.createElement("box-annotation-toolbar") as AnnotationToolbar;
    element.colorOptions = [
      { id: "amber", label: "Amber", value: "#f59e0b" },
      { id: "blue", label: "Blue", value: "#3b82f6" },
    ];

    document.body.append(element);

    const blue = element.shadowRoot?.querySelector('[part="color"][data-color-id="blue"]') as HTMLButtonElement;
    blue.focus();
    blue.click();

    expect(element.currentColor).toBe("#3b82f6");
    expect(element.shadowRoot?.activeElement).toBe(blue);
    expect(blue.getAttribute("aria-pressed")).toBe("true");
    expect(blue.tabIndex).toBe(0);
  });

  it("omits the swatch style for hostile color values", () => {
    const element = document.createElement("box-annotation-toolbar") as AnnotationToolbar;
    element.colorOptions = [
      { id: "amber", label: "Amber", value: "#f59e0b" },
      { id: "sneaky", label: "Sneaky", value: "red;background:url(https://evil.example/x)" },
    ];

    document.body.append(element);

    const safe = element.shadowRoot?.querySelector('[part="color"][data-color-id="amber"]') as HTMLButtonElement;
    const hostile = element.shadowRoot?.querySelector('[part="color"][data-color-id="sneaky"]') as HTMLButtonElement;
    expect(safe.getAttribute("style")).toContain("--annotation-color:#f59e0b");
    expect(hostile.getAttribute("style")).toBeNull();
  });

  it("toggles the actions section as actions are removed and restored", () => {
    const element = document.createElement("box-annotation-toolbar") as AnnotationToolbar;
    document.body.append(element);

    const section = element.shadowRoot
      ?.querySelector('[part="actions"]')
      ?.closest("section") as HTMLElement;
    expect(section.hidden).toBe(true);

    element.actions = [{ id: "undo", label: "Undo" }];
    expect(section.hidden).toBe(false);

    element.actions = [];
    expect(section.hidden).toBe(true);
  });

  it("patches action labels in place for IDs that would break a CSS selector", () => {
    const element = document.createElement("box-annotation-toolbar") as AnnotationToolbar;
    element.actions = [{ id: 'undo\n"all"', label: "Undo" }];
    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="action"]') as HTMLButtonElement;
    element.actions = [{ id: 'undo\n"all"', label: "Undo everything", tone: "primary" }];

    expect(element.shadowRoot?.querySelector('[part="action"]')).toBe(button);
    expect(button.textContent?.trim()).toBe("Undo everything");
    expect(button.dataset.tone).toBe("primary");
  });

  it("moves focus between tools with ArrowRight and ArrowLeft", async () => {
    const element = document.createElement("box-annotation-toolbar") as AnnotationToolbar;
    element.tools = [
      { id: "highlight", label: "Highlight", icon: "H" },
      { id: "comment", label: "Comment", icon: "C" },
    ];
    document.body.append(element);

    const highlight = element.shadowRoot?.querySelector('[data-tool-id="highlight"]') as HTMLButtonElement;
    const comment = element.shadowRoot?.querySelector('[data-tool-id="comment"]') as HTMLButtonElement;
    highlight.focus();

    // focusRovingItem defers the focus() call to a microtask.
    highlight.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await Promise.resolve();
    expect(element.shadowRoot?.activeElement).toBe(comment);

    comment.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    await Promise.resolve();
    expect(element.shadowRoot?.activeElement).toBe(highlight);
  });

  it("includes brand focus-visible and interactive states for tools", () => {
    const element = document.createElement("box-annotation-toolbar") as AnnotationToolbar;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part="tool"]:focus-visible');
    expect(styles).toContain('[part="action"]:hover:not(:disabled)');
    expect(styles).toContain('[part="color"]:active:not(:disabled)');
    expect(styles).toContain('[part="tool"]:disabled');
    expect(styles).toContain("--boe-token-surface-surface-brand");
  });
});
