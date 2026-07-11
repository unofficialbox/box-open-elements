// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxCarouselElement, defineBoxCarouselElement } from "../../../src/components/collections/carousel.js";

describe("BoxCarouselElement", () => {
  beforeEach(() => {
    defineBoxCarouselElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the active slide", () => {
    const element = document.createElement("box-carousel") as BoxCarouselElement;
    element.items = [
      { title: "One", description: "First" },
      { title: "Two", description: "Second" },
    ];
    element.value = 1;

    document.body.append(element);

    const title = element.shadowRoot?.querySelector('[part="title"]') as HTMLElement | null;
    expect(title?.textContent).toBe("Two");
  });

  it("emits value-changed when navigating", () => {
    const element = document.createElement("box-carousel") as BoxCarouselElement;
    const changed = vi.fn();
    element.items = [
      { title: "One" },
      { title: "Two" },
    ];
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const next = element.shadowRoot?.querySelector('[part="next"]') as HTMLButtonElement | null;
    next?.click();

    expect(element.value).toBe(1);
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: 1 },
      }),
    );
  });

  it("supports dot navigation", () => {
    const element = document.createElement("box-carousel") as BoxCarouselElement;
    element.items = [
      { title: "One" },
      { title: "Two" },
      { title: "Three" },
    ];

    document.body.append(element);

    const thirdDot = element.shadowRoot?.querySelector('[data-index="2"]') as HTMLButtonElement | null;
    thirdDot?.click();

    expect(element.value).toBe(2);
  });

  it("marks the active dot with a selected part", () => {
    const element = document.createElement("box-carousel") as BoxCarouselElement;
    element.items = [
      { title: "One" },
      { title: "Two" },
      { title: "Three" },
    ];
    element.value = 1;

    document.body.append(element);

    const activeDot = element.shadowRoot?.querySelector('[part~="dot-selected"]') as HTMLButtonElement | null;
    expect(activeDot?.dataset.index).toBe("1");
  });

  it("wraps when using previous from the first slide", () => {
    const element = document.createElement("box-carousel") as BoxCarouselElement;
    element.items = [
      { title: "One" },
      { title: "Two" },
      { title: "Three" },
    ];

    document.body.append(element);

    const previous = element.shadowRoot?.querySelector('[part="previous"]') as HTMLButtonElement | null;
    previous?.click();

    expect(element.value).toBe(2);
  });
});
