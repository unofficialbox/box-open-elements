// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";

import { Button } from "../src/button.js";
import { Button as ButtonElement } from "../../../src/components/actions/button.js";

describe("Button React adapter", () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  const render = (props: {
    label?: string;
    tone?: string;
    size?: string;
    disabled?: boolean;
    onClick?: (event: MouseEvent & { currentTarget: ButtonElement }) => void;
  }) => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    act(() => {
      root.render(createElement(Button, props));
    });
    return container.querySelector("box-button") as ButtonElement | null;
  };

  it("registers and renders box-button with synced properties", () => {
    const element = render({ label: "Save", tone: "neutral", size: "large" });

    expect(customElements.get("box-button")).toBeTruthy();
    expect(element).toBeTruthy();
    expect(element?.label).toBe("Save");
    expect(element?.tone).toBe("neutral");
    expect(element?.size).toBe("large");
    expect(element?.shadowRoot?.querySelector('[part="label"]')?.textContent).toBe("Save");
  });

  it("reflects disabled as a property", () => {
    const element = render({ label: "Save", disabled: true });

    expect(element?.disabled).toBe(true);
    expect(element?.shadowRoot?.querySelector("button")?.disabled).toBe(true);
  });

  it("forwards click events from the host", () => {
    const onClick = vi.fn();
    const element = render({ label: "Save", onClick });

    act(() => {
      element?.shadowRoot?.querySelector("button")?.click();
    });

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("fires onClick once for a button inside an opened, portaled drawer", async () => {
    // The reported bug, and the arrangement matters: ONE React root, outside
    // the drawer, rendering the drawer and the button together. React delegates
    // from that root container. When the drawer opens it moves itself — and the
    // button with it — to document.body, out of the container, and a delegated
    // click never arrives.
    //
    // Giving the drawer its own React root instead would move the container
    // along with it and prove nothing; that mistake passed with the bug present.
    const { Drawer } = await import("../../../src/components/overlays/drawer.js");
    Drawer.register();

    const onClick = vi.fn();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    act(() => {
      root.render(
        createElement("box-drawer", { heading: "Connect Box" }, createElement(Button, {
          label: "Save",
          onClick,
        })),
      );
    });

    const drawer = container.querySelector("box-drawer") as HTMLElement & { open: boolean };
    act(() => {
      drawer.open = true;
    });

    // The drawer really did leave the React root container. Without this the
    // test is exercising the ordinary case under a misleading name.
    expect(drawer.parentElement).toBe(document.body);
    expect(container.contains(drawer)).toBe(false);

    const element = drawer.querySelector("box-button") as ButtonElement | null;
    expect(element).toBeTruthy();

    act(() => {
      element?.shadowRoot?.querySelector("button")?.click();
    });

    expect(onClick).toHaveBeenCalledTimes(1);

    // Put the drawer back before the shared teardown unmounts the root: React
    // cannot remove a node that a third party moved out of its container, and
    // throws NotFoundError trying. Worth knowing in its own right — an app that
    // unmounts with a drawer open hits the same thing — but it is the portal's
    // business, not this fix's.
    act(() => {
      drawer.open = false;
    });
    expect(container.contains(drawer)).toBe(true);
  });

  it("invokes the latest callback after a rerender, not the first", () => {
    const first = vi.fn();
    const second = vi.fn();
    const element = render({ label: "Save", onClick: first });

    act(() => {
      root.render(createElement(Button, { label: "Save", onClick: second }));
    });
    act(() => {
      element?.shadowRoot?.querySelector("button")?.click();
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("removes the listener on unmount", () => {
    const onClick = vi.fn();
    const element = render({ label: "Save", onClick });
    const inner = element?.shadowRoot?.querySelector("button");

    act(() => {
      root.unmount();
    });
    // The element is detached but still reachable; a surviving listener would
    // keep calling into an unmounted tree.
    act(() => {
      inner?.click();
    });
    expect(onClick).not.toHaveBeenCalled();

    // afterEach unmounts again; make that a no-op rather than a double unmount.
    root = createRoot(document.createElement("div"));
  });

  it("does not invoke the callback for a disabled button", () => {
    const onClick = vi.fn();
    const element = render({ label: "Save", disabled: true, onClick });

    act(() => {
      element?.shadowRoot?.querySelector("button")?.click();
    });

    expect(onClick).not.toHaveBeenCalled();
  });

  it("fires exactly once outside an overlay — no delegated duplicate", () => {
    // Binding natively while React also delegated its own onClick would double
    // every click. The factory strips configured event props from the host
    // spread; this is the assertion that it actually did.
    const onClick = vi.fn();
    const element = render({ label: "Save", onClick });

    act(() => {
      element?.shadowRoot?.querySelector("button")?.click();
    });

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("hands the callback a native MouseEvent, not a React SyntheticEvent", () => {
    // The type says native; this is what makes the type honest. A React
    // SyntheticEvent carries `nativeEvent` and is not an instanceof MouseEvent.
    const received: unknown[] = [];
    // currentTarget is only set while the event is being dispatched, so it has
    // to be captured inside the handler — reading it afterwards yields null.
    // That is exactly the window in which the type's `currentTarget: E` holds.
    let currentTarget: unknown = "not called";
    const element = render({
      label: "Save",
      onClick: event => {
        received.push(event);
        currentTarget = event.currentTarget;
      },
    });

    act(() => {
      element?.shadowRoot?.querySelector("button")?.click();
    });

    expect(received).toHaveLength(1);
    const event = received[0] as MouseEvent & { nativeEvent?: unknown };
    expect(event).toBeInstanceOf(MouseEvent);
    expect(event.nativeEvent).toBeUndefined();
    expect(currentTarget).toBe(element);
  });

  it("updates properties when React props change", () => {
    const element = render({ label: "Save", tone: "primary" });
    expect(element?.label).toBe("Save");

    act(() => {
      root.render(createElement(Button, { label: "Publish", tone: "danger" }));
    });

    const next = container.querySelector("box-button") as ButtonElement | null;
    expect(next?.label).toBe("Publish");
    expect(next?.tone).toBe("danger");
    expect(next?.shadowRoot?.querySelector('[part="label"]')?.textContent).toBe("Publish");
  });
});
