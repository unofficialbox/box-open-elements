import { afterEach, describe, expect, it, vi } from "vitest";

import { CommandPalette } from "../../../src/components/overlays/command-palette.js";
import type { CommandDescriptor } from "../../../src/components/overlays/command-types.js";

CommandPalette.register();

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
};

const commands: CommandDescriptor[] = [
  { id: "new-contract", label: "New contract", group: "Create", shortcut: "⌘N", description: "Start an intake request" },
  { id: "new-clause", label: "New clause", group: "Create" },
  { id: "compare-versions", label: "Compare versions", group: "Review", keywords: ["diff"] },
  { id: "cancel-request", label: "Cancel request", group: "Review", disabled: true },
  { id: "settings", label: "Open settings" },
];

const mount = async (configure: (element: CommandPalette) => void = () => {}): Promise<CommandPalette> => {
  const element = document.createElement("box-command-palette") as CommandPalette;
  element.commands = commands;
  configure(element);
  document.body.append(element);
  await flush();
  return element;
};

const q = (element: CommandPalette, selector: string): HTMLElement | null =>
  element.shadowRoot!.querySelector(selector);

const all = (element: CommandPalette, selector: string): HTMLElement[] =>
  Array.from(element.shadowRoot!.querySelectorAll(selector));

const optionLabels = (element: CommandPalette): (string | null)[] =>
  all(element, '[part="option"]').map(node => node.getAttribute("data-command-id"));

const activeId = (element: CommandPalette): string | null =>
  all(element, '[part="option"]').find(node => node.getAttribute("aria-selected") === "true")
    ?.getAttribute("data-command-id") ?? null;

const type = async (element: CommandPalette, value: string): Promise<void> => {
  const input = q(element, '[part="search"]') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  await flush();
};

