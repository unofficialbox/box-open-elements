import { boeMotionDuration, boeMotionEasing } from "./tokens.js";
export const boeMotionStagger = "var(--boe-profile-motion-stagger, 50ms)";
export const boeEntranceKeyframes = `
@keyframes boe-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes boe-pop { from { opacity: 0; transform: scale(.8); } to { opacity: 1; transform: none; } }
@keyframes boe-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes boe-status-check { from { stroke-dashoffset: 20; } to { stroke-dashoffset: 0; } }
@keyframes boe-status-spin { to { transform: rotate(360deg); } }
`;
export const boeEntrance = (name: "rise" | "pop" | "fade-in" = "rise"): string =>
  `animation: boe-${name} ${boeMotionDuration.arrival} ${boeMotionEasing.enter} both;`;
export const boeStaggerStyles = `animation-delay: calc(var(--i, 0) * ${boeMotionStagger});`;
/** Put padding on a grandchild, not the collapsible child. Pair with inert. */
export const boeDisclosureStyles = (selector = ".boe-disclosure"): string => `
${selector} { display: grid; grid-template-rows: 0fr; transition: grid-template-rows ${boeMotionDuration.panel} ${boeMotionEasing.enter}; }
${selector}[data-open] { grid-template-rows: 1fr; }
${selector} > * { min-height: 0; overflow: hidden; padding-block: 0; }
`;
/** Include in document and shadow styles: media rules do not cross shadow roots. */
export const boeReducedMotionPolicy = `
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important;
    animation-delay: 0ms !important; transition-duration: 1ms !important; transition-delay: 0ms !important; scroll-behavior: auto !important; }
}
`;
