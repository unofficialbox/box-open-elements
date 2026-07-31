// @vitest-environment jsdom

import { createApp, createSSRApp, effectScope, h, nextTick, ref } from "vue";
import { renderToString } from "@vue/server-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExplorerSelectionController } from "@unofficialbox/box-open-elements/patterns/content-explorer/selection";
import { Button } from "../src/button.js";
import { Dialog } from "../src/dialog.js";
import { useExplorerSelectionController } from "../src/explorer-selection.js";
import { Select } from "../src/select.js";
import { TextField } from "../src/text-field.js";

describe("Vue adapter", () => {
  const containers: HTMLElement[] = [];

  afterEach(() => {
    for (const container of containers.splice(0)) container.remove();
  });

  it("syncs properties and routes custom events", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    containers.push(container);
    const options = [{ label: "Draft", value: "draft" }];
    const onValueChanged = vi.fn();
    const onOpenChanged = vi.fn();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const onClick = vi.fn();
    const selectAdapter = ref<{ element?: HTMLElement }>();
    const app = createApp({
      render: () => h("div", null, [
        h(Button, { label: "Save", tone: "primary", size: "large", disabled: true, onClick }),
        h(Select, {
          ref: selectAdapter,
          label: "Status",
          options,
          value: "draft",
          name: "status",
          errorMessage: "Choose",
          disabled: true,
          invalid: true,
        }),
        h(TextField, {
          label: "Project",
          value: "Apollo",
          placeholder: "Name",
          name: "project",
          errorMessage: "Required",
          disabled: true,
          invalid: true,
          onValueChanged,
        }),
        h(Dialog, {
          open: true,
          heading: "Confirm",
          description: "Continue?",
          confirmLabel: "Continue",
          size: "large",
          onOpenChanged,
          onConfirm,
          onCancel,
        }),
      ]),
    });
    app.mount(container);
    await nextTick();

    const select = container.querySelector("box-select") as HTMLElement & {
      options: typeof options;
    };
    expect(select.options).toEqual(options);
    expect(selectAdapter.value?.element).toBe(select);
    expect(select.getAttribute("label")).toBe("Status");
    expect(select.hasAttribute("disabled")).toBe(true);
    const field = container.querySelector("box-text-field") as HTMLElement & {
      value: string;
      invalid: boolean;
    };
    expect(field.value).toBe("Apollo");
    expect(field.invalid).toBe(true);
    container.querySelector<HTMLElement>("box-button")!.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    const event = new CustomEvent("value-changed", {
      detail: { value: "Voyager" },
      bubbles: true,
      composed: true,
    });
    field.dispatchEvent(event);
    expect(onValueChanged).toHaveBeenCalledWith(event);
    const dialog = container.querySelector("box-dialog")!;
    const openEvent = new CustomEvent("open-changed", {
      detail: { open: false },
      bubbles: true,
      composed: true,
    });
    dialog.dispatchEvent(openEvent);
    expect(onOpenChanged).toHaveBeenCalledWith(openEvent);
    dialog.dispatchEvent(new CustomEvent("confirm", { detail: null }));
    dialog.dispatchEvent(new CustomEvent("cancel", { detail: null }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
    app.unmount();
    const openChangedCallsAfterUnmount = onOpenChanged.mock.calls.length;
    field.dispatchEvent(event);
    dialog.dispatchEvent(openEvent);
    expect(onValueChanged).toHaveBeenCalledTimes(1);
    expect(onOpenChanged).toHaveBeenCalledTimes(openChangedCallsAfterUnmount);
  });

  it("subscribes inside a Vue effect scope", () => {
    const controller = new ExplorerSelectionController();
    controller.setItems([{ id: "alpha" }]);
    const scope = effectScope();
    const selection = scope.run(() => useExplorerSelectionController(controller))!;
    controller.toggleSelection("alpha");
    expect(selection.value.selectedItemIds).toEqual(["alpha"]);
    scope.stop();
    controller.clearSelection();
    expect(selection.value.selectedItemIds).toEqual(["alpha"]);
  });

  it("mounts every wrapper with default optional properties", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    containers.push(container);
    const app = createApp({
      render: () => h("div", null, [
        h(Button),
        h(TextField),
        h(Select),
        h(Dialog),
      ]),
    });
    app.mount(container);
    await nextTick();
    expect(container.querySelector("box-button")).not.toBeNull();
    expect(container.querySelector("box-dialog")).not.toBeNull();
    app.unmount();
  });

  it("server-renders an inert custom-element host", async () => {
    const html = await renderToString(
      createSSRApp({ render: () => h(Button, { label: "Save" }) }),
    );
    expect(html).toContain("<box-button");
  });
});
