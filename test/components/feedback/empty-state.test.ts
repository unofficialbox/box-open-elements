// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxEmptyStateElement,
  defineBoxEmptyStateElement,
} from "../../../src/components/feedback/empty-state.js";

describe("BoxEmptyStateElement", () => {
  beforeEach(() => {
    defineBoxEmptyStateElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders title and message", () => {
    const element = document.createElement("box-empty-state") as BoxEmptyStateElement;
    element.heading = "No files yet";
    element.message = "Upload a file to get started.";

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("No files yet");
    expect(element.shadowRoot?.querySelector('[part="title"]')?.textContent).toContain("No files yet");
    expect(element.shadowRoot?.textContent).toContain("Upload a file to get started.");
  });

  it("emits an action event when the action button is clicked", () => {
    const element = document.createElement("box-empty-state") as BoxEmptyStateElement;
    const action = vi.fn();
    element.actionLabel = "Upload file";
    element.addEventListener("action", action);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="action"]') as HTMLButtonElement | null;
    button?.click();

    expect(action).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { action: "primary", label: "Upload file" },
      }),
    );
  });

  it("supports description as a compatible alias for message", () => {
    const element = document.createElement("box-empty-state") as BoxEmptyStateElement;
    element.description = "Use filters or create a new item to get started.";

    document.body.append(element);

    expect(element.message).toBe("Use filters or create a new item to get started.");
    expect(element.shadowRoot?.querySelector('[part~="description"]')?.textContent).toContain("get started");
  });

  it("uses compact empty-state shell styles", () => {
    const element = document.createElement("box-empty-state") as BoxEmptyStateElement;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("padding: 0.75rem;");
    expect(styles).toContain("border-radius: 0.7rem;");
    expect(styles).toContain("padding: 0.45rem 0.75rem;");
  });
});
