import { describe, expect, it, vi } from "vitest";
import { h, render, createRef } from "preact";
import { act } from "preact/test-utils";
import { TextField, Select, createWebComponent, ExplorerSelectionController, useExplorerSelectionController } from "../src/index.js";

class Probe extends HTMLElement { payload: unknown; }
customElements.define("preact-probe", Probe);
const Wrapped = createWebComponent<Probe, { payload: unknown; onCase?: (e: Event) => void }>({
  tagName: "preact-probe", propertyNames: ["payload"], events: [{ propName: "onCase", eventName: "ExactCase" }],
  sync: (el, props) => { el.payload = props.payload; },
});
describe("native Preact lifecycle", () => {
  it("preserves hosts, structured properties, latest exact cancelable events, and releases listeners", () => {
    const root = document.createElement("div"); document.body.appendChild(root);
    const ref = createRef<Probe>(); const first = vi.fn(); const latest = vi.fn((e: Event) => e.preventDefault());
    act(() => render(h(Wrapped, { ref, payload: { value: 1 }, onCase: first }), root));
    const host = ref.current!;
    act(() => render(h(Wrapped, { ref, payload: [1, 2], onCase: latest }), root));
    expect(ref.current).toBe(host); expect(host.payload).toEqual([1, 2]); expect(host.hasAttribute("payload")).toBe(false);
    expect(host.dispatchEvent(new Event("ExactCase", { cancelable: true }))).toBe(false);
    host.dispatchEvent(new Event("exactcase")); expect(latest).toHaveBeenCalledTimes(1); expect(first).not.toHaveBeenCalled();
    act(() => render(null, root)); expect(ref.current).toBeNull(); host.dispatchEvent(new Event("ExactCase")); expect(latest).toHaveBeenCalledTimes(1); root.remove();
  });
  it("syncs boolean/form values and arrays through public component contracts", () => {
    const root = document.createElement("div"); document.body.appendChild(root);
    act(() => render(h(TextField, { value: "one", disabled: true, name: "title" }), root));
    const host = root.querySelector("box-text-field")!;
    act(() => render(h(TextField, { value: "two", disabled: false, name: "title" }), root));
    expect(root.querySelector("box-text-field")).toBe(host); expect(host.hasAttribute("disabled")).toBe(false); expect(host.getAttribute("value")).toBe("two");
    act(() => render(h(Select, { options: [{ label: "One", value: "1" }] }), root));
    expect(root.querySelector("box-select")!.getAttribute("options")).toBe(JSON.stringify([{ label: "One", value: "1" }]));
    act(() => render(null, root)); root.remove();
  });
  it("preserves native callback-ref cleanup and controller replacement ownership", () => {
    const root = document.createElement("div"); document.body.appendChild(root);
    const cleanup = vi.fn();
    act(() => render(h(Wrapped, { payload: [], ref: node => { if (node) return cleanup; } }), root));
    act(() => render(null, root)); expect(cleanup).toHaveBeenCalledTimes(1);
    const first = new ExplorerSelectionController(); const second = new ExplorerSelectionController();
    first.setItems([{ id: "a" }]); second.setItems([{ id: "b" }]);
    const original = first.subscribe.bind(first); const released = vi.fn();
    vi.spyOn(first, "subscribe").mockImplementation((...args) => {
      const unsubscribe = original(...args); return () => { unsubscribe(); released(); };
    });
    const Harness = ({ controller }: { controller: ExplorerSelectionController }) => h("output", null, useExplorerSelectionController(controller).selectedItemIds.join(","));
    act(() => render(h(Harness, { controller: first }), root));
    act(() => first.select(["a"])); expect(root.textContent).toBe("a");
    act(() => render(h(Harness, { controller: second }), root)); expect(released).toHaveBeenCalledTimes(1); expect(root.textContent).toBe("");
    act(() => second.select(["b"])); expect(root.textContent).toBe("b");
    act(() => first.clearSelection()); expect(root.textContent).toBe("b");
    act(() => render(null, root)); root.remove();
  });
});
