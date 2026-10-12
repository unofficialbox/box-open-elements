/** Reconcile owned children without disconnecting surviving focused controls. */
const keys = new WeakMap<HTMLElement, string>();
export const syncKeyedChildren = <T>(
  parent: HTMLElement,
  items: readonly T[],
  key: (item: T) => string,
  create: (item: T) => HTMLElement,
  update: (element: HTMLElement, item: T) => void,
): void => {
  const available = new Map<string, HTMLElement[]>();
  for (const child of Array.from(parent.children) as HTMLElement[]) {
    const identity = keys.get(child);
    if (identity !== undefined) {
      const matches = available.get(identity) ?? [];
      matches.push(child); available.set(identity, matches);
    }
  }
  const root = parent.getRootNode();
  const active = root instanceof ShadowRoot ? root.activeElement as HTMLElement | null : null;
  const hadFocus = active && parent.contains(active);
  let cursor = parent.firstElementChild;
  for (const item of items) {
    const identity = key(item);
    const child = available.get(identity)?.shift() ?? create(item);
    keys.set(child, identity);
    update(child, item);
    if (child !== cursor) {
      const move = (parent as HTMLElement & { moveBefore?: (node: Node, before: Node | null) => void }).moveBefore;
      if (move && child.parentElement === parent && child.isConnected) move.call(parent, child, cursor);
      else parent.insertBefore(child, cursor);
    }
    cursor = child.nextElementSibling;
  }
  for (const matches of available.values()) for (const child of matches) child.remove();
  // Older DOMs lack state-preserving moveBefore. Restore only focus lost by
  // this move; an intervening host focus handoff always wins.
  if (hadFocus && active.isConnected && root instanceof ShadowRoot && !root.activeElement && active.ownerDocument.activeElement === active.ownerDocument.body) {
    active.focus({ preventScroll: true });
  }
};

export const actionButton = (part: string): HTMLButtonElement => {
  const button = document.createElement("button"); button.type = "button"; button.setAttribute("part", part); return button;
};
