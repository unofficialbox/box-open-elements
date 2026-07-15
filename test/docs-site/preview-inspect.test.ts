// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { inspectPreviewTree } from "../../docs-site/preview-inspect.js";

describe("inspectPreviewTree", () => {
  it("collects explicit roles and primary-host parts", () => {
    const canvas = document.createElement("div");
    const host = document.createElement("box-demo");
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <div role="listbox">
        <button part="item" role="option">One</button>
      </div>
    `;
    canvas.append(host);

    const inspection = inspectPreviewTree(canvas, { primaryTag: "box-demo" });
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
      <input type="number" />
      <input type="range" />
      <select></select>
      <a href="/docs">Docs</a>
    `;

    const inspection = inspectPreviewTree(canvas, { primaryTag: "box-missing" });
    expect(inspection.roles).toEqual([]);
    expect(inspection.guidanceRoles).toEqual([
      "button",
      "checkbox",
      "combobox",
      "link",
      "searchbox",
      "slider",
      "spinbutton",
    ]);
    expect(inspection.parts).toEqual([]);
  });

  it("walks nested shadow roots for roles but keeps parts on the primary host", () => {
    const canvas = document.createElement("div");
    const outer = document.createElement("box-outer");
    const outerShadow = outer.attachShadow({ mode: "open" });
    outerShadow.innerHTML = `<span part="outer-only">Shell</span>`;
    const inner = document.createElement("box-inner");
    const innerShadow = inner.attachShadow({ mode: "open" });
    innerShadow.innerHTML = `<span part="nested" role="status">Ready</span>`;
    outerShadow.append(inner);
    canvas.append(outer);

    const inspection = inspectPreviewTree(canvas, { primaryTag: "box-outer" });
    expect(inspection.parts).toEqual(["outer-only"]);
    expect(inspection.roles).toEqual(["status"]);
    expect(inspection.guidanceRoles).toEqual(["status"]);
  });
});
