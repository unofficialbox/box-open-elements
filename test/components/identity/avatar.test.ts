// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  BoxAvatarElement,
  defineBoxAvatarElement,
} from "../../../src/components/identity/avatar.js";

describe("BoxAvatarElement", () => {
  beforeEach(() => {
    defineBoxAvatarElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders initials derived from the name", () => {
    const element = document.createElement("box-avatar") as BoxAvatarElement;
    element.name = "Morgan Lee";

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("ML");
  });

  it("renders an image when src is provided", () => {
    const element = document.createElement("box-avatar") as BoxAvatarElement;
    element.src = "https://example.com/avatar.png";
    element.alt = "Profile photo";

    document.body.append(element);

    const image = element.shadowRoot?.querySelector('[part="image"]') as HTMLImageElement | null;
    expect(image?.getAttribute("src")).toBe("https://example.com/avatar.png");
    expect(image?.getAttribute("alt")).toBe("Profile photo");
  });

  it("falls back to the default size for invalid size values", () => {
    const element = document.createElement("box-avatar") as BoxAvatarElement;
    element.name = "Morgan Lee";
    element.setAttribute("size", "0");

    document.body.append(element);

    const avatar = element.shadowRoot?.querySelector('[part="avatar"]') as HTMLElement | null;
    expect(element.size).toBe(52);
    expect(avatar?.style.width).toBe("52px");
    expect(avatar?.style.height).toBe("52px");
  });

  it("scales initials font size with avatar size", () => {
    const element = document.createElement("box-avatar") as BoxAvatarElement;
    element.name = "Morgan Lee";
    element.size = 80;

    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    const avatar = element.shadowRoot?.querySelector('[part="avatar"]') as HTMLElement | null;
    expect(styles).toContain("calc(var(--avatar-size");
    expect(avatar?.style.getPropertyValue("--avatar-size")).toBe("80px");
  });

  it("shows initials when the image fails to load", () => {
    const element = document.createElement("box-avatar") as BoxAvatarElement;
    element.name = "Morgan Lee";
    element.src = "https://example.com/missing.png";

    document.body.append(element);

    const image = element.shadowRoot?.querySelector('[part="image"]') as HTMLImageElement | null;
    image?.dispatchEvent(new Event("error"));

    expect(image?.hidden).toBe(true);
    expect(element.shadowRoot?.querySelector('[part="fallback"]')?.textContent).toBe("ML");
  });
});
