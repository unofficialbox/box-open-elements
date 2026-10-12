// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { TagInput } from "../../../src/components/forms/tag-input.js";
import { PillSelectorDropdown } from "../../../src/components/forms/pill-selector-dropdown.js";
import { SearchField } from "../../../src/components/forms/search-field.js";
import { Combobox } from "../../../src/components/forms/combobox.js";
import { CommandPalette } from "../../../src/components/overlays/command-palette.js";

TagInput.register();

type Control = TagInput | PillSelectorDropdown | SearchField | Combobox | CommandPalette;
const tags = ["tag-input", "pill-selector-dropdown", "search-field", "combobox", "command-palette"] as const;
const flush = async () => { await Promise.resolve(); await new Promise(resolve => setTimeout(resolve, 0)); };
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

async function mount(tag: typeof tags[number]) {
  const element = document.createElement(`box-${tag}`) as Control;
  if (element instanceof PillSelectorDropdown) element.allowCustom = true;
  if (element instanceof Combobox) element.options = [{ value: "synthetic", label: "Synthetic option" }];
  if (element instanceof CommandPalette) {
    element.commands = [{ id: "synthetic", label: "Synthetic command" }];
    element.open = true;
  }
  const form = document.createElement("form");
  form.append(element);
  document.body.append(form);
  const submit = vi.spyOn(form, "requestSubmit").mockImplementation(() => {});
  await flush();
  const input = () => element.shadowRoot!.querySelector<HTMLInputElement>("input")!;
  input().focus();
  input().value = "synthetic";
  input().dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
  await flush();
  if (element instanceof Combobox) input().dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  const committed = vi.fn();
  for (const event of ["value-changed", "search", "command-selected", "tag-added"]) element.addEventListener(event, committed);
  return { element, input, committed, submit };
}

function key(input: HTMLInputElement, key: string, mode: "lifecycle" | "isComposing" | "keyCode229" | "normal") {
  const event = new KeyboardEvent("keydown", {
    key, bubbles: true, composed: true, cancelable: true,
    ...(mode === "isComposing" ? { isComposing: true } : mode === "keyCode229" ? { keyCode: 229 } : {}),
  });
  input.dispatchEvent(event);
  return event;
}

describe("composition-aware commit ownership", () => {
  for (const tag of tags) for (const mode of ["lifecycle", "isComposing", "keyCode229"] as const) {
    it(`${tag}: ${mode} Enter preserves composition, then ordinary Enter works`, async () => {
      const { element, input, committed, submit } = await mount(tag);
      const before = element instanceof CommandPalette ? element.open : element.value;
      if (mode === "lifecycle") input().dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, composed: true }));
      const event = key(input(), "Enter", mode);
      await flush();
      expect(committed).not.toHaveBeenCalled();
      expect(submit).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
      expect(element instanceof CommandPalette ? element.open : element.value).toEqual(before);
      expect(input().value).toBe("synthetic");
      if (mode === "lifecycle") input().dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, composed: true }));
      key(input(), "Enter", "normal");
      await flush();
      expect(committed).toHaveBeenCalled();
      if (element instanceof SearchField) expect(submit).toHaveBeenCalledTimes(1);
    });
  }
});

describe("composition lifecycle boundaries", () => {
  for (const tag of tags) {
    it(`${tag}: disconnect/reconnect clears unfinished composition`, async () => {
      const { element, input, committed } = await mount(tag);
      input().dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, composed: true }));
      element.remove();
      document.body.append(element);
      await flush();
      input().focus();
      input().value = "synthetic";
      input().dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
      if (element instanceof Combobox) key(input(), "ArrowDown", "normal");
      committed.mockClear();
      key(input(), "Enter", "normal");
      await flush();
      expect(committed).toHaveBeenCalled();
    });
  }
  for (const tag of ["tag-input", "pill-selector-dropdown"] as const) {
    it(`${tag}: composition comma/Backspace/blur do not commit or remove tokens`, async () => {
      const { element, input, committed } = await mount(tag);
      if (element instanceof TagInput) element.tags = ["existing"];
      else (element as PillSelectorDropdown).value = ["existing"];
      committed.mockClear();
      input().dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, composed: true }));
      expect(key(input(), ",", "normal").defaultPrevented).toBe(false);
      input().value = "";
      expect(key(input(), "Backspace", "normal").defaultPrevented).toBe(false);
      input().value = "unfinished";
      input().dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
      input().dispatchEvent(new FocusEvent("blur"));
      expect(committed).not.toHaveBeenCalled();
      expect(element instanceof TagInput ? element.tags : (element as PillSelectorDropdown).value).toEqual(["existing"]);
      // A new focus session can commit ordinary text without compositionend.
      key(input(), "Enter", "normal");
      expect(committed).toHaveBeenCalled();
    });
  }
  for (const tag of ["combobox", "command-palette"] as const) {
    it(`${tag}: composing Escape does not close, ordinary Escape does`, async () => {
      const { element, input } = await mount(tag);
      input().dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, composed: true }));
      expect(key(input(), "Escape", "normal").defaultPrevented).toBe(false);
      if (element instanceof CommandPalette) expect(element.open).toBe(true);
      else expect(input().getAttribute("aria-expanded")).toBe("true");
      input().dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, composed: true }));
      key(input(), "Escape", "normal");
      if (element instanceof CommandPalette) expect(element.open).toBe(false);
      else expect(input().getAttribute("aria-expanded")).toBe("false");
    });
  }
  it("palette native cancel preserves active composition and explicit close ends the session", async () => {
    const { element, input, committed } = await mount("command-palette");
    const palette = element as CommandPalette;
    input().dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, composed: true }));
    const cancel = new Event("cancel", { cancelable: true });
    element.shadowRoot!.querySelector("dialog")!.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(palette.open).toBe(true);
    palette.open = false;
    palette.open = true;
    await flush();
    key(input(), "Enter", "normal");
    expect(committed).toHaveBeenCalled();
  });
});
