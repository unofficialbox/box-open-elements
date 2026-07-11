import {
  createStaticPreviewProviderAdapter,
  type PreviewAdapterState,
  type PreviewProvider,
  type PreviewProviderActionDetail,
  type StaticPreviewProviderAdapter,
} from "./provider-adapter.js";

export type ContentPreviewAdapterConfig = {
  onAction?: (detail: PreviewProviderActionDetail) => void | Promise<void>;
  onMount?: (container: HTMLElement) => void;
  onUnmount?: () => void;
  provider?: Partial<PreviewProvider>;
  state?: PreviewAdapterState | null;
};

export type ContentPreviewAdapter = StaticPreviewProviderAdapter & {
  mount: (container: HTMLElement) => void;
  unmount: () => void;
};

export const createContentPreviewAdapter = (
  config: ContentPreviewAdapterConfig = {},
): ContentPreviewAdapter => {
  const adapter = createStaticPreviewProviderAdapter({
    onAction: config.onAction,
    provider: {
      id: "box-content-preview",
      label: "Box Content Preview",
      engine: "content-preview",
      capabilities: ["annotations", "comments", "downloads"],
      ...config.provider,
    },
    state: config.state ?? null,
  });

  let mountedContainer: HTMLElement | null = null;

  return {
    ...adapter,
    mount(container) {
      mountedContainer = container;
      config.onMount?.(container);
      adapter.setState({
        ...(adapter.getState() ?? {}),
        ready: true,
      });
    },
    unmount() {
      mountedContainer = null;
      config.onUnmount?.();
    },
  };
};
