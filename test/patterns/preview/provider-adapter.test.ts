import { describe, expect, it, vi } from "vitest";

import { createStaticPreviewProviderAdapter } from "../../../src/patterns/preview/provider-adapter.js";

describe("createStaticPreviewProviderAdapter", () => {
  it("stores provider and state and notifies subscribers", () => {
    const adapter = createStaticPreviewProviderAdapter({
      provider: {
        id: "box-content-preview",
        label: "Box Content Preview",
      },
      state: {
        ready: true,
        mode: "Review",
      },
    });
    const listener = vi.fn();
    const unsubscribe = adapter.subscribe(listener);

    expect(adapter.getProvider()).toEqual({
      id: "box-content-preview",
      label: "Box Content Preview",
    });
    expect(adapter.getState()).toEqual({
      ready: true,
      mode: "Review",
    });

    adapter.setState({
      ready: true,
      mode: "Annotate",
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(adapter.getState()).toEqual({
      ready: true,
      mode: "Annotate",
    });

    unsubscribe();
    adapter.setProvider({
      id: "custom-provider",
      label: "Custom Provider",
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(adapter.getProvider()).toEqual({
      id: "custom-provider",
      label: "Custom Provider",
    });
  });
});
