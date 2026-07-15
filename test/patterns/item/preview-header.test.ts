// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxPreviewHeaderElement,
  defineBoxPreviewHeaderElement,
} from "../../../src/patterns/item/preview-header.js";

describe("BoxPreviewHeaderElement", () => {
  beforeEach(() => {
    defineBoxPreviewHeaderElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders heading, status, and breadcrumbs", () => {
    const element = document.createElement("box-preview-header") as BoxPreviewHeaderElement;
    element.heading = "Brand Strategy.pdf";
    element.status = "Ready";
    element.breadcrumbs = [
      { id: "0", label: "All Files" },
      { id: "marketing", label: "Marketing" },
    ];

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Brand Strategy.pdf");
    expect(element.shadowRoot?.textContent).toContain("Ready");
    expect(element.shadowRoot?.textContent).toContain("Marketing");
  });

  it("emits action", () => {
    const element = document.createElement("box-preview-header") as BoxPreviewHeaderElement;
    const action = vi.fn();
    element.heading = "Brand Strategy.pdf";
    element.actions = [{ id: "share", label: "Share" }];
    element.addEventListener("action", action);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[data-action-id="share"]') as HTMLButtonElement | null;
    button?.click();

    expect(action).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { action: "share" },
      }),
    );
  });

  it("emits breadcrumb-selected", () => {
    const element = document.createElement("box-preview-header") as BoxPreviewHeaderElement;
    const selected = vi.fn();
    element.heading = "Brand Strategy.pdf";
    element.breadcrumbs = [
      { id: "0", label: "All Files" },
      { id: "marketing", label: "Marketing" },
    ];
    element.addEventListener("breadcrumb-selected", selected);

    document.body.append(element);

    const crumb = element.shadowRoot?.querySelector('[data-crumb-id="marketing"]') as HTMLButtonElement | null;
    crumb?.click();

    expect(selected).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { id: "marketing" },
      }),
    );
  });

  it("preserves action focus across unrelated attribute updates", () => {
    const element = document.createElement("box-preview-header") as BoxPreviewHeaderElement;
    element.heading = "Brand Strategy.pdf";
    element.actions = [{ id: "share", label: "Share" }];
    element.breadcrumbs = [
      { id: "0", label: "All Files" },
      { id: "marketing", label: "Marketing" },
    ];
    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[data-action-id="share"]') as HTMLButtonElement;
    button.focus();

    element.heading = "Updated Title.pdf";
    element.status = "Ready";
    element.message = "Preview refreshed";

    expect(element.shadowRoot?.activeElement).toBe(button);
    expect(element.shadowRoot?.querySelector('[data-action-id="share"]')).toBe(button);
    expect(element.shadowRoot?.textContent).toContain("Updated Title.pdf");
  });

  it("preserves action focus when only tone changes", () => {
    const element = document.createElement("box-preview-header") as BoxPreviewHeaderElement;
    element.heading = "Brand Strategy.pdf";
    element.actions = [{ id: "share", label: "Share", tone: "neutral" }];
    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[data-action-id="share"]') as HTMLButtonElement;
    button.focus();

    element.actions = [{ id: "share", label: "Share", tone: "primary" }];

    expect(element.shadowRoot?.activeElement).toBe(button);
    expect(element.shadowRoot?.querySelector('[data-action-id="share"]')).toBe(button);
    expect(button.dataset.tone).toBe("primary");
  });
});
