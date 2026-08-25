/**
 * The status vocabulary shared by the feedback surfaces.
 *
 * `box-alert` and `box-toast` both state their tone in words for screen
 * readers, and both must say the *same* words: a reader who hears "In progress"
 * from an alert should not hear "Inprogress" from a toast reporting the same
 * thing. One definition is what keeps them in step.
 *
 * The glyphs live here for the same reason. Both surfaces render them, and a
 * success tick that differs between an alert and a toast reporting the same
 * outcome is a defect a reader would notice before either team did.
 */

/**
 * The tone as a word, for assistive technology.
 *
 * Tone is otherwise carried by fill and glyph, neither of which reaches a
 * screen reader. An unrecognised tone is title-cased rather than dropped —
 * a host that invents a tone should still get something spoken.
 */
export const toneAccessibleLabel = (tone: string): string => {
  switch (tone) {
    case "success":
      return "Success";
    case "error":
      return "Error";
    case "warning":
      return "Warning";
    case "inprogress":
      return "In progress";
    case "info":
      return "Info";
    default:
      return tone.charAt(0).toUpperCase() + tone.slice(1);
  }
};

/**
 * Status glyphs, one per tone.
 *
 * These surfaces are read at a glance, often out of the corner of an eye, so
 * the shape has to carry the meaning before the colour does — a round tick and
 * a warning triangle are distinguishable to a reader who cannot separate green
 * from amber. That matters most where the fill is faint: `box-alert` tints its
 * background by only 10%, which on its own is a weak signal.
 *
 * Literal markup, never author input, so innerHTML is safe here.
 */
export const TONE_ICONS: Record<string, string> = {
  info: `<svg viewBox="0 0 20 20" fill="currentColor" focusable="false"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 3.4a1.15 1.15 0 110 2.3 1.15 1.15 0 010-2.3zM11.1 15H8.9V9.3h2.2V15z"/></svg>`,
  success: `<svg viewBox="0 0 20 20" fill="currentColor" focusable="false"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm4.06 5.86-5 5.2a1 1 0 01-1.44 0L5.94 11.3A1 1 0 117.38 9.9l1.04 1.08 4.28-4.52a1 1 0 011.36 1.38z"/></svg>`,
  warning: `<svg viewBox="0 0 20 20" fill="currentColor" focusable="false"><path d="M9.13 2.6 1.4 15.9a1 1 0 00.87 1.5h15.46a1 1 0 00.87-1.5L10.87 2.6a1 1 0 00-1.74 0zM11.1 15.4H8.9v-2.2h2.2v2.2zm0-3.4H8.9V7.6h2.2V12z"/></svg>`,
  error: `<svg viewBox="0 0 20 20" fill="currentColor" focusable="false"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 2c1.29 0 2.48.41 3.46 1.1L5.1 13.46A6 6 0 0110 4zm0 12c-1.29 0-2.48-.41-3.46-1.1l8.36-8.36A6 6 0 0110 16z"/></svg>`,
};

/** The tone glyph, falling back to the info mark for an unknown tone. */
export const toneIcon = (tone: string): string => TONE_ICONS[tone] ?? TONE_ICONS.info!;
