import type { StoryModule } from "./metadata.js";
import button from "./stories/button.stories.js";
import buttonGroup from "./stories/button-group.stories.js";
import iconButton from "./stories/icon-button.stories.js";
import linkButton from "./stories/link-button.stories.js";
import menu from "./stories/menu.stories.js";
import menuItem from "./stories/menu-item.stories.js";
import segmentedControl from "./stories/segmented-control.stories.js";
import badge from "./stories/badge.stories.js";
import chip from "./stories/chip.stories.js";
import alert from "./stories/alert.stories.js";
import emptyState from "./stories/empty-state.stories.js";
import errorMask from "./stories/error-mask.stories.js";
import helpText from "./stories/help-text.stories.js";
import nudge from "./stories/nudge.stories.js";
import spinner from "./stories/spinner.stories.js";
import progressBar from "./stories/progress-bar.stories.js";
import progressRing from "./stories/progress-ring.stories.js";
import progressSteps from "./stories/progress-steps.stories.js";
import skeleton from "./stories/skeleton.stories.js";
import toast from "./stories/toast.stories.js";
import switchStory from "./stories/switch.stories.js";
import checkbox from "./stories/checkbox.stories.js";
import checkboxGroup from "./stories/checkbox-group.stories.js";
import radioGroup from "./stories/radio-group.stories.js";
import searchField from "./stories/search-field.stories.js";
import textField from "./stories/text-field.stories.js";
import textArea from "./stories/text-area.stories.js";
import numberInput from "./stories/number-input.stories.js";
import dateField from "./stories/date-field.stories.js";
import select from "./stories/select.stories.js";
import combobox from "./stories/combobox.stories.js";
import multiSelect from "./stories/multi-select.stories.js";
import dropdown from "./stories/dropdown.stories.js";
import rating from "./stories/rating.stories.js";
import slider from "./stories/slider.stories.js";
import spinButton from "./stories/spin-button.stories.js";
import calendar from "./stories/calendar.stories.js";
import categorySelector from "./stories/category-selector.stories.js";
import dualListbox from "./stories/dual-listbox.stories.js";
import rangeSlider from "./stories/range-slider.stories.js";
import tagInput from "./stories/tag-input.stories.js";
import timeField from "./stories/time-field.stories.js";
import dialog from "./stories/dialog.stories.js";
import drawer from "./stories/drawer.stories.js";
import popover from "./stories/popover.stories.js";
import tooltip from "./stories/tooltip.stories.js";
import illustration from "./stories/illustration.stories.js";
import avatar from "./stories/avatar.stories.js";
import persona from "./stories/persona.stories.js";
import contactDatalistItem from "./stories/contact-datalist-item.stories.js";
import card from "./stories/card.stories.js";
import carousel from "./stories/carousel.stories.js";
import datalistItem from "./stories/datalist-item.stories.js";
import pagination from "./stories/pagination.stories.js";
import tree from "./stories/tree.stories.js";
import divider from "./stories/divider.stories.js";
import dropZone from "./stories/drop-zone.stories.js";
import section from "./stories/section.stories.js";
import tabs from "./stories/tabs.stories.js";
import accordion from "./stories/accordion.stories.js";
import sharePanel from "./stories/share-panel.stories.js";
import fileRequestBuilder from "./stories/file-request-builder.stories.js";
import reviewQueueItem from "./stories/review-queue-item.stories.js";
import metricCard from "./stories/metric-card.stories.js";

/**
 * The authored story set. Add a story module here to include it in the
 * workshop and its extracted JSON. Expand with attribute-stable reference
 * surfaces so docs-site Usage cards stay real (see docs/workshop/storybook.md).
 */
export const storyModules: StoryModule[] = [
  button,
  buttonGroup,
  iconButton,
  linkButton,
  menu,
  menuItem,
  segmentedControl,
  badge,
  chip,
  alert,
  emptyState,
  errorMask,
  helpText,
  nudge,
  spinner,
  progressBar,
  progressRing,
  progressSteps,
  skeleton,
  toast,
  switchStory,
  checkbox,
  checkboxGroup,
  radioGroup,
  searchField,
  textField,
  textArea,
  numberInput,
  dateField,
  select,
  combobox,
  multiSelect,
  dropdown,
  rating,
  slider,
  spinButton,
  calendar,
  categorySelector,
  dualListbox,
  rangeSlider,
  tagInput,
  timeField,
  dialog,
  drawer,
  popover,
  tooltip,
  illustration,
  avatar,
  persona,
  contactDatalistItem,
  card,
  carousel,
  datalistItem,
  pagination,
  tree,
  divider,
  dropZone,
  section,
  tabs,
  accordion,
  sharePanel,
  fileRequestBuilder,
  reviewQueueItem,
  metricCard,
];
