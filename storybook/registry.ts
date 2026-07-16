import type { StoryModule } from "./metadata.js";
import button from "./stories/button.stories.js";
import iconButton from "./stories/icon-button.stories.js";
import linkButton from "./stories/link-button.stories.js";
import badge from "./stories/badge.stories.js";
import chip from "./stories/chip.stories.js";
import alert from "./stories/alert.stories.js";
import emptyState from "./stories/empty-state.stories.js";
import helpText from "./stories/help-text.stories.js";
import spinner from "./stories/spinner.stories.js";
import progressBar from "./stories/progress-bar.stories.js";
import toast from "./stories/toast.stories.js";
import switchStory from "./stories/switch.stories.js";
import checkbox from "./stories/checkbox.stories.js";
import searchField from "./stories/search-field.stories.js";
import textField from "./stories/text-field.stories.js";
import dialog from "./stories/dialog.stories.js";
import tooltip from "./stories/tooltip.stories.js";
import illustration from "./stories/illustration.stories.js";

/**
 * The authored story set. Add a story module here to include it in the
 * workshop and its extracted JSON. Expand with attribute-stable reference
 * surfaces so docs-site Usage cards stay real (see docs/workshop/storybook.md).
 */
export const storyModules: StoryModule[] = [
  button,
  iconButton,
  linkButton,
  badge,
  chip,
  alert,
  emptyState,
  helpText,
  spinner,
  progressBar,
  toast,
  switchStory,
  checkbox,
  searchField,
  textField,
  dialog,
  tooltip,
  illustration,
];
