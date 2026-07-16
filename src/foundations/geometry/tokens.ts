/**
 * Box Design Language geometry — sourced from box-ui-elements
 * `src/styles/constants/_layout.scss`, `_buttons.scss`, and `_inputs.scss`.
 *
 * Prefer these over ad-hoc rem bands when styling everyday controls so the
 * catalog tracks upstream Box chrome (4px grid, 32px controls, 4/6/8/12 radii).
 */

/** `$bdl-grid-unit` — spacing scale root (4px). */
export const boeSpace = {
  unit: "4px",
  /** 1 × grid */
  1: "4px",
  /** 2 × grid */
  2: "8px",
  /** 3 × grid */
  3: "12px",
  /** 4 × grid — button horizontal padding */
  4: "16px",
  /** 5 × grid */
  5: "20px",
  /** 6 × grid — overlay padding */
  6: "24px",
  /** 7.5 × grid — modal-ish pad */
  8: "32px",
} as const;

/**
 * `$bdl-border-radius-size*` — 4 / 6 / 8 / 12px.
 * Use `med` for controls (button, input); `large` for menus; `xlarge` for modals.
 */
export const boeRadius = {
  size: "4px",
  med: "6px",
  large: "8px",
  xlarge: "12px",
  /** True pills only (chips, label-pills) — not everyday controls. */
  pill: "999px",
} as const;

/** `$bdl-btn-height*` + related control metrics. */
export const boeControl = {
  height: "32px",
  heightLarge: "40px",
  paddingInline: "16px",
  /** Shared input pad from `@mixin box-inputs` */
  inputPadding: "7px",
  /** BUE select control height */
  selectHeight: "34px",
  /** Legacy body font used on `.btn` */
  fontSize: "13px",
  letterSpacing: "0.035em",
  /** BUE disabled control opacity */
  disabledOpacity: "0.4",
  /** Input border — `$bdl-gray-20` / SurfaceSurfaceQuaternary */
  inputBorder: "var(--boe-token-surface-surface-quaternary, #d3d3d3)",
  /** Button secondary border — `$bdl-gray-30` / StrokeStrokeHover */
  buttonBorder: "var(--boe-token-stroke-stroke-hover, #bcbcbc)",
  /** `@mixin box-inputs` inset shadow */
  inputInsetShadow: "inset 0 2px 4px rgb(0 0 0 / 10%)",
  /** Overlay / menu shadow — `mixins/_overlay.scss` */
  overlayShadow: "0 4px 12px 0 rgb(0 0 0 / 10%)",
  /** Primary button focus inset ring */
  primaryFocusShadow:
    "inset 0 0 0 1px rgb(255 255 255 / 80%), 0 1px 2px rgb(0 0 0 / 10%)",
} as const;

/** Shared text-field / select chrome matching `@mixin box-inputs`. */
export const boeInputControlStyles = (selector: string): string => `
  ${selector} {
    box-sizing: border-box;
    min-height: ${boeControl.height};
    padding: ${boeControl.inputPadding};
    color: var(--boe-token-text-text, #222222);
    border: 1px solid ${boeControl.inputBorder};
    border-radius: ${boeRadius.med};
    background: var(--boe-token-surface-surface, #ffffff);
    box-shadow: ${boeControl.inputInsetShadow};
    transition:
      border-color linear 0.15s,
      box-shadow linear 0.1s;
  }

  ${selector}:hover:not(:disabled) {
    box-shadow: ${boeControl.inputInsetShadow};
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
  }

  ${selector}:focus-visible {
    outline: 0;
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    box-shadow: ${boeControl.inputInsetShadow};
  }

  ${selector}:disabled {
    opacity: ${boeControl.disabledOpacity};
    cursor: not-allowed;
  }
`;
