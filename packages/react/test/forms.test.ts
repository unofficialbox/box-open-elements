// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { act, createElement, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";

import { BoxSelectElement } from "../../../src/components/forms/select.js";
import type { BoxTextFieldElement } from "../../../src/components/forms/text-field.js";
import { BoxSelect, type BoxSelectOption } from "../src/select.js";
import { BoxTextField } from "../src/text-field.js";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

describe("React form adapters", () => {
  let container: HTMLDivElement | undefined;
  let root: Root | undefined;

  const createHost = (): Root => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    return root;
  };

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    container?.remove();
    root = undefined;
    container = undefined;
    vi.restoreAllMocks();
  });

  it("syncs text-field properties and forwards the underlying element ref", () => {
    const host = createHost();
    const ref = createRef<BoxTextFieldElement>();

    act(() => {
      host.render(
        createElement(BoxTextField, {
          ref,
          label: "Project name",
          value: "Apollo",
          placeholder: "Enter a name",
          disabled: true,
          name: "projectName",
          invalid: true,
          errorMessage: "A name is required",
        }),
      );
    });

    const element = container?.querySelector("box-text-field") as BoxTextFieldElement | null;
    expect(ref.current).toBe(element);
    expect(element?.label).toBe("Project name");
    expect(element?.value).toBe("Apollo");
    expect(element?.placeholder).toBe("Enter a name");
    expect(element?.disabled).toBe(true);
    expect(element?.name).toBe("projectName");
    expect(element?.invalid).toBe(true);
    expect(element?.errorMessage).toBe("A name is required");

    act(() => host.unmount());
    root = undefined;
    expect(ref.current).toBeNull();
  });

  it("forwards value-changed to the latest handler without resubscribing", () => {
    const addEventListener = vi.spyOn(EventTarget.prototype, "addEventListener");
    const firstHandler = vi.fn();
    let latestCurrentTarget: EventTarget | null = null;
    const latestHandler = vi.fn((event: CustomEvent<{ value: string }>) => {
      latestCurrentTarget = event.currentTarget;
    });
    const host = createHost();

    act(() => {
      host.render(createElement(BoxTextField, { value: "First", onValueChanged: firstHandler }));
    });
    const subscriptionsAfterMount = addEventListener.mock.calls.filter(
      ([eventName]) => eventName === "value-changed",
    ).length;

    act(() => {
      host.render(createElement(BoxTextField, { value: "Second", onValueChanged: latestHandler }));
    });

    const element = container?.querySelector("box-text-field") as BoxTextFieldElement | null;
    const input = element?.shadowRoot?.querySelector("input");
    expect(element?.value).toBe("Second");
    expect(
      addEventListener.mock.calls.filter(([eventName]) => eventName === "value-changed"),
    ).toHaveLength(subscriptionsAfterMount);

    act(() => {
      if (input) {
        input.value = "Updated by user";
        input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      }
    });

    expect(firstHandler).not.toHaveBeenCalled();
    expect(latestHandler).toHaveBeenCalledTimes(1);
    expect(latestHandler.mock.calls[0]?.[0].detail).toEqual({ value: "Updated by user" });
    expect(latestCurrentTarget).toBe(element);
  });

  it("assigns structured select options once and updates them as properties", () => {
    const optionsSetter = vi.spyOn(BoxSelectElement.prototype, "options", "set");
    let selectCurrentTarget: EventTarget | null = null;
    const onValueChanged = vi.fn((event: CustomEvent<{ value: string }>) => {
      selectCurrentTarget = event.currentTarget;
    });
    const host = createHost();
    const initialOptions: BoxSelectOption[] = [
      { label: "Draft", value: "draft" },
      { label: "Published", value: "published" },
    ];

    act(() => {
      host.render(
        createElement(BoxSelect, {
          label: "Status",
          value: "draft",
          options: initialOptions,
          onValueChanged,
        }),
      );
    });

    const element = container?.querySelector("box-select") as BoxSelectElement | null;
    expect(optionsSetter).toHaveBeenCalledTimes(1);
    expect(element?.options).toEqual(initialOptions);
    expect(element?.shadowRoot?.querySelectorAll("option")).toHaveLength(2);

    const nextOptions: BoxSelectOption[] = [
      ...initialOptions,
      { label: "Archived", value: "archived" },
    ];
    act(() => {
      host.render(
        createElement(BoxSelect, {
          label: "Status",
          value: "archived",
          options: nextOptions,
          onValueChanged,
        }),
      );
    });

    expect(optionsSetter).toHaveBeenCalledTimes(2);
    expect(element?.options).toEqual(nextOptions);
    expect(element?.value).toBe("archived");

    const select = element?.shadowRoot?.querySelector("select");
    act(() => {
      if (select) {
        select.value = "published";
        select.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
      }
    });

    expect(onValueChanged).toHaveBeenCalledTimes(1);
    expect(onValueChanged.mock.calls[0]?.[0].detail).toEqual({ value: "published" });
    expect(selectCurrentTarget).toBe(element);
  });
});
