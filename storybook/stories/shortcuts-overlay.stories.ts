import type { StoryModule } from "../metadata.js";

const shortcutsOverlay: StoryModule = {
  title: "Components/Overlays/Shortcuts Overlay",
  meta: {
    id: "shortcuts-overlay",
    tag: "box-shortcuts-overlay",
    shortDescription: "The keyboard shortcuts sheet, driven by the same command catalogue as the palette.",
    docsDescription:
      "The pair to `box-command-palette`. It reads the *same* `CommandDescriptor[]` the palette takes and lists only the commands that declare a `shortcut`. One catalogue driving both surfaces is the point: a shortcut cannot end up documented but unreachable, or reachable but undocumented, because there is only one place to add it — adding `shortcut: \"mod+k\"` to a command puts it in the palette **and** in the sheet. `groupShortcutCommands` and `splitShortcutKeys` are pure and DOM-free, so a host can render its own sheet from the same data. Keys render as `kbd` elements rather than one run of text, with the whole combination as the accessible name and the `+` separators hidden from assistive tech. A bare-character hotkey needs two guards, and `?` has both: it never fires while someone is typing — including inside a shadow-DOM form control, where the event target retargets to the wrapper — and never fires with a modifier held. Modal, with a focus trap and focus restore; Escape closes it from anywhere, not only while the sheet holds focus.",
    sourceSnippet: `<box-shortcuts-overlay heading="Keyboard shortcuts"></box-shortcuts-overlay>`,
    referenceRows: [
      { kind: "attribute", name: "commands", type: "json", description: "The same CommandDescriptor records the palette takes; only those with a `shortcut` are listed." },
      { kind: "attribute", name: "heading", type: "string", description: "Sheet title and its dialog accessible name. Defaults to 'Keyboard shortcuts'." },
      { kind: "attribute", name: "hotkey", type: "string", description: "Character that opens the sheet, matched against the produced character. Defaults to '?'; set empty to let the host own the trigger." },
      { kind: "attribute", name: "open", type: "boolean", description: "Whether the sheet is showing." },
      { kind: "property", name: "documentedCommands", type: "CommandDescriptor[]", description: "Read-only: the commands that declare a shortcut, in catalogue order." },
      { kind: "event", name: "dismissed", description: "The sheet was closed by Escape, the close button, or a backdrop press." },
    ],
  },
  variants: [
    {
      name: "Documented shortcuts",
      html: `<box-shortcuts-overlay heading="Keyboard shortcuts" open></box-shortcuts-overlay>`,
      note: "Grouped the way the palette sections its results, with the ungrouped section trailing. Each key is its own kbd; the whole combination is the accessible name.",
    },
    {
      name: "Nothing documented yet",
      html: `<box-shortcuts-overlay heading="Keyboard shortcuts" open></box-shortcuts-overlay>`,
      note: "A catalogue where no command declares a shortcut says so, rather than rendering a heading over nothing.",
    },
  ],
};

export default shortcutsOverlay;
