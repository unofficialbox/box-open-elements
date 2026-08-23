/**
 * Top-layer promotion for overlays.
 *
 * An overlay has to paint above the page, and `position: fixed` alone cannot
 * promise that: an ancestor with a `transform`, `filter`, `perspective`,
 * `contain`, or `will-change` becomes the containing block, and the overlay is
 * positioned — and clipped — against that ancestor instead of the viewport.
 *
 * The old answer was to move the overlay's host node to `document.body`.
 * `box-drawer` did exactly that and it broke every framework that owns the
 * node: React unmounting a tree containing an open drawer threw
 * `NotFoundError`, because the node it tried to remove was no longer its child.
 *
 * The top layer solves the same problem without touching the DOM tree. It is a
 * rendering concern, so the host stays exactly where its framework put it.
 *
 * Two primitives, and the difference is modality rather than taste:
 *
 * - `showModal()` on a `<dialog>` — for overlays that own the screen while they
 *   are up, with a scrim, a focus trap, and the rest of the page inert.
 * - `showPopover()` on a `[popover]` element — for anchored, non-modal surfaces
 *   (tooltips, menus, popovers) that must **not** trap focus or block the page.
 *
 * Using the modal primitive for an anchored surface would be a behaviour
 * regression, not just an overreach, which is why these are separate calls.
 *
 * Every entry point is guarded rather than assumed. jsdom implements neither
 * API, so the unit suite exercises everything around the promotion and the
 * promotion itself is verified in a browser; and a detached or hidden element
 * throws rather than opening, which is a normal state during teardown.
 */

/** An element that may be promotable as a modal dialog. */
type MaybeDialog = HTMLElement & {
  showModal?: () => void;
  close?: () => void;
  open?: boolean;
};

/** An element that may be promotable as a popover. */
type MaybePopover = HTMLElement & {
  showPopover?: () => void;
  hidePopover?: () => void;
};

/**
 * Promote a `<dialog>` into the top layer as a modal.
 *
 * Returns whether the promotion happened, so a caller can tell "not supported
 * here" from "already open" if it needs to — most do not.
 */
export const promoteModal = (element: MaybeDialog | null): boolean => {
  if (!element || typeof element.showModal !== "function" || element.open) {
    return false;
  }
  try {
    element.showModal();
    return true;
  } catch {
    // Detached, hidden, or already promoted by another path. The overlay still
    // renders and behaves; it simply does not get the top layer.
    return false;
  }
};

/** Close a modal `<dialog>`, leaving the top layer. */
export const dismissModal = (element: MaybeDialog | null): void => {
  if (!element || typeof element.close !== "function" || !element.open) {
    return;
  }
  try {
    element.close();
  } catch {
    // Already closed or detached; nothing to undo.
  }
};

/**
 * Promote an element into the top layer as a **non-modal** popover.
 *
 * Callers are expected to set `popover="manual"` on the element: `auto`
 * popovers light-dismiss and close each other, which fights components that
 * already own their own dismissal rules.
 */
export const promotePopover = (element: MaybePopover | null): boolean => {
  if (!element || typeof element.showPopover !== "function") {
    return false;
  }
  try {
    element.showPopover();
    return true;
  } catch {
    // Throws if already showing, or if the element is not connected.
    return false;
  }
};

/** Hide a popover, leaving the top layer. */
export const dismissPopover = (element: MaybePopover | null): void => {
  if (!element || typeof element.hidePopover !== "function") {
    return;
  }
  try {
    element.hidePopover();
  } catch {
    // Not currently showing; nothing to undo.
  }
};
