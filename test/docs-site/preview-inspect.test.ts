// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { inspectPreviewTree } from "../../docs-site/preview-inspect.js";

describe("inspectPreviewTree", () => {
  it("collects explicit roles and parts from light DOM", () => {
    const canvas = document.createElement("div");
    canvas.innerHTML = `
      <div role="listbox">
        <button part="item" role="option">One</button>
      </div>
    `;

    const inspection = inspectPreviewTree(canvas);
    expect(inspection.roles).toEqual(["listbox", "option"]);
    expect(inspection.parts).toEqual(["item"]);
    expect(inspection.guidanceRoles).toEqual(["listbox", "option"]);
  });

  it("infers native interactive semantics for guidance when role is absent", () => {
    const canvas = document.createElement("div");
    canvas.innerHTML = `
      <button type="button">Save</button>
      <input type="checkbox" />
      <input type="search" />
    `;

    const inspection = inspectPreviewTree(canvas);
    expect(inspection.roles).toEqual([]);
    expect(inspection.guidanceRoles).toEqual(["button", "checkbox", "searchbox"]);
  });

  it("walks nested shadow roots for parts and roles", () => {
    const canvas = document.createElement("div");
    const outer = document.createElement("div");
    const outerShadow = outer.attachShadow({ mode: "open" });
    const inner = document.createElement("div");
    const innerShadow = inner.attachShadow({ mode: "open" });
    innerShadow.innerHTML = `<span part="nested" role="status">Ready</span>`;
    outerShadow.append(inner);
    canvas.append(outer);

    const inspection = inspectPreviewTree(canvas);
    expect(inspection.parts).toEqual(["nested"]);
    expect(inspection.roles).toEqual(["status"]);
    expect(inspection.guidanceRoles).toEqual(["status"]);
  });
});
