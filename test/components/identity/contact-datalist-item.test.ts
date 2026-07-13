// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxContactDatalistItemElement,
  defineBoxContactDatalistItemElement,
} from "../../../src/components/identity/contact-datalist-item.js";

describe("BoxContactDatalistItemElement", () => {
  beforeEach(() => {
    defineBoxContactDatalistItemElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders name, email, and initials avatar", () => {
    const element = document.createElement("box-contact-datalist-item") as BoxContactDatalistItemElement;
    element.name = "Morgan Lee";
    element.email = "morgan@box.com";
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="item"]')?.getAttribute("role")).toBe("option");
    expect(element.shadowRoot?.querySelector('[part="name"]')?.textContent).toContain("Morgan Lee");
    expect(element.shadowRoot?.querySelector('[part="email"]')?.textContent).toContain("morgan@box.com");
    expect(element.shadowRoot?.querySelector('[part="avatar-fallback"]')?.textContent).toBe("ML");
  });

  it("renders an image when src is provided", () => {
    const element = document.createElement("box-contact-datalist-item") as BoxContactDatalistItemElement;
    element.name = "Alex Kim";
    element.src = "https://example.com/a.png";
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="avatar-image"]')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part="avatar-fallback"]')).toBeNull();
  });

  it("defaults value to the email and emits select on activation", () => {
    const element = document.createElement("box-contact-datalist-item") as BoxContactDatalistItemElement;
    element.name = "Sam Patel";
    element.email = "sam@box.com";
    document.body.append(element);

    const onSelect = vi.fn();
    element.addEventListener("select", onSelect);
    const item = element.shadowRoot?.querySelector('[part="item"]') as HTMLElement;
    item.click();
    item.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenLastCalledWith(expect.objectContaining({ detail: { value: "sam@box.com" } }));
  });

  it("reflects selected and suppresses activation while disabled", () => {
    const element = document.createElement("box-contact-datalist-item") as BoxContactDatalistItemElement;
    element.name = "Jordan Rivera";
    element.disabled = true;
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="item"]')?.getAttribute("aria-disabled")).toBe("true");

    const onSelect = vi.fn();
    element.addEventListener("select", onSelect);
    (element.shadowRoot?.querySelector('[part="item"]') as HTMLElement).click();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
