import { act, createElement, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NumberInput, type NumberInputRef, Checkbox, Tabs, Card, Alert, Toast, type ToastRef, Drawer, CodeBlock } from "../src/index.js";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | undefined;
afterEach(() => { act(() => root?.unmount()); root = undefined; document.body.innerHTML = ""; });
function mount() { const host = document.createElement("div"); document.body.append(host); root = createRoot(host); return root; }

describe("Studio wrappers", () => {
  it("exposes numeric values and typed refs/events", () => {
    const host = mount();
    const ref = createRef<NumberInputRef>();
    const changed = vi.fn();
    act(() => host.render(createElement(NumberInput, { ref, value: 4, label: "Retries", hideLabel: true, onValueChanged: changed })));
    expect(ref.current?.value).toBe(4);
    const input = ref.current!.shadowRoot!.querySelector("input")!;
    act(() => { input.value = "7"; input.dispatchEvent(new Event("input")); });
    expect(changed.mock.calls[0][0].detail).toEqual({ value: 7 });
  });

  it("does not reset imperative Toast state on unrelated renders", () => {
    const host = mount();
    const ref = createRef<ToastRef>();
    act(() => host.render(createElement(Toast, { ref, heading: "Result" })));
    act(() => ref.current!.show("Saved", { duration: 0 }));
    act(() => host.render(createElement(Toast, { ref, heading: "Updated result" })));
    expect(ref.current?.open).toBe(true);
    act(() => host.render(createElement(Toast, { ref, open: false })));
    expect(ref.current?.open).toBe(false);
  });

  it("syncs the other six wrappers, children and native events", () => {
    const host = mount();
    const checked = vi.fn(); const selected = vi.fn(); const copied = vi.fn();
    act(() => host.render(createElement("div", {},
      createElement(Checkbox, { label: "Enabled", checked: true, onCheckedChanged: checked }),
      createElement(Tabs, { value: "one", options: [{ value: "one", label: "One" }], onValueChanged: selected }),
      createElement(Card, { heading: "Details" }, createElement("span", {}, "Card body")),
      createElement(Alert, { message: "Check settings", tone: "warning" }),
      createElement(Drawer, { heading: "Inspector", open: false }, createElement("span", {}, "Inspector body")),
      createElement(CodeBlock, { code: "const x = 1", language: "js", onCodeCopied: copied }),
    )));
    expect(document.querySelector("box-checkbox")?.getAttribute("checked")).not.toBeNull();
    expect(document.querySelector("box-tabs")?.getAttribute("value")).toBe("one");
    expect(document.querySelector("box-card")?.textContent).toBe("Card body");
    expect(document.querySelector("box-alert")?.getAttribute("tone")).toBe("warning");
    expect(document.querySelector("box-drawer")?.textContent).toBe("Inspector body");
    expect(document.querySelector("box-code-block")?.getAttribute("language")).toBe("js");
    act(() => {
      document.querySelector("box-checkbox")!.dispatchEvent(new CustomEvent("checked-changed", { detail: { checked: false } }));
      document.querySelector("box-tabs")!.dispatchEvent(new CustomEvent("value-changed", { detail: { value: "two" } }));
      document.querySelector("box-code-block")!.dispatchEvent(new CustomEvent("code-copied", { detail: { copied: true } }));
    });
    expect(checked).toHaveBeenCalledOnce(); expect(selected).toHaveBeenCalledOnce(); expect(copied).toHaveBeenCalledOnce();
  });
});
