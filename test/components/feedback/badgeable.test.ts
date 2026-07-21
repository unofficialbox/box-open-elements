// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  BoxBadgeableElement,
  defineBoxBadgeableElement,
} from "../../../src/components/feedback/badgeable.js";

describe("BoxBadgeableElement", () => {
  beforeEach(() => {
    defineBoxBadgeableElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a slot for each corner plus the default subject slot", () => {
    const el = document.createElement("box-badgeable") as BoxBadgeableElement;
    document.body.append(el);
    const slots = [...(el.shadowRoot?.querySelectorAll("slot") ?? [])].map(s => s.getAttribute("name"));
    expect(slots).toEqual([null, "top-left", "top-right", "bottom-left", "bottom-right"]);
  });

  it("hides corners with no assigned badge and shows those with one", () => {
    const el = document.createElement("box-badgeable") as BoxBadgeableElement;
    el.innerHTML = `<span>subject</span><span slot="bottom-right">3</span>`;
    document.body.append(el);

    const corner = (name: string): HTMLElement =>
      el.shadowRoot?.querySelector(`[data-corner="${name}"]`) as HTMLElement;

    expect(corner("bottom-right").hidden).toBe(false);
    expect(corner("top-left").hidden).toBe(true);
    expect(corner("top-right").hidden).toBe(true);
    expect(corner("bottom-left").hidden).toBe(true);
  });

  it("reveals a corner when a badge is added later", async () => {
    const el = document.createElement("box-badgeable") as BoxBadgeableElement;
    el.innerHTML = `<span>subject</span>`;
    document.body.append(el);
    const topRight = el.shadowRoot?.querySelector('[data-corner="top-right"]') as HTMLElement;
    expect(topRight.hidden).toBe(true);

    const badge = document.createElement("span");
    badge.setAttribute("slot", "top-right");
    badge.textContent = "!";
    el.append(badge);
    // slotchange dispatches asynchronously (microtask), as in real browsers.
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(topRight.hidden).toBe(false);
  });
});
