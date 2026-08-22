import { afterEach, describe, expect, it, vi } from "vitest";

import { ShortcutsOverlay } from "../../../src/components/overlays/shortcuts-overlay.js";
import {
  groupShortcutCommands,
  splitShortcutKeys,
} from "../../../src/components/overlays/command-types.js";
import type { CommandDescriptor } from "../../../src/components/overlays/command-types.js";

ShortcutsOverlay.register();

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
};

const commands: CommandDescriptor[] = [
  { id: "new-intake", label: "New intake request", group: "Create", shortcut: "mod+n" },
  { id: "new-clause", label: "New clause", group: "Create" },
  { id: "compare", label: "Compare versions", group: "Review", shortcut: "mod+shift+d" },
  { id: "approve", label: "Approve request", group: "Review" },
  { id: "help", label: "Show shortcuts", shortcut: "?" },
];

const mount = async (
  configure: (element: ShortcutsOverlay) => void = () => {},
): Promise<ShortcutsOverlay> => {
  const element = document.createElement("box-shortcuts-overlay") as ShortcutsOverlay;
  element.commands = commands;
  configure(element);
  document.body.append(element);
  await flush();
  return element;
};

const q = (element: ShortcutsOverlay, selector: string): HTMLElement | null =>
  element.shadowRoot!.querySelector(selector);

const all = (element: ShortcutsOverlay, selector: string): HTMLElement[] =>
  Array.from(element.shadowRoot!.querySelectorAll(selector));

afterEach(() => {
  document.body.innerHTML = "";
});

describe("groupShortcutCommands", () => {
  it("keeps only commands that declare a shortcut", () => {
    const groups = groupShortcutCommands(commands);
    expect(groups.flatMap(group => group.commands.map(c => c.id))).toEqual([
      "new-intake",
      "compare",
      "help",
    ]);
  });

  it("trails the ungrouped section", () => {
    expect(groupShortcutCommands(commands).map(group => group.key)).toEqual([
      "Create",
      "Review",
      "",
    ]);
    expect(groupShortcutCommands(commands).at(-1)?.label).toBe("Other");
  });

  it("returns nothing when no command declares a shortcut", () => {
    expect(groupShortcutCommands(commands.filter(c => !c.shortcut))).toEqual([]);
    expect(groupShortcutCommands([])).toEqual([]);
  });
});

describe("splitShortcutKeys", () => {
  it("splits on + and drops empty segments", () => {
    expect(splitShortcutKeys("mod+shift+d")).toEqual(["mod", "shift", "d"]);
    expect(splitShortcutKeys(" mod + k ")).toEqual(["mod", "k"]);
    expect(splitShortcutKeys("?")).toEqual(["?"]);
    expect(splitShortcutKeys("")).toEqual([]);
  });

  it("keeps a literal + as its own key", () => {
    // "mod++" is how the zoom shortcut is written: mod, then the plus key.
    expect(splitShortcutKeys("mod++")).toEqual(["mod", "+"]);
    expect(splitShortcutKeys("ctrl + +")).toEqual(["ctrl", "+"]);
    expect(splitShortcutKeys("+")).toEqual(["+"]);
  });
});

