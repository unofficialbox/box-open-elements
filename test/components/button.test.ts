import { beforeAll, describe, expect, it, vi } from "vitest";

import { defineBoxButtonElement } from "../../src/components/actions/button.js";

describe("box-button", () => {
  beforeAll(() => {
    defineBoxButtonElement();
  });

  const create = (): HTMLElement => {
    const element = document.createElement("box-button");
    document.body.append(element);
    return element;
  };

  it("renders its label into a native button", () => {
    const element = create();
    element.setAttribute("label", "Save");

    const button = element.shadowRoot?.querySelector("button");

    expect(button?.textContent?.trim()).toBe("Save");
    expect(button?.getAttribute("part")).toBe("button");
  });

  it("reflects tone and size onto the internal button", () => {
    const element = create();
    element.setAttribute("tone", "neutral");
    element.setAttribute("size", "small");

    const button = element.shadowRoot?.querySelector("button");

    expect(button?.dataset.tone).toBe("neutral");
    expect(button?.dataset.size).toBe("small");
  });

  it("disables interaction when disabled is set", () => {
    const element = create();
    element.setAttribute("disabled", "");

    const button = element.shadowRoot?.querySelector("button");
    const onClick = vi.fn();
    element.addEventListener("click", onClick);
    button?.click();

    expect(button?.disabled).toBe(true);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("escapes label content", () => {
    const element = create();
    element.setAttribute("label", "<img src=x>");

    expect(element.shadowRoot?.querySelector("img")).toBeNull();
    expect(element.shadowRoot?.querySelector("button")?.textContent).toContain("<img src=x>");
  });

  it("is idempotent to define twice", () => {
    expect(() => defineBoxButtonElement()).not.toThrow();
  });
});
