// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import { createContentPreviewAdapter } from "../../../src/patterns/preview/content-preview-adapter.js";

describe("createContentPreviewAdapter", () => {
  it("starts with Box Content Preview defaults and supports mount/unmount hooks", () => {
    const onMount = vi.fn();
    const onUnmount = vi.fn();
    const adapter = createContentPreviewAdapter({
      onMount,
      onUnmount,
      state: {
        mode: "Review",
        ready: false,
      },
    });
    const container = document.createElement("div");

    expect(adapter.getProvider()).toEqual({
      id: "box-content-preview",
      label: "Box Content Preview",
      engine: "content-preview",
      capabilities: ["annotations", "comments", "downloads"],
    });

    adapter.mount(container);

    expect(onMount).toHaveBeenCalledWith(container);
    expect(adapter.getState()).toEqual({
      mode: "Review",
      ready: true,
    });

    adapter.unmount();
    expect(onUnmount).toHaveBeenCalledTimes(1);
  });

  it("forwards provider actions through the configured handler", async () => {
    const onAction = vi.fn();
    const adapter = createContentPreviewAdapter({ onAction });

    await adapter.performAction?.({
      action: "download",
      adapterState: null,
      provider: adapter.getProvider(),
      providerId: adapter.getProvider()?.id ?? null,
    });

    expect(onAction).toHaveBeenCalledWith({
      action: "download",
      adapterState: null,
      provider: adapter.getProvider(),
      providerId: "box-content-preview",
    });
  });
});
