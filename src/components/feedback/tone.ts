/**
 * The status vocabulary shared by the feedback surfaces.
 *
 * `box-alert` and `box-toast` both state their tone in words for screen
 * readers, and both must say the *same* words: a reader who hears "In progress"
 * from an alert should not hear "Inprogress" from a toast reporting the same
 * thing. One definition is what keeps them in step.
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
