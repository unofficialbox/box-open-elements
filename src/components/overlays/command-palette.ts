import {
  groupCommandMatches,
  isCommandDescriptorRecord,
  matchCommands,
  splitCommandLabel,
} from "./command-types.js";
import type { CommandDescriptor, CommandMatch } from "./command-types.js";
import { BaseElement } from "../../core/index.js";
import { dismissModal, promoteModal } from "../../foundations/overlay/index.js";
import { FocusRestore, trapTabKey } from "../../foundations/a11y/index.js";
import { boeOverlay, boePanel, boeRadius } from "../../foundations/geometry/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-command-palette";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const elementStyles = `
        [hidden] {
          display: none !important;
        }

        :host {
          display: contents;
        }

        /* The host's own display would otherwise beat the UA rule for [hidden],
           leaving the element on screen when a host hides it. */
        :host([hidden]) {
          display: none !important;
        }

        /* A <dialog> promoted with showModal() — see
           foundations/overlay/top-layer.ts. The top layer keeps the scrim above
           the page without moving the host node. UA border/margin/max-* reset
           because this is the full-viewport scrim, not a centred card. */
        [part="backdrop"] {
          position: fixed;
          inset: 0;
          display: flex;
          justify-content: center;
          align-items: start;
          padding-block-start: 12vh;
          background: ${boeOverlay.modalBackdrop};
          z-index: 1000;
          border: 0;
          margin: 0;
          max-width: none;
          max-height: none;
          width: auto;
          height: auto;
          color: inherit;
        }

        /* The scrim paints itself; the UA pseudo must not double it up. */
        [part="backdrop"]::backdrop {
          background: transparent;
        }

        /* Without showModal support the element stays hidden, which is the
           correct closed state anyway. */
        [part="backdrop"]:not([open]) {
          display: none;
        }

        [part="palette"] {
          inline-size: min(40rem, calc(100vw - 2rem));
          max-block-size: 70vh;
          display: grid;
          grid-template-rows: auto 1fr auto;
          border-radius: ${boeOverlay.modalRadius};
          border: ${boePanel.border};
          background: ${boePanel.background};
          box-shadow: ${boeOverlay.shadow};
          overflow: hidden;
        }

        [part="search-row"] {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.7rem 0.9rem;
          border-block-end: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
        }

        [part="search-icon"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="search"] {
          flex: 1;
          appearance: none;
          border: none;
          background: none;
          font: inherit;
          font-size: 1rem;
          color: var(--boe-token-text-text, #1f1e1b);
          outline: none;
        }

        [part="search"]::placeholder {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="results"] {
          margin: 0;
          padding: 0.35rem;
          list-style: none;
          overflow-y: auto;
        }

        [part="group-label"] {
          padding: 0.45rem 0.6rem 0.25rem;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="option"] {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.5rem 0.6rem;
          border-radius: ${boeOverlay.itemRadius};
          cursor: pointer;
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="option"][aria-selected="true"] {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, transparent);
        }

        [part="option"][aria-disabled="true"] {
          opacity: 0.5;
          cursor: not-allowed;
        }

        [part="option-text"] {
          display: grid;
          gap: 0.1rem;
          min-inline-size: 0;
        }

        [part="option-label"] {
          color: var(--boe-token-text-text, #1f1e1b);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        [part="match"] {
          font-weight: 700;
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="option-description"] {
          font-size: 0.78rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        [part="shortcut"] {
          margin-inline-start: auto;
          padding: 0.1rem 0.35rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 90%, transparent);
          border-radius: ${boeRadius.size};
          font-family: ui-monospace, monospace;
          font-size: 0.72rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          white-space: nowrap;
        }

        [part="empty"] {
          padding: 1.4rem 0.9rem;
          text-align: center;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="footer"] {
          display: flex;
          gap: 0.9rem;
          padding: 0.45rem 0.9rem;
          border-block-start: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
          font-size: 0.72rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="footer-key"] {
          font-family: ui-monospace, monospace;
          font-weight: 700;
        }

        @media (prefers-reduced-motion: reduce) {
          [part="option"] {
            transition: none;
          }
        }
      `;

