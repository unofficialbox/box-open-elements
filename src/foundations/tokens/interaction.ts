/**
 * Shared interactive-state CSS snippets for Web Components.
 *
 * Batch 3 fidelity contract: every interactive control gets a brand
 * `:focus-visible` ring plus `:hover` / `:active` / `:disabled` using
 * `--boe-token-*` surfaces. Import these helpers into component style
 * blocks so the ring and hover language stay consistent.
 */

/**
 * Brand focus ring (WCAG 2.4.7). Theme-adaptive via surface-brand.
 * Uses an opaque brand fallback so keyboard focus stays high-contrast when
 * no design system has registered tokens yet.
 */
export const boeFocusRingShadow =
  "0 0 0 3px var(--boe-token-surface-surface-brand, #0061d5)";

/**
 * Neutral control surface states (buttons, chips, triggers, list rows).
 * `selector` should target the interactive part, e.g. `[part="trigger"]`.
 */
export const boeNeutralInteractiveStyles = (selector: string): string => `
  ${selector}:focus-visible {
    outline: none;
    box-shadow: ${boeFocusRingShadow};
  }

  ${selector}:hover:not(:disabled) {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
  }

  ${selector}:active:not(:disabled) {
    background: color-mix(in srgb, var(--boe-token-surface-surface-hover, #f4f4f4) 70%, var(--boe-token-surface-surface-secondary, #fbfbfb) 30%);
  }

  ${selector}:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    box-shadow: none;
  }
`;

/**
 * Brand/primary action surface states (confirm, submit, primary chips).
 */
export const boeBrandInteractiveStyles = (selector: string): string => `
  ${selector}:focus-visible {
    outline: none;
    box-shadow: ${boeFocusRingShadow};
  }

  ${selector}:hover:not(:disabled) {
    background: var(--boe-token-surface-surface-brand-hover, #006ae9);
  }

  ${selector}:active:not(:disabled) {
    background: var(--boe-token-surface-surface-brand-pressed, #004eac);
  }

  ${selector}:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    box-shadow: none;
  }
`;

/**
 * Focus ring only — for controls that already own hover/active styling
 * (native checkboxes, range inputs) or use a different hover treatment.
 */
export const boeFocusVisibleStyles = (selector: string): string => `
  ${selector}:focus-visible {
    outline: none;
    box-shadow: ${boeFocusRingShadow};
  }
`;
