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

  const hrefOf = (value: string): string | null => {
    const element = document.createElement("box-link-button") as BoxLinkButtonElement;
    element.href = value;
    document.body.append(element);
    return element.shadowRoot?.querySelector('[part="link"]')?.getAttribute("href") ?? null;
  };

  it("rejects dangerous URL schemes", () => {
    expect(hrefOf("javascript:alert(1)")).toBe("#");
    expect(hrefOf("JavaScript:alert(1)")).toBe("#");
    expect(hrefOf(" javascript:alert(1)")).toBe("#");
    expect(hrefOf("data:text/html,<script>alert(1)</script>")).toBe("#");
    expect(hrefOf("vbscript:msgbox(1)")).toBe("#");
  });

  it("allows safe schemes and relative/fragment URLs", () => {
    expect(hrefOf("https://app.box.com")).toBe("https://app.box.com");
    expect(hrefOf("mailto:team@box.com")).toBe("mailto:team@box.com");
    expect(hrefOf("/folder/1")).toBe("/folder/1");
    expect(hrefOf("#section")).toBe("#section");
  });
});
