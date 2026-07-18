/**
 * Conformance manifest: maps box-open-elements geometry claims onto the concrete
 * value declared in the real box-ui-elements (BUE) upstream SCSS.
 *
 * The box-open-elements side imports the actual geometry constants from
 * `src/foundations/geometry`, so a claim can never silently drift from the value
 * the catalog ships. The upstream side names a file (fetched from
 * `raw.githubusercontent.com/box/box-ui-elements`) plus an extractor.
 *
 * Only length-valued claims live here today — they are statically resolvable and
 * cover the Box Design Language geometry vocabulary (grid, radii, control
 * heights, overlay/modal metrics). Colour/shadow conformance is produced by Sass
 * functions upstream and is verified in the live-Storybook computed-style phase
 * (see plans/bue-conformance-execplan.md).
 */
import {
  boeControl,
  boeOverlay,
  boeRadius,
  boeSpace,
} from "../../src/foundations/geometry/index.js";

/**
 * Immutable upstream revision. Pinned to a release tag (not `master`) so the
 * audit is reproducible and never mixes files from different commits when the
 * branch advances mid-run. Override for a one-off run with `BUE_UPSTREAM_REV`.
 * Bump this deliberately to re-baseline against a newer box-ui-elements release.
 */
export const UPSTREAM_REVISION = "v26.0.0";

/** Build the raw.githubusercontent URL for an upstream path at a revision. */
export function upstreamUrl(path: string, revision = UPSTREAM_REVISION): string {
  return `https://raw.githubusercontent.com/box/box-ui-elements/${revision}/${path}`;
}

/** Upstream file to fetch, keyed by a short id used from extractors. */
export interface UpstreamFile {
  id: string;
  path: string;
}

function upstream(id: string, path: string): UpstreamFile {
  return { id, path };
}

export const UPSTREAM_FILES: readonly UpstreamFile[] = [
  upstream("layout", "src/styles/constants/_layout.scss"),
  upstream("buttons", "src/styles/constants/_buttons.scss"),
  upstream("modal", "src/components/modal/Modal.scss"),
  upstream("menu", "src/components/menu/Menu.scss"),
  upstream("overlay", "src/styles/mixins/_overlay.scss"),
  upstream("inputs", "src/styles/_inputs.scss"),
  upstream("badge", "src/components/badge/Badge.scss"),
] as const;

export type Extractor =
  | { kind: "scss-var"; file: string; name: string }
  | {
      kind: "decl";
      file: string;
      property: string;
      /** Rule selector the declaration must live under (prevents matching an
       *  unrelated declaration elsewhere in the file). */
      selector: string;
      /** Nth match within the scoped selector rule(s); defaults to 0. */
      index?: number;
    };

export interface Claim {
  id: string;
  /** box-open-elements surface / component family the claim governs. */
  surface: string;
  /** The geometry export the catalog consumes. */
  boeConst: string;
  /** Resolved box-open-elements value — imported, never hand-copied. */
  boeValue: string;
  /** How to pull the corresponding value out of upstream SCSS. */
  extractor: Extractor;
  /** Allowed absolute pixel difference (0 = must match exactly). */
  tolerancePx: number;
  /** What box-open-elements docs claim the upstream anchor is. */
  citation: string;
  /**
   * Set when box-open-elements **deliberately** diverges from box-ui-elements
   * source for this value (tracking the live Box web app instead). A mismatch is
   * then reported as `intentional-divergence`, not `drift`, and does not fail
   * `--strict`. See `docs/audits/bue-conformance-webapp-audit.md`.
   */
  intentional?: string;
}

