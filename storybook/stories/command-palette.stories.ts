import type { StoryModule } from "../metadata.js";

const commandPalette: StoryModule = {
  title: "Components/Overlays/Command Palette",
  meta: {
    id: "command-palette",
    tag: "box-command-palette",
    shortDescription: "Keyboard-first action launcher over the overlay + listbox machinery.",
    docsDescription:
      "The global command bar (CLM gap 4). Matching is pure and DOM-free, so a host can drive its own launcher from the same functions: exact label ranks above prefix above substring above subsequence, word starts and consecutive runs score higher (so 'cv' finds 'Compare versions' by initials), hidden keywords match without highlighting since they are not on screen, and disabled commands rank last but stay findable. The shell follows the ARIA combobox-with-listbox pattern — focus never leaves the search input and the active option is named through aria-activedescendant, which is what lets Up/Down browse results while the query stays editable. Arrows cross section headings in one flat index space and wrap at both ends; Home/End jump; Escape and backdrop press dismiss; focus returns to whatever opened it. An optional hotkey (mod+k, where mod is Cmd or Ctrl per platform) opens it globally, and its listener is removed on disconnect. The host owns what commands mean — the palette only reports the choice.",
    sourceSnippet: `<box-command-palette hotkey="mod+k"></box-command-palette>`,
    referenceRows: [
      { kind: "attribute", name: "open", type: "boolean", description: "Visibility. Each opening starts from a clean query." },
      { kind: "attribute", name: "hotkey", type: "string", description: "Global shortcut such as `mod+k`; `mod` is Cmd or Ctrl per platform. Omit to let the host own the trigger." },
      { kind: "attribute", name: "placeholder", type: "string", description: "Search placeholder, also the input's accessible name." },
      { kind: "attribute", name: "hide-disabled", type: "boolean", description: "Drop disabled commands instead of ranking them last." },
      { kind: "attribute", name: "commands", type: "json", description: "CommandDescriptor records, validated per record." },
      { kind: "property", name: "recentIds", type: "string[]", description: "Recently run ids, most recent first; boosts ranking." },
      { kind: "property", name: "visibleCommands", type: "CommandDescriptor[]", description: "The ranked matches currently on screen." },
      { kind: "event", name: "command-selected", description: "A command was run — detail carries the descriptor." },
      { kind: "event", name: "dismissed", description: "Closed by Escape or a backdrop press." },
    ],
  },
  variants: [
    {
      name: "Open with grouped commands",
      html: `<box-command-palette hotkey="mod+k" placeholder="Type a command or search…" open></box-command-palette>`,
      note: "Sections come from each command's group, with the ungrouped section trailing. Arrows cross headings in one flat index space, so the highlighted option is always the one Enter runs.",
    },
  ],
};

export default commandPalette;
