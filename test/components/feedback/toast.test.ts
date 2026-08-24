// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Toast } from "../../../src/components/feedback/toast.js";

describe("Toast", () => {
  beforeEach(() => {
    Toast.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("shows and dismisses a toast", () => {
    const element = document.createElement("box-toast") as Toast;
    const dismissed = vi.fn();
    element.addEventListener("dismiss", dismissed);

    document.body.append(element);
    element.show("Saved", { duration: 0, tone: "success" });

    expect(element.open).toBe(true);
    expect(element.shadowRoot?.textContent).toContain("Saved");

    const dismiss = element.shadowRoot?.querySelector('[part="dismiss"]') as HTMLButtonElement | null;
    dismiss?.click();

    expect(dismissed).toHaveBeenCalled();
    expect(element.open).toBe(false);
  });

  it("uses BUE notification toast styles", () => {
    const element = document.createElement("box-toast") as Toast;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("inline-size: fit-content;");
    expect(styles).toContain("min-height: 48px;");
    expect(styles).toContain("padding: 10px 10px 10px 20px;");
    expect(styles).toContain("border-radius: var(--boe-profile-radius-large, 16px);");
    expect(styles).toContain("border: 2px solid");
    expect(styles).toContain("font-size: 15px;");
  });

  it("auto-hides after the provided duration", () => {
    vi.useFakeTimers();
    const element = document.createElement("box-toast") as Toast;

    document.body.append(element);
    element.show("Done", { duration: 100 });
    vi.advanceTimersByTime(100);

    expect(element.open).toBe(false);
  });

  it("auto-hides per a declarative duration when opened via the property", () => {
    vi.useFakeTimers();
    const element = document.createElement("box-toast") as Toast;
    element.message = "Copied";
    element.duration = 200;
    document.body.append(element);

    element.open = true;
    expect(element.open).toBe(true);
    vi.advanceTimersByTime(199);
    expect(element.open).toBe(true);
    vi.advanceTimersByTime(1);
    expect(element.open).toBe(false);
  });

  it("reveals the action slot only when content is assigned", () => {
    const element = document.createElement("box-toast") as Toast;
    element.message = "File deleted";
    document.body.append(element);

    const actionSlot = element.shadowRoot?.querySelector('slot[name="action"]') as HTMLSlotElement;
    expect(actionSlot.classList.contains("has-content")).toBe(false);

    const undo = document.createElement("button");
    undo.slot = "action";
    undo.textContent = "Undo";
    element.append(undo);
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(actionSlot.classList.contains("has-content")).toBe(true);
        resolve();
      }, 0);
    });
  });
});

