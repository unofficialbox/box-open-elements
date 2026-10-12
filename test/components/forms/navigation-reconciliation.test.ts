// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { Combobox } from "../../../src/components/forms/combobox.js";
import { CategorySelector } from "../../../src/components/forms/category-selector.js";
import { PillSelectorDropdown } from "../../../src/components/forms/pill-selector-dropdown.js";
import { SegmentedControl } from "../../../src/components/actions/segmented-control.js";
Combobox.register(); CategorySelector.register(); PillSelectorDropdown.register(); SegmentedControl.register();
const options = [{value:"a",label:"Alpha"},{value:"b",label:"Beta"}];
const key = (node: HTMLElement, key: string) => node.dispatchEvent(new KeyboardEvent("keydown", {key,bubbles:true,cancelable:true}));
afterEach(() => document.body.replaceChildren());
describe("remaining confirmed form navigation", () => {
  for (const mode of ["disable", "reorder", "remove"]) {
    it(`Combobox reconciles active logical Beta after ${mode}`, () => {
      const e = new Combobox(); e.options = options; document.body.append(e);
      const input = e.shadowRoot!.querySelector("input")!; input.focus(); key(input,"End");
      e.options = mode === "reorder" ? [...options].reverse() : mode === "disable" ? [options[0],{...options[1],disabled:true}] : [options[0]];
      key(input,"Enter"); expect(e.value).toBe(mode === "reorder" ? "b" : "");
      if (mode !== "reorder") expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    });
  }
  for (const Constructor of [CategorySelector, SegmentedControl]) {
    for (const mode of ["remove", "disable"]) {
      it(`${Constructor.tagName} repairs its keyboard entry after ${mode}`, () => {
        const e = new Constructor(); e.options = options; e.value = "b"; document.body.append(e);
        e.options = mode === "remove" ? [options[0]] : [options[0],{...options[1],disabled:true}];
        const enabled = Array.from(e.shadowRoot!.querySelectorAll("button")).filter(b => !b.disabled);
        expect(enabled.filter(b => b.tabIndex === 0)).toHaveLength(1);
        enabled[0].focus(); key(enabled[0],"End"); expect(e.value).toBe("a");
      });
    }
  }
  it("SegmentedControl respects explicit host focus handoff on selection", () => {
    const outside = document.createElement("button"); document.body.append(outside);
    const e = new SegmentedControl(); e.options = options; document.body.append(e);
    e.addEventListener("value-changed", () => outside.focus());
    const button = e.shadowRoot!.querySelector("button")!; button.focus(); key(button,"ArrowRight");
    expect(document.activeElement).toBe(outside); expect(e.value).toBe("b");
  });
  it("PillSelectorDropdown returns focus to its visible custom input after removal", () => {
    const e = new PillSelectorDropdown(); e.allowCustom = true; e.options = []; e.value = ["one"]; document.body.append(e);
    const remove = e.shadowRoot!.querySelector<HTMLButtonElement>('[part="pill-remove"]')!; remove.focus(); remove.click();
    expect(e.value).toEqual([]); expect(e.shadowRoot!.activeElement).toBe(e.shadowRoot!.querySelector("input"));
  });
});

it("SegmentedControl keeps keyed focus through reorder, then repairs removed focus", () => {
  const e = new SegmentedControl(); e.options = options; e.value = "b"; document.body.append(e);
  const beta = e.shadowRoot!.querySelector<HTMLButtonElement>('[data-value="b"]')!; beta.focus();
  e.options = [{value:"b",label:"Renamed Beta"}, options[0]];
  expect(e.shadowRoot!.querySelector('[data-value="b"]')).toBe(beta); expect(e.shadowRoot!.activeElement).toBe(beta);
  e.options = [options[0]];
  const alpha = e.shadowRoot!.querySelector<HTMLButtonElement>('[data-value="a"]')!;
  expect(e.shadowRoot!.activeElement).toBe(alpha); key(alpha,"End"); expect(e.value).toBe("a");
});

