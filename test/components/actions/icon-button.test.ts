// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  BoxIconButtonElement,
  defineBoxIconButtonElement,
} from "../../../src/components/actions/icon-button.js";
import { registerBoxDefaultDesignSystem, setActiveDesignSystem } from "../../../src/index.js";

describe("BoxIconButtonElement", () => {
  beforeEach(() => {
    defineBoxIconButtonElement();
    registerBoxDefaultDesignSystem({ setActive: true });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    setActiveDesignSystem(null);
  });

  it("renders a registered Box svg icon for aliased icon names and preserves the label", () => {
    const element = document.createElement("box-icon-button") as BoxIconButtonElement;
    element.icon = "+";
    element.label = "Add item";

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="button"]') as HTMLButtonElement | null;
    const icon = element.shadowRoot?.querySelector('[part="icon"]') as HTMLElement | null;
    expect(button?.getAttribute("aria-label")).toBe("Add item");
    expect(icon?.dataset.iconSource).toBe("design-system");
    expect(icon?.innerHTML).toContain("<svg");
  });

  it("renders a registered Box svg icon when the icon name matches the active design system", () => {
    const element = document.createElement("box-icon-button") as BoxIconButtonElement;
    element.icon = "search";
    element.label = "Search";

    document.body.append(element);

    const icon = element.shadowRoot?.querySelector('[part="icon"]') as HTMLElement | null;
    expect(icon?.dataset.iconSource).toBe("design-system");
    expect(icon?.innerHTML).toContain("<svg");
  });
});
