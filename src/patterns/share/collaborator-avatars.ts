import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-collaborator-avatars";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const initialsFromName = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(segment => segment[0] ?? "")
    .join("")
    .toUpperCase();

type Collaborator = {
  id?: string;
  name: string;
  initials?: string;
  src?: string;
};

const isCollaborator = (value: unknown): value is Collaborator => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    (candidate.id === undefined || typeof candidate.id === "string") &&
    (candidate.initials === undefined || typeof candidate.initials === "string") &&
    (candidate.src === undefined || typeof candidate.src === "string")
  );
};

/**
 * A stacked "avatar pile" for the collaborators on an item, with a `+N` overflow
 * chip once the count exceeds `max`. A composition: data arrives via the
 * `collaborators` property (no transport). Each visible avatar is a button that
 * emits `select`; the overflow chip emits `overflow`. The group is labelled for
 * assistive tech and the hidden count is announced.
 */

const elementStyles = `
        :host {
          display: inline-block;
          color: inherit;
          font: inherit;
        }

        [part="group"] {
          display: inline-flex;
          align-items: center;
        }

        [part="avatar"],
        [part="overflow"] {
          appearance: none;
          display: inline-grid;
          place-items: center;
          inline-size: 2.1rem;
          block-size: 2.1rem;
          margin-inline-start: -0.55rem;
          padding: 0;
          overflow: hidden;
          border: 2px solid var(--boe-token-surface-surface, #ffffff);
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
          color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 72%, var(--boe-token-text-text, #222222));
          font: inherit;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 120ms ease;
        }

        [part="group"] > :first-child {
          margin-inline-start: 0;
        }

        [part="avatar"]:hover,
        [part="avatar"]:focus-visible,
        [part="overflow"]:hover,
        [part="overflow"]:focus-visible {
          transform: translateY(-2px);
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
        }

        [part="overflow"] {
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 82%, var(--boe-token-surface-surface, #ffffff) 18%);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="avatar-image"] {
          inline-size: 100%;
          block-size: 100%;
          object-fit: cover;
        }

        [part="empty"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.86rem;
        }
      `;

export class BoxCollaboratorAvatarsElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["collaborators", "label", "max"];
  }
  get collaborators(): Collaborator[] {
    const raw = this.getAttribute("collaborators");
    if (!raw) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isCollaborator) : [];
    } catch {
      return [];
    }
  }

  set collaborators(value: Collaborator[]) {
    this.setAttribute("collaborators", JSON.stringify(value));
  }

  get label(): string {
    return this.getAttribute("label")?.trim() || "Collaborators";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get max(): number {
    const raw = Number(this.getAttribute("max") ?? "5");
    if (!Number.isFinite(raw) || raw < 1) {
      return 5;
    }
    return Math.floor(raw);
  }

  set max(value: number) {
    this.setAttribute("max", String(value));
  }

  connectedCallback(): void {
    super.connectedCallback();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {

    super.attributeChangedCallback(name, oldValue, newValue);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <div part="content-host"></div>
    `;
  }

  protected update(): void {
    if (!this.shadowRoot) {
      return;
    }

    const collaborators = this.collaborators;
    const max = this.max;
    const visible = collaborators.slice(0, max);
    const overflow = Math.max(0, collaborators.length - visible.length);

    const avatarsMarkup = visible
      .map((collaborator, index) => {
        const initials = collaborator.initials || initialsFromName(collaborator.name) || "?";
        const inner = collaborator.src
          ? `<img part="avatar-image" src="${escapeHtml(collaborator.src)}" alt="" />`
          : escapeHtml(initials);
        return `
          <button
            type="button"
            part="avatar"
            data-index="${index}"
            style="z-index:${visible.length - index};"
            aria-label="${escapeHtml(collaborator.name)}"
            title="${escapeHtml(collaborator.name)}"
          >${inner}</button>
        `;
      })
      .join("");

    const overflowMarkup = overflow
      ? `<button type="button" part="overflow" aria-label="${overflow} more" title="${overflow} more">+${overflow}</button>`
      : "";

    const host = this.shadowRoot.querySelector('[part="content-host"]');
    if (!host) {
      return;
    }

    host.innerHTML = `
      ${
        collaborators.length
          ? `<div part="group" role="group" aria-label="${escapeHtml(this.label)}">${avatarsMarkup}${overflowMarkup}</div>`
          : `<div part="group" role="group" aria-label="${escapeHtml(this.label)}"><span part="empty">No collaborators</span></div>`
      }
    `;

    for (const avatar of Array.from(this.shadowRoot.querySelectorAll('[part="avatar"]'))) {
      avatar.addEventListener("click", () => {
        const index = Number((avatar as HTMLElement).dataset.index ?? "-1");
        const collaborator = visible[index];
        if (collaborator) {
          this.dispatchEvent(
            new CustomEvent("select", {
              bubbles: true,
              composed: true,
              detail: { id: collaborator.id, name: collaborator.name },
            }),
          );
        }
      });
    }

    this.shadowRoot.querySelector('[part="overflow"]')?.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("overflow", {
          bubbles: true,
          composed: true,
          detail: { count: overflow },
        }),
      );
    });
  
  }
}

export const defineBoxCollaboratorAvatarsElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxCollaboratorAvatarsElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxCollaboratorAvatarsElement;
  }

  customElements.define(tagName, BoxCollaboratorAvatarsElement);
  return BoxCollaboratorAvatarsElement;
};
