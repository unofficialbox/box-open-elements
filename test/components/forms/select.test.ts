// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Select } from "../../../src/components/forms/select.js";
import { getMirroredFormValue } from "../../../src/core/index.js";

describe("Select", () => {
  beforeEach(() => {
    Select.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders options and emits value changes", () => {
    const element = document.createElement("box-select") as Select;
    const changed = vi.fn();
    element.label = "View";
    element.options = [
      { label: "List", value: "list" },
      { label: "Table", value: "table" },
    ];
    element.value = "list";
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const select = element.shadowRoot?.querySelector('[part="select"]') as HTMLSelectElement | null;
    select!.value = "table";
    select?.dispatchEvent(new Event("change", { bubbles: true }));

    expect(element.value).toBe("table");
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "table" },
      }),
    );
  });

  it("uses BUE select control geometry", () => {
    const element = document.createElement("box-select") as Select;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("gap: var(--boe-profile-space-2, 8px)");
    expect(styles).toContain("min-height: var(--boe-profile-select-height, 34px)");
    expect(styles).toContain("padding: 5px 25px 5px 10px");
    expect(styles).toContain("border-radius: var(--boe-profile-radius-control, 20px)");
  });

  it("forwards disabled state to the select", () => {
    const element = document.createElement("box-select") as Select;
    element.disabled = true;

    document.body.append(element);

    const select = element.shadowRoot?.querySelector('[part="select"]') as HTMLSelectElement | null;

    expect(select?.disabled).toBe(true);
  });

  it("groups options carrying a group into optgroups and disables options", () => {
    const element = document.createElement("box-select") as Select;
    element.options = [
      { label: "Recent", value: "recent" },
      { label: "Name", value: "name", group: "Sort by" },
      { label: "Size", value: "size", group: "Sort by", disabled: true },
    ];
    document.body.append(element);

    const select = element.shadowRoot?.querySelector('[part="select"]') as HTMLSelectElement;
    const optgroup = select.querySelector("optgroup");
    expect(optgroup?.label).toBe("Sort by");
    expect(optgroup?.querySelectorAll("option").length).toBe(2);
    // Ungrouped option stays at the top level (direct child of the select).
    const topLevelOption = Array.from(select.children).find(child => child.tagName === "OPTION");
    expect(topLevelOption?.getAttribute("value")).toBe("recent");
    // Disabled option is inert.
    expect((select.querySelector('option[value="size"]') as HTMLOptionElement).disabled).toBe(true);
  });

  it("supports multiple selection with array values and form mirroring", () => {
    const form = document.createElement("form");
    const element = document.createElement("box-select") as Select;
    element.setAttribute("name", "views");
    element.multiple = true;
    element.options = [
      { label: "List", value: "list" },
      { label: "Table", value: "table" },
      { label: "Grid", value: "grid" },
    ];
    form.append(element);
    document.body.append(form);

    const select = element.shadowRoot?.querySelector('[part="select"]') as HTMLSelectElement;
    expect(select.multiple).toBe(true);

    // Simulate selecting two options in the native list box.
    (select.querySelector('option[value="list"]') as HTMLOptionElement).selected = true;
    (select.querySelector('option[value="grid"]') as HTMLOptionElement).selected = true;
    select.dispatchEvent(new Event("change", { bubbles: true }));

    expect(element.values).toEqual(["list", "grid"]);

    const mirrored = getMirroredFormValue((element as unknown as { internals: ElementInternals }).internals);
    const names = mirrored instanceof FormData ? mirrored.getAll("views") : [];
    expect(names).toEqual(["list", "grid"]);
  });
});

describe("Select loading/empty states (dispatch intake round 3)", () => {
  beforeEach(() => {
    Select.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  const OPTIONS = JSON.stringify([
    { label: "Legal", value: "legal" },
    { label: "Sales", value: "sales" },
  ]);

  const selectOf = (element: Select): HTMLSelectElement =>
    element.shadowRoot?.querySelector('[part="select"]') as HTMLSelectElement;

  it("states loading in words and shows the spinner while options load", () => {
    const element = document.createElement("box-select") as Select;
    element.setAttribute("loading", "");
    document.body.append(element);

    expect(selectOf(element).textContent).toContain("Loading options…");
    expect(selectOf(element).options[0]?.disabled).toBe(true);
    expect(
      element.shadowRoot?.querySelector('[part="control"]')?.getAttribute("data-status"),
    ).toBe("loading");
    expect(element.shadowRoot?.querySelector('[part="spinner"]')).not.toBeNull();
  });

  it("states emptiness instead of rendering a silently blank control", () => {
    const element = document.createElement("box-select") as Select;
    document.body.append(element);

    expect(selectOf(element).textContent).toContain("No options available");
    expect(selectOf(element).options[0]?.disabled).toBe(true);
    // No spinner when merely empty.
    expect(element.shadowRoot?.querySelector('[part="spinner"]')).toBeNull();
  });

  it("honours a custom empty-text", () => {
    const element = document.createElement("box-select") as Select;
    element.setAttribute("empty-text", "No teams match your filter");
    document.body.append(element);

    expect(selectOf(element).textContent).toContain("No teams match your filter");
  });

  it("clears the loading state and renders real options when they arrive", () => {
    const element = document.createElement("box-select") as Select;
    element.setAttribute("loading", "");
    document.body.append(element);

    element.removeAttribute("loading");
    element.setAttribute("options", OPTIONS);

    expect(selectOf(element).options.length).toBe(2);
    expect(selectOf(element).textContent).not.toContain("Loading options…");
    expect(
      element.shadowRoot?.querySelector('[part="control"]')?.hasAttribute("data-status"),
    ).toBe(false);
  });

  it("rejects malformed option payloads whole", () => {
    const element = document.createElement("box-select") as Select;
    element.setAttribute("options", JSON.stringify([{ label: "ok", value: "ok" }, { nope: true }]));
    document.body.append(element);

    expect(element.options).toEqual([]);
    // And the control says so rather than showing half a list.
    expect(selectOf(element).textContent).toContain("No options available");
  });
});
