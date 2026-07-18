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
  /** 8 × grid — modal-ish pad / control height */
  8: "32px",
  /** 10 × grid */
  10: "40px",
  /** 12 × grid — menu-item trailing pad */
  12: "48px",
} as const;

/**
 * Pattern / panel shell chrome — denser BDL card surfaces (12 / 8)
 * used by share panels, explorers, insights cards, etc.
 */
export const boePanel = {
  padding: "12px",
  /** Card / panel surface — Box 16px (was 8px). */
  radius: "16px",
  gap: "12px",
  border: "1px solid var(--boe-token-stroke-stroke, #e8e8e8)",
  background: "var(--boe-token-surface-surface, #ffffff)",
  /** Content-sidebar-ish drawer width */
  drawerWidth: "340px",
} as const;

/**
 * Overlay / menu / flyout chrome — `mixins/_overlay.scss` + Menu.scss.
 */
export const boeOverlay = {
  /** Container pad — 3 × grid */
  padding: "12px",
  /** Menu / popover surface — Box 20px (was 8px). */
  radius: "20px",
  shadow: "0 4px 12px 0 rgb(0 0 0 / 10%)",
  border: "1px solid var(--boe-token-stroke-stroke, #e8e8e8)",
  /** Menu item — min-height 30; item radius 12px (Box). */
  itemPadding: "8px 48px 8px 8px",
  itemMinHeight: "30px",
  itemRadius: "12px",
  /** Modal — dialog radius 24px (Box; was 12px). */
  modalPadding: "30px",
  modalWidth: "460px",
  modalRadius: "24px",
  modalShadow: "0 1px 1px 1px rgb(0 0 0 / 5%)",
  modalTitleSize: "16px",
  modalBackdrop: "rgba(0, 0, 0, 0.75)",
} as const;

/**
 * Corner radii. box-open-elements tracks the **live Box web app** (Blueprint),
 * which ships pill-shaped controls and larger surface radii — captured from
 * `app.box.com` (see `docs/audits/box-webapp-reference.data.json`). This is an
 * intentional divergence from box-ui-elements' legacy SCSS geometry (4/6/8/12);
 * the Layer 1 audit records it as such.
 *
 * Role guide: `control` for buttons/inputs, `field` for search + dialogs, `nav`
 * for nav items, `large` for cards/panels, `med` for rows/small surfaces,
 * `size` for badges/checkboxes, `pill` for chips/toggles.
 */
export const boeRadius = {
  /** Badges, checkboxes, tiny chips — Box ~4px. */
  size: "4px",
  /** Rows, small surfaces, list-item hover — Box 12px (was 6px). */
  med: "12px",
  /** Cards, panels — Box 16px (was 8px). */
  large: "16px",
  /** Controls (buttons, inputs) + menus — Box 20px (was 12px). */
  xlarge: "20px",
  /** Interactive controls — buttons, inputs. Box pill radius 20px. */
  control: "20px",
  /** Large fields (search) + dialogs/modals — Box 24px. */
  field: "24px",
  /** Nav items — Box 28px. */
  nav: "28px",
  /** True pills — chips, toggles, label-pills. */
  pill: "999px",
} as const;

/** `$bdl-btn-height*` + related control metrics. */
export const boeControl = {
  height: "32px",
  heightLarge: "40px",
  paddingInline: "16px",
  /** Pill control radius — buttons/inputs. Box 20px. */
  radius: "20px",
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
    outline: 2px solid var(--boe-token-surface-surface-brand, #0061d5);
    outline-offset: 1px;
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    box-shadow: ${boeControl.inputInsetShadow};
  }

  ${selector}:disabled {
    opacity: ${boeControl.disabledOpacity};
    cursor: not-allowed;
  }
`;
