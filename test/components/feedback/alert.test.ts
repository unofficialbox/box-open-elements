// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Alert } from "../../../src/components/feedback/alert.js";

describe("Alert", () => {
  beforeEach(() => {
    Alert.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders title and message", () => {
    const element = document.createElement("box-alert") as Alert;
    element.heading = "Heads up";
    element.message = "Your session will expire soon.";
    element.tone = "warning";

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Heads up");
    expect(element.shadowRoot?.querySelector('[part="title"]')?.textContent).toContain("Heads up");
    expect(element.shadowRoot?.textContent).toContain("Your session will expire soon.");
  });

  it("dismisses and emits an event", () => {
    const element = document.createElement("box-alert") as Alert;
    const dismissed = vi.fn();
    const openChanged = vi.fn();
    element.heading = "Saved";
    element.message = "Settings updated.";
    element.addEventListener("dismiss", dismissed);
    element.addEventListener("open-changed", openChanged);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="dismiss"]') as HTMLButtonElement | null;
    button?.click();

    expect(dismissed).toHaveBeenCalled();
    expect(openChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { open: false },
      }),
    );
    expect(element.open).toBe(false);
  });

  it("supports description as a compatible alias for message", () => {
    const element = document.createElement("box-alert") as Alert;
    element.heading = "Heads up";
    element.description = "Storage is almost full.";

    document.body.append(element);

    expect(element.message).toBe("Storage is almost full.");
    expect(element.shadowRoot?.querySelector('[part~="description"]')?.textContent).toContain("almost full");
  });

  it("exposes accessible alert and dismiss labels", () => {
    const element = document.createElement("box-alert") as Alert;
    element.heading = "Heads up";
    element.message = "Storage is almost full.";

    document.body.append(element);

    const alert = element.shadowRoot?.querySelector('[part="alert"]') as HTMLElement | null;
    const dismiss = element.shadowRoot?.querySelector('[part="dismiss"]') as HTMLButtonElement | null;
    const title = element.shadowRoot?.querySelector("#alert-title") as HTMLElement | null;
    expect(alert?.getAttribute("aria-labelledby")).toBe("alert-title");
    expect(alert?.hasAttribute("aria-label")).toBe(false);
    expect(title).not.toBeNull();
    expect(dismiss?.getAttribute("aria-label")).toBe("Dismiss alert");
  });

  it("names heading-less alerts with tone and message", () => {
    const element = document.createElement("box-alert") as Alert;
    element.message = "Storage is almost full.";
    element.tone = "warning";

    document.body.append(element);

    const alert = element.shadowRoot?.querySelector('[part="alert"]') as HTMLElement | null;
    expect(alert?.hasAttribute("aria-labelledby")).toBe(false);
    expect(alert?.getAttribute("aria-label")).toBe("Warning: Storage is almost full.");
  });

  it("announces tone with visually hidden text", () => {
    const element = document.createElement("box-alert") as Alert;
    element.heading = "Heads up";
    element.message = "Storage is almost full.";
    element.tone = "warning";

    document.body.append(element);

    const toneLabel = element.shadowRoot?.querySelector('[part="tone-label"]') as HTMLElement | null;
    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(toneLabel?.textContent).toBe("Warning");
    expect(toneLabel?.classList.contains("sr-only")).toBe(true);
    expect(styles).toContain(".sr-only");
  });

  it("uses BUE inline-alert shell styles", () => {
    const element = document.createElement("box-alert") as Alert;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("padding: 14px 10px;");
    expect(styles).toContain("border-radius: var(--boe-profile-radius-large, 16px);");
    expect(styles).toContain("margin: var(--boe-profile-space-3, 12px) 0;");
  });

  it("renders rich slotted content and stays visible on rich-only alerts", () => {
    const element = document.createElement("box-alert") as Alert;
    element.setAttribute("open", "");
    // No heading/message — only rich children.
    const link = document.createElement("a");
    link.href = "#";
    link.textContent = "View details";
    element.append(link);
    document.body.append(element);

    const richSlot = element.shadowRoot?.querySelector('slot[part="rich"]') as HTMLSlotElement;
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(richSlot.classList.contains("has-content")).toBe(true);
        expect(richSlot.assignedElements()[0]).toBe(link);
        // Rich-only alert is still shown.
        expect(element.hidden).toBe(false);
        resolve();
      }, 0);
    });
  });

  it("includes focus-visible and interactive styles for dismiss", () => {
    const element = document.createElement("box-alert") as Alert;
    element.heading = "Heads up";
    element.message = "Storage is almost full.";
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part="dismiss"]:focus-visible');
    expect(styles).toContain('[part="dismiss"]:hover:not(:disabled)');
    expect(styles).toContain('[part="dismiss"]:active:not(:disabled)');
    expect(styles).toContain('[part="dismiss"]:disabled');
    expect(styles).toContain("--boe-token-surface-surface-hover");
  });
});

describe("Alert tone glyph", () => {
  beforeEach(() => {
    Alert.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  const mount = (tone?: string): Alert => {
    const element = document.createElement("box-alert") as Alert;
    element.message = "Shared links expire in 30 days.";
    if (tone) {
      element.setAttribute("tone", tone);
    }
    document.body.append(element);
    return element;
  };

  it("carries a glyph, because a 10% tint is a weak signal on its own", () => {
    // Removing the border in 0.12.0 left alert's tone resting on the tint plus
    // the visually-hidden label. The glyph is what puts the signal back.
    const icon = mount("success").shadowRoot?.querySelector('[part="icon"]');

    expect(icon?.querySelector("svg")).not.toBeNull();
  });

  it("hides the glyph from assistive technology", () => {
    // The tone is already spoken by [part="tone-label"]; announcing it twice
    // would be worse than not announcing it at all.
    expect(
      mount("error").shadowRoot?.querySelector('[part="icon"]')?.getAttribute("aria-hidden"),
    ).toBe("true");
  });

  it("draws a different shape per tone, not just a different colour", () => {
    // A reader who cannot separate green from amber still has to be able to
    // tell a success from a warning.
    const shapeOf = (tone: string): string =>
      mount(tone).shadowRoot?.querySelector('[part="icon"]')?.innerHTML ?? "";

    const shapes = ["success", "error", "warning", "info"].map(shapeOf);
    expect(new Set(shapes).size).toBe(4);
  });

  it("falls back to the info mark for an unknown tone", () => {
    expect(mount("banana").shadowRoot?.querySelector('[part="icon"]')?.innerHTML).toBe(
      mount("info").shadowRoot?.querySelector('[part="icon"]')?.innerHTML,
    );
  });

  it("colours the glyph from the accent, leaving the pinned fills alone", () => {
    // The tinted backgrounds are conformance-pinned against upstream; the
    // accent is ours, because upstream has no glyph to match.
    const styles = mount().shadowRoot?.querySelector("style")?.textContent ?? "";

    expect(styles).toContain("color: var(--alert-accent)");
    expect(styles).toContain("--alert-accent: var(--boe-token-surface-status-surface-success, #26c281)");
    expect(styles).toContain("background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 10%, #fff)");
  });

  it("repaints the glyph only when the tone actually changes", () => {
    const element = mount("info");
    const icon = element.shadowRoot?.querySelector('[part="icon"]') as HTMLElement;
    const before = icon.firstElementChild;

    element.message = "A different message entirely.";
    expect(icon.firstElementChild).toBe(before);

    element.setAttribute("tone", "error");
    expect(icon.firstElementChild).not.toBe(before);
  });
});