describe("Toast structure", () => {
  beforeEach(() => {
    Toast.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  const shown = (configure: (element: Toast) => void = () => {}): Toast => {
    const element = document.createElement("box-toast") as Toast;
    document.body.append(element);
    element.message = "3 of 12 files could not be read";
    configure(element);
    element.open = true;
    return element;
  };

  const part = (element: Toast, name: string): HTMLElement | null =>
    element.shadowRoot!.querySelector(`[part="${name}"]`);

  it("states the tone in words, not only in colour and glyph", () => {
    // The glyph is aria-hidden and the fill is colour, so without this the tone
    // reaches a screen reader not at all.
    const element = shown(el => (el.tone = "error"));
    expect(part(element, "tone-label")?.textContent).toBe("Error");
    expect(part(element, "icon")?.getAttribute("aria-hidden")).toBe("true");

    element.tone = "inprogress";
    expect(part(element, "tone-label")?.textContent).toBe("In progress");
  });

  it("draws a distinct glyph per tone", () => {
    // Shape before colour: a reader who cannot separate green from amber still
    // gets a tick versus a triangle.
    const glyphs = new Set<string>();
    for (const tone of ["info", "success", "warning", "error"]) {
      const element = shown(el => (el.tone = tone));
      const svg = part(element, "icon")?.innerHTML ?? "";
      expect(svg).toContain("<svg");
      glyphs.add(svg);
      document.body.innerHTML = "";
    }
    expect(glyphs.size).toBe(4);
  });

  it("falls back to the info glyph for an unknown tone", () => {
    const unknown = shown(el => (el.tone = "banana"));
    const unknownSvg = part(unknown, "icon")?.innerHTML;
    document.body.innerHTML = "";
    const info = shown(el => (el.tone = "info"));
    expect(unknownSvg).toBe(part(info, "icon")?.innerHTML);
  });

  it("rewrites the glyph only when the tone actually changes", () => {
    // update() runs on every attribute write and this re-parses SVG markup.
    const element = shown(el => (el.tone = "success"));
    const icon = part(element, "icon")!;
    const first = icon.firstElementChild;

    element.message = "a different message";
    expect(icon.firstElementChild).toBe(first);

    element.tone = "error";
    expect(icon.firstElementChild).not.toBe(first);
  });

  it("shows a heading above the message when given one", () => {
    const element = shown(el => (el.heading = "Upload failed"));
    expect(part(element, "heading")?.textContent).toBe("Upload failed");
    expect(part(element, "message")?.textContent).toBe("3 of 12 files could not be read");
  });

  it("leaves the heading empty when none is set, so CSS can collapse it", () => {
    expect(part(shown(), "heading")?.textContent).toBe("");
  });

  it("gives the dismiss control an accessible name now that it is an icon", () => {
    // It lost its "Dismiss" text; without a name it would be an unlabelled button.
    expect(part(shown(), "dismiss")?.getAttribute("aria-label")).toBe("Dismiss");
    expect(part(shown(), "dismiss")?.querySelector("svg")).not.toBeNull();
  });

  it("keeps box-ui-elements' notification fill, border and shadow", () => {
    // The Salesforce-derived refinement is structural only: these four
    // declarations are pinned by the colour conformance manifest against
    // upstream Notification.scss, and drifting from them fails strict mode.
    const styles = shown().shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("border: 2px solid var(--boe-token-text-text, #222222)");
    expect(styles).toContain("background: var(--boe-token-surface-surface-secondary, #f4f4f4)");
    expect(styles).toContain("color: var(--boe-token-text-text, #222222)");
    expect(styles).toContain("box-shadow: 0 2px 6px rgb(0 0 0 / 15%)");
  });
});

describe("Toast mode", () => {
  beforeEach(() => {
    Toast.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("defaults to dismissible and falls back for an unknown mode", () => {
    const element = document.createElement("box-toast") as Toast;
    document.body.append(element);
    expect(element.mode).toBe("dismissible");
    element.setAttribute("mode", "pester");
    expect(element.mode).toBe("dismissible");
  });

  it("keeps a sticky toast open past its duration", () => {
    vi.useFakeTimers();
    const element = document.createElement("box-toast") as Toast;
    document.body.append(element);
    element.mode = "sticky";
    element.show("Still here", { duration: 100 });

    vi.advanceTimersByTime(5000);
    expect(element.open).toBe(true);

    // And it is still closable by hand — sticky must not mean trapped.
    (element.shadowRoot?.querySelector('[part="dismiss"]') as HTMLButtonElement).click();
    expect(element.open).toBe(false);
    vi.useRealTimers();
  });

  it("auto-dismisses when the mode goes back to dismissible", () => {
    vi.useFakeTimers();
    const element = document.createElement("box-toast") as Toast;
    document.body.append(element);
    element.mode = "sticky";
    element.show("Wait", { duration: 100 });
    vi.advanceTimersByTime(500);
    expect(element.open).toBe(true);

    element.mode = "dismissible";
    element.show("Now go", { duration: 100 });
    vi.advanceTimersByTime(100);
    expect(element.open).toBe(false);
    vi.useRealTimers();
  });
});
