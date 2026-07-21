// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  BoxLinkButtonElement,
  defineBoxLinkButtonElement,
} from "../../../src/components/actions/link-button.js";
import { boeMotionDuration, boeMotionEasing } from "../../../src/foundations/motion/index.js";

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

  it("uses shared motion vocabulary for paint transitions", () => {
    const element = document.createElement("box-link-button") as BoxLinkButtonElement;
    document.body.append(element);

    const styleText = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    const timing = `${boeMotionDuration.interactive} ${boeMotionEasing.standard}`;
    expect(styleText).toContain(`background-color ${timing}`);
    expect(styleText).toContain(`color ${timing}`);
    expect(styleText).toContain(`box-shadow ${timing}`);
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
    // Control chars that browsers strip on navigation must not bypass the check.
    expect(hrefOf("java\nscript:alert(1)")).toBe("#");
    expect(hrefOf("java\tscript:alert(1)")).toBe("#");
    expect(hrefOf("java\rscript:alert(1)")).toBe("#");
  });

  it("allows safe schemes and relative/fragment URLs", () => {
    expect(hrefOf("https://app.box.com")).toBe("https://app.box.com");
    expect(hrefOf("mailto:team@box.com")).toBe("mailto:team@box.com");
    expect(hrefOf("/folder/1")).toBe("/folder/1");
    expect(hrefOf("#section")).toBe("#section");
  });

  it("adds a safe rel automatically for target=_blank and honors explicit rel", () => {
    const element = document.createElement("box-link-button") as BoxLinkButtonElement;
    element.href = "https://app.box.com";
    element.target = "_blank";
    document.body.append(element);

    const link = element.shadowRoot?.querySelector('[part="link"]') as HTMLAnchorElement;
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");

    element.rel = "noopener";
    expect(link.getAttribute("rel")).toBe("noopener");

    element.target = "";
    expect(link.hasAttribute("target")).toBe(false);
    // Explicit rel persists even without a target.
    expect(link.getAttribute("rel")).toBe("noopener");
  });

  it("renders rich slotted children instead of the label", () => {
    const element = document.createElement("box-link-button") as BoxLinkButtonElement;
    element.href = "/docs";
    element.label = "fallback";
    const strong = document.createElement("strong");
    strong.textContent = "Read the docs";
    element.append(strong);
    document.body.append(element);

    const link = element.shadowRoot?.querySelector('[part="link"]') as HTMLAnchorElement;
    const slot = link.querySelector("slot") as HTMLSlotElement;
    expect(slot.assignedElements()[0]).toBe(strong);
    // Accessible name comes from the children, not a forced aria-label.
    expect(link.hasAttribute("aria-label")).toBe(false);
  });
});
