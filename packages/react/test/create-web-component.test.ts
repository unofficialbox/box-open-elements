// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";

import { createWebComponent, type WebComponentProps } from "../src/create-web-component.js";

/**
 * A bare custom element, so these assertions are about the factory rather than
 * about any component's own behaviour.
 */
class Probe extends HTMLElement {
  marker = "";
}
customElements.define("probe-element", Probe);

type ProbeProps = WebComponentProps & {
  marker?: string;
  onPing?: (event: Event) => void;
};

const Probed = createWebComponent<Probe, ProbeProps>({
  tagName: "probe-element",
  displayName: "Probed",
  propertyNames: ["marker"],
  events: [{ propName: "onPing", eventName: "ping" }],
  sync: (element, props) => {
    if (props.marker !== undefined) element.marker = props.marker;
  },
});

describe("createWebComponent event bindings", () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  const render = (props: ProbeProps): Probe => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    act(() => {
      root.render(createElement(Probed, props));
    });
    return container.querySelector("probe-element") as Probe;
  };

  it("registers configured events with addEventListener, not as host props", () => {
    // The distinction that matters: a real listener on the element survives the
    // element being moved out of React's root container. A host prop does not.
    const added: string[] = [];
    const original = Probe.prototype.addEventListener;
    const spy = vi
      .spyOn(Probe.prototype, "addEventListener")
      .mockImplementation(function (this: Probe, type: string, ...rest: unknown[]) {
        added.push(type);
        return (original as (...args: unknown[]) => void).call(this, type, ...rest);
      } as typeof original);

    const element = render({ marker: "m", onPing: () => undefined });

    expect(added).toContain("ping");
    // And the callback is not left on the element as an attribute or property.
    expect(element.getAttribute("onPing")).toBeNull();
    expect(element.getAttribute("onping")).toBeNull();
    expect((element as unknown as Record<string, unknown>).onPing).toBeUndefined();

    spy.mockRestore();
  });

  it("does not forward configured event props into the host spread", () => {
    // React would otherwise warn about an unknown prop and stamp it onto the
    // DOM. Asserting on the rendered element is the observable form of that.
    const element = render({ marker: "m", onPing: () => undefined });
    const attributeNames = element.getAttributeNames();

    expect(attributeNames).not.toContain("onping");
    expect(attributeNames.some(name => name.toLowerCase().startsWith("onping"))).toBe(false);
  });

  it("still forwards ordinary host props", () => {
    // The stripping must be surgical: only the configured event props go.
    const element = render({ marker: "m", id: "probe-1", title: "hello" });

    expect(element.id).toBe("probe-1");
    expect(element.getAttribute("title")).toBe("hello");
    expect(element.marker).toBe("m");
  });

  it("routes to the latest callback without rebinding the listener", () => {
    const added: string[] = [];
    const original = Probe.prototype.addEventListener;
    const spy = vi
      .spyOn(Probe.prototype, "addEventListener")
      .mockImplementation(function (this: Probe, type: string, ...rest: unknown[]) {
        added.push(type);
        return (original as (...args: unknown[]) => void).call(this, type, ...rest);
      } as typeof original);

    const first = vi.fn();
    const second = vi.fn();
    const element = render({ onPing: first });
    const bindingsAfterMount = added.filter(type => type === "ping").length;

    act(() => {
      root.render(createElement(Probed, { onPing: second }));
    });

    act(() => {
      element.dispatchEvent(new Event("ping"));
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    // One binding for the element's lifetime: re-binding per render would drop
    // events dispatched between the removal and the re-add.
    expect(added.filter(type => type === "ping").length).toBe(bindingsAfterMount);

    spy.mockRestore();
  });

  it("removes the listener on unmount", () => {
    const onPing = vi.fn();
    const element = render({ onPing });

    act(() => {
      root.unmount();
    });
    act(() => {
      element.dispatchEvent(new Event("ping"));
    });

    expect(onPing).not.toHaveBeenCalled();
    root = createRoot(document.createElement("div"));
  });
});
