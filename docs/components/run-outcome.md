# Run outcome surfaces

`box-verdict-banner` communicates a finished run's outcome. Use `tone="passed"`,
`"missed"` or `"none"`; colour is paired with a glyph and an explicit heading.
Set `heading-level` (1–6) to fit the host page outline. `reasons` is a string
array property; plain text is used, never HTML. One `action` slot holds the
primary next action. A passed/missed heading is announced politely once when
the banner first appears; subsequent rerenders do not repeat it.

```ts
import { VerdictBanner } from "@unofficialbox/box-open-elements/verdict-banner";
const banner = document.querySelector("box-verdict-banner") as VerdictBanner;
banner.tone = "missed";
banner.heading = "Missed 1 of 2 targets";
banner.reasons = ["3% of step executions failed; target was below 1%."];
```

`box-mode-indicator` states where the *next* run goes, independently of the
latest run's verdict. `mode="dry"` shows “Dry run”; `mode="live"` shows “Live”.
Set `detail` for the target and `name-prefix` (default “Next run”) for the
accessible name. `interactive` makes the indicator a button that emits
`activate`; the host navigates to its mode-setting UI. It is at least 24px
tall. Initial rendering is silent; subsequent mode changes are announced
politely. `live-stripe` adds a local top stripe for prominent live-mode warning;
page-wide treatment remains a host decision.

```html
<box-mode-indicator mode="dry" detail="simulated Box"
  name-prefix="Next run" interactive></box-mode-indicator>
```

Both components stack or truncate supplementary content inside narrow
containers without hiding the primary outcome/mode text. Use the live docs
examples to check light and dark themes at 320px.
