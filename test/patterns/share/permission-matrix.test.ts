// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxPermissionMatrixElement,
  defineBoxPermissionMatrixElement,
} from "../../../src/patterns/share/permission-matrix.js";

describe("BoxPermissionMatrixElement", () => {
  beforeEach(() => {
    defineBoxPermissionMatrixElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders subjects and selected roles", () => {
    const element = document.createElement("box-permission-matrix") as BoxPermissionMatrixElement;
    element.label = "Permissions";
    element.options = [
      { label: "Viewer", value: "viewer" },
      { label: "Editor", value: "editor" },
    ];
    element.subjects = [
      { id: "1", name: "Morgan Lee", description: "Content Designer", type: "User" },
    ];
    element.value = { "1": "editor" };

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Morgan Lee");
    expect(element.shadowRoot?.textContent).toContain("Content Designer");
    const select = element.shadowRoot?.querySelector("select") as HTMLSelectElement | null;
    expect(select?.value).toBe("editor");
    expect(element.shadowRoot?.querySelector('[part="select-shell"]')).not.toBeNull();
    expect(element.shadowRoot?.querySelector('[part="select-icon"]')).not.toBeNull();
  });

  it("emits value-changed and subject-role-changed", () => {
    const element = document.createElement("box-permission-matrix") as BoxPermissionMatrixElement;
    const valueChanged = vi.fn();
    const roleChanged = vi.fn();
    element.options = [
      { label: "Viewer", value: "viewer" },
      { label: "Editor", value: "editor" },
    ];
    element.subjects = [
      { id: "1", name: "Avery Chen", type: "User" },
    ];
    element.value = { "1": "viewer" };
    element.addEventListener("value-changed", valueChanged);
    element.addEventListener("subject-role-changed", roleChanged);

    document.body.append(element);

    const select = element.shadowRoot?.querySelector("select") as HTMLSelectElement | null;
    if (select) {
      select.value = "editor";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }

    expect(valueChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: { "1": "editor" } },
      }),
    );
    expect(roleChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { subjectId: "1", value: "editor" },
      }),
    );
  });
});
