import { BaseElement } from "../../core/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/interaction.js";
import { boePanel } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-metadata-inspector";

let nextFieldId = 0;

type MetadataInspectorField = {
  description?: string;
  label: string;
  tone?: string;
  value: string;
};

type MetadataInspectorSection = {
  fields: MetadataInspectorField[];
  title: string;
};


const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        /* The host's own display would otherwise beat the UA rule for [hidden],
           leaving the element on screen when a host hides it. */
        :host([hidden]) {
          display: none !important;
        }

        [part="inspector"] {
          display: grid;
          gap: ${boePanel.gap};
          padding: ${boePanel.padding};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: ${boePanel.radius};
          background: ${boePanel.background};
        }

        [part="header"] {
          display: grid;
          gap: 0.45rem;
        }

        [part="eyebrow"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="title"] {
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1.15;
        }

        [part="message"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          line-height: 1.55;
        }

        [part="section"] {
          display: grid;
          gap: ${boePanel.gap};
        }

        [part="section-title"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="section-fields"] {
          display: grid;
          gap: ${boePanel.gap};
          margin: 0;
        }

        [part="field-definition"] { margin: 0; }
        [part="field-term"] {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip-path: inset(50%);
          white-space: nowrap;
          border: 0;
        }

        [part="field"] {
          display: grid;
          gap: 0.4rem;
          width: 100%;
          text-align: left;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 56%, transparent);
          border-radius: ${boePanel.radius};
          padding: 0.55rem 0.65rem;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          cursor: pointer;
        }

        ${boeNeutralInteractiveStyles('[part="field"]')}

        [part="field-header"] {
          display: flex;
          gap: ${boePanel.gap};
          align-items: start;
          justify-content: space-between;
        }

        [part="field-label"] {
          margin: 0;
          font-size: 0.84rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="field-value"] {
          margin: 0;
          font-weight: 600;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="field-value"][data-tone="accent"] {
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="field-value"][data-tone="success"] {
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 70%, var(--boe-token-text-text, #222222));
        }

        [part="field-description"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          line-height: 1.5;
        }
      `;

export class MetadataInspector extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["eyebrow", "heading", "message", "sections"];
  }
  private renderRevision = 0;
  private readonly childKeys = new WeakMap<HTMLElement, string>();

  get eyebrow(): string {
    return this.getAttribute("eyebrow") ?? "";
  }

  set eyebrow(value: string) {
    this.setAttribute("eyebrow", value);
  }

  get message(): string {
    return this.getAttribute("message") ?? "";
  }

  set message(value: string) {
    this.setAttribute("message", value);
  }

  get sections(): MetadataInspectorSection[] {
    return this.parseJsonAttribute<MetadataInspectorSection[]>("sections", []);
  }

  set sections(value: MetadataInspectorSection[]) {
    this.setAttribute("sections", JSON.stringify(value));
  }

  get heading(): string {
    return this.getAttribute("heading") ?? "Metadata Inspector";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  connectedCallback(): void {
    super.connectedCallback();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {

    super.attributeChangedCallback(name, oldValue, newValue);
  }

  private parseJsonAttribute<T>(name: string, fallback: T): T {
    const raw = this.getAttribute(name);
    if (!raw) {
      return fallback;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private emitFieldSelected(label: string, value: string, section: string): void {
    this.dispatchEvent(
      new CustomEvent("field-selected", {
        bubbles: true,
        composed: true,
        detail: { label, section, value },
      }),
    );
  }

  /** Move surviving controls in place and abandon work superseded by callbacks. */
  private syncChildren<T>(
    parent: HTMLElement,
    items: readonly T[],
    key: (item: T) => string,
    create: () => HTMLElement,
    update: (element: HTMLElement, item: T) => void,
    revision: number,
  ): boolean {
    const available = new Map<string, HTMLElement[]>();
    for (const child of Array.from(parent.children) as HTMLElement[]) {
      const identity = this.childKeys.get(child);
      if (identity === undefined) continue;
      const matches = available.get(identity) ?? [];
      matches.push(child);
      available.set(identity, matches);
    }
    let cursor = parent.firstElementChild;
    for (const item of items) {
      if (revision !== this.renderRevision) return false;
      const identity = key(item);
      const child = available.get(identity)?.shift() ?? create();
      this.childKeys.set(child, identity);
      update(child, item);
      if (revision !== this.renderRevision) return false;
      if (child !== cursor) {
        const move = (parent as HTMLElement & { moveBefore?: (node: Node, before: Node | null) => void }).moveBefore;
        if (move && child.parentElement === parent && child.isConnected) move.call(parent, child, cursor);
        else parent.insertBefore(child, cursor);
      }
      if (revision !== this.renderRevision) return false;
      cursor = child.nextElementSibling;
    }
    for (const matches of available.values()) {
      for (const child of matches) {
        child.remove();
        if (revision !== this.renderRevision) return false;
      }
    }
    return true;
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <div part="content-host">
        <section part="inspector">
          <header part="header">
            <div part="eyebrow" hidden></div>
            <h2 part="title"></h2>
            <div part="message" hidden></div>
          </header>
          <div part="sections"></div>
        </section>
      </div>
    `;
    const sections = this.shadowRoot.querySelector<HTMLElement>('[part="sections"]')!;
    sections.style.display = "contents";
  }

  protected setupListeners(): void {
    this.shadowRoot?.addEventListener("click", event => {
      const target = event.target;
      if (!(target instanceof Element) || !this.isConnected) return;
      const field = target.closest<HTMLButtonElement>('button[part="field"]');
      if (!field || !this.shadowRoot?.contains(field)) return;
      this.emitFieldSelected(field.dataset.fieldLabel ?? "", field.dataset.fieldValue ?? "", field.dataset.fieldSection ?? "");
    });
  }

  protected update(): void {
    const root = this.shadowRoot;
    const sections = root?.querySelector<HTMLElement>('[part="sections"]');
    if (!root || !sections) return;
    const revision = ++this.renderRevision;
    const active = root.activeElement as HTMLElement | null;
    const hadFocus = active && sections.contains(active);
    root.querySelector('[part="title"]')!.textContent = this.heading;
    for (const [part, text] of [["eyebrow", this.eyebrow], ["message", this.message]]) {
      const element = root.querySelector<HTMLElement>(`[part="${part}"]`)!;
      element.textContent = text;
      element.hidden = !text;
    }
    const current = this.sections;
    const completed = this.syncChildren(sections, current, section => section.title, () => {
      const section = document.createElement("section");
      section.setAttribute("part", "section");
      section.innerHTML = '<div part="section-title"></div><dl part="section-fields"></dl>';
      return section;
    }, (element, section) => {
      element.querySelector('[part="section-title"]')!.textContent = section.title;
      const fields = element.querySelector<HTMLElement>('dl')!;
      this.syncChildren(fields, section.fields, field => field.label, () => {
        const group = document.createElement("div");
        const id = `boe-metadata-field-${++nextFieldId}`;
        group.innerHTML = `<dt part="field-term" id="${id}-term"></dt>
          <dd part="field-definition"><button type="button" part="field" aria-labelledby="${id}-term ${id}-value">
            <div part="field-header"><span part="field-label" aria-hidden="true"></span>
              <span part="field-value" id="${id}-value"></span></div>
            <div part="field-description" id="${id}-description" hidden></div>
          </button></dd>`;
        return group;
      }, (group, field) => {
        const button = group.querySelector<HTMLButtonElement>('button')!;
        button.dataset.fieldLabel = field.label;
        button.dataset.fieldValue = field.value;
        button.dataset.fieldSection = section.title;
        group.querySelector('[part="field-term"]')!.textContent = field.label;
        group.querySelector('[part="field-label"]')!.textContent = field.label;
        const value = group.querySelector<HTMLElement>('[part="field-value"]')!;
        value.textContent = field.value;
        value.dataset.tone = field.tone ?? "neutral";
        const description = group.querySelector<HTMLElement>('[part="field-description"]')!;
        description.textContent = field.description ?? "";
        description.hidden = !field.description;
        if (field.description) button.setAttribute("aria-describedby", description.id);
        else button.removeAttribute("aria-describedby");
      }, revision);
    }, revision);
    // Legacy insertBefore can drop focus during a move. Restore once the whole
    // render is complete, unless a host callback has already handed it elsewhere.
    if (completed && hadFocus && active.isConnected && !root.activeElement
      && this.ownerDocument.activeElement === this.ownerDocument.body) {
      active.focus({ preventScroll: true });
    }
  }
}

MetadataInspector.register();
