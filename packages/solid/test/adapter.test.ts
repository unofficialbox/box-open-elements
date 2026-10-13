import { describe, expect, it, vi } from "vitest";
import { createComponent, createSignal, createRoot } from "solid-js";
import { render } from "solid-js/web";
import { createWebComponent, ExplorerSelectionController, useExplorerSelectionController, TextField } from "../src/index.js";

class Probe extends HTMLElement { payload: unknown; }
customElements.define("solid-probe", Probe);
const Wrapped = createWebComponent<Probe, { payload: unknown; onCase?: (e: Event) => void }>({
  tagName: "solid-probe", propertyNames: ["payload"], events: [{ propName: "onCase", eventName: "ExactCase" }],
  sync: (el, props) => { el.payload = props.payload; },
});
describe("Solid reactive ownership", () => {
  it("rejects ownerless subscriptions instead of leaking a controller listener", () => {
    const controller = new ExplorerSelectionController();
    const subscribe = vi.spyOn(controller, "subscribe");
    expect(() => useExplorerSelectionController(controller)).toThrow("requires a Solid reactive owner");
    expect(subscribe).not.toHaveBeenCalled();
  });
  it("tracks actual signals without host remounts and cleans exact native listeners", () => {
    const root = document.createElement("div"); document.body.appendChild(root);
    const [payload, setPayload] = createSignal<unknown>({ count: 1 });
    const first = vi.fn(); const latest = vi.fn((e: Event) => e.preventDefault());
    const [handler, setHandler] = createSignal<((e: Event) => void) | undefined>(first);
    let host!: Probe;
    const dispose = render(() => createComponent(Wrapped, { get payload() { return payload(); }, get onCase() { return handler(); }, ref: el => { host = el; } }), root);
    const original = host;
    setPayload([1, 2]); setHandler(() => latest);
    expect(host).toBe(original); expect(host.payload).toEqual([1, 2]); expect(host.hasAttribute("payload")).toBe(false);
    expect(host.dispatchEvent(new Event("ExactCase", { cancelable: true }))).toBe(false);
    host.dispatchEvent(new Event("exactcase")); expect(latest).toHaveBeenCalledTimes(1); expect(first).not.toHaveBeenCalled();
    setHandler(undefined); host.dispatchEvent(new Event("ExactCase")); expect(latest).toHaveBeenCalledTimes(1);
    setHandler(() => latest); dispose(); host.dispatchEvent(new Event("ExactCase")); expect(latest).toHaveBeenCalledTimes(1); root.remove();
  });
  it("owns controller subscriptions and reactive boolean/form values", () => {
    const root = document.createElement("div"); document.body.appendChild(root);
    const [disabled, setDisabled] = createSignal(true);
    const dispose = render(() => createComponent(TextField, { value: "Title", name: "title", get disabled() { return disabled(); } }), root);
    const host = root.querySelector("box-text-field")!; expect(host.hasAttribute("disabled")).toBe(true);
    setDisabled(false); expect(root.querySelector("box-text-field")).toBe(host); expect(host.hasAttribute("disabled")).toBe(false);
    const controller = new ExplorerSelectionController(); controller.setItems([{ id: "a" }]);
    const unsub = vi.fn(); const original = controller.subscribe.bind(controller);
    vi.spyOn(controller, "subscribe").mockImplementation((...args) => {
      const release = original(...args); return () => { release(); unsub(); };
    });
    createRoot(release => {
      const state = useExplorerSelectionController(controller);
      controller.select(["a"]); expect(state().selectedItemIds).toEqual(["a"]);
      release(); controller.clearSelection(); expect(state().selectedItemIds).toEqual(["a"]);
    });
    expect(unsub).toHaveBeenCalledTimes(1);
    dispose(); root.remove();
  });
});
