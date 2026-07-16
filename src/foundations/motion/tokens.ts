/**
 * Shared motion vocabulary for shadow styles.
 *
 * Components should prefer these constants (or the CSS snippets below) over
 * hard-coded duration/easing literals so timing stays consistent and
 * prefers-reduced-motion policy is one place to update.
 */

export const boeMotionDuration = {
  /** Hover / focus / color transitions */
  fast: "120ms",
  /** Opacity / layout micro-transitions */
  medium: "160ms",
  /** Panel expand / collapse */
  slow: "240ms",
  /** Indeterminate spinner rotation */
  spin: "0.8s",
  /** Skeleton shimmer cycle */
  shimmer: "1.4s",
} as const;

export const boeMotionEasing = {
  standard: "ease",
  enter: "ease-out",
  exit: "ease-in",
  linear: "linear",
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
