// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxSidebarToggleButtonElement,
  defineBoxSidebarToggleButtonElement,
} from "../../../src/components/layout/sidebar-toggle-button.js";

describe("BoxSidebarToggleButtonElement", () => {
  beforeEach(() => {
    defineBoxSidebarToggleButtonElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders an expanded button with a default accessible label", () => {
    const element = document.createElement("box-sidebar-toggle-button") as BoxSidebarToggleButtonElement;
    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="button"]');
    expect(button?.getAttribute("aria-label")).toBe("Toggle sidebar");
    expect(button?.getAttribute("aria-expanded")).toBe("true");
    expect(element.expanded).toBe(true);
  });

  it("wires controls onto aria-controls for the region it operates", () => {
    const element = document.createElement("box-sidebar-toggle-button") as BoxSidebarToggleButtonElement;
    element.controls = "primary-sidebar";
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="button"]')?.getAttribute("aria-controls")).toBe(
      "primary-sidebar",
    );
  });

  it("toggles expanded state and emits a toggle event on click", () => {
    const element = document.createElement("box-sidebar-toggle-button") as BoxSidebarToggleButtonElement;
    document.body.append(element);

    const onToggle = vi.fn();
    element.addEventListener("toggle", onToggle);

    const button = element.shadowRoot?.querySelector('[part="button"]') as HTMLButtonElement;
    button.click();

    expect(element.expanded).toBe(false);
    expect(element.shadowRoot?.querySelector('[part="button"]')?.getAttribute("aria-expanded")).toBe("false");
    expect(onToggle).toHaveBeenCalledWith(expect.objectContaining({ detail: { expanded: false } }));

    // A second activation returns to expanded.
    (element.shadowRoot?.querySelector('[part="button"]') as HTMLButtonElement).click();
    expect(element.expanded).toBe(true);
    expect(onToggle).toHaveBeenLastCalledWith(expect.objectContaining({ detail: { expanded: true } }));
  });

  it("does not toggle or emit while disabled", () => {
    const element = document.createElement("box-sidebar-toggle-button") as BoxSidebarToggleButtonElement;
    element.disabled = true;
    document.body.append(element);

    const onToggle = vi.fn();
    element.addEventListener("toggle", onToggle);

    const button = element.shadowRoot?.querySelector('[part="button"]') as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    element.toggle();
    expect(element.expanded).toBe(true);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("restores focus to the button after an attribute-driven re-render", () => {
    const element = document.createElement("box-sidebar-toggle-button") as BoxSidebarToggleButtonElement;
    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="button"]') as HTMLButtonElement;
    button.focus();
    expect(element.shadowRoot?.activeElement?.getAttribute("part")).toBe("button");

    // Changing an unrelated observed attribute forces a full re-render.
    element.label = "Collapse navigation";
    expect(element.shadowRoot?.activeElement?.getAttribute("part")).toBe("button");
  });

  it("reflects direction and an action-aware tooltip title", () => {
    const element = document.createElement("box-sidebar-toggle-button") as BoxSidebarToggleButtonElement;
    document.body.append(element);
    const button = element.shadowRoot?.querySelector('[part="button"]') as HTMLButtonElement;

    // Expanded by default → tooltip offers to collapse.
    expect(button.dataset.direction).toBe("left");
    expect(button.title).toBe("Collapse sidebar");

    element.expanded = false;
    expect(button.title).toBe("Expand sidebar");

    element.direction = "right";
    expect(button.dataset.direction).toBe("right");
  });
});
