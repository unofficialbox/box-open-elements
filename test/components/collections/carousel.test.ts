// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Carousel } from "../../../src/components/collections/carousel.js";

describe("Carousel", () => {
  beforeEach(() => {
    Carousel.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the active slide", () => {
    const element = document.createElement("box-carousel") as Carousel;
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
    const element = document.createElement("box-carousel") as Carousel;
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
    const element = document.createElement("box-carousel") as Carousel;
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

  it("exposes slide titles as headings and avoids fake tab roles on dots", () => {
    const element = document.createElement("box-carousel") as Carousel;
    element.items = [{ title: "One" }, { title: "Two" }];
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="title"]')?.tagName).toBe("H2");
    expect(element.shadowRoot?.querySelector('[part="pagination"]')?.getAttribute("role")).toBe("group");
    expect(element.shadowRoot?.querySelector('[part~="dot"]')?.getAttribute("role")).toBeNull();
  });

  it("navigates with ArrowLeft/ArrowRight on the carousel", () => {
    const element = document.createElement("box-carousel") as Carousel;
    element.items = [{ title: "One" }, { title: "Two" }, { title: "Three" }];
    document.body.append(element);

    const carousel = element.shadowRoot?.querySelector('[part="carousel"]') as HTMLElement;
    carousel.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(element.value).toBe(1);
    carousel.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    expect(element.value).toBe(0);
  });

  it("marks the active dot with a selected part", () => {
    const element = document.createElement("box-carousel") as Carousel;
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

  it("uses compact shell chrome styles", () => {
    const element = document.createElement("box-carousel") as Carousel;
    element.items = [{ title: "One" }];
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("padding: 0.7rem;");
    expect(styles).toContain("border-radius: var(--boe-profile-radius-large, 16px);");
    expect(styles).toContain("gap: 0.55rem;");
    expect(styles).toContain("font-size: 1.15rem;");
    expect(styles).toContain("padding: 0.7rem 0.75rem;");
    expect(styles).toContain("border-radius: var(--boe-profile-radius-medium, 12px);");
  });

  it("preserves selected-dot styles on hover and active", () => {
    const element = document.createElement("box-carousel") as Carousel;
    element.items = [{ title: "One" }, { title: "Two" }];
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part~="dot-selected"]:hover:not(:disabled)');
    expect(styles).toContain('[part~="dot-selected"]:active:not(:disabled)');
    expect(styles).toContain("--boe-token-surface-surface-brand");
  });

  it("wraps when using previous from the first slide", () => {
    const element = document.createElement("box-carousel") as Carousel;
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

  it("does not lose focus on a control when an attribute updates", () => {
    const element = document.createElement("box-carousel") as Carousel;
    element.items = [
      { title: "One" },
      { title: "Two" },
    ];
    document.body.append(element);

    const next = element.shadowRoot?.querySelector('[part="next"]') as HTMLButtonElement | null;
    next?.focus();
    expect(element.shadowRoot?.activeElement).toBe(next);

    element.label = "Featured carousel";

    expect(element.shadowRoot?.querySelector('[part="next"]')).toBe(next);
    expect(element.shadowRoot?.activeElement).toBe(next);
  });

  it("clamps the active index when items shrink", () => {
    const element = document.createElement("box-carousel") as Carousel;
    element.items = [
      { title: "One" },
      { title: "Two" },
      { title: "Three" },
    ];
    element.value = 2;
    document.body.append(element);

    expect(element.value).toBe(2);

    element.items = [{ title: "One" }, { title: "Two" }];

    expect(element.value).toBe(1);
    expect(element.shadowRoot?.querySelector('[part="title"]')?.textContent).toBe("Two");
  });

  it("navigates slotted slides, showing only the active one", () => {
    const element = document.createElement("box-carousel") as Carousel;
    for (const [i, text] of ["Alpha", "Beta", "Gamma"].entries()) {
      const slide = document.createElement("div");
      slide.slot = "slide";
      slide.setAttribute("data-title", text);
      slide.textContent = `Slide ${i}`;
      element.append(slide);
    }
    document.body.append(element);

    const slides = Array.from(element.querySelectorAll('[slot="slide"]')) as HTMLElement[];
    // slotchange is async in jsdom.
    return new Promise<void>(resolve => {
      setTimeout(() => {
        // JSON viewport is hidden; slotted stage is shown.
        expect((element.shadowRoot?.querySelector('[part="viewport"]') as HTMLElement).hidden).toBe(true);
        expect((element.shadowRoot?.querySelector('[part="slotted-stage"]') as HTMLElement).hidden).toBe(false);
        // Only slide 0 active.
        expect(slides[0].hasAttribute("data-carousel-active")).toBe(true);
        expect(slides[1].hasAttribute("data-carousel-active")).toBe(false);

        // Pagination reflects 3 slotted slides.
        expect(element.shadowRoot?.querySelectorAll('[part~="dot"]').length).toBe(3);

        // Advance to slide 1.
        (element.shadowRoot?.querySelector('[part="next"]') as HTMLButtonElement).click();
        expect(element.value).toBe(1);
        expect(slides[1].hasAttribute("data-carousel-active")).toBe(true);
        expect(slides[0].hasAttribute("data-carousel-active")).toBe(false);
        resolve();
      }, 0);
    });
  });
});

describe("Carousel owned navigation and descendant keys", () => {
  afterEach(() => { document.body.innerHTML = ""; });
  const create = (): Carousel => {
    const el = new Carousel(); el.items = [{ title: "One" }, { title: "Two" }]; document.body.append(el); return el;
  };
  it("retains dot identity and current metadata across activation and JSON refresh", () => {
    const el = create(); const dot = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part~="dot"]')[1]; dot.focus();
    const events = vi.fn(); el.addEventListener("value-changed", events); dot.click();
    el.items = [{ title: "Current One" }, { title: 'Current R&D <Two>' }];
    expect(el.shadowRoot!.querySelectorAll('[part~="dot"]')[1]).toBe(dot);
    expect(el.shadowRoot!.activeElement).toBe(dot); expect(dot.getAttribute("aria-current")).toBe("true");
    expect(dot.getAttribute("aria-label")).toBe('Go to slide 2: Current R&D <Two>');
    dot.click(); expect(events).toHaveBeenCalledTimes(2);
  });
  it("retains slotted dot identity across refresh and preserves caller focus handoff", async () => {
    const el = new Carousel(); el.innerHTML = '<div slot="slide" data-title="One">One</div><div slot="slide" data-title="Two">Two</div>'; document.body.append(el);
    await new Promise(resolve => setTimeout(resolve, 0));
    const dot = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part~="dot"]')[1]; dot.focus(); dot.click(); el.label = "Current carousel";
    expect(el.shadowRoot!.querySelectorAll('[part~="dot"]')[1]).toBe(dot); expect(el.shadowRoot!.activeElement).toBe(dot);
    const outside = document.createElement("input"); document.body.append(outside);
    el.addEventListener("value-changed", () => { outside.focus(); el.label = "Caller current"; }, { once: true }); dot.click();
    expect(document.activeElement).toBe(outside);
    expect(el.shadowRoot!.querySelector("style")?.textContent).toContain('[part="viewport"][hidden]');
  });
  it.each(["input", "textarea", "select", "contenteditable", "textbox"])("leaves %s descendant arrows uncanceled", async kind => {
    const el = new Carousel(); const slide = document.createElement("div"); slide.slot = "slide";
    const editor = document.createElement(["contenteditable", "textbox"].includes(kind) ? "div" : kind);
    if (kind === "contenteditable") editor.setAttribute("contenteditable", "true");
    if (kind === "textbox") editor.setAttribute("role", "textbox");
    slide.append(editor); const other = document.createElement("div"); other.slot = "slide"; el.append(slide, other); document.body.append(el);
    await new Promise(resolve => setTimeout(resolve, 0)); const changed = vi.fn(); el.addEventListener("value-changed", changed);
    for (const key of ["ArrowLeft", "ArrowRight"]) {
      const event = new KeyboardEvent("keydown", { key, bubbles: true, composed: true, cancelable: true }); editor.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
    expect(el.value).toBe(0); expect(changed).not.toHaveBeenCalled();
  });
  it("removes empty/shrunk dot targets and prevents obsolete metadata from surviving refresh", () => {
    const el = create(); const dot = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part~="dot"]')[1]; dot.focus(); dot.disabled = true;
    el.items = [{ title: "Current One" }, { title: "Current Two" }]; expect(dot.disabled).toBe(false);
    el.items = [{ title: "Only" }]; expect(dot.isConnected).toBe(false); expect(el.shadowRoot!.activeElement).toBeNull();
    const changed = vi.fn(); el.addEventListener("value-changed", changed); dot.click(); expect(changed).not.toHaveBeenCalled();
    el.items = []; expect(el.shadowRoot!.querySelectorAll('[part~="dot"]').length).toBe(0);
  });
  it("keeps own control arrows working when the entire carousel is projected through an editor-labelled panel", () => {
    const panel = document.createElement("div"); panel.setAttribute("role", "textbox"); panel.attachShadow({ mode: "open" }).innerHTML = '<slot></slot>'; document.body.append(panel);
    const el = new Carousel(); el.items = [{ title: "One" }, { title: "Two" }]; panel.append(el);
    const carousel = el.shadowRoot!.querySelector('[part="carousel"]')!;
    carousel.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, composed: true, cancelable: true }));
    expect(el.value).toBe(1);
  });
});
