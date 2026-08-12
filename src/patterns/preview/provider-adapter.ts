export type PreviewProvider = {
  capabilities?: string[];
  engine?: string;
  id: string;
  label: string;
  status?: string;
};

/** Lifecycle of the previewed content, from nothing loaded to failure. */
export type PreviewStatus = "idle" | "loading" | "ready" | "error";

export type PreviewAdapterState = {
  currentAnnotationId?: string;
  mode?: string;
  /** Display-only label; prefer the numeric `page`/`pageCount` when driving UI. */
  pageLabel?: string;
  /** Legacy readiness flag; prefer `status`. Kept for adapter compatibility. */
  ready?: boolean;
  selectionLabel?: string;
  /** Display-only label; prefer the numeric `zoomPercent` when driving UI. */
  zoomLabel?: string;
  /** Content lifecycle. When absent, derived from `ready` (see resolvePreviewStatus). */
  status?: PreviewStatus;
  /** Human-readable failure description; render when `status` is "error". */
  errorMessage?: string;
  /** 1-based current page for paged content. */
  page?: number;
  pageCount?: number;
  /** Zoom level as a percentage (100 = actual size). */
  zoomPercent?: number;
};

/**
 * Effective lifecycle for a state object: an explicit `status` wins; otherwise
 * the legacy `ready` flag maps true→ready / false→loading; no state → idle.
 */
export const resolvePreviewStatus = (state: PreviewAdapterState | null | undefined): PreviewStatus => {
  if (!state) {
    return "idle";
  }
  if (state.status) {
    return state.status;
  }
  if (typeof state.ready === "boolean") {
    return state.ready ? "ready" : "loading";
  }
  return "idle";
};

/**
 * A typed command the host UI sends INTO the preview engine. Known commands
 * carry their payload shape; the string fallback keeps the channel open for
 * engine-specific extensions.
 */
export type PreviewCommand =
  | { command: "next-page" | "previous-page" | "zoom-in" | "zoom-out" | "toggle-fullscreen" | "download" | "print" }
  | { command: "go-to-page"; value: number }
  | { command: "set-zoom"; value: number }
  | { command: string; value?: unknown };

export type PreviewProviderActionDetail = {
  action: string;
  adapterState: PreviewAdapterState | null;
  provider: PreviewProvider | null;
  providerId: string | null;
};

export type PreviewProviderAdapter = {
  getProvider: () => PreviewProvider | null;
  getState: () => PreviewAdapterState | null;
  performAction?: (detail: PreviewProviderActionDetail) => void | Promise<void>;
  subscribe?: (listener: () => void) => () => void;
  /**
   * Hand the adapter a stable container to render the preview engine into.
   * `box-preview-element` calls this with its stage node when present; the
   * node survives shell re-renders, so mounted DOM is never destroyed by
   * chrome updates.
   */
  mount?: (container: HTMLElement) => void;
  unmount?: () => void;
  /** Drive the engine (paging, zoom, download, …) with a typed command. */
  sendCommand?: (command: PreviewCommand) => void | Promise<void>;
};

export type StaticPreviewProviderAdapter = PreviewProviderAdapter & {
  setProvider: (provider: PreviewProvider | null) => void;
  setState: (state: PreviewAdapterState | null) => void;
};

export const createStaticPreviewProviderAdapter = (config: {
  onAction?: (detail: PreviewProviderActionDetail) => void | Promise<void>;
  onCommand?: (command: PreviewCommand) => void | Promise<void>;
  provider?: PreviewProvider | null;
  state?: PreviewAdapterState | null;
}): StaticPreviewProviderAdapter => {
  let provider = config.provider ?? null;
  let state = config.state ?? null;
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  return {
    getProvider: () => provider,
    getState: () => state,
    performAction: config.onAction,
    ...(config.onCommand ? { sendCommand: config.onCommand } : {}),
    setProvider(nextProvider) {
      provider = nextProvider;
      notify();
    },
    setState(nextState) {
      state = nextState;
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};
