import { Toast } from "../../components/feedback/toast.js";
import { Button } from "../../components/actions/button.js";
import { announce } from "../../foundations/a11y/index.js";

/** Remove once and return an idempotent restore preserving the original object's identity. */
export function removeAt<T>(list: T[], index: number): () => void {
  if (!Number.isInteger(index) || index < 0 || index >= list.length) return () => {};
  const item = list.splice(index, 1)[0];
  let restored = false;
  return () => {
    if (restored) return;
    restored = true;
    list.splice(Math.min(index, list.length), 0, item);
  };
}

/** Never overwrite a key recreated after removal. */
export function removeKey<T>(map: Record<string, T>, key: string): () => void {
  if (!Object.hasOwn(map, key)) return () => {};
  const value = map[key];
  delete map[key];
  let restored = false;
  return () => {
    if (restored) return;
    restored = true;
    if (!Object.hasOwn(map, key)) Object.defineProperty(map, key, { value, writable: true, enumerable: true, configurable: true });
  };
}

/** Restore into the current list, preserving intervening edits and clamping the index. */
export function removeFromMapList<T>(map: Record<string, T[]>, key: string, index: number): () => void {
  const list = Object.hasOwn(map, key) ? map[key] : undefined;
  if (!list || !Number.isInteger(index) || index < 0 || index >= list.length) return () => {};
  const item = list.splice(index, 1)[0];
  if (!list.length) delete map[key];
  let restored = false;
  return () => {
    if (restored) return;
    restored = true;
    if (!Object.hasOwn(map, key)) Object.defineProperty(map, key, { value: list, writable: true, enumerable: true, configurable: true });
    const target = map[key];
    target.splice(Math.min(index, target.length), 0, item);
  };
}

export interface UndoOffer {
  readonly toast: Toast | null;
  undo(): void;
  dispose(): void;
}
export interface UndoOptions {
  container?: HTMLElement;
  duration?: number;
  onRestore?: () => void;
}
const offers = new WeakMap<Document, UndoOffer>();

/** Offer a single document-scoped undo. Hosts call dispose on teardown. SSR-safe. */
export function offerUndo(message: string, restore: () => void, options: UndoOptions = {}): UndoOffer {
  const doc = options.container?.ownerDocument ?? globalThis.document;
  if (!doc?.body) return { toast: null, undo() {}, dispose() {} };
  offers.get(doc)?.dispose();
  const toast = doc.createElement(Toast.tagName) as Toast;
  const action = doc.createElement(Button.tagName) as Button;
  action.tone = "neutral";
  action.size = "small";
  action.label = "Undo";
  action.slot = "action";
  const mac = /Mac|iPhone|iPad/.test(doc.defaultView?.navigator.platform ?? "");
  const shortcut = mac ? "Command-Z" : "Control-Z";
  action.setAttribute("aria-keyshortcuts", mac ? "Meta+Z" : "Control+Z");
  toast.append(action);
  let live = true;
  const dispose = () => {
    if (!live) return;
    live = false;
    doc.removeEventListener("keydown", onKey);
    toast.removeEventListener("open-changed", onOpen);
    toast.hide();
    toast.remove();
    if (offers.get(doc) === offer) offers.delete(doc);
  };
  const undo = () => {
    if (!live) return;
    dispose();
    restore();
    options.onRestore?.();
    announce("Restored", "polite", doc);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || event.shiftKey || event.altKey || !(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z") return;
    const editing = event.composedPath().some(target => target instanceof HTMLElement && (target.matches("input, textarea, select, [role=textbox]") || target.isContentEditable));
    if (editing) return;
    event.preventDefault();
    undo();
  };
  const onOpen = (event: Event) => { if (!(event as CustomEvent<{ open: boolean }>).detail.open) dispose(); };
  const offer: UndoOffer = { toast, undo, dispose };
  offers.set(doc, offer);
  action.addEventListener("click", undo);
  toast.addEventListener("open-changed", onOpen);
  doc.addEventListener("keydown", onKey);
  (options.container ?? doc.body).append(toast);
  // Toast owns the one persistent announcement, avoiding duplicate live messages.
  toast.show(`${message}. Undo available with ${shortcut}.`, { duration: options.duration ?? 8000 });
  return offer;
}