it("SegmentedControl respects reentrant host value and focus, skips disabled options, and reconnects once", () => {
  const e = new SegmentedControl(); e.options = [...options,{value:"c",label:"Unavailable",disabled:true}]; document.body.append(e);
  const changed = vi.fn(); e.addEventListener("value-changed", changed);
  e.addEventListener("value-changed", () => { e.value = "a"; });
  const first = e.shadowRoot!.querySelector<HTMLButtonElement>('[data-value="a"]')!;
  first.focus(); key(first,"End"); expect(e.value).toBe("a"); expect(changed).toHaveBeenCalledTimes(1);
  e.remove(); document.body.append(e); first.focus(); key(first,"ArrowRight"); expect(changed).toHaveBeenCalledTimes(2);
  e.disabled = true; key(first,"ArrowRight"); expect(changed).toHaveBeenCalledTimes(2);
});

it("Combobox clears active intent on closing and rejects disabled programmatic commits", () => {
  const e = new Combobox(); e.options = options; document.body.append(e);
  const input = e.shadowRoot!.querySelector("input")!; input.focus(); key(input,"End"); key(input,"Escape");
  key(input,"ArrowDown"); expect(e.shadowRoot!.getElementById(input.getAttribute("aria-activedescendant")!)?.dataset.value).toBe("a");
  e.disabled = true; key(input,"Enter"); expect(e.value).toBe("");
});

for (const Constructor of [CategorySelector, SegmentedControl]) {
  it(`${Constructor.tagName} has no enabled entry when every option is disabled`, () => {
    const e = new Constructor(); e.options = options.map(option => ({...option,disabled:true})); document.body.append(e);
    expect(Array.from(e.shadowRoot!.querySelectorAll("button")).some(button => !button.disabled && button.tabIndex === 0)).toBe(false);
  });
}

it("CategorySelector exposes More when its first eligible fallback is in overflow", () => {
  const e = new CategorySelector(); e.maxLinks = 1; e.value = "removed";
  e.options = [{...options[0],disabled:true},options[1]]; document.body.append(e);
  expect(e.shadowRoot!.querySelector<HTMLButtonElement>('[data-more]')!.tabIndex).toBe(0);
});

it("PillSelectorDropdown uses the visible trigger when fixed options remain and respects host handoff", () => {
  const e = new PillSelectorDropdown(); e.allowCustom = true; e.options = options; e.value = ["one"]; document.body.append(e);
  const outside = document.createElement("button"); document.body.append(outside);
  e.addEventListener("value-changed", () => outside.focus());
  const remove = e.shadowRoot!.querySelector<HTMLButtonElement>('[part="pill-remove"]')!; remove.focus(); remove.click();
  expect(document.activeElement).toBe(outside);
  expect(e.shadowRoot!.querySelector<HTMLButtonElement>('[part="trigger"]')!.hidden).toBe(false);
});

it("PillSelectorDropdown blur commits a token without requesting return focus", () => {
  const e = new PillSelectorDropdown(); e.allowCustom = true; e.options = []; document.body.append(e);
  const input = e.shadowRoot!.querySelector("input")!, focus = vi.spyOn(input,"focus");
  input.value = "fresh"; input.dispatchEvent(new FocusEvent("blur"));
  expect(e.value).toEqual(["fresh"]); expect(focus).not.toHaveBeenCalled(); expect(input.value).toBe("");
});

it("PillSelectorDropdown blur with fixed choices does not move focus to the visible trigger", () => {
  const e = new PillSelectorDropdown(); e.allowCustom = true; e.options = options; document.body.append(e);
  const input = e.shadowRoot!.querySelector("input")!, trigger = e.shadowRoot!.querySelector<HTMLButtonElement>('[part="trigger"]')!;
  const focus = vi.spyOn(trigger,"focus"); input.value = "fresh"; input.dispatchEvent(new FocusEvent("blur"));
  expect(e.value).toEqual(["fresh"]); expect(focus).not.toHaveBeenCalled();
});
