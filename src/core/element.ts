export abstract class BaseElement extends HTMLElement {
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
