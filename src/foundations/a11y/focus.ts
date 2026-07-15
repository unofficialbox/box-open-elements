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
  element.hasAttribute("disabled") ||
  (element as HTMLButtonElement).disabled === true ||
  element.getAttribute("aria-disabled") === "true";

const isVisible = (element: HTMLElement): boolean => {
  if (element.hidden || element.getAttribute("aria-hidden") === "true") {
    return false;
  }
  // Closest [hidden] ancestor (common pattern for closed panels).
  if (element.closest("[hidden]")) {
    return false;
  }
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  if (!style) {
    return true;
  }
  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }
  return true;
};

/** Visible, enabled tabbable controls inside `container` (light or shadow). */
export const getTabbableElements = (container: ParentNode): HTMLElement[] => {
  return Array.from(container.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR)).filter(element => {
    if (isDisabled(element)) {
      return false;
    }
    if (element.tabIndex < 0) {
      return false;
    }
    return isVisible(element);
  });
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
  const active = (root?.activeElement as HTMLElement | null) ?? (document.activeElement as HTMLElement | null);

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
    this.previous = from instanceof HTMLElement ? from : null;
  }

  restore(): void {
    const target = this.previous;
    this.previous = null;
    if (!target) {
      return;
    }
    queueMicrotask(() => {
      if (typeof target.focus === "function") {
        target.focus();
      }
    });
  }

  clear(): void {
    this.previous = null;
  }
}
