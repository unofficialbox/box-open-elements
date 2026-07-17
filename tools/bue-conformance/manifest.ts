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

const UPSTREAM_ROOT =
  "https://raw.githubusercontent.com/box/box-ui-elements/master";

/** Upstream file to fetch, keyed by a short id used from extractors. */
export interface UpstreamFile {
  id: string;
  path: string;
  url: string;
}

function upstream(id: string, path: string): UpstreamFile {
  return { id, path, url: `${UPSTREAM_ROOT}/${path}` };
}

export const UPSTREAM_FILES: readonly UpstreamFile[] = [
  upstream("layout", "src/styles/constants/_layout.scss"),
  upstream("buttons", "src/styles/constants/_buttons.scss"),
  upstream("modal", "src/components/modal/Modal.scss"),
  upstream("menu", "src/components/menu/Menu.scss"),
] as const;

export type Extractor =
  | { kind: "scss-var"; file: string; name: string }
  | { kind: "decl"; file: string; property: string; index?: number };

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
  },
  {
    id: "radius.large",
    surface: "radius",
    boeConst: "boeRadius.large",
    boeValue: boeRadius.large,
    extractor: { kind: "scss-var", file: "layout", name: "bdl-border-radius-size-large" },
    tolerancePx: 0,
    citation: "$bdl-border-radius-size-large (= size * 2)",
  },
  {
    id: "radius.xlarge",
    surface: "radius",
    boeConst: "boeRadius.xlarge",
    boeValue: boeRadius.xlarge,
    extractor: { kind: "scss-var", file: "layout", name: "bdl-border-radius-size-xlarge" },
    tolerancePx: 0,
    citation: "$bdl-border-radius-size-xlarge (= size * 3)",
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
    extractor: { kind: "decl", file: "modal", property: "border-radius", index: 0 },
    tolerancePx: 0,
    citation: "Modal.scss .modal-content border-radius: $bdl-border-radius-size-xlarge",
  },
  {
    id: "overlay.modalPadding",
    surface: "overlay",
    boeConst: "boeOverlay.modalPadding",
    boeValue: boeOverlay.modalPadding,
    extractor: { kind: "decl", file: "modal", property: "padding", index: 0 },
    tolerancePx: 0,
    citation: "Modal.scss .modal padding: 30px",
  },
  {
    id: "overlay.modalWidth",
    surface: "overlay",
    boeConst: "boeOverlay.modalWidth",
    boeValue: boeOverlay.modalWidth,
    extractor: { kind: "decl", file: "modal", property: "width", index: 1 },
    tolerancePx: 0,
    citation: "Modal.scss .modal-content width: 460px",
  },
  {
    id: "overlay.itemMinHeight",
    surface: "overlay",
    boeConst: "boeOverlay.itemMinHeight",
    boeValue: boeOverlay.itemMinHeight,
    extractor: { kind: "decl", file: "menu", property: "min-height", index: 0 },
    tolerancePx: 0,
    citation: "Menu.scss .menu-item min-height: 30px",
  },
] as const;
