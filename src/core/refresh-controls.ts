/** Reuse only explicitly keyed native controls whose rendered role stays compatible. */
export function refreshOwnedControls(
  previous: ParentNode,
  next: ParentNode,
  selector: string,
  keyOf: (control: HTMLElement) => string | undefined,
): void {
  const oldControls = Array.from(previous.querySelectorAll<HTMLElement>(selector));
  const newControls = Array.from(next.querySelectorAll<HTMLElement>(selector));
  const unique = (controls: HTMLElement[]): Map<string, HTMLElement> => {
    const values = new Map<string, HTMLElement>();
    const duplicates = new Set<string>();
    for (const control of controls) {
      const key = keyOf(control);
      if (key === undefined) continue;
      if (values.has(key)) duplicates.add(key);
      values.set(key, control);
    }
    for (const key of duplicates) values.delete(key);
    return values;
  };
  const oldByKey = unique(oldControls);
  for (const [key, fresh] of unique(newControls)) {
    const old = oldByKey.get(key);
    if (!old || old.tagName !== fresh.tagName) continue;
    if (old instanceof HTMLInputElement && fresh instanceof HTMLInputElement && old.type !== fresh.type) continue;
    // The fresh renderer remains the source of truth, including removal of
    // obsolete attributes, accessible names, hrefs and checked state.
    for (const attribute of Array.from(old.attributes)) {
      if (!fresh.hasAttribute(attribute.name)) old.removeAttribute(attribute.name);
    }
    for (const attribute of Array.from(fresh.attributes)) old.setAttribute(attribute.name, attribute.value);
    if (old instanceof HTMLInputElement && fresh instanceof HTMLInputElement) {
      old.checked = fresh.checked;
      old.indeterminate = fresh.indeterminate;
      old.value = fresh.value;
    }
    old.replaceChildren(...Array.from(fresh.childNodes));
    fresh.replaceWith(old);
  }
}

export function captureOwnedFocus(host: HTMLElement) {
  const root = host.getRootNode();
  return {
    target: host.shadowRoot?.activeElement instanceof HTMLElement ? host.shadowRoot.activeElement : null,
    scope: "activeElement" in root ? root as Document | ShadowRoot : host.ownerDocument,
  };
}

/** Restore only a surviving owned node after the complete render transaction. */
export function restoreOwnedFocus(host: HTMLElement, focus: ReturnType<typeof captureOwnedFocus>): void {
  const target = focus.target;
  if (!host.isConnected || !target?.isConnected || !host.shadowRoot?.contains(target) || host.getRootNode() !== focus.scope) return;
  const active = focus.scope.activeElement;
  const body = host.ownerDocument.body;
  if (active === host || active === target || active === body || (active === null && host.ownerDocument.activeElement === body)) {
    target.focus({ preventScroll: true });
  }
}
