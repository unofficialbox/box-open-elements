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
  it("keeps first-legend controls and links inside disabled fieldsets", () => {
    const container = document.createElement("div");
    container.innerHTML = `<fieldset disabled>
      <legend><button id="enable">Enable settings</button></legend>
      <input id="disabled-input"><button id="disabled-button">Disabled</button>
      <legend><button id="second-legend">Also disabled</button></legend>
      <a id="help" href="#help">Help</a>
    </fieldset><button id="last">Last</button>`;
    document.body.append(container);
    const first = container.querySelector<HTMLButtonElement>("#enable")!;
    const last = container.querySelector<HTMLButtonElement>("#last")!;
    expect(getTabbableElements(container).map(el => el.id)).toEqual(["enable", "help", "last"]);
    last.focus();
    trapTabKey(new KeyboardEvent("keydown", { key: "Tab", cancelable: true }), container);
    expect(document.activeElement).toBe(first);
    trapTabKey(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, cancelable: true }), container);
    expect(document.activeElement).toBe(last);
    container.querySelector("fieldset")!.setAttribute("aria-disabled", "true");
    expect(getTabbableElements(container)).toEqual([last]);
    container.remove();
  });

  it("excludes controls disabled by an outer fieldset despite an inner legend", () => {
    const container = document.createElement("div");
    container.innerHTML = '<fieldset disabled><legend>Outer</legend><fieldset><legend><button>Nested</button></legend><input></fieldset></fieldset>';
    document.body.append(container);
    expect(getTabbableElements(container)).toEqual([]);
    container.remove();
  });

  it("excludes negative-tabindex shadow scopes but preserves light-DOM descendants", () => {
    const container = document.createElement("div");
    const host = document.createElement("div");
    host.tabIndex = -1;
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = '<button>Shadow control</button><slot></slot>';
    const slotted = document.createElement("button");
    host.append(slotted);
    const light = document.createElement("div");
    light.tabIndex = -1;
    light.innerHTML = '<button>Light control</button>';
    const last = light.querySelector("button")!;
    container.append(host, light);
    document.body.append(container);
    expect(getTabbableElements(container)).toEqual([last]);
    last.focus();
    const reverseTab = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, cancelable: true });
    trapTabKey(reverseTab, container);
    expect(reverseTab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);
    host.tabIndex = -2;
    expect(getTabbableElements(container)).toEqual([last]);
    host.removeAttribute("tabindex");
    expect(getTabbableElements(container)).toEqual([shadow.querySelector("button"), slotted, last]);
    container.remove();
  });

  it("does not restore a trigger disabled by its fieldset after capture", async () => {
    const fieldset = document.createElement("fieldset");
    const trigger = document.createElement("button");
    fieldset.append(trigger);
    document.body.append(fieldset);
    const restore = new FocusRestore();
    restore.capture(trigger);
    fieldset.disabled = true;
    const focus = vi.spyOn(trigger, "focus");
    restore.restore();
    await Promise.resolve();
    expect(focus).not.toHaveBeenCalled();
    fieldset.remove();
  });

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

  it("traverses slotted controls and nested shadow roots in visible tab order", () => {
    const container = document.createElement("div");
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = '<button>First</button><slot></slot><button>Last</button>';
    const slotted = document.createElement("button");
    host.append(slotted);
    container.append(host);
    document.body.append(container);
    const [first, last] = shadow.querySelectorAll("button");
    expect(getTabbableElements(container)).toEqual([first, slotted, last]);
    last!.focus();
    trapTabKey(new KeyboardEvent("keydown", { key: "Tab" }), container);
    expect(shadow.activeElement).toBe(first);
    host.setAttribute("inert", "");
    expect(getTabbableElements(container)).toEqual([]);
    host.removeAttribute("inert");
    host.style.display = "none";
    expect(getTabbableElements(container)).toEqual([]);
    container.remove();
  });

  it("restores the inner trigger without scrolling and ignores removed triggers", async () => {
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = '<button>Open</button>';
    document.body.append(host);
    const button = shadow.querySelector("button")!;
    button.focus();
    const restore = new FocusRestore();
    restore.capture();
    const focus = vi.spyOn(button, "focus");
    restore.restore();
    await Promise.resolve();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    restore.capture(button);
    host.remove();
    focus.mockClear();
    restore.restore();
    await Promise.resolve();
    expect(focus).not.toHaveBeenCalled();
  });
});

describe("foundations/a11y heading", () => {
  it("renders escaped native heading markup", () => {
    expect(renderHeadingHtml('Plan <script>', { level: 2, part: "title heading" })).toBe(
      '<h2 part="title heading">Plan &lt;script&gt;</h2>',
    );
  });
});
