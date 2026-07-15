// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxNudgeElement, defineBoxNudgeElement } from "../../../src/components/feedback/nudge.js";

describe("BoxNudgeElement", () => {
  beforeEach(() => {
    defineBoxNudgeElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a heading and message as a polite status", () => {
    const element = document.createElement("box-nudge") as BoxNudgeElement;
    element.heading = "Try grid view";
    element.message = "See files as thumbnails.";
    document.body.append(element);

    const nudge = element.shadowRoot?.querySelector('[part="nudge"]');
    expect(nudge?.getAttribute("role")).toBe("status");
    expect(element.shadowRoot?.querySelector('[part~="title"]')?.textContent).toContain("Try grid view");
    expect(element.shadowRoot?.querySelector('[part="message"]')?.textContent).toContain("See files as thumbnails.");
  });

  it("omits the action button until an action label is set", () => {
    const element = document.createElement("box-nudge") as BoxNudgeElement;
    element.heading = "Tip";
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part~="title"]')?.textContent).toContain("Tip");
    expect(element.shadowRoot?.querySelector('[part="action"]')).toBeNull();

    element.actionLabel = "Show me";
    expect(element.shadowRoot?.querySelector('[part="action"]')?.textContent).toContain("Show me");
  });

  it("emits an action event when the action is activated", () => {
    const element = document.createElement("box-nudge") as BoxNudgeElement;
    element.heading = "Tip";
    element.actionLabel = "Show me";
    document.body.append(element);

    const onAction = vi.fn();
    element.addEventListener("action", onAction);
    (element.shadowRoot?.querySelector('[part="action"]') as HTMLButtonElement).click();

    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ detail: { label: "Show me" } }));
  });

  it("dismisses on the close button, emitting dismiss and clearing the content", () => {
    const element = document.createElement("box-nudge") as BoxNudgeElement;
    element.heading = "Tip";
    document.body.append(element);

    const onDismiss = vi.fn();
    element.addEventListener("dismiss", onDismiss);
    (element.shadowRoot?.querySelector('[part="dismiss"]') as HTMLButtonElement).click();

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(element.open).toBe(false);
    expect(element.shadowRoot?.querySelector('[part="nudge"]')).toBeNull();
  });
});
