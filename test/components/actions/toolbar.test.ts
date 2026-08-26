// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Toolbar } from "../../../src/components/actions/toolbar.js";

const mount = (inner: string, attrs: Record<string, string> = {}): Toolbar => {
  const element = document.createElement("box-toolbar") as Toolbar;
  for (const [name, value] of Object.entries(attrs)) {
    element.setAttribute(name, value);
  }
  element.innerHTML = inner;
  document.body.append(element);
  return element;
};

const buttons = (element: Toolbar): HTMLButtonElement[] =>
  Array.from(element.querySelectorAll("button"));

const press = (target: HTMLElement, key: string): void => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, composed: true }));
};

const THREE = `
  <button type="button">One</button>
  <button type="button">Two</button>
  <button type="button">Three</button>
`;

describe("box-toolbar", () => {
  beforeEach(() => {
    Toolbar.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("carries the toolbar role and the name it was given", () => {
    const element = mount(THREE, { label: "Document actions" });
    const toolbar = element.shadowRoot?.querySelector('[part="toolbar"]');

    expect(toolbar?.getAttribute("role")).toBe("toolbar");
    expect(toolbar?.getAttribute("aria-label")).toBe("Document actions");
  });

  it("leaves aria-label off rather than naming the group an empty string", () => {
    // A blank accessible name is worse than none: it overrides what a screen
    // reader would otherwise derive.
    const element = mount(THREE);

    expect(element.shadowRoot?.querySelector('[part="toolbar"]')?.hasAttribute("aria-label")).toBe(
      false,
    );
  });

  it("is a single tab stop, which is the reason to reach for it", () => {
    const element = mount(THREE);
    const [first, second, third] = buttons(element);

    expect(first.tabIndex).toBe(0);
    expect(second.tabIndex).toBe(-1);
    expect(third.tabIndex).toBe(-1);
  });

  it("moves the tab stop with the arrow keys", () => {
    const element = mount(THREE);
    const [first, second] = buttons(element);

    press(first, "ArrowRight");

    expect(second.tabIndex).toBe(0);
    expect(first.tabIndex).toBe(-1);
  });

  it("navigates with up and down when it is vertical", () => {
    const element = mount(THREE, { orientation: "vertical" });
    const [first, second] = buttons(element);

    press(first, "ArrowDown");
    expect(second.tabIndex).toBe(0);

    // The cross-axis key should not also move it, or the two orientations
    // would be indistinguishable.
    press(second, "ArrowRight");
    expect(second.tabIndex).toBe(0);
  });

  it("ignores an unrecognised orientation instead of passing it through", () => {
    const element = mount(THREE, { orientation: "diagonal" });

    expect(element.orientation).toBe("horizontal");
    expect(
      element.shadowRoot?.querySelector('[part="toolbar"]')?.getAttribute("aria-orientation"),
    ).toBe("horizontal");
  });

  it("skips a disabled control, which cannot take focus anyway", () => {
    const element = mount(`
      <button type="button">One</button>
      <button type="button" disabled>Two</button>
      <button type="button">Three</button>
    `);

    expect(element.controls).toHaveLength(2);

    const [first] = buttons(element);
    press(first, "ArrowRight");

    expect(buttons(element)[2].tabIndex).toBe(0);
  });

  it("leaves a disabled control off the tab order rather than trusting its default", () => {
    // A button's tabIndex defaults to 0. Roving tabindex only writes to the
    // controls it manages, so a disabled one keeps that 0 unless it is claimed
    // explicitly — which is invisible until it is re-enabled.
    const element = mount(`
      <button type="button">One</button>
      <button type="button" disabled>Two</button>
    `);

    expect(buttons(element)[1].tabIndex).toBe(-1);
  });

  it("takes a re-enabled control back into the rotation", async () => {
    // The common shape: a Clear Selection that wakes once something is
    // selected. Without this it is either a second tab stop or unreachable.
    const element = mount(`
      <button type="button">One</button>
      <button type="button" disabled>Two</button>
    `);
    const [, second] = buttons(element);

    expect(element.controls).toHaveLength(1);

    second.removeAttribute("disabled");
    await new Promise(resolve => queueMicrotask(() => resolve(null)));

    expect(element.controls).toHaveLength(2);
    press(buttons(element)[0], "ArrowRight");
    expect(second.tabIndex).toBe(0);
  });

  it("notices a control added inside a wrapper, which fires no slotchange", async () => {
    const element = mount(`<div><button type="button">One</button></div>`);
    expect(element.controls).toHaveLength(1);

    const added = document.createElement("button");
    added.type = "button";
    element.querySelector("div")!.append(added);
    await new Promise(resolve => queueMicrotask(() => resolve(null)));

    expect(element.controls).toHaveLength(2);
    expect(added.tabIndex).toBe(-1);
  });

  it("finds controls nested inside a wrapper element", () => {
    // Hosts group controls in a span or div for layout; the toolbar would be
    // empty if it only looked at its direct children.
    const element = mount(`<div><button type="button">One</button></div>`);

    expect(element.controls).toHaveLength(1);
  });

  it("counts a link as a control but not a plain span", () => {
    const element = mount(`
      <a href="#one">One</a>
      <span>Not focusable</span>
      <button type="button">Two</button>
    `);

    expect(element.controls).toHaveLength(2);
  });

  it("makes a clicked control the tab stop, so Tab returns where the reader was", () => {
    const element = mount(THREE);
    const [first, , third] = buttons(element);

    third.dispatchEvent(new FocusEvent("focusin", { bubbles: true, composed: true }));

    expect(third.tabIndex).toBe(0);
    expect(first.tabIndex).toBe(-1);
  });

  it("does not report custom elements it could not actually focus", () => {
    // Roving tabindex only focuses what the browser considers focusable, and a
    // custom element host is not, unless it carries its own tabindex.
    const element = mount(`
      <box-button>Opaque</box-button>
      <box-button tabindex="-1">Focusable</box-button>
    `);

    expect(element.controls).toHaveLength(1);
  });
});