/**
 * Keyboard-first action launcher (CLM gap 4) over the existing overlay and
 * listbox machinery.
 *
 * Follows the ARIA combobox-with-listbox pattern: focus never leaves the
 * search input, so typing and navigating are the same gesture. The active
 * option is communicated with `aria-activedescendant` rather than by moving
 * focus, which is what lets Up/Down browse results while the query stays
 * editable.
 *
 * The host owns what commands mean — the palette only reports the choice.
 */
export class CommandPalette extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return ["commands", "hide-disabled", "hotkey", "open", "placeholder"];
  }

  private hostEl!: HTMLElement;
  private backdropEl: HTMLElement | null = null;

  private readonly focusRestore = new FocusRestore();

  private openValue = false;

  private wasOpen = false;

  private query = "";

  private activeIndex = 0;

  /** Flattened, ranked matches — the index space the keyboard walks. */
  private rankedMatches: CommandMatch[] = [];

  private commandsRaw: string | null = null;

  private commandsCache: CommandDescriptor[] = [];

  private recentIdsValue: string[] = [];

  private readonly onDocumentKeydown = (event: KeyboardEvent): void => {
    const hotkey = this.hotkey;
    if (!hotkey || this.openValue) {
      return;
    }
    // `mod` means Cmd on Apple platforms and Ctrl elsewhere — the same
    // physical gesture, which is what "⌘K or Ctrl+K" actually means.
    const parts = hotkey.toLowerCase().split("+").map(part => part.trim());
    const key = parts[parts.length - 1] ?? "";
    const wantsMod = parts.includes("mod");
    const wantsShift = parts.includes("shift");
    const wantsAlt = parts.includes("alt");
    const modPressed = event.metaKey || event.ctrlKey;

    if (
      event.key.toLowerCase() === key &&
      (!wantsMod || modPressed) &&
      (wantsMod || !modPressed) &&
      wantsShift === event.shiftKey &&
      wantsAlt === event.altKey
    ) {
      event.preventDefault();
      this.open = true;
    }
  };

  get open(): boolean {
    return this.hasAttribute("open");
  }

  set open(value: boolean) {
    this.toggleAttribute("open", value);
  }

  get placeholder(): string {
    return this.getAttribute("placeholder") ?? "Type a command or search…";
  }

  set placeholder(value: string) {
    this.setAttribute("placeholder", value);
  }

  /**
   * Global shortcut that opens the palette, e.g. `mod+k`. `mod` resolves to
   * Cmd or Ctrl per platform. Omit to let the host own the trigger.
   */
  get hotkey(): string {
    return this.getAttribute("hotkey") ?? "";
  }

  set hotkey(value: string) {
    this.setAttribute("hotkey", value);
  }

  get hideDisabled(): boolean {
    return this.hasAttribute("hide-disabled");
  }

  set hideDisabled(value: boolean) {
    this.toggleAttribute("hide-disabled", value);
  }

  /** Command catalogue; JSON payloads are validated per record. */
  get commands(): CommandDescriptor[] {
    const raw = this.getAttribute("commands");
    if (!raw) {
      return [];
    }
    if (raw !== this.commandsRaw) {
      this.commandsRaw = raw;
      try {
        const parsed: unknown = JSON.parse(raw);
        this.commandsCache =
          Array.isArray(parsed) && parsed.every(isCommandDescriptorRecord)
            ? (parsed as CommandDescriptor[])
            : [];
      } catch {
        this.commandsCache = [];
      }
    }
    return [...this.commandsCache];
  }

  set commands(value: CommandDescriptor[]) {
    if (value.length) {
      this.setAttribute("commands", JSON.stringify(value));
      return;
    }
    this.removeAttribute("commands");
  }

  /** Most recently run command ids, most recent first; boosts ranking. */
  get recentIds(): string[] {
    return [...this.recentIdsValue];
  }

  set recentIds(value: string[]) {
    this.recentIdsValue = [...value];
    if (this.isRendered) {
      this.update();
    }
  }

  /** The ranked matches currently on screen. */
  get visibleCommands(): CommandDescriptor[] {
    return this.rankedMatches.map(match => match.command);
  }

  show(): void {
    this.open = true;
  }

  hide(): void {
    this.open = false;
  }

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("keydown", this.onDocumentKeydown);
  }

  disconnectedCallback(): void {
    document.removeEventListener("keydown", this.onDocumentKeydown);
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "open" && oldValue !== newValue && this.hasAttribute("open")) {
      // Every opening starts from a clean query — a palette that reopens
      // holding the last search is a nuisance, not a convenience.
      this.query = "";
      this.activeIndex = 0;
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  private runActive(): void {
    const match = this.rankedMatches[this.activeIndex];
    if (!match || match.command.disabled) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("command-selected", {
        bubbles: true,
        composed: true,
        detail: { command: match.command },
      }),
    );
    this.open = false;
  }

  private moveActive(delta: number): void {
    if (this.rankedMatches.length === 0) {
      return;
    }
    // Wrap: from the last result, Down returns to the first. A palette is a
    // short list, and dead-ending at the bottom just costs a keystroke.
    const next = (this.activeIndex + delta + this.rankedMatches.length) % this.rankedMatches.length;
    this.activeIndex = next;
    this.update();
    this.scrollActiveIntoView();
  }

  private scrollActiveIntoView(): void {
    const active = this.hostEl.querySelector(
      '[part="option"][aria-selected="true"]',
    ) as HTMLElement | null;
    // Not every DOM provides scrollIntoView (jsdom, SSR shims). Keeping the
    // active option in view is an enhancement — never a reason to throw and
    // take the whole keypress down with it.
    active?.scrollIntoView?.({ block: "nearest" });
  }

  private optionHtml(match: CommandMatch, index: number): string {
    const { command } = match;
    const label = splitCommandLabel(command.label, match.ranges)
      .map(part =>
        part.match
          ? `<span part="match">${escapeHtml(part.text)}</span>`
          : escapeHtml(part.text),
      )
      .join("");

    return `
      <li
        part="option"
        role="option"
        id="command-option-${String(index)}"
        data-command-id="${escapeHtml(command.id)}"
        data-index="${String(index)}"
        aria-selected="${index === this.activeIndex ? "true" : "false"}"
        ${command.disabled ? 'aria-disabled="true"' : ""}
      >
        <span part="option-text">
          <span part="option-label">${label}</span>
          ${command.description ? `<span part="option-description">${escapeHtml(command.description)}</span>` : ""}
        </span>
        ${command.shortcut ? `<span part="shortcut">${escapeHtml(command.shortcut)}</span>` : ""}
      </li>
    `;
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }
    this.shadowRoot.innerHTML = `<style>${elementStyles}</style><div part="host"></div>`;
    this.hostEl = this.shadowRoot.querySelector('[part="host"]')!;
  }

  protected setupListeners(): void {
    this.hostEl.addEventListener("pointerdown", event => {
      const target = event.target as HTMLElement;
      if (target.closest('[part="palette"]')) {
        return;
      }
      if (target.closest('[part="backdrop"]')) {
        this.dispatchEvent(new CustomEvent("dismissed", { bubbles: true, composed: true }));
        this.open = false;
      }
    });

    this.hostEl.addEventListener("click", event => {
      const option = (event.target as HTMLElement).closest('[part="option"]') as HTMLElement | null;
      if (!option || !this.hostEl.contains(option)) {
        return;
      }
      this.activeIndex = Number(option.getAttribute("data-index") ?? "0");
      this.runActive();
    });

    this.hostEl.addEventListener("input", event => {
      const input = event.target as HTMLInputElement;
      if (input.getAttribute("part") !== "search") {
        return;
      }
      this.query = input.value;
      this.activeIndex = 0;
      this.update();
    });

    this.hostEl.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      const palette = this.hostEl.querySelector('[part="palette"]') as HTMLElement | null;
      if (!palette) {
        return;
      }

      switch (keyboardEvent.key) {
        case "Escape":
          keyboardEvent.preventDefault();
          this.dispatchEvent(new CustomEvent("dismissed", { bubbles: true, composed: true }));
          this.open = false;
          return;
        case "ArrowDown":
          keyboardEvent.preventDefault();
          this.moveActive(1);
          return;
        case "ArrowUp":
          keyboardEvent.preventDefault();
          this.moveActive(-1);
          return;
        case "Home":
          keyboardEvent.preventDefault();
          this.activeIndex = 0;
          this.update();
          this.scrollActiveIntoView();
          return;
        case "End":
          keyboardEvent.preventDefault();
          this.activeIndex = Math.max(0, this.rankedMatches.length - 1);
          this.update();
          this.scrollActiveIntoView();
          return;
        case "Enter":
          keyboardEvent.preventDefault();
          this.runActive();
          return;
        case "Tab":
          trapTabKey(keyboardEvent, palette);
          return;
        default:
      }
    });
  }

  protected update(): void {
    if (!this.hostEl) {
      return;
    }

    this.openValue = this.open;
    if (!this.openValue) {
      const wasOpen = this.wasOpen;
      // Leave the top layer before the element is discarded, not after.
      dismissModal(this.backdropEl);
      this.backdropEl = null;
      this.hostEl.innerHTML = "";
      this.rankedMatches = [];
      this.wasOpen = false;
      if (wasOpen) {
        this.focusRestore.restore();
      }
      return;
    }

    const justOpened = !this.wasOpen;
    this.wasOpen = true;
    if (justOpened) {
      this.focusRestore.capture();
    }

    const groups = groupCommandMatches(
      matchCommands(this.commands, this.query, {
        recentIds: this.recentIdsValue,
        hideDisabled: this.hideDisabled,
      }),
    );
    // Flatten in *rendered* order, not rank order. Grouping can reorder
    // matches relative to their rank — the ungrouped section always trails —
    // so indexing the keyboard off the rank order would highlight one option
    // while Enter ran a different one.
    this.rankedMatches = groups.flatMap(group => group.matches);
    if (this.activeIndex >= this.rankedMatches.length) {
      this.activeIndex = Math.max(0, this.rankedMatches.length - 1);
    }

    // One flat index space across groups, so Up/Down crosses section
    // headings the way a reader expects.
    let index = 0;
    const sections = groups
      .map(group => {
        const options = group.matches.map(match => this.optionHtml(match, index++)).join("");
        return `<li part="group" role="presentation"><span part="group-label" role="presentation">${escapeHtml(group.label)}</span><ul part="group-options" role="group" aria-label="${escapeHtml(group.label)}">${options}</ul></li>`;
      })
      .join("");

    const activeId =
      this.rankedMatches.length > 0 ? `command-option-${String(this.activeIndex)}` : "";

    if (justOpened || !this.hostEl.querySelector('[part="palette"]')) {
      this.hostEl.innerHTML = `
        <dialog part="backdrop" aria-label="Command palette">
          <div part="palette">
            <div part="search-row">
              <span part="search-icon" aria-hidden="true">⌕</span>
              <input
                part="search"
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls="command-results"
                aria-autocomplete="list"
                aria-label="${escapeHtml(this.placeholder)}"
                placeholder="${escapeHtml(this.placeholder)}"
                autocomplete="off"
                spellcheck="false"
              >
            </div>
            <ul part="results" id="command-results" role="listbox" aria-label="Commands"></ul>
            <div part="empty" hidden>No matching commands.</div>
            <div part="footer">
              <span><span part="footer-key">↑↓</span> navigate</span>
              <span><span part="footer-key">⏎</span> run</span>
              <span><span part="footer-key">esc</span> close</span>
            </div>
          </div>
        </dialog>
      `;
    }

    const freshScrim = this.backdropEl === null;
    this.backdropEl = this.hostEl.querySelector('[part="backdrop"]');
    if (freshScrim && this.backdropEl) {
      // A modal dialog closes itself on Escape and fires `cancel`; route it
      // through the component's own dismissal so `open` stays in sync.
      this.backdropEl.addEventListener("cancel", event => {
        event.preventDefault();
        this.dispatchEvent(new CustomEvent("dismissed", { bubbles: true, composed: true }));
        this.open = false;
      });
    }
    promoteModal(this.backdropEl);

    const input = this.hostEl.querySelector('[part="search"]') as HTMLInputElement;
    const results = this.hostEl.querySelector('[part="results"]') as HTMLElement;
    const empty = this.hostEl.querySelector('[part="empty"]') as HTMLElement;

    results.innerHTML = sections;
    results.hidden = this.rankedMatches.length === 0;
    empty.hidden = this.rankedMatches.length > 0;

    if (input.value !== this.query) {
      input.value = this.query;
    }
    if (activeId) {
      input.setAttribute("aria-activedescendant", activeId);
    } else {
      input.removeAttribute("aria-activedescendant");
    }

    if (justOpened) {
      input.focus();
    }
  }
}

CommandPalette.register();
