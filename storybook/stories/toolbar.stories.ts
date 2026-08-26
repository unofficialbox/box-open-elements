import type { StoryModule } from "../metadata.js";

const toolbar: StoryModule = {
  title: "Components/Actions/Toolbar",
  meta: {
    id: "toolbar",
    tag: "box-toolbar",
    shortDescription: "A row of independent controls, as one tab stop.",
    docsDescription:
      "The controls are yours; this contributes the three things a toolbar owes and hosts routinely skip: `role=\"toolbar\"`, an accessible name, and roving tabindex — so the whole group is a single tab stop and the arrow keys move within it. Reach for `box-button-group` instead when the controls are not independent: that one is a `radiogroup`, for picking exactly one of a set. Roving tabindex works by moving `tabindex` between elements, so it can only manage controls the browser already considers focusable — a custom element host is not focusable unless it carries its own `tabindex`.",
    sourceSnippet: `<box-toolbar label="Document actions">
  <button type="button">Share</button>
  <button type="button">Download</button>
</box-toolbar>`,
    referenceRows: [
      { kind: "attribute", name: "label", type: "string", description: "Accessible name for the group, announced before its controls. Omitted rather than set blank when absent." },
      { kind: "attribute", name: "orientation", type: "string", description: "`horizontal` (default) or `vertical`. Picks which arrow keys navigate, and sets `aria-orientation`." },
      { kind: "property", name: "controls", type: "HTMLElement[]", description: "The focusable, non-disabled controls being managed, in document order." },
      { kind: "slot", name: "(default)", type: "slot", description: "The controls. Nested ones are found, so wrapping for layout is fine." },
      { kind: "part", name: "toolbar", type: "part", description: "The container carrying the role and the name." },
    ],
  },
  variants: [
    {
      name: "Actions",
      html: `<box-toolbar label="Document actions">
  <button type="button">Share</button>
  <button type="button">Download</button>
  <button type="button">Rename</button>
</box-toolbar>`,
      note: "Tab reaches the group once; the arrow keys move between the controls inside it.",
    },
    {
      name: "With a disabled control",
      html: `<box-toolbar label="Document actions">
  <button type="button">Share</button>
  <button type="button" disabled>Download</button>
  <button type="button">Rename</button>
</box-toolbar>`,
      note: "Arrow keys skip it. A disabled control cannot take focus, so leaving it in the rotation would strand the reader on a dead stop.",
    },
    {
      name: "Vertical",
      html: `<box-toolbar label="Document actions" orientation="vertical" style="max-width:12rem">
  <button type="button">Share</button>
  <button type="button">Download</button>
  <button type="button">Rename</button>
</box-toolbar>`,
      note: "Up and down navigate instead, and `aria-orientation` follows so the announcement matches the behaviour.",
    },
    {
      name: "Grouped for layout",
      html: `<box-toolbar label="Editor actions">
  <span><button type="button">Bold</button><button type="button">Italic</button></span>
  <a href="#help">Help</a>
</box-toolbar>`,
      note: "Controls nested in a wrapper are still found, and a link counts as a control — a toolbar is not only buttons.",
    },
  ],
};

export default toolbar;
