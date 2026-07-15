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
    expect(inspection.tokens).toEqual([]);
    expect(inspection.guidanceRoles).toEqual(["listbox", "option"]);
  });

  it("collects --boe-token-* references from the primary host shadow styles", () => {
    const canvas = document.createElement("div");
    const host = document.createElement("box-demo");
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host {
          color: var(--boe-token-text-text, #222222);
          background: var(--boe-token-surface-surface, #ffffff);
        }
        button {
          border-color: var(--boe-token-stroke-stroke, #e8e8e8);
          color: var(--boe-token-text-text, #222222);
        }
      </style>
      <button part="trigger">Go</button>
    `;
    canvas.append(host);

    const inspection = inspectPreviewTree(canvas, { primaryTag: "box-demo" });
    expect(inspection.parts).toEqual(["trigger"]);
    expect(inspection.tokens).toEqual([
      "--boe-token-stroke-stroke",
      "--boe-token-surface-surface",
      "--boe-token-text-text",
    ]);
  });

  it("reads tokens from adoptedStyleSheets when present", () => {
    const canvas = document.createElement("div");
    const host = document.createElement("box-demo");
    const shadow = host.attachShadow({ mode: "open" });
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`:host { outline-color: var(--boe-token-surface-surface-brand, #0061d5); }`);
    shadow.adoptedStyleSheets = [sheet];
    shadow.innerHTML = `<span part="label">Label</span>`;
    canvas.append(host);

    const inspection = inspectPreviewTree(canvas, { primaryTag: "box-demo" });
    expect(inspection.tokens).toEqual(["--boe-token-surface-surface-brand"]);
    expect(inspection.parts).toEqual(["label"]);
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
    expect(inspection.tokens).toEqual([]);
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
    expect(inspection.tokens).toEqual([]);
    expect(inspection.roles).toEqual(["status"]);
    expect(inspection.guidanceRoles).toEqual(["status"]);
  });

  it("ignores tokens from nested custom-element shadows", () => {
    const canvas = document.createElement("div");
    const outer = document.createElement("box-outer");
    const outerShadow = outer.attachShadow({ mode: "open" });
    outerShadow.innerHTML = `
      <style>:host { color: var(--boe-token-text-text, #222); }</style>
      <span part="shell">Shell</span>
    `;
    const inner = document.createElement("box-inner");
    const innerShadow = inner.attachShadow({ mode: "open" });
    innerShadow.innerHTML = `
      <style>:host { background: var(--boe-token-surface-surface-brand, #0061d5); }</style>
      <span part="nested">Nested</span>
    `;
    outerShadow.append(inner);
    canvas.append(outer);

    const inspection = inspectPreviewTree(canvas, { primaryTag: "box-outer" });
    expect(inspection.tokens).toEqual(["--boe-token-text-text"]);
    expect(inspection.parts).toEqual(["shell"]);
  });
});
