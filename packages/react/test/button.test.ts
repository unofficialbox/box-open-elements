// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";

import { BoxButton } from "../src/button.js";
import type { BoxButtonElement } from "../../../src/components/actions/button.js";

describe("BoxButton React adapter", () => {
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
    onClick?: (event: unknown) => void;
  }) => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    act(() => {
      root.render(createElement(BoxButton, props));
    });
    return container.querySelector("box-button") as BoxButtonElement | null;
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

  it("updates properties when React props change", () => {
    const element = render({ label: "Save", tone: "primary" });
    expect(element?.label).toBe("Save");

    act(() => {
      root.render(createElement(BoxButton, { label: "Publish", tone: "danger" }));
    });

    const next = container.querySelector("box-button") as BoxButtonElement | null;
    expect(next?.label).toBe("Publish");
    expect(next?.tone).toBe("danger");
    expect(next?.shadowRoot?.querySelector('[part="label"]')?.textContent).toBe("Publish");
  });
});
