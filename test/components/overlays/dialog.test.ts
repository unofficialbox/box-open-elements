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

  it("restores focus to the previously focused element on close", async () => {
    const opener = document.createElement("button");
    opener.textContent = "Open";
    document.body.append(opener);
    opener.focus();

    const element = document.createElement("box-dialog") as BoxDialogElement;
    document.body.append(element);
    element.show();
    await Promise.resolve();

    element.close();
    await Promise.resolve();
    await Promise.resolve();

    expect(document.activeElement).toBe(opener);
  });

  it("traps Tab focus inside the dialog", () => {
    const element = document.createElement("box-dialog") as BoxDialogElement;
    document.body.append(element);
    element.show();

    const dialog = element.shadowRoot?.querySelector('[part="dialog"]') as HTMLElement;
    const cancel = element.shadowRoot?.querySelector('[part="cancel"]') as HTMLButtonElement;
    const confirm = element.shadowRoot?.querySelector('[part="confirm"]') as HTMLButtonElement;
    confirm.focus();

    const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    const prevent = vi.spyOn(tab, "preventDefault");
    dialog.dispatchEvent(tab);

    expect(prevent).toHaveBeenCalled();
    expect(element.shadowRoot?.activeElement).toBe(cancel);
  });

  it("uses BUE modal dialog shell styles", () => {
    const element = document.createElement("box-dialog") as BoxDialogElement;
    document.body.append(element);
    element.show();

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("padding: 30px;");
    expect(styles).toContain("border-radius: 12px;");
    expect(styles).toContain("width: min(460px, calc(100vw - 3rem))");
    expect(styles).toContain("background: rgba(0, 0, 0, 0.75)");
    expect(styles).toContain("font-size: 16px;");
    expect(styles).toContain("min-height: 40px;");
    expect(styles).toContain("border-radius: 6px;");
  });

  it("includes focus-visible and hover styles for cancel and confirm", () => {
    const element = document.createElement("box-dialog") as BoxDialogElement;
    document.body.append(element);
    element.show();

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part="cancel"]:focus-visible');
    expect(styles).toContain('[part="cancel"]:hover:not(:disabled)');
    expect(styles).toContain('[part="confirm"]:focus-visible');
    expect(styles).toContain('[part="confirm"]:hover:not(:disabled)');
  });
});