const press = async (element: CommandPalette, key: string): Promise<void> => {
  const input = q(element, '[part="search"]') as HTMLInputElement;
  input.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, composed: true }));
  await flush();
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("box-command-palette", () => {
  it("renders nothing until opened", async () => {
    const element = await mount();
    expect(q(element, '[part="palette"]')).toBeNull();

    element.open = true;
    await flush();
    expect(q(element, '[part="palette"]')).not.toBeNull();
  });

  it("groups commands with an ungrouped trailing section", async () => {
    const element = await mount(el => (el.open = true));

    expect(all(element, '[part="group-label"]').map(n => n.textContent)).toEqual([
      "Create",
      "Review",
      "Other",
    ]);
    expect(optionLabels(element)).toEqual([
      "new-contract",
      "new-clause",
      "compare-versions",
      "cancel-request",
      "settings",
    ]);
  });

  it("wires the ARIA combobox contract to the active option", async () => {
    const element = await mount(el => (el.open = true));

    const input = q(element, '[part="search"]')!;
    const results = q(element, '[part="results"]')!;
    expect(input.getAttribute("role")).toBe("combobox");
    expect(input.getAttribute("aria-controls")).toBe(results.id);
    expect(results.getAttribute("role")).toBe("listbox");

    // Focus stays in the input; the active option is named, not focused.
    const active = all(element, '[part="option"]').find(
      node => node.getAttribute("aria-selected") === "true",
    );
    expect(input.getAttribute("aria-activedescendant")).toBe(active!.id);
    expect(element.shadowRoot!.activeElement).toBe(input);
  });

  it("filters as you type and highlights the matched run", async () => {
    const element = await mount(el => (el.open = true));

    await type(element, "new c");
    expect(optionLabels(element)).toEqual(["new-contract", "new-clause"]);

    const highlight = q(element, '[part="match"]');
    expect(highlight?.textContent).toBe("New c");
  });

  it("keeps focus in the input while arrows walk the results", async () => {
    const element = await mount(el => (el.open = true));
    const input = q(element, '[part="search"]') as HTMLInputElement;

    expect(activeId(element)).toBe("new-contract");
    await press(element, "ArrowDown");
    expect(activeId(element)).toBe("new-clause");
    expect(element.shadowRoot!.activeElement).toBe(input);

    // Arrow keys cross a group heading without a hitch — one flat index space.
    await press(element, "ArrowDown");
    expect(activeId(element)).toBe("compare-versions");
  });

  it("wraps at both ends and honours Home/End", async () => {
    const element = await mount(el => (el.open = true));

    await press(element, "ArrowUp");
    expect(activeId(element)).toBe("settings");
    await press(element, "ArrowDown");
    expect(activeId(element)).toBe("new-contract");

    await press(element, "End");
    expect(activeId(element)).toBe("settings");
    await press(element, "Home");
    expect(activeId(element)).toBe("new-contract");
  });

  it("runs the active command on Enter and closes", async () => {
    const element = await mount(el => (el.open = true));
    const selected = vi.fn();
    element.addEventListener("command-selected", selected);

    await type(element, "compare");
    await press(element, "Enter");

    expect(selected.mock.calls[0]?.[0].detail.command.id).toBe("compare-versions");
    expect(element.open).toBe(false);
    expect(q(element, '[part="palette"]')).toBeNull();
  });

  it("runs a command on click", async () => {
    const element = await mount(el => (el.open = true));
    const selected = vi.fn();
    element.addEventListener("command-selected", selected);

    all(element, '[part="option"]')[1]!.click();
    await flush();

    expect(selected.mock.calls[0]?.[0].detail.command.id).toBe("new-clause");
  });

  it("refuses to run a disabled command", async () => {
    const element = await mount(el => (el.open = true));
    const selected = vi.fn();
    element.addEventListener("command-selected", selected);

    const disabled = all(element, '[part="option"]').find(
      node => node.getAttribute("data-command-id") === "cancel-request",
    )!;
    expect(disabled.getAttribute("aria-disabled")).toBe("true");
    disabled.click();
    await flush();

    expect(selected).not.toHaveBeenCalled();
    expect(element.open).toBe(true);
  });

  it("shows an empty state when nothing matches", async () => {
    const element = await mount(el => (el.open = true));

    await type(element, "zzzz");

    expect(all(element, '[part="option"]')).toHaveLength(0);
    expect(q(element, '[part="empty"]')?.hidden).toBe(false);
    // Enter on an empty list must not emit anything.
    const selected = vi.fn();
    element.addEventListener("command-selected", selected);
    await press(element, "Enter");
    expect(selected).not.toHaveBeenCalled();
  });

  it("closes on Escape and emits dismissed", async () => {
    const element = await mount(el => (el.open = true));
    const dismissed = vi.fn();
    element.addEventListener("dismissed", dismissed);

    await press(element, "Escape");

    expect(dismissed).toHaveBeenCalled();
    expect(element.open).toBe(false);
  });

  it("closes when the backdrop is pressed but not the palette", async () => {
    const element = await mount(el => (el.open = true));

    q(element, '[part="palette"]')!.dispatchEvent(
      new MouseEvent("pointerdown", { bubbles: true, composed: true }),
    );
    await flush();
    expect(element.open).toBe(true);

    q(element, '[part="backdrop"]')!.dispatchEvent(
      new MouseEvent("pointerdown", { bubbles: true, composed: true }),
    );
    await flush();
    expect(element.open).toBe(false);
  });

  it("restores focus to the opener when it closes", async () => {
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();
    expect(document.activeElement).toBe(opener);

    const element = await mount();
    element.open = true;
    await flush();
    expect(document.activeElement).toBe(element);

    element.open = false;
    await flush();
    expect(document.activeElement).toBe(opener);
  });

  it("starts each opening from a clean query", async () => {
    const element = await mount(el => (el.open = true));
    await type(element, "compare");
    expect(optionLabels(element)).toEqual(["compare-versions"]);

    element.open = false;
    await flush();
    element.open = true;
    await flush();

    expect((q(element, '[part="search"]') as HTMLInputElement).value).toBe("");
    expect(optionLabels(element)).toHaveLength(commands.length);
  });

  it("boosts recent commands, carrying their group to the front", async () => {
    const element = await mount(el => {
      el.recentIds = ["compare-versions"];
      el.open = true;
    });

    expect(all(element, '[part="group-label"]')[0]?.textContent).toBe("Review");
    expect(optionLabels(element)[0]).toBe("compare-versions");
  });

  it("keeps the ungrouped section trailing even for a recent command", async () => {
    const element = await mount(el => {
      el.recentIds = ["settings"];
      el.open = true;
    });

    // Section placement is grouping's call, not ranking's: "Other" trails by
    // rule, so a recent ungrouped command does not jump the sections above it.
    expect(all(element, '[part="group-label"]').at(-1)?.textContent).toBe("Other");
    expect(optionLabels(element).at(-1)).toBe("settings");
  });

  it("highlights the same command that Enter runs", async () => {
    // The keyboard indexes rendered order, and grouping can reorder matches
    // relative to their rank — indexing off rank order instead would run a
    // different command than the one shown as selected.
    const element = await mount(el => {
      el.recentIds = ["settings"];
      el.open = true;
    });
    const selected = vi.fn();
    element.addEventListener("command-selected", selected);

    for (const step of [0, 1, 2, 3, 4]) {
      void step;
      const shown = activeId(element);
      const input = q(element, '[part="search"]')!;
      const described = element.shadowRoot!.getElementById(
        input.getAttribute("aria-activedescendant")!,
      );
      expect(described?.getAttribute("data-command-id")).toBe(shown);
      await press(element, "ArrowDown");
    }

    // And the command actually dispatched is the highlighted one.
    await press(element, "Home");
    const highlighted = activeId(element);
    await press(element, "Enter");
    expect(selected.mock.calls[0]?.[0].detail.command.id).toBe(highlighted);
  });

  it("opens on the configured hotkey, resolving mod per platform", async () => {
    const element = await mount(el => (el.hotkey = "mod+k"));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
    await flush();
    expect(element.open).toBe(true);

    element.open = false;
    await flush();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
    await flush();
    expect(element.open).toBe(true);
  });

  it("ignores the bare key when the hotkey wants a modifier", async () => {
    const element = await mount(el => (el.hotkey = "mod+k"));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", bubbles: true }));
    await flush();
    expect(element.open).toBe(false);
  });

  it("stops listening for the hotkey once disconnected", async () => {
    const element = await mount(el => (el.hotkey = "mod+k"));
    element.remove();
    await flush();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
    await flush();
    expect(element.open).toBe(false);
  });

  it("navigates without scrollIntoView, which not every DOM provides", async () => {
    const element = await mount(el => (el.open = true));
    const option = all(element, '[part="option"]')[0]! as HTMLElement & {
      scrollIntoView?: unknown;
    };
    // jsdom omits it; an SSR shim may too. Keeping the active option in view
    // is an enhancement, so its absence must not break the keypress.
    expect(option.scrollIntoView).toBeUndefined();

    await press(element, "ArrowDown");
    await press(element, "End");
    await press(element, "Home");
    expect(activeId(element)).toBe("new-contract");
  });

  it("escapes hostile command content", async () => {
    const element = await mount(el => {
      el.commands = [
        {
          id: "<img src=x onerror=alert(1)>",
          label: "<script>alert('label')</script>",
          description: "<b>desc</b>",
          group: "<i>group</i>",
          shortcut: "<u>k</u>",
        },
      ];
      el.open = true;
    });

    expect(element.shadowRoot!.querySelector("script")).toBeNull();
    expect(element.shadowRoot!.querySelector("img")).toBeNull();
    expect(element.shadowRoot!.querySelector("b")).toBeNull();
    expect(q(element, '[part="option-label"]')?.textContent).toBe("<script>alert('label')</script>");
    expect(q(element, '[part="option-description"]')?.textContent).toBe("<b>desc</b>");
    expect(q(element, '[part="group-label"]')?.textContent).toBe("<i>group</i>");
  });

  it("ignores a malformed commands payload", async () => {
    const element = document.createElement("box-command-palette") as CommandPalette;
    element.setAttribute("commands", '[{"id":"ok","label":"Fine"},{"label":"no id"}]');
    element.setAttribute("open", "");
    document.body.append(element);
    await flush();

    expect(element.commands).toEqual([]);
    expect(q(element, '[part="empty"]')?.hidden).toBe(false);
  });
});
