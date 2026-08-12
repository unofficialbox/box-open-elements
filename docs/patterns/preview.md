# Preview

The preview pattern stays layered:

- **Compositions** — preview headers, toolbars, and annotation surfaces around the rendering engine (`annotation-toolbar`, `annotation-inspector`, `annotation-thread`, `preview-header`). A tabbed content sidebar (details/activity/metadata/versions) is a known gap — see the patterns catalog.
- **Workflow shell** — a pluggable preview element that hosts the actual preview provider and orchestrates preview state

The shell behaves like an adapter host, not a hard-coded renderer. The same surrounding shell must work with:

- Box Content Preview
- other third-party preview libraries
- lightweight custom renderers for narrow formats

## Provider adapter contract

```ts
type PreviewProvider = {
  id: string;
  label: string;
  engine?: string;
  status?: string;
  capabilities?: string[];
};

type PreviewAdapterState = {
  ready?: boolean;
  mode?: string;
  pageLabel?: string;
  zoomLabel?: string;
  selectionLabel?: string;
  currentAnnotationId?: string;
};
```

The shell accepts `provider` and `adapterState` as plain serializable objects, and shell-level actions emit enough adapter context for an outer orchestrator to route commands into Box Content Preview or another provider.

When an integration needs lifecycle hooks or live sync, prefer a `providerAdapter` object over ad hoc provider-specific props. `createContentPreviewAdapter()` (`patterns/preview/content-preview-adapter`) is the concrete adapter for Box Content Preview: pass `createViewer(container)` to boot the real engine into the shell's stable stage node (return a teardown function), and drive it with the typed command channel.

The adapter contract (v2) carries:

- `mount(container)` / `unmount()` — `box-preview-element` hands the adapter its `[part="stage-mount"]` node, which keeps identity across chrome re-renders, and unmounts on disconnect.
- `PreviewAdapterState.status` (`idle | loading | ready | error`, with `errorMessage`) — the shell renders a busy stage, an error alert, and a status chip from it; the legacy `ready` flag still resolves via `resolvePreviewStatus()`.
- Numeric `page` / `pageCount` / `zoomPercent` — when present alongside `sendCommand`, the shell renders paging/zoom controls that emit typed `PreviewCommand`s (`next-page`, `go-to-page`, `zoom-in`, `set-zoom`, …) and a `command` DOM event.
- Rejected `performAction` / `sendCommand` promises surface as an `action-error` DOM event instead of vanishing.

The shell emits a single `action` event per action (the former duplicate `provider-action` event was removed).

Guidance:

- keep preview shell surfaces separate from the rendering engine
- pass item context, preview state, and commands through stable properties and events
- prefer provider adapters over provider-specific top-level APIs
- keep provider configuration isolated so switching preview engines does not require rewriting the surrounding compositions
- prefer slot-based or clearly separated regions for preview toolbars, stage content, and sidebars

## Annotation-first priorities

- prioritize annotation customization before Box AI-specific preview features
- design annotation compositions so they work with Box Content Preview or another preview provider
- defer Box AI integration until the annotation contract is stable and provider-neutral
- keep annotation command surfaces provider-neutral with stable tool, color, and action contracts
- keep annotation inspection surfaces focused on annotation properties, markup context, location, color, and status
- keep annotation thread surfaces focused on mixed discussion streams around annotations, including plain comments, replies, and annotation updates
- treat comments, replies, highlights, drawings, and redactions as different annotation modes inside the same preview ecosystem, not as one generic "activity pane"
- in Box terms: the inspector describes the selected markup layer, while the thread interleaves annotation events and comments in one ordered review stream

## Repo boundary

Preview-platform infrastructure (preview dialogs, preview navigation, open-with) historically belongs to the sibling `box-open-preview` repository. When preview responsibilities expand here, validate the split against that repo before duplicating abstractions.
