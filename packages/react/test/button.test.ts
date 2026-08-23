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

  it("fires onClick once for a button inside an opened drawer", async () => {
    // The originally reported arrangement: ONE React root, outside the drawer,
    // rendering the drawer and the button together.
    //
    // This no longer reproduces the delegation bug on its own — the drawer used
    // to move itself to document.body and now stays put, covering the page via
    // the top layer instead. Kept because a button inside an open drawer is the
    // real-world case that was reported, and it must keep working; the
    // delegation hazard itself is provoked directly in the test below.
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

    const element = drawer.querySelector("box-button") as ButtonElement | null;
    expect(element).toBeTruthy();

    act(() => {
      element?.shadowRoot?.querySelector("button")?.click();
    });

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("fires onClick for a button whose host has been moved out of the React root", () => {
    // The hazard this fix exists for, now provoked directly rather than through
    // the drawer. `box-drawer` used to relocate itself to document.body, which
    // is how the bug was found — it no longer does, so the drawer alone can no
    // longer prove anything about delegation. Any host that relocates a subtree
    // (a third-party portal, an app moving nodes by hand) reproduces it, and
    // React's delegated onClick would still silently die.
    const onClick = vi.fn();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    act(() => {
      root.render(createElement(Button, { label: "Save", onClick }));
    });

    const element = container.querySelector("box-button") as ButtonElement;
    expect(element).toBeTruthy();

    // Out of the React root container, exactly as the drawer used to do.
    const elsewhere = document.createElement("div");
    document.body.append(elsewhere);
    elsewhere.append(element);
    expect(container.contains(element)).toBe(false);

    act(() => {
      element.shadowRoot?.querySelector("button")?.click();
    });

    expect(onClick).toHaveBeenCalledTimes(1);

    // React cannot remove a node a third party moved out of its container, so
    // put it back before the shared teardown unmounts the root.
    container.append(element);
    elsewhere.remove();
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
