# Compact glyph actions

`box-icon-button` accepts SVG nodes in its named `icon` slot. This supports
tree-shakable library glyph exports without registering a design system.
Slotted content takes precedence; removing it restores the registered icon
or escaped text fallback selected by `icon`. The button's `label` remains
its accessible name; glyphs are decorative.

```ts
import { iconXBatsu } from "@unofficialbox/box-open-elements/foundations/icons/glyphs";
const template = document.createElement("template");
template.innerHTML = iconXBatsu; // trusted library glyph, not user HTML
const glyph = template.content.querySelector("svg")!;
glyph.setAttribute("slot", "icon");
const button = document.createElement("box-icon-button");
button.label = "Remove target";
button.size = "small";
button.variant = "quiet";
button.append(glyph);
```

Small buttons are 1.5rem (24px with the default root size). Quiet buttons have
transparent resting chrome, with visible hover and keyboard focus states.
`disabled` and existing tone behavior remain available.
