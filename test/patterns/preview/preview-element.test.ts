// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createStaticPreviewProviderAdapter } from "../../../src/patterns/preview/provider-adapter.js";
import {
  BoxPreviewElement,
  defineBoxPreviewElement,
} from "../../../src/patterns/preview/preview-element.js";

describe("BoxPreviewElement", () => {
  beforeEach(() => {
    defineBoxPreviewElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders provider, title, and slotted regions", () => {
    const element = document.createElement("box-preview-element") as BoxPreviewElement;
    element.title = "Preview Workspace";
    element.provider = {
      id: "box-content-preview",
      label: "Box Content Preview",
      capabilities: ["annotations", "downloads"],
      status: "ready",
    };
    element.adapterState = {
      ready: true,
      mode: "Review",
      pageLabel: "Page 2",
      zoomLabel: "100%",
    };
    element.itemLabel = "Brand Strategy.pdf";

    const toolbar = document.createElement("div");
    toolbar.slot = "toolbar";
    toolbar.textContent = "Toolbar";

    const stage = document.createElement("div");
    stage.slot = "stage";
    stage.textContent = "Stage";

    const sidebar = document.createElement("div");
    sidebar.slot = "sidebar";
    sidebar.textContent = "Sidebar";

    element.append(toolbar, stage, sidebar);
    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Preview Workspace");
    expect(element.shadowRoot?.textContent).toContain("Box Content Preview");
    expect(element.shadowRoot?.textContent).toContain("Brand Strategy.pdf");
    expect(element.shadowRoot?.textContent).toContain("Page 2");
    expect(element.shadowRoot?.textContent).toContain("annotations");
    expect(element.querySelector('[slot="toolbar"]')?.textContent).toBe("Toolbar");
  });

  it("emits action when a shell action is clicked", () => {
    const element = document.createElement("box-preview-element") as BoxPreviewElement;
    const action = vi.fn();
    element.actions = [{ id: "open-provider", label: "Open provider", tone: "primary" }];
    element.addEventListener("action", action);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="action"][data-action-id="open-provider"]') as HTMLButtonElement | null;
    button?.click();

    expect(action).toHaveBeenCalledTimes(1);
    expect(action.mock.calls[0]?.[0]?.detail).toEqual({
      action: "open-provider",
      adapterState: null,
      provider: null,
      providerId: null,
    });
  });

  it("emits provider-action with provider context", () => {
    const element = document.createElement("box-preview-element") as BoxPreviewElement;
    const action = vi.fn();
    element.provider = {
      id: "box-content-preview",
      label: "Box Content Preview",
    };
    element.adapterState = {
      ready: true,
      mode: "Review",
    };
    element.actions = [{ id: "open-provider", label: "Open provider", tone: "primary" }];
    element.addEventListener("provider-action", action);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="action"][data-action-id="open-provider"]') as HTMLButtonElement | null;
    button?.click();

    expect(action).toHaveBeenCalledTimes(1);
    expect(action.mock.calls[0]?.[0]?.detail).toEqual({
      action: "open-provider",
      adapterState: {
        ready: true,
        mode: "Review",
      },
      provider: {
        id: "box-content-preview",
        label: "Box Content Preview",
      },
      providerId: "box-content-preview",
    });
  });

  it("renders from providerAdapter and forwards actions to it", () => {
    const onAction = vi.fn();
    const adapter = createStaticPreviewProviderAdapter({
      provider: {
        id: "box-content-preview",
        label: "Box Content Preview",
      },
      state: {
        ready: true,
        mode: "Review",
        pageLabel: "Page 2",
      },
      onAction,
    });
    const element = document.createElement("box-preview-element") as BoxPreviewElement;
    element.providerAdapter = adapter;
    element.actions = [{ id: "open-provider", label: "Open provider" }];

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Box Content Preview");
    expect(element.shadowRoot?.textContent).toContain("Page 2");

    const button = element.shadowRoot?.querySelector('[part="action"][data-action-id="open-provider"]') as HTMLButtonElement | null;
    button?.click();

    expect(onAction).toHaveBeenCalledWith({
      action: "open-provider",
      adapterState: {
        ready: true,
        mode: "Review",
        pageLabel: "Page 2",
      },
      provider: {
        id: "box-content-preview",
        label: "Box Content Preview",
      },
      providerId: "box-content-preview",
    });

    adapter.setState({
      ready: true,
      mode: "Review",
      pageLabel: "Page 3",
    });

    expect(element.shadowRoot?.textContent).toContain("Page 3");
  });
});
