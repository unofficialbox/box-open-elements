// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  BoxLinkButtonElement,
  defineBoxLinkButtonElement,
} from "../../../src/components/actions/link-button.js";

describe("BoxLinkButtonElement", () => {
  beforeEach(() => {
    defineBoxLinkButtonElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a link with the configured label and href", () => {
    const element = document.createElement("box-link-button") as BoxLinkButtonElement;
    element.label = "Open docs";
    element.href = "/docs";

    document.body.append(element);

    const link = element.shadowRoot?.querySelector('[part="link"]') as HTMLAnchorElement | null;
    expect(link?.textContent).toContain("Open docs");
    expect(link?.getAttribute("href")).toBe("/docs");
    expect(link?.getAttribute("aria-label")).toBe("Open docs");
  });
});
