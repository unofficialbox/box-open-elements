const HTMLElementBase = (
  typeof globalThis.HTMLElement === "undefined" ? class {} : globalThis.HTMLElement
) as typeof HTMLElement;

/**
 * Registers a custom element when a browser registry is available.
 *
 * Component modules call this at import time. The browser guard keeps those
 * modules safe to evaluate during SSR, while the existing-definition check
 * makes repeated root and per-component imports idempotent.
 */
const registerCustomElement = <T extends CustomElementConstructor>(
  tagName: string,
  constructor: T,
): T => {
  const registry = globalThis.customElements;
  if (!registry) {
    return constructor;
  }

  const existing = registry.get(tagName);
  if (existing) {
    return existing as T;
  }

  registry.define(tagName, constructor);
  return constructor;
};

export abstract class BaseElement extends HTMLElementBase {
  static readonly tagName: string = "";

  static register<T extends typeof BaseElement>(
    this: T,
    tagName = this.tagName,
  ): T {
    if (!tagName) {
      throw new TypeError("Custom element classes must declare a tagName.");
    }

    return registerCustomElement(
      tagName,
      this as unknown as CustomElementConstructor,
    ) as unknown as T;
  }

  protected isRendered = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback(): void {
    if (!this.isRendered) {
      this.renderTemplate();
      this.isRendered = true;
      this.setupListeners();
    }
    this.update();
  }

  disconnectedCallback(): void {
    // Optional teardown for subclasses to override
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (this.isRendered && oldValue !== newValue) {
      this.update();
    }
  }

  /**
   * Subclasses override this to define the initial Shadow DOM structure and styles.
   * This is only run once during the first connectedCallback.
   */
  protected abstract renderTemplate(): void;

  /**
   * Subclasses override this to register event listeners on elements within their Shadow DOM.
   * This is only run once during the first connectedCallback.
   */
  protected setupListeners(): void {}

  /**
   * Subclasses override this to perform in-place mutations (text content, classes,
   * attributes, dataset etc.) on existing Shadow DOM nodes when state changes.
   */
  protected abstract update(): void;
}
