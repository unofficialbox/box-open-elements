import {
  boxGeneratedIconCounts,
  boxGeneratedIconMetadata,
  boxGeneratedIcons,
  boxGeneratedIconKeys,
} from "./box-iconography.generated.js";

const aliasToKey = {
  "+": "plus",
  "-": "minus",
  "⋯": "6-dots",
  alert: "exclamation-mark",
  bell: "bell",
  calendar: "calendar",
  check: "check",
  checkmark: "checkmark",
  download: "download",
  ellipsis: "6-dots",
  filter: "funnel",
  folder: "folder",
  funnel: "funnel",
  gear: "gear",
  home: "home",
  link: "link",
  lock: "lock",
  metadata: "metadata",
  minus: "minus",
  person: "person",
  plus: "plus",
  search: "magnifying-glass",
  settings: "gear",
  upload: "upload",
  user: "user-primary",
} as const;

export const boxIconographyAliases = Object.fromEntries(
  Object.entries(aliasToKey)
    .map(([alias, key]) => {
      const iconMarkup = boxGeneratedIcons[key];
      return iconMarkup ? [alias, iconMarkup] : null;
    })
    .filter((entry): entry is [string, string] => Boolean(entry)),
);

export const boxIconography = {
  ...boxGeneratedIcons,
  ...boxIconographyAliases,
} as const;

export {
  boxGeneratedIconCounts,
  boxGeneratedIconKeys,
  boxGeneratedIconMetadata,
  boxGeneratedIcons,
};
