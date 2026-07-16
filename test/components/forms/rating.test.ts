// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxRatingElement, defineBoxRatingElement } from "../../../src/components/forms/rating.js";
import { getMirroredFormValue } from "../../../src/core/index.js";

describe("BoxRatingElement", () => {
  beforeEach(() => {
    defineBoxRatingElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the current rating and label", () => {
    const element = document.createElement("box-rating") as BoxRatingElement;
    element.label = "Review";
    element.value = 4;

    document.body.append(element);

    const label = element.shadowRoot?.querySelector('[part="label"]') as HTMLElement | null;
    const value = element.shadowRoot?.querySelector('[part="value"]') as HTMLElement | null;
    expect(label?.textContent).toBe("Review");
    expect(value?.textContent).toBe("4/5");
  });

  it("uses compact transparent star styles", () => {
    const element = document.createElement("box-rating") as BoxRatingElement;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("padding: 0.25rem 0.35rem;");
    expect(styles).toContain("inline-size: 1.85rem;");
    expect(styles).toContain("block-size: 1.85rem;");
    expect(styles).toMatch(
      /\[part="star"\]\[data-filled="true"\]\s*\{\s*color: var\(--boe-token-surface-surface-brand, #0061d5\);\s*border-color: transparent;\s*background: transparent;\s*\}/,
    );
  });

  it("emits value-changed when a star is selected", () => {
    const element = document.createElement("box-rating") as BoxRatingElement;
    const changed = vi.fn();
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const fourthStar = element.shadowRoot?.querySelector('[data-value="4"]') as HTMLButtonElement | null;
    fourthStar?.click();

    expect(element.value).toBe(4);
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: 4 },
      }),
    );
  });

  it("supports keyboard stepping", () => {
    const element = document.createElement("box-rating") as BoxRatingElement;
    element.value = 2;

    document.body.append(element);

    const control = element.shadowRoot?.querySelector('[part="control"]') as HTMLDivElement | null;
    control?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(element.value).toBe(3);

    control?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    expect(element.value).toBe(2);
  });

  it("does not change while disabled", () => {
    const element = document.createElement("box-rating") as BoxRatingElement;
    element.disabled = true;

    document.body.append(element);

    const thirdStar = element.shadowRoot?.querySelector('[data-value="3"]') as HTMLButtonElement | null;
    thirdStar?.click();

    expect(element.value).toBe(0);
  });

  it("mirrors rating as a string form value", () => {
    const element = document.createElement("box-rating") as BoxRatingElement;
    element.name = "score";
    document.body.append(element);

    const thirdStar = element.shadowRoot?.querySelector('[data-value="3"]') as HTMLButtonElement | null;
    thirdStar?.click();

    expect(getMirroredFormValue(element.internals)).toBe("3");
  });
});
