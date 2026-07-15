// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import {
  FocusRestore,
  applyRovingTabindex,
  getTabbableElements,
  nextRovingIndex,
  renderHeadingHtml,
  trapTabKey,
} from "../../src/foundations/a11y/index.js";

describe("foundations/a11y keyboard", () => {
  it("maps Arrow/Home/End to the next roving index with wrap", () => {
    expect(nextRovingIndex("ArrowRight", 0, 3)).toBe(1);
    expect(nextRovingIndex("ArrowRight", 2, 3)).toBe(0);
    expect(nextRovingIndex("ArrowLeft", 0, 3)).toBe(2);
    expect(nextRovingIndex("Home", 2, 3)).toBe(0);
    expect(nextRovingIndex("End", 0, 3)).toBe(2);
    expect(nextRovingIndex("Enter", 0, 3)).toBeNull();
  });

  it("respects orientation and no-wrap", () => {
    expect(nextRovingIndex("ArrowDown", 0, 3, { orientation: "horizontal" })).toBeNull();
    expect(nextRovingIndex("ArrowRight", 2, 3, { wrap: false })).toBe(2);
  });

  it("applies roving tabindex to only one item", () => {
    const items = [0, 1, 2].map(() => document.createElement("button"));
    applyRovingTabindex(items, 1);
    expect(items.map(item => item.tabIndex)).toEqual([-1, 0, -1]);
  });
});

describe("foundations/a11y focus", () => {
  it("lists tabbable elements and traps Tab at the edges", () => {
    const container = document.createElement("div");
    const first = document.createElement("button");
    const last = document.createElement("button");
    first.textContent = "First";
    last.textContent = "Last";
    container.append(first, last);
    document.body.append(container);

    expect(getTabbableElements(container)).toHaveLength(2);

    first.focus();
    const shiftTab = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true });
    const prevent = vi.spyOn(shiftTab, "preventDefault");
    trapTabKey(shiftTab, container);
    expect(prevent).toHaveBeenCalled();
    expect(document.activeElement).toBe(last);

    container.remove();
  });

  it("excludes CSS-hidden and disabled controls from the tab trap set", () => {
    const container = document.createElement("div");
    const visible = document.createElement("button");
    const hidden = document.createElement("button");
    const disabled = document.createElement("button");
    visible.textContent = "Visible";
    hidden.textContent = "Hidden";
    hidden.style.display = "none";
    disabled.textContent = "Disabled";
    disabled.disabled = true;
    disabled.tabIndex = 0;
    container.append(visible, hidden, disabled);
    document.body.append(container);

    expect(getTabbableElements(container)).toEqual([visible]);
    container.remove();
  });

  it("restores previously captured focus", async () => {
    const a = document.createElement("button");
    const b = document.createElement("button");
    document.body.append(a, b);
    a.focus();

    const restore = new FocusRestore();
    restore.capture();
    b.focus();
    expect(document.activeElement).toBe(b);

    restore.restore();
    await Promise.resolve();
    await Promise.resolve();
    expect(document.activeElement).toBe(a);

    a.remove();
    b.remove();
  });
});

describe("foundations/a11y heading", () => {
  it("renders escaped native heading markup", () => {
    expect(renderHeadingHtml('Plan <script>', { level: 2, part: "title heading" })).toBe(
      '<h2 part="title heading">Plan &lt;script&gt;</h2>',
    );
  });
});