export const CLAIMS: readonly Claim[] = [
  // --- Border radii (_layout.scss $bdl-border-radius-size*) ---
  {
    id: "radius.size",
    surface: "radius",
    boeConst: "boeRadius.size",
    boeValue: boeRadius.size,
    extractor: { kind: "scss-var", file: "layout", name: "bdl-border-radius-size" },
    tolerancePx: 0,
    citation: "$bdl-border-radius-size",
  },
  {
    id: "radius.med",
    surface: "radius",
    boeConst: "boeRadius.med",
    boeValue: boeRadius.med,
    extractor: { kind: "scss-var", file: "layout", name: "bdl-border-radius-size-med" },
    tolerancePx: 0,
    citation: "$bdl-border-radius-size-med (= size * 1.5)",
    intentional: "Tracks the live Box web app pill geometry (Blueprint), not box-ui-elements 6px source — see webapp audit.",
  },
  {
    id: "radius.large",
    surface: "radius",
    boeConst: "boeRadius.large",
    boeValue: boeRadius.large,
    extractor: { kind: "scss-var", file: "layout", name: "bdl-border-radius-size-large" },
    tolerancePx: 0,
    citation: "$bdl-border-radius-size-large (= size * 2)",
    intentional: "Tracks the live Box web app pill geometry (Blueprint), not box-ui-elements 6px source — see webapp audit.",
  },
  {
    id: "radius.xlarge",
    surface: "radius",
    boeConst: "boeRadius.xlarge",
    boeValue: boeRadius.xlarge,
    extractor: { kind: "scss-var", file: "layout", name: "bdl-border-radius-size-xlarge" },
    tolerancePx: 0,
    citation: "$bdl-border-radius-size-xlarge (= size * 3)",
    intentional: "Tracks the live Box web app pill geometry (Blueprint), not box-ui-elements 6px source — see webapp audit.",
  },

  // --- Spacing grid (_layout.scss $bdl-grid-unit) ---
  {
    id: "space.unit",
    surface: "spacing",
    boeConst: "boeSpace.unit",
    boeValue: boeSpace.unit,
    extractor: { kind: "scss-var", file: "layout", name: "bdl-grid-unit" },
    tolerancePx: 0,
    citation: "$bdl-grid-unit (4px grid root)",
  },

  // --- Control metrics (_buttons.scss $bdl-btn-*) ---
  {
    id: "control.height",
    surface: "control",
    boeConst: "boeControl.height",
    boeValue: boeControl.height,
    extractor: { kind: "scss-var", file: "buttons", name: "bdl-btn-height" },
    tolerancePx: 0,
    citation: "$bdl-btn-height",
  },
  {
    id: "control.heightLarge",
    surface: "control",
    boeConst: "boeControl.heightLarge",
    boeValue: boeControl.heightLarge,
    extractor: { kind: "scss-var", file: "buttons", name: "bdl-btn-height-large" },
    tolerancePx: 0,
    citation: "$bdl-btn-height-large",
  },
  {
    id: "control.paddingInline",
    surface: "control",
    boeConst: "boeControl.paddingInline",
    boeValue: boeControl.paddingInline,
    extractor: { kind: "scss-var", file: "buttons", name: "bdl-btn-padding-horizontal" },
    tolerancePx: 0,
    citation: "$bdl-btn-padding-horizontal (= grid-unit * 4)",
  },

  // --- Modal / overlay chrome (Modal.scss declarations, var-resolved) ---
  {
    id: "overlay.modalRadius",
    surface: "overlay",
    boeConst: "boeOverlay.modalRadius",
    boeValue: boeOverlay.modalRadius,
    extractor: {
      kind: "decl",
      file: "modal",
      selector: ".modal-dialog",
      property: "border-radius",
    },
    tolerancePx: 0,
    citation: "Modal.scss .modal-dialog border-radius: $bdl-border-radius-size-xlarge",
    intentional: "Tracks the live Box web app pill geometry (Blueprint), not box-ui-elements source — see webapp audit.",
  },
  {
    id: "overlay.modalPadding",
    surface: "overlay",
    boeConst: "boeOverlay.modalPadding",
    boeValue: boeOverlay.modalPadding,
    extractor: {
      kind: "decl",
      file: "modal",
      selector: ".modal-dialog",
      property: "padding",
    },
    tolerancePx: 0,
    citation: "Modal.scss .modal-dialog padding: 30px",
  },
  {
    id: "overlay.modalWidth",
    surface: "overlay",
    boeConst: "boeOverlay.modalWidth",
    boeValue: boeOverlay.modalWidth,
    extractor: {
      kind: "decl",
      file: "modal",
      selector: ".modal-dialog",
      property: "width",
    },
    tolerancePx: 0,
    citation: "Modal.scss .modal-dialog width: 460px",
  },
  {
    id: "overlay.itemMinHeight",
    surface: "overlay",
    boeConst: "boeOverlay.itemMinHeight",
    boeValue: boeOverlay.itemMinHeight,
    extractor: {
      kind: "decl",
      file: "menu",
      selector: ".menu-item",
      property: "min-height",
    },
    tolerancePx: 0,
    citation: "Menu.scss .menu-item min-height: 30px",
  },
  {
    id: "overlay.padding",
    surface: "overlay",
    boeConst: "boeOverlay.padding",
    boeValue: boeOverlay.padding,
    extractor: {
      kind: "decl",
      file: "overlay",
      selector: "@mixin bdl-Overlay-container",
      property: "padding",
    },
    tolerancePx: 0,
    citation: "mixins/_overlay.scss bdl-Overlay-container padding: $bdl-grid-unit * 3",
  },
  {
    id: "overlay.radius",
    surface: "overlay",
    boeConst: "boeOverlay.radius",
    boeValue: boeOverlay.radius,
    extractor: {
      kind: "decl",
      file: "overlay",
      selector: "@mixin bdl-Overlay-container",
      property: "border-radius",
    },
    tolerancePx: 0,
    citation: "mixins/_overlay.scss bdl-Overlay-container border-radius: $bdl-border-radius-size-large",
    intentional: "Tracks the live Box web app pill geometry (Blueprint), not box-ui-elements source — see webapp audit.",
  },
  {
    id: "overlay.itemRadius",
    surface: "overlay",
    boeConst: "boeOverlay.itemRadius",
    boeValue: boeOverlay.itemRadius,
    extractor: {
      kind: "decl",
      file: "overlay",
      selector: "@mixin bdl-Overlay-listItemContainer",
      property: "border-radius",
    },
    tolerancePx: 0,
    citation: "mixins/_overlay.scss bdl-Overlay-listItemContainer border-radius: $bdl-border-radius-size-large",
    intentional: "Tracks the live Box web app pill geometry (Blueprint), not box-ui-elements source — see webapp audit.",
  },

  // --- Input control chrome (@mixin box-inputs) ---
  {
    id: "control.inputPadding",
    surface: "control",
    boeConst: "boeControl.inputPadding",
    boeValue: boeControl.inputPadding,
    extractor: {
      kind: "decl",
      file: "inputs",
      selector: "@mixin box-inputs",
      property: "padding",
    },
    tolerancePx: 0,
    citation: "_inputs.scss @mixin box-inputs padding: 7px",
  },

  // --- Badge radius (Badge.scss .badge) ---
  {
    id: "badge.radius",
    surface: "badge",
    boeConst: "boeRadius.size",
    boeValue: boeRadius.size,
    extractor: {
      kind: "decl",
      file: "badge",
      selector: ".badge",
      property: "border-radius",
    },
    tolerancePx: 0,
    citation: "Badge.scss .badge border-radius: $bdl-border-radius-size (badges use boeRadius.size)",
  },
] as const;
