import {
  createStaticPreviewProviderAdapter,
  type PreviewAdapterState,
  type PreviewCommand,
  type PreviewProvider,
  type PreviewProviderActionDetail,
  type StaticPreviewProviderAdapter,
} from "./provider-adapter.js";

export type ContentPreviewAdapterConfig = {
  onAction?: (detail: PreviewProviderActionDetail) => void | Promise<void>;
  onCommand?: (command: PreviewCommand) => void | Promise<void>;
  onMount?: (container: HTMLElement) => void;
  onUnmount?: () => void;
  /**
   * Boot the real preview engine into the container (e.g. `new Preview()` +
   * `preview.show(fileId, token, { container })` for the Box Preview SDK).
   * Return a teardown function; the adapter invokes it on unmount and before
   * re-mounting into a different container.
   */
  createViewer?: (container: HTMLElement) => (() => void) | void;
  provider?: Partial<PreviewProvider>;
  state?: PreviewAdapterState | null;
};

export type ContentPreviewAdapter = StaticPreviewProviderAdapter & {
  mount: (container: HTMLElement) => void;
  unmount: () => void;
  getMountedContainer: () => HTMLElement | null;
};

export const createContentPreviewAdapter = (
  config: ContentPreviewAdapterConfig = {},
): ContentPreviewAdapter => {
  const adapter = createStaticPreviewProviderAdapter({
    onAction: config.onAction,
    onCommand: config.onCommand,
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
  let teardownViewer: (() => void) | null = null;

  const teardown = () => {
    teardownViewer?.();
    teardownViewer = null;
    mountedContainer = null;
  };

  return {
    ...adapter,
    mount(container) {
      if (mountedContainer === container) {
        return;
      }
      // Re-mounting elsewhere tears the previous viewer down first.
      if (mountedContainer) {
        teardown();
      }
      mountedContainer = container;
      config.onMount?.(container);
      teardownViewer = config.createViewer?.(container) ?? null;
      adapter.setState({
        ...(adapter.getState() ?? {}),
        ready: true,
        status: "ready",
      });
    },
    unmount() {
      if (!mountedContainer) {
        return;
      }
      teardown();
      config.onUnmount?.();
      adapter.setState({
        ...(adapter.getState() ?? {}),
        ready: false,
        status: "idle",
      });
    },
    getMountedContainer: () => mountedContainer,
  };
};
