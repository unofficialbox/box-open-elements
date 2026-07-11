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
});
