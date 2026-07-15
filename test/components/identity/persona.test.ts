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

  it("falls back to the default size for invalid size values", () => {
    const element = document.createElement("box-persona") as BoxPersonaElement;
    element.name = "Morgan Lee";
    element.setAttribute("size", "not-a-number");

    document.body.append(element);

    const avatar = element.shadowRoot?.querySelector('[part="avatar"]') as HTMLElement | null;
    expect(element.size).toBe(48);
    expect(avatar?.style.width).toBe("48px");
    expect(avatar?.style.height).toBe("48px");
  });

  it("scales initials font size with avatar size", () => {
    const element = document.createElement("box-persona") as BoxPersonaElement;
    element.name = "Morgan Lee";
    element.size = 64;

    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    const avatar = element.shadowRoot?.querySelector('[part="avatar"]') as HTMLElement | null;
    expect(styles).toContain("calc(var(--avatar-size");
    expect(avatar?.style.getPropertyValue("--avatar-size")).toBe("64px");
  });

  it("shows initials when the image fails to load", () => {
    const element = document.createElement("box-persona") as BoxPersonaElement;
    element.name = "Morgan Lee";
    element.src = "https://example.com/missing.png";

    document.body.append(element);

    const image = element.shadowRoot?.querySelector('[part="image"]') as HTMLImageElement | null;
    image?.dispatchEvent(new Event("error"));

    expect(image?.hidden).toBe(true);
    expect(element.shadowRoot?.querySelector('[part="fallback"]')?.textContent).toBe("ML");
  });

  it("maps tone to status indicator styles", () => {
    const element = document.createElement("box-persona") as BoxPersonaElement;
    element.name = "Morgan Lee";
    element.status = "Approved";
    element.tone = "success";

    document.body.append(element);

    const status = element.shadowRoot?.querySelector('[part="status"]') as HTMLElement | null;
    expect(status?.dataset.tone).toBe("success");

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part="status"][data-tone="success"]');
    expect(styles).toContain('[part="status"][data-tone="error"]');
    expect(styles).toContain('[part="status"][data-tone="warning"]');
  });
});
