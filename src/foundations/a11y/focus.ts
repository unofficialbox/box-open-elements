/**
 * Focus management helpers for modal dialogs, drawers, and transient menus.
 */

const TABBABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

const isDisabled = (element: HTMLElement): boolean =>
  element.matches(":disabled") ||
  element.hasAttribute("disabled") ||
  (element as HTMLButtonElement).disabled === true ||
  element.getAttribute("aria-disabled") === "true";

const isVisible = (element: HTMLElement): boolean => {
  for (let current: Element | null = element; current;) {
    if (current.hasAttribute("hidden") || current.hasAttribute("inert") || current.getAttribute("aria-hidden") === "true") return false;
    const style = current.ownerDocument.defaultView?.getComputedStyle(current);
    if (style?.display === "none" || style?.visibility === "hidden") return false;
    const root = current.getRootNode();
    current = current.assignedSlot ?? current.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
  }
  return true;
};

const deepActiveElement = (root: Document | ShadowRoot): Element | null => {
  let active = root.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
};

/** Visible, enabled tabbable controls inside `container` (light or shadow). */
export const getTabbableElements = (container: ParentNode): HTMLElement[] => {
  const result: HTMLElement[] = [];
  const visit = (node: ParentNode): void => {
    const children = node instanceof HTMLSlotElement
      ? (node.assignedElements().length ? node.assignedElements() : Array.from(node.children))
      : Array.from(node.children);
    for (const child of children) {
      if (!(child instanceof HTMLElement) || !isVisible(child)) continue;
      const disabled = isDisabled(child);
      // A disabled fieldset still permits controls in its first legend and
      // non-form controls such as links. Let native :disabled filter each
      // descendant instead of pruning the entire fieldset subtree.
      if (disabled && (!(child instanceof HTMLFieldSetElement) || child.getAttribute("aria-disabled") === "true")) continue;
      if (!disabled && child.matches(TABBABLE_SELECTOR) && child.tabIndex >= 0) result.push(child);
      // An explicit negative tabindex removes a shadow host's entire focus
      // scope from sequential navigation. Ordinary light-DOM containers with
      // tabindex=-1 do not have that behavior.
      if (child.shadowRoot && child.hasAttribute("tabindex") && child.tabIndex < 0) continue;
      visit(child.shadowRoot ?? child);
    }
  };
  visit(container);
  return result;
};

/**
 * Keep Tab / Shift+Tab cycling inside `container` while a modal is open.
 * Call from a `keydown` listener when `event.key === "Tab"`.
 */
export const trapTabKey = (event: KeyboardEvent, container: ParentNode): void => {
  if (event.key !== "Tab") {
    return;
  }

  const focusables = getTabbableElements(container);
  if (focusables.length === 0) {
    event.preventDefault();
    return;
  }

  const first = focusables[0]!;
  const last = focusables[focusables.length - 1]!;
  const root = (container as Element).getRootNode?.() as Document | ShadowRoot | undefined;
  const active = deepActiveElement(root ?? document) ?? deepActiveElement(document);

  if (event.shiftKey) {
    if (active === first || !focusables.includes(active as HTMLElement)) {
      event.preventDefault();
      last.focus();
    }
    return;
  }

  if (active === last || !focusables.includes(active as HTMLElement)) {
    event.preventDefault();
    first.focus();
  }
};

/** Capture the currently focused element and restore it later (menu/dialog close). */
export class FocusRestore {
  private previous: HTMLElement | null = null;

  capture(from: Element | null = document.activeElement): void {
    while (from?.shadowRoot?.activeElement) from = from.shadowRoot.activeElement;
    this.previous = from instanceof HTMLElement ? from : null;
  }

  restore(): void {
    const target = this.previous;
    this.previous = null;
    if (!target) {
      return;
    }
    queueMicrotask(() => {
      if (target.isConnected && isVisible(target) && !isDisabled(target)) {
        target.focus({ preventScroll: true });
      }
    });
  }

  clear(): void {
    this.previous = null;
  }
}
