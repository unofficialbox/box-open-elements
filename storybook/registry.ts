import type { StoryModule } from "./metadata.js";
import button from "./stories/button.stories.js";
import iconButton from "./stories/icon-button.stories.js";
import badge from "./stories/badge.stories.js";
import chip from "./stories/chip.stories.js";
import alert from "./stories/alert.stories.js";
import spinner from "./stories/spinner.stories.js";
import progressBar from "./stories/progress-bar.stories.js";
import switchStory from "./stories/switch.stories.js";
import checkbox from "./stories/checkbox.stories.js";

/**
 * The authored story set. Add a story module here to include it in the
 * workshop and its extracted JSON. Kept intentionally narrow (a pilot across
 * Actions / Feedback / Forms) per docs/workshop/storybook.md.
 */
export const storyModules: StoryModule[] = [
  button,
  iconButton,
  badge,
  chip,
  alert,
  spinner,
  progressBar,
  switchStory,
  checkbox,
];
