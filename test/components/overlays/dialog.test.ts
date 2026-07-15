// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxDialogElement, defineBoxDialogElement } from "../../../src/components/overlays/dialog.js";

describe("BoxDialogElement", () => {
  beforeEach(() => {
    defineBoxDialogElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("opens and closes through the public API", () => {
    const element = document.createElement("box-dialog") as BoxDialogElement;

    document.body.append(element);
    element.show();

    expect(element.open).toBe(true);
    expect(element.shadowRoot?.textContent).toContain("Dialog");

    element.close();

    expect(element.open).toBe(false);
    expect(element.shadowRoot?.textContent ?? "").toBe("");
  });

  it("focuses the dialog surface when it opens", async () => {
    const element = document.createElement("box-dialog") as BoxDialogElement;
    document.body.append(element);
    element.show();
    await Promise.resolve();

    const dialog = element.shadowRoot?.querySelector('[part="dialog"]') as HTMLElement | null;
    expect(dialog?.getAttribute("tabindex")).toBe("-1");
    expect(element.shadowRoot?.activeElement).toBe(dialog);
  });

  it("emits confirm and closes", () => {
    const element = document.createElement("box-dialog") as BoxDialogElement;
    const confirmed = vi.fn();
    element.heading = "Delete item";
    element.confirmLabel = "Delete";
    element.description = "This cannot be undone.";
    element.addEventListener("confirm", confirmed);

    document.body.append(element);
    element.show();

    expect(element.shadowRoot?.textContent).toContain("Delete item");

    const confirmButton = element.shadowRoot?.querySelector('[part="confirm"]') as HTMLButtonElement | null;
    confirmButton?.click();

    expect(confirmed).toHaveBeenCalled();
    expect(element.open).toBe(false);
  });

  it("closes on Escape and emits cancel", () => {
    const element = document.createElement("box-dialog") as BoxDialogElement;
    const cancelled = vi.fn();
    element.addEventListener("cancel", cancelled);

    document.body.append(element);
    element.show();

    const dialog = element.shadowRoot?.querySelector('[part="dialog"]') as HTMLElement | null;
    dialog?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(cancelled).toHaveBeenCalled();
    expect(element.open).toBe(false);
  });
});
