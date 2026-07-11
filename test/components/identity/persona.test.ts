// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  BoxPersonaElement,
  defineBoxPersonaElement,
} from "../../../src/components/identity/persona.js";

describe("BoxPersonaElement", () => {
  beforeEach(() => {
    defineBoxPersonaElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders persona metadata", () => {
    const element = document.createElement("box-persona") as BoxPersonaElement;
    element.name = "Morgan Lee";
    element.subtitle = "Product Design";
    element.status = "Reviewer";

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Morgan Lee");
    expect(element.shadowRoot?.textContent).toContain("Product Design");
    expect(element.shadowRoot?.textContent).toContain("Reviewer");
  });

  it("supports description as the preferred subtitle alias", () => {
    const element = document.createElement("box-persona") as BoxPersonaElement;
    element.name = "Morgan Lee";
    element.description = "Design Systems";

    document.body.append(element);

    expect(element.subtitle).toBe("Design Systems");
    expect(element.shadowRoot?.querySelector('[part~="description"]')?.textContent).toContain("Design Systems");
  });

  it("derives initials from the name", () => {
    const element = document.createElement("box-persona") as BoxPersonaElement;
    element.name = "Morgan Lee";

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("ML");
  });
});
