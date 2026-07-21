// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxButtonElement, defineBoxButtonElement } from "../../../src/components/actions/button.js";

const create = (): BoxButtonElement => {
  const el = document.createElement("box-button") as BoxButtonElement;
  el.label = "Save";
  document.body.append(el);
  return el;
};

const innerButton = (el: BoxButtonElement): HTMLButtonElement =>
  el.shadowRoot?.querySelector('[part="button"]') as HTMLButtonElement;

describe("BoxButtonElement", () => {
  beforeEach(() => {
    defineBoxButtonElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the label and reflects tone/size", () => {
    const el = create();
    el.tone = "danger";
    el.size = "small";
    const btn = innerButton(el);
    expect(el.shadowRoot?.querySelector('[part="label"]')?.textContent).toBe("Save");
    expect(btn.dataset.tone).toBe("danger");
    expect(btn.dataset.size).toBe("small");
  });

  it("shows a spinner and blocks activation while loading", () => {
    const el = create();
    el.isLoading = true;
    const btn = innerButton(el);
    expect((el.shadowRoot?.querySelector('[part="spinner"]') as HTMLElement).hidden).toBe(false);
    expect(btn.getAttribute("aria-busy")).toBe("true");
    expect(btn.getAttribute("aria-disabled")).toBe("true");

    const clicked = vi.fn();
    el.addEventListener("click", clicked);
    btn.click();
    // Loading buttons swallow the activation.
    expect(clicked).not.toHaveBeenCalled();
  });

  it("hides the icon slot until content is assigned", async () => {
    const el = create();
    const iconEl = el.shadowRoot?.querySelector('[part="icon"]') as HTMLElement;
    expect(iconEl.hidden).toBe(true);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("slot", "icon");
    el.append(svg);
    await new Promise(resolve => setTimeout(resolve, 0)); // slotchange is async
    expect(iconEl.hidden).toBe(false);
  });

  it("submits the owning form when type=submit", () => {
    const form = document.createElement("form");
    const el = document.createElement("box-button") as BoxButtonElement;
    el.type = "submit";
    el.label = "Submit";
    form.append(el);
    document.body.append(form);

    const submitted = vi.fn((e: Event) => e.preventDefault());
    form.addEventListener("submit", submitted);
    innerButton(el).click();
    expect(submitted).toHaveBeenCalledTimes(1);
  });

  it("resets the owning form when type=reset", () => {
    const form = document.createElement("form");
    form.innerHTML = `<input name="q" value="" />`;
    const el = document.createElement("box-button") as BoxButtonElement;
    el.type = "reset";
    form.append(el);
    document.body.append(form);
    const input = form.querySelector("input")!;
    input.value = "typed";

    const reset = vi.fn();
    form.addEventListener("reset", reset);
    innerButton(el).click();
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("does not activate when disabled", () => {
    const el = create();
    el.disabled = true;
    expect(innerButton(el).hasAttribute("disabled")).toBe(true);
  });
});
