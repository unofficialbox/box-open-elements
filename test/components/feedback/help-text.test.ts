// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  BoxHelpTextElement,
  defineBoxHelpTextElement,
} from "../../../src/components/feedback/help-text.js";
import { registerBoxDefaultDesignSystem, setActiveDesignSystem } from "../../../src/index.js";

describe("BoxHelpTextElement", () => {
  beforeEach(() => {
    defineBoxHelpTextElement();
    registerBoxDefaultDesignSystem({ setActive: true });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    setActiveDesignSystem(null);
  });

  it("renders the label and message", () => {
    const element = document.createElement("box-help-text") as BoxHelpTextElement;
    element.label = "Heads up";
    element.message = "Inherited permissions may affect visibility.";

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Heads up");
    expect(element.shadowRoot?.textContent).toContain("Inherited permissions may affect visibility.");
  });

  it("supports description as a compatible alias for message", () => {
    const element = document.createElement("box-help-text") as BoxHelpTextElement;
    element.description = "This is inherited from the parent folder.";

    document.body.append(element);

    expect(element.message).toBe("This is inherited from the parent folder.");
    expect(element.shadowRoot?.querySelector('[part~="description"]')?.textContent).toContain("parent folder");
  });

  it("exposes note semantics with an accessible label", () => {
    const element = document.createElement("box-help-text") as BoxHelpTextElement;
    element.label = "Heads up";
    element.message = "Inherited permissions may affect visibility.";

    document.body.append(element);

    const root = element.shadowRoot?.querySelector('[part="help-text"]') as HTMLElement | null;
    expect(root?.getAttribute("role")).toBe("note");
    expect(root?.getAttribute("aria-label")).toBe("Heads up");
  });

  it("announces error-tone help text assertively via role=alert", () => {
    const element = document.createElement("box-help-text") as BoxHelpTextElement;
    element.message = "Enter a valid email address.";
    element.tone = "error";
    document.body.append(element);

    const root = element.shadowRoot?.querySelector('[part="help-text"]') as HTMLElement;
    expect(root.getAttribute("role")).toBe("alert");

    // Switching away from error returns to the passive note role.
    element.tone = "info";
    expect(root.getAttribute("role")).toBe("note");
  });

  it("uses a registered Box icon when the active design system provides one", () => {
    const element = document.createElement("box-help-text") as BoxHelpTextElement;
    element.message = "Inherited permissions may affect visibility.";

    document.body.append(element);

    const icon = element.shadowRoot?.querySelector('[part="icon"]') as HTMLElement | null;
    expect(icon?.dataset.iconSource).toBe("design-system");
    expect(icon?.innerHTML).toContain("<svg");
  });
});
