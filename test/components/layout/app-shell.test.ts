// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BoxAppShellElement, defineBoxAppShellElement } from "../../../src/components/layout/app-shell.js";

describe("BoxAppShellElement", () => {
  beforeEach(() => {
    defineBoxAppShellElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders named layout regions", () => {
    const element = document.createElement("box-app-shell") as BoxAppShellElement;
    element.heading = "Workspace";

    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="header"]')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part="nav"]')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part="main"]')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part="aside"]')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part="footer"]')).toBeTruthy();
    expect(element.shadowRoot?.textContent).toContain("Workspace");
  });
});
