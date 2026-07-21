// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxBreadcrumbElement,
  defineBoxBreadcrumbElement,
} from "../../../src/components/navigation/breadcrumb.js";

const path = (n: number): { label: string; value: string }[] =>
  Array.from({ length: n }, (_, i) => ({ label: `Folder ${i}`, value: String(i) }));

const create = (items: unknown[]): BoxBreadcrumbElement => {
  const el = document.createElement("box-breadcrumb") as BoxBreadcrumbElement;
  el.items = items as never;
  document.body.append(el);
  return el;
};

describe("BoxBreadcrumbElement", () => {
  beforeEach(() => {
    defineBoxBreadcrumbElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a crumb per item with the last marked as current", () => {
    const el = create(path(3));
    const links = el.shadowRoot?.querySelectorAll('[part="link"]');
    expect(links?.length).toBe(3);
    expect(links?.[2].getAttribute("aria-current")).toBe("page");
    expect(links?.[0].hasAttribute("aria-current")).toBe(false);
  });

  it("collapses the middle into an ellipsis past max-items", () => {
    const el = create(path(6)); // default max 4 → first + … + last two
    const crumbs = el.shadowRoot?.querySelectorAll('[part="crumb"]');
    expect(crumbs?.length).toBe(4);
    expect(el.shadowRoot?.querySelector('[part="ellipsis"]')).not.toBeNull();
    const links = [...(el.shadowRoot?.querySelectorAll('[part="link"]') ?? [])];
    expect(links.map(l => l.textContent)).toEqual(["Folder 0", "Folder 4", "Folder 5"]);
  });

  it("does not collapse when within max-items", () => {
    const el = create(path(4));
    expect(el.shadowRoot?.querySelector('[part="ellipsis"]')).toBeNull();
  });

  it("emits navigate with the crumb value and prevents default for JS crumbs", () => {
    const el = create(path(3));
    const navigated = vi.fn();
    el.addEventListener("navigate", navigated);
    const first = el.shadowRoot?.querySelector('[part="link"]') as HTMLButtonElement;
    first.click();
    expect(navigated).toHaveBeenCalledTimes(1);
    expect(navigated.mock.calls[0][0].detail.value).toBe("0");
  });

  it("does not emit navigate for the current (last) crumb", () => {
    const el = create(path(3));
    const navigated = vi.fn();
    el.addEventListener("navigate", navigated);
    const links = el.shadowRoot?.querySelectorAll('[part="link"]');
    (links?.[2] as HTMLElement).click();
    expect(navigated).not.toHaveBeenCalled();
  });

  it("renders href crumbs as anchors, keeping the last as a button", () => {
    const el = create([
      { label: "Home", href: "/" },
      { label: "Docs", href: "/docs" },
      { label: "Page", href: "/docs/page" },
    ]);
    const links = el.shadowRoot?.querySelectorAll('[part="link"]');
    expect(links?.[0].tagName).toBe("A");
    expect(links?.[0].getAttribute("href")).toBe("/");
    expect(links?.[2].tagName).toBe("BUTTON"); // current crumb is not a link
  });
});
