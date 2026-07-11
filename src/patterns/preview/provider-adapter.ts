export type PreviewProvider = {
  capabilities?: string[];
  engine?: string;
  id: string;
  label: string;
  status?: string;
};

export type PreviewAdapterState = {
  currentAnnotationId?: string;
  mode?: string;
  pageLabel?: string;
  ready?: boolean;
  selectionLabel?: string;
  zoomLabel?: string;
};

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
};

export type StaticPreviewProviderAdapter = PreviewProviderAdapter & {
  setProvider: (provider: PreviewProvider | null) => void;
  setState: (state: PreviewAdapterState | null) => void;
};

export const createStaticPreviewProviderAdapter = (config: {
  onAction?: (detail: PreviewProviderActionDetail) => void | Promise<void>;
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
