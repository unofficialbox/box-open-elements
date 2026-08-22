import {
  groupShortcutCommands,
  isCommandDescriptorRecord,
  splitShortcutKeys,
} from "./command-types.js";
import type { CommandDescriptor } from "./command-types.js";
import { BaseElement } from "../../core/index.js";
import { FocusRestore, trapTabKey } from "../../foundations/a11y/index.js";
import { boeOverlay, boePanel, boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-shortcuts-overlay";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/** Editable targets where a bare-character hotkey must never fire. */
const isTypingTarget = (target: EventTarget | null): boolean => {
  const element = target as HTMLElement | null;
  if (!element || typeof element.tagName !== "string") {
    return false;
  }
  if (element.isContentEditable) {
    return true;
  }
  const tag = element.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
};

/**
 * The element the key was actually typed into. `event.target` is retargeted to
 * the shadow host once an event crosses a shadow boundary, and this library
 * wraps native controls in shadow DOM — so reading `target` on a document
 * listener sees `box-text-field`, not the `input` inside it.
 */
const keyOrigin = (event: KeyboardEvent): EventTarget | null =>
  event.composedPath()[0] ?? event.target;

const elementStyles = `
        [hidden] {
          display: none !important;
        }

        :host {
          display: contents;
        }

        [part="backdrop"] {
          position: fixed;
          inset: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1rem;
          background: ${boeOverlay.modalBackdrop};
          z-index: 1000;
        }

        [part="sheet"] {
          inline-size: min(34rem, 100%);
          max-block-size: 80vh;
          display: grid;
          grid-template-rows: auto 1fr;
          border-radius: ${boeOverlay.modalRadius};
          border: ${boePanel.border};
          background: ${boePanel.background};
          box-shadow: ${boeOverlay.shadow};
          overflow: hidden;
        }

        [part="header"] {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.85rem 1rem;
          border-block-end: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
        }

        [part="title"] {
          margin: 0;
          font: inherit;
          font-size: 1rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="close"] {
          margin-inline-start: auto;
          appearance: none;
          font: inherit;
          font-size: 0.8rem;
          padding: 0.25rem 0.55rem;
          border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
          border-radius: ${boeRadius.control};
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #222222);
          cursor: pointer;
        }

        [part="close"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part="groups"] {
          margin: 0;
          padding: 0.6rem 1rem 1rem;
          list-style: none;
          overflow-y: auto;
        }

        [part="group-label"] {
          display: block;
          padding-block: 0.7rem 0.3rem;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="rows"] {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
        }

        [part="row"] {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
          padding: 0.35rem 0;
        }

        [part="row-label"] {
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="keys"] {
          margin-inline-start: auto;
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
          white-space: nowrap;
        }

        [part="key"] {
          min-inline-size: 1.4rem;
          padding: 0.1rem 0.35rem;
          border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
          border-block-end-width: 2px;
          border-radius: ${boeRadius.size};
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
          font-family: ui-monospace, monospace;
          font-size: 0.72rem;
          text-align: center;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="key-separator"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.7rem;
        }

        [part="empty"] {
          padding: 1.4rem 1rem;
          text-align: center;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="close"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }
      `;

/**
 * The keyboard shortcuts sheet that makes keyboard-first real — the pair to
 * `box-command-palette`.
 *
 * It reads the *same* `CommandDescriptor[]` the palette does and lists only
 * the commands that declare a `shortcut`. One catalogue driving both surfaces
 * is the point: a shortcut cannot end up documented but unreachable, or
 * reachable but undocumented, because there is only one place to add it.
 *
 * Keys render as `<kbd>` elements rather than a run of text, so the markup
 * says what it means.
 */
export class ShortcutsOverlay extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return ["commands", "heading", "hotkey", "open"];
  }

  private hostEl!: HTMLElement;

  private readonly focusRestore = new FocusRestore();

  private wasOpen = false;

  private commandsRaw: string | null = null;

  private commandsCache: CommandDescriptor[] = [];

  private readonly onDocumentKeydown = (event: KeyboardEvent): void => {
    if (this.open) {
      // Escape closes from anywhere. Focus can end up outside the sheet — the
      // browser chrome, a host that moves it — and a modal that only closes
      // while it still holds focus is a trap. The sheet's own handler runs
      // first and clears `open`, so this never dismisses twice.
      if (event.key === "Escape") {
        event.preventDefault();
        this.dismiss();
      }
      return;
    }
    const hotkey = this.hotkey;
    if (!hotkey) {
      return;
    }
    // A bare-character hotkey must never fire while someone is typing —
    // "?" is a legitimate character in every text field on the page.
    if (isTypingTarget(keyOrigin(event))) {
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    if (event.key === hotkey) {
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

  get heading(): string {
    return this.getAttribute("heading") ?? "Keyboard shortcuts";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  /**
   * Character that opens the sheet. Defaults to `?`, the convention. Matched
   * against the produced character, so the Shift needed to type it is already
   * accounted for. Set empty to let the host own the trigger.
   */
  get hotkey(): string {
    const raw = this.getAttribute("hotkey");
    return raw === null ? "?" : raw;
  }

  set hotkey(value: string) {
    this.setAttribute("hotkey", value);
  }

  /** The same catalogue `box-command-palette` takes; validated per record. */
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

  /** Only the commands that declare a shortcut, in catalogue order. */
  get documentedCommands(): CommandDescriptor[] {
    return groupShortcutCommands(this.commands).flatMap(group => group.commands);
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

  private dismiss(): void {
    this.dispatchEvent(new CustomEvent("dismissed", { bubbles: true, composed: true }));
    this.open = false;
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
      if (target.closest('[part="sheet"]')) {
        return;
      }
      if (target.closest('[part="backdrop"]')) {
        this.dismiss();
      }
    });

    this.hostEl.addEventListener("click", event => {
      if ((event.target as HTMLElement).closest('[part="close"]')) {
        this.dismiss();
      }
    });

    this.hostEl.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      const sheet = this.hostEl.querySelector('[part="sheet"]') as HTMLElement | null;
      if (!sheet) {
        return;
      }
      if (keyboardEvent.key === "Escape") {
        keyboardEvent.preventDefault();
        this.dismiss();
        return;
      }
      if (keyboardEvent.key === "Tab") {
        trapTabKey(keyboardEvent, sheet);
      }
    });
  }

  protected update(): void {
    if (!this.hostEl) {
      return;
    }

    if (!this.open) {
      const wasOpen = this.wasOpen;
      this.hostEl.innerHTML = "";
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

    const groups = groupShortcutCommands(this.commands);
    const sections = groups
      .map(group => {
        const rows = group.commands
          .map(command => {
            const keys = splitShortcutKeys(command.shortcut ?? "")
              .map(key => `<kbd part="key">${escapeHtml(key)}</kbd>`)
              .join(`<span part="key-separator" aria-hidden="true">+</span>`);
            return `
              <li part="row" data-command-id="${escapeHtml(command.id)}">
                <span part="row-label">${escapeHtml(command.label)}</span>
                <span part="keys" aria-label="${escapeHtml(command.shortcut ?? "")}">${keys}</span>
              </li>
            `;
          })
          .join("");
        return `<li part="group" data-group-key="${escapeHtml(group.key)}"><span part="group-label">${escapeHtml(group.label)}</span><ul part="rows" role="list">${rows}</ul></li>`;
      })
      .join("");

    this.hostEl.innerHTML = `
      <div part="backdrop">
        <div part="sheet" role="dialog" aria-modal="true" aria-label="${escapeHtml(this.heading)}">
          <div part="header">
            <h2 part="title">${escapeHtml(this.heading)}</h2>
            <button type="button" part="close">Close</button>
          </div>
          ${
            groups.length
              ? `<ul part="groups" role="list">${sections}</ul>`
              : `<div part="empty">No keyboard shortcuts are defined.</div>`
          }
        </div>
      </div>
    `;

    if (justOpened) {
      (this.hostEl.querySelector('[part="close"]') as HTMLElement | null)?.focus();
    }
  }
}

ShortcutsOverlay.register();
