/**
 * Shared motion vocabulary for shadow styles.
 *
 * Components should prefer these constants (or the CSS snippets below) over
 * hard-coded duration/easing literals so timing stays consistent and
 * prefers-reduced-motion policy is one place to update.
 */

export const boeMotionDuration = {
  /** Quick accent transitions (charts, micro-feedback) */
  fast: "var(--boe-profile-motion-fast, 120ms)",
  /**
   * Dominant interactive paint duration across catalog controls
   * (background / border / color / box-shadow on hover and press).
   */
  interactive: "var(--boe-profile-motion-interactive, 140ms)",
  /** Opacity / layout micro-transitions */
  medium: "var(--boe-profile-motion-medium, 160ms)",
  /** Panel expand / collapse */
  slow: "var(--boe-profile-motion-slow, 240ms)",
  /** Indeterminate spinner rotation */
  spin: "var(--boe-profile-motion-spin, 0.8s)",
  /** Skeleton shimmer cycle */
  shimmer: "var(--boe-profile-motion-shimmer, 1.4s)",
} as const;

export const boeMotionEasing = {
  standard: "var(--boe-profile-easing-standard, ease)",
  enter: "var(--boe-profile-easing-enter, ease-out)",
  exit: "var(--boe-profile-easing-exit, ease-in)",
  linear: "var(--boe-profile-easing-linear, linear)",
} as const;

export type BoeMotionDuration = (typeof boeMotionDuration)[keyof typeof boeMotionDuration];
export type BoeMotionEasing = (typeof boeMotionEasing)[keyof typeof boeMotionEasing];

/** CSS transition shorthand using the shared vocabulary. */
export const boeTransition = (
  property: string,
  duration: BoeMotionDuration = boeMotionDuration.fast,
  easing: BoeMotionEasing = boeMotionEasing.standard,
): string => `${property} ${duration} ${easing}`;

/**
 * Wrap rules that should change under `prefers-reduced-motion: reduce`.
 * Pass the full declaration block (including trailing semicolons).
 */
export const boeReducedMotionStyles = (selector: string, declarations: string): string => `
@media (prefers-reduced-motion: reduce) {
  ${selector} {
    ${declarations}
  }
}
`;
