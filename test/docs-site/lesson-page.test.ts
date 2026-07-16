// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { renderLessonPage } from "../../docs-site/lesson-page.js";
import { previewLesson, shareLesson } from "../../docs-site/lessons.js";
import { defineBoxPreviewElement } from "../../src/patterns/preview/preview-element.js";
import { defineBoxSharePanelElement } from "../../src/patterns/share/share-panel.js";

describe("docs-site Share lesson page previews", () => {
  beforeEach(() => {
    defineBoxSharePanelElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("mounts share preview states, forwards events, and tears down cleanly", () => {
    const stage = document.createElement("div");
    const breadcrumb = document.createElement("div");
    document.body.append(stage, breadcrumb);

    const teardown = renderLessonPage(shareLesson, stage, breadcrumb);

    const canvases = [...stage.querySelectorAll<HTMLElement>(".lesson-canvas")];
    const byPreview = Object.fromEntries(
      canvases.map(canvas => [canvas.dataset.preview ?? "", canvas]),
    ) as Record<string, HTMLElement>;

    expect(byPreview.empty?.querySelector(".preview-note")?.textContent).toMatch(/Empty app/);
    expect(byPreview["share-shell"]?.querySelector("box-share-panel")).toBeTruthy();
    expect(byPreview["share-shell"]?.textContent).not.toContain("https://box.com/s/example");

    const linkPanel = byPreview["share-link"]?.querySelector("box-share-panel");
    expect(linkPanel?.getAttribute("shared-link")).toContain("https://box.com/s/example");
    expect(linkPanel?.getAttribute("collaborators")).toBeNull();

    const peoplePanel = byPreview["share-people"]?.querySelector("box-share-panel");
    expect(peoplePanel?.getAttribute("collaborators")).toContain("Morgan Lee");
    expect(peoplePanel?.getAttribute("settings")).toBeNull();

    const settingsPanel = byPreview["share-settings"]?.querySelector("box-share-panel");
    expect(settingsPanel?.getAttribute("message")).toContain("Anyone in the company");
    expect(settingsPanel?.getAttribute("settings")).toContain("Jun 1, 2027");
    expect(settingsPanel?.getAttribute("actions")).toBeNull();

    const actionsCanvas = byPreview["share-actions"];
    const actionsPanel = actionsCanvas?.querySelector("box-share-panel") as HTMLElement;
    expect(actionsPanel?.getAttribute("actions")).toContain("Copy link");

    const actionButton = actionsPanel.shadowRoot?.querySelector(
      '[data-action-id="copy"]',
    ) as HTMLButtonElement | null;
    const collaboratorButton = actionsPanel.shadowRoot?.querySelector(
      '[data-collaborator-name="Morgan Lee"]',
    ) as HTMLButtonElement | null;
    expect(actionButton).toBeTruthy();
    expect(collaboratorButton).toBeTruthy();

    actionButton?.click();
    collaboratorButton?.click();

    const eventList = stage.querySelector("#lesson-event-list")!;
    const eventNames = [...eventList.querySelectorAll(".event-name")].map(node => node.textContent);
    expect(eventNames).toContain("action");
    expect(eventNames).toContain("collaborator-selected");
    expect(stage.querySelector("#lesson-event-count")?.textContent).toBe("2");

    teardown();
    expect(stage.querySelectorAll("box-share-panel")).toHaveLength(0);
  });
});

describe("docs-site Preview lesson page previews", () => {
  beforeEach(() => {
    defineBoxPreviewElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("mounts preview states, forwards events, and tears down cleanly", () => {
    const stage = document.createElement("div");
    const breadcrumb = document.createElement("div");
    document.body.append(stage, breadcrumb);

    const teardown = renderLessonPage(previewLesson, stage, breadcrumb);

    const canvases = [...stage.querySelectorAll<HTMLElement>(".lesson-canvas")];
    const byPreview = Object.fromEntries(
      canvases.map(canvas => [canvas.dataset.preview ?? "", canvas]),
    ) as Record<string, HTMLElement>;

    expect(byPreview.empty?.querySelector(".preview-note")?.textContent).toMatch(/Empty app/);
    expect(byPreview["preview-shell"]?.querySelector("box-preview-element")).toBeTruthy();
    expect(byPreview["preview-shell"]?.querySelector("box-preview-element")?.getAttribute("item-label")).toBeNull();

    const meta = byPreview["preview-meta"]?.querySelector("box-preview-element");
    expect(meta?.getAttribute("item-label")).toBe("PDF · 2.4 MB");
    expect(meta?.getAttribute("provider")).toBeNull();

    const provider = byPreview["preview-provider"]?.querySelector("box-preview-element");
    expect(provider?.getAttribute("provider")).toContain("Box Content Preview");
    expect(provider?.getAttribute("adapter-state")).toBeNull();

    const adapter = byPreview["preview-adapter"]?.querySelector("box-preview-element");
    expect(adapter?.getAttribute("adapter-state")).toContain("Page 2 of 34");
    expect(adapter?.getAttribute("actions")).toBeNull();

    const actionsPanel = byPreview["preview-actions"]?.querySelector("box-preview-element") as HTMLElement;
    expect(actionsPanel?.getAttribute("actions")).toContain("Open provider");

    const actionButton = actionsPanel.shadowRoot?.querySelector(
      '[data-action-id="open-provider"]',
    ) as HTMLButtonElement | null;
    expect(actionButton).toBeTruthy();
    actionButton?.click();

    const eventList = stage.querySelector("#lesson-event-list")!;
    const eventNames = [...eventList.querySelectorAll(".event-name")].map(node => node.textContent);
    expect(eventNames).toContain("action");
    expect(eventNames).toContain("provider-action");

    teardown();
    expect(stage.querySelectorAll("box-preview-element")).toHaveLength(0);
  });
});