describe("box-shortcuts-overlay", () => {
  it("renders nothing until opened", async () => {
    const element = await mount();
    expect(q(element, '[part="sheet"]')).toBeNull();

    element.open = true;
    await flush();
    expect(q(element, '[part="sheet"]')).not.toBeNull();
  });

  it("lists only documented shortcuts, grouped", async () => {
    const element = await mount(el => (el.open = true));

    expect(all(element, '[part="row"]').map(n => n.getAttribute("data-command-id"))).toEqual([
      "new-intake",
      "compare",
      "help",
    ]);
    expect(all(element, '[part="group-label"]').map(n => n.textContent)).toEqual([
      "Create",
      "Review",
      "Other",
    ]);
    expect(element.documentedCommands.map(c => c.id)).toEqual(["new-intake", "compare", "help"]);
  });

  it("renders each key as a kbd element", async () => {
    const element = await mount(el => (el.open = true));

    const row = all(element, '[part="row"]')[1]!;
    const keys = Array.from(row.querySelectorAll('[part="key"]'));
    expect(keys.map(k => k.tagName)).toEqual(["KBD", "KBD", "KBD"]);
    expect(keys.map(k => k.textContent)).toEqual(["mod", "shift", "d"]);
    // The whole combination is the accessible name; the + is decoration.
    expect(row.querySelector('[part="keys"]')?.getAttribute("aria-label")).toBe("mod+shift+d");
    expect(row.querySelector('[part="key-separator"]')?.getAttribute("aria-hidden")).toBe("true");
  });

  it("shows an empty state when nothing declares a shortcut", async () => {
    const element = await mount(el => {
      el.commands = commands.filter(c => !c.shortcut);
      el.open = true;
    });

    expect(q(element, '[part="empty"]')).not.toBeNull();
    expect(all(element, '[part="row"]')).toHaveLength(0);
  });

  it("closes on Escape, the close button, and the backdrop", async () => {
    for (const dismiss of [
      (el: ShortcutsOverlay) =>
        q(el, '[part="sheet"]')!.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true }),
        ),
      (el: ShortcutsOverlay) => (q(el, '[part="close"]') as HTMLButtonElement).click(),
      (el: ShortcutsOverlay) =>
        q(el, '[part="backdrop"]')!.dispatchEvent(
          new MouseEvent("pointerdown", { bubbles: true, composed: true }),
        ),
    ]) {
      const element = await mount(el => (el.open = true));
      const dismissed = vi.fn();
      element.addEventListener("dismissed", dismissed);

      dismiss(element);
      await flush();

      expect(element.open).toBe(false);
      // Exactly once: Escape from inside the sheet also reaches the document
      // listener, which must see `open` already cleared and stand down.
      expect(dismissed).toHaveBeenCalledTimes(1);
      element.remove();
    }
  });

  it("does not close when the sheet itself is pressed", async () => {
    const element = await mount(el => (el.open = true));

    q(element, '[part="sheet"]')!.dispatchEvent(
      new MouseEvent("pointerdown", { bubbles: true, composed: true }),
    );
    await flush();

    expect(element.open).toBe(true);
  });

  it("opens on the ? hotkey and restores focus on close", async () => {
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();

    const element = await mount();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
    await flush();

    expect(element.open).toBe(true);
    expect(document.activeElement).toBe(element);

    element.open = false;
    await flush();
    expect(document.activeElement).toBe(opener);
  });

  it("never fires the bare hotkey while someone is typing", async () => {
    const element = await mount();
    const input = document.createElement("input");
    document.body.append(input);
    input.focus();

    // "?" is an ordinary character in a text field — the sheet must not steal it.
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
    await flush();
    expect(element.open).toBe(false);

    const area = document.createElement("textarea");
    document.body.append(area);
    area.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
    await flush();
    expect(element.open).toBe(false);
  });

  it("sees a field inside a shadow root, not the host it retargets to", async () => {
    const element = await mount();

    // This library wraps native controls in shadow DOM (box-text-field and
    // friends), and `event.target` on a document listener is retargeted to the
    // host. Reading `target` would see the wrapper and steal the character.
    const wrapper = document.createElement("div");
    document.body.append(wrapper);
    const shadow = wrapper.attachShadow({ mode: "open" });
    const input = document.createElement("input");
    shadow.append(input);

    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "?", bubbles: true, composed: true }),
    );
    await flush();

    expect(element.open).toBe(false);
  });

  it("ignores the hotkey when any modifier is held", async () => {
    const element = await mount();

    for (const modifier of ["ctrlKey", "metaKey", "altKey"]) {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "?", [modifier]: true, bubbles: true }),
      );
      await flush();
      expect(element.open).toBe(false);
    }
  });

  it("does nothing when the hotkey fires while the sheet is already open", async () => {
    const element = await mount(el => (el.open = true));
    const dismissed = vi.fn();
    element.addEventListener("dismissed", dismissed);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
    await flush();

    expect(element.open).toBe(true);
    expect(dismissed).not.toHaveBeenCalled();
  });

  it("closes on Escape even when focus has left the sheet", async () => {
    const element = await mount(el => (el.open = true));
    const outside = document.createElement("button");
    document.body.append(outside);
    outside.focus();

    const dismissed = vi.fn();
    element.addEventListener("dismissed", dismissed);

    outside.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await flush();

    expect(element.open).toBe(false);
    // A modal that only closes while it still holds focus is a trap.
    expect(dismissed).toHaveBeenCalledTimes(1);
  });

  it("honours a custom hotkey and an empty one", async () => {
    const custom = await mount(el => (el.hotkey = "k"));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", bubbles: true }));
    await flush();
    expect(custom.open).toBe(true);
    custom.remove();

    const none = await mount(el => (el.hotkey = ""));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
    await flush();
    expect(none.open).toBe(false);
  });

  it("stops listening once disconnected", async () => {
    const element = await mount();
    element.remove();
    await flush();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "?", bubbles: true }));
    await flush();
    expect(element.open).toBe(false);
  });

  it("escapes hostile command content", async () => {
    const element = await mount(el => {
      el.commands = [
        {
          id: "<img src=x onerror=alert(1)>",
          label: "<script>alert('label')</script>",
          group: "<i>group</i>",
          shortcut: "<b>k</b>",
        },
      ];
      el.open = true;
    });

    expect(element.shadowRoot!.querySelector("script")).toBeNull();
    expect(element.shadowRoot!.querySelector("img")).toBeNull();
    expect(element.shadowRoot!.querySelector("i")).toBeNull();
    expect(q(element, '[part="row-label"]')?.textContent).toBe("<script>alert('label')</script>");
    expect(q(element, '[part="group-label"]')?.textContent).toBe("<i>group</i>");
  });

  it("ignores a malformed commands payload", async () => {
    const element = document.createElement("box-shortcuts-overlay") as ShortcutsOverlay;
    element.setAttribute("commands", '[{"id":"ok","label":"Fine","shortcut":"k"},{"label":"no id"}]');
    element.setAttribute("open", "");
    document.body.append(element);
    await flush();

    expect(element.commands).toEqual([]);
    expect(q(element, '[part="empty"]')).not.toBeNull();
  });
});
