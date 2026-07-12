const DEFAULT_TAG_NAME = "box-draggable-list";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type BoxDraggableListItem = {
  value: string;
  label: string;
};

/**
 * A reorderable list. Items arrive via the `items` property; reordering is
 * available by pointer drag and by keyboard (focus a row's handle, then
 * ArrowUp/ArrowDown to move it). Every reorder updates `items` and emits a
 * `reorder` event carrying the moved value, its old/new index, and the new
 * order. It owns no persistence — the host stores the order.
 */
export class BoxDraggableListElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["items", "label"];
  }

  private dragValue: string | null = null;
  private focusValue: string | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get items(): BoxDraggableListItem[] {
    const raw = this.getAttribute("items");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as BoxDraggableListItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set items(value: BoxDraggableListItem[]) {
    this.setAttribute("items", JSON.stringify(value));
  }

  get label(): string {
    return this.getAttribute("label") ?? "Reorderable list";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  /** Move the item at `from` to `to`, persist, and announce it. */
  private moveItem(from: number, to: number): void {
    const items = this.items;
    if (from < 0 || from >= items.length || to < 0 || to >= items.length || from === to) {
      return;
    }

    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    this.focusValue = moved.value;
    // Set the attribute directly (not via the `items` setter) so we control a
    // single render, then focus the moved handle in its new position.
    this.setAttribute("items", JSON.stringify(next));
    this.render();
    this.dispatchEvent(
      new CustomEvent("reorder", {
        bubbles: true,
        composed: true,
        detail: { value: moved.value, from, to, items: next },
      }),
    );
  }

  private indexOf(value: string): number {
    return this.items.findIndex(item => item.value === value);
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const items = this.items;
    const rows = items
      .map((item, index) => {
        const position = index + 1;
        return `
          <li
            part="item"
            role="listitem"
            draggable="true"
            data-value="${escapeHtml(item.value)}"
            data-index="${index}"
          >
            <button
              type="button"
              part="handle"
              aria-label="Reorder ${escapeHtml(item.label)}, position ${position} of ${items.length}"
              tabindex="${item.value === (this.focusValue ?? items[0]?.value) ? "0" : "-1"}"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M6 4h.01M10 4h.01M6 8h.01M10 8h.01M6 12h.01M10 12h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <span part="item-label">${escapeHtml(item.label)}</span>
          </li>
        `;
      })
      .join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="list"] {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.4rem;
        }

        [part="item"] {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.55rem 0.7rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 82%, transparent);
          border-radius: 0.7rem;
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #101820);
        }

        [part="item"][data-dragging="true"] {
          opacity: 0.5;
        }

        [part="item"][data-drop-target="true"] {
          border-color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="handle"] {
          appearance: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          inline-size: 1.6rem;
          block-size: 1.6rem;
          padding: 0;
          border: 0;
          border-radius: 0.4rem;
          background: transparent;
          color: var(--boe-token-text-text-secondary, #52606d);
          cursor: grab;
        }

        [part="handle"] svg {
          inline-size: 1rem;
          block-size: 1rem;
        }

        [part="handle"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
        }

        [part="item-label"] {
          font-size: 0.9rem;
          font-weight: 500;
        }
      </style>
      ${
        items.length
          ? `<ul part="list" role="list" aria-label="${escapeHtml(this.label)}">${rows}</ul>`
          : `<div part="empty">No items loaded</div>`
      }
    `;

    this.attachListeners();

    if (this.focusValue) {
      const target = Array.from(this.shadowRoot.querySelectorAll('[part="item"]')).find(
        node => (node as HTMLElement).dataset.value === this.focusValue,
      );
      (target?.querySelector('[part="handle"]') as HTMLButtonElement | undefined)?.focus();
    }
  }

  private attachListeners(): void {
    if (!this.shadowRoot) {
      return;
    }

    for (const handle of Array.from(this.shadowRoot.querySelectorAll('[part="handle"]'))) {
      handle.addEventListener("keydown", event => {
        const keyboardEvent = event as KeyboardEvent;
        const row = (handle as HTMLElement).closest('[part="item"]') as HTMLElement | null;
        const value = row?.dataset.value ?? "";
        const index = this.indexOf(value);

        if (keyboardEvent.key === "ArrowUp") {
          keyboardEvent.preventDefault();
          this.moveItem(index, index - 1);
        } else if (keyboardEvent.key === "ArrowDown") {
          keyboardEvent.preventDefault();
          this.moveItem(index, index + 1);
        } else if (keyboardEvent.key === "Home") {
          keyboardEvent.preventDefault();
          this.moveItem(index, 0);
        } else if (keyboardEvent.key === "End") {
          keyboardEvent.preventDefault();
          this.moveItem(index, this.items.length - 1);
        }
      });
    }

    for (const row of Array.from(this.shadowRoot.querySelectorAll('[part="item"]'))) {
      const element = row as HTMLElement;

      element.addEventListener("dragstart", event => {
        this.dragValue = element.dataset.value ?? null;
        element.dataset.dragging = "true";
        (event as DragEvent).dataTransfer?.setData("text/plain", this.dragValue ?? "");
      });

      element.addEventListener("dragover", event => {
        event.preventDefault();
        element.dataset.dropTarget = "true";
      });

      element.addEventListener("dragleave", () => {
        delete element.dataset.dropTarget;
      });

      element.addEventListener("drop", event => {
        event.preventDefault();
        delete element.dataset.dropTarget;
        if (this.dragValue === null) {
          return;
        }
        const from = this.indexOf(this.dragValue);
        const to = this.indexOf(element.dataset.value ?? "");
        this.dragValue = null;
        this.moveItem(from, to);
      });

      element.addEventListener("dragend", () => {
        delete element.dataset.dragging;
        this.dragValue = null;
      });
    }
  }
}

export const defineBoxDraggableListElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxDraggableListElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxDraggableListElement;
  }

  customElements.define(tagName, BoxDraggableListElement);
  return BoxDraggableListElement;
};
