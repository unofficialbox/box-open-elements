// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxThumbnailCardElement,
  defineBoxThumbnailCardElement,
} from "../../../src/components/collections/thumbnail-card.js";

const create = (): BoxThumbnailCardElement => {
  const el = document.createElement("box-thumbnail-card") as BoxThumbnailCardElement;
  document.body.append(el);
  return el;
};

describe("BoxThumbnailCardElement", () => {
  beforeEach(() => {
    defineBoxThumbnailCardElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the title and subtitle", () => {
    const el = create();
    el.cardTitle = "Quarterly Plan.pdf";
    el.subtitle = "PDF · 2.4 MB";
    expect(el.shadowRoot?.querySelector('[part="title"]')?.textContent).toBe("Quarterly Plan.pdf");
    expect(el.shadowRoot?.querySelector('[part="subtitle"]')?.textContent).toBe("PDF · 2.4 MB");
  });

  it("hides the subtitle when empty", () => {
    const el = create();
    el.cardTitle = "Untitled";
    const subtitle = el.shadowRoot?.querySelector('[part="subtitle"]') as HTMLElement;
    expect(subtitle.hidden).toBe(true);
  });

  it("becomes a button when interactive", () => {
    const el = create();
    el.cardTitle = "Report.pdf";
    el.interactive = true;
    const card = el.shadowRoot?.querySelector('[part="card"]');
    expect(card?.getAttribute("role")).toBe("button");
    expect(card?.getAttribute("tabindex")).toBe("0");
    expect(card?.getAttribute("aria-label")).toBe("Report.pdf");
  });

  it("emits activate on click and Enter/Space only when interactive", () => {
    const el = create();
    el.cardTitle = "Report.pdf";
    const activated = vi.fn();
    el.addEventListener("activate", activated);
    const card = el.shadowRoot?.querySelector('[part="card"]') as HTMLElement;

    card.click();
    expect(activated).not.toHaveBeenCalled(); // not interactive yet

    el.interactive = true;
    card.click();
    card.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    card.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    expect(activated).toHaveBeenCalledTimes(3);
    expect(activated.mock.calls[0][0].detail.title).toBe("Report.pdf");
  });

  it("drops button semantics when interactive is removed", () => {
    const el = create();
    el.interactive = true;
    el.interactive = false;
    const card = el.shadowRoot?.querySelector('[part="card"]');
    expect(card?.hasAttribute("role")).toBe(false);
    expect(card?.hasAttribute("tabindex")).toBe(false);
  });
});
