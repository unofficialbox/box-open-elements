// @vitest-environment jsdom

import { DestroyRef, ElementRef } from "@angular/core";
import { describe, expect, it, vi } from "vitest";
import { ExplorerSelectionController } from "@unofficialbox/box-open-elements/patterns/content-explorer/selection";
import { Button } from "../src/button.js";
import { Dialog } from "../src/dialog.js";
import { createExplorerSelectionSignal } from "../src/explorer-selection.js";
import { Select } from "../src/select.js";
import { TextField } from "../src/text-field.js";

describe("Angular adapter", () => {
  it("syncs primitive and structured inputs onto custom-element properties", () => {
    const buttonElement = document.createElement("box-button");
    const button = new Button(new ElementRef(buttonElement as never));
    button.label = undefined;
    button.tone = undefined;
    button.size = undefined;
    button.label = "Save";
    button.tone = "primary";
    button.size = "large";
    button.disabled = true;
    expect(button.element.label).toBe("Save");
    expect(button.element.tone).toBe("primary");
    expect(button.element.size).toBe("large");
    expect(button.element.disabled).toBe(true);

    const selectElement = document.createElement("box-select");
    const select = new Select(new ElementRef(selectElement as never));
    const options = [{ label: "Draft", value: "draft" }];
    select.label = undefined;
    select.value = undefined;
    select.options = undefined;
    select.name = undefined;
    select.errorMessage = undefined;
    select.label = "Status";
    select.value = "draft";
    select.options = options;
    select.name = "status";
    select.errorMessage = "Choose a status";
    select.disabled = true;
    select.invalid = true;
    expect(select.element.options).toEqual(options);
    expect(select.element.label).toBe("Status");
    expect(select.element.value).toBe("draft");
    expect(select.element.name).toBe("status");
    expect(select.element.errorMessage).toBe("Choose a status");
    expect(select.element.disabled).toBe(true);
    expect(select.element.invalid).toBe(true);
    const selectChanged = vi.fn();
    select.valueChanged.subscribe(selectChanged);
    selectElement.dispatchEvent(
      new CustomEvent("value-changed", { detail: { value: "draft" } }),
    );
    expect(selectChanged).toHaveBeenCalledTimes(1);
    select.ngOnDestroy();
    selectElement.dispatchEvent(
      new CustomEvent("value-changed", { detail: { value: "draft" } }),
    );
    expect(selectChanged).toHaveBeenCalledTimes(1);
  });

  it("emits typed custom events through Angular outputs", () => {
    const fieldElement = document.createElement("box-text-field");
    const field = new TextField(new ElementRef(fieldElement as never));
    field.label = undefined;
    field.value = undefined;
    field.placeholder = undefined;
    field.name = undefined;
    field.errorMessage = undefined;
    field.label = "Project";
    field.value = "Apollo";
    field.placeholder = "Name";
    field.name = "project";
    field.errorMessage = "Required";
    field.disabled = true;
    field.invalid = true;
    expect(field.element.label).toBe("Project");
    expect(field.element.value).toBe("Apollo");
    expect(field.element.placeholder).toBe("Name");
    expect(field.element.name).toBe("project");
    expect(field.element.errorMessage).toBe("Required");
    expect(field.element.disabled).toBe(true);
    expect(field.element.invalid).toBe(true);
    const handler = vi.fn();
    field.valueChanged.subscribe(handler);
    const event = new CustomEvent("value-changed", { detail: { value: "Apollo" } });
    fieldElement.dispatchEvent(event);
    expect(handler).toHaveBeenCalledWith(event);
    field.ngOnDestroy();
    fieldElement.dispatchEvent(event);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("syncs dialog inputs, emits overlay events, and tears down", () => {
    const dialogElement = document.createElement("box-dialog");
    const dialog = new Dialog(new ElementRef(dialogElement as never));
    dialog.heading = undefined;
    dialog.description = undefined;
    dialog.confirmLabel = undefined;
    dialog.size = undefined;
    dialog.heading = "Confirm";
    dialog.description = "Continue?";
    dialog.confirmLabel = "Continue";
    dialog.size = "large";
    dialog.open = true;
    expect(dialog.element.heading).toBe("Confirm");
    expect(dialog.element.description).toBe("Continue?");
    expect(dialog.element.confirmLabel).toBe("Continue");
    expect(dialog.element.size).toBe("large");
    expect(dialog.element.open).toBe(true);

    const openChanged = vi.fn();
    const confirm = vi.fn();
    const cancel = vi.fn();
    dialog.openChanged.subscribe(openChanged);
    dialog.confirm.subscribe(confirm);
    dialog.cancel.subscribe(cancel);
    dialogElement.dispatchEvent(new CustomEvent("open-changed", { detail: { open: false } }));
    dialogElement.dispatchEvent(new CustomEvent("confirm", { detail: null }));
    dialogElement.dispatchEvent(new CustomEvent("cancel", { detail: null }));
    expect(openChanged).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);

    dialog.ngOnDestroy();
    dialogElement.dispatchEvent(new CustomEvent("confirm", { detail: null }));
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it("maps controller updates to a signal and disposes the subscription", () => {
    const controller = new ExplorerSelectionController();
    controller.setItems([{ id: "alpha" }]);
    let destroy = () => undefined;
    const destroyRef = {
      onDestroy(callback: () => void) {
        destroy = callback;
        return () => undefined;
      },
      destroyed: false,
    } as DestroyRef;
    const selection = createExplorerSelectionSignal(controller, destroyRef);
    controller.toggleSelection("alpha");
    expect(selection().selectedItemIds).toEqual(["alpha"]);
    destroy();
    controller.clearSelection();
    expect(selection().selectedItemIds).toEqual(["alpha"]);
  });
});
