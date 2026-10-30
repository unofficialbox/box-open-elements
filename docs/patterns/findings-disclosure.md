# Findings disclosure (#604)

Import `@unofficialbox/box-open-elements/findings-disclosure` or the governance pattern entry. `box-findings-disclosure` separates conclusions, corrected conclusions and limits without hiding the existence of a correction.

- `findings: string[]`: ordered conclusions. `leadCount` (`lead-count`) defaults to 1; the first n remain visible.
- `corrections: { field, was, now, why }[]`: the corrected field names remain visible even when collapsed. Expanded detail retains the original and revised conclusions and the reason.
- `limits: string[]`: statements of what the result does not establish.
- `expanded`: controlled boolean state. A native button toggles it and emits `expanded-changed` with `{ expanded }`.
- `heading` and `headingLevel` (`heading-level`, default 2): accessible section heading.

The toggle counts the additional findings, corrections and limits. One finding with no correction or limit has no toggle. A lead count of zero is allowed. A disclosure with only corrections still names those fields while collapsed.

Host strings are escaped text, not HTML. The native button supports Enter and Space; `aria-expanded` and `aria-controls` link it to the named details region. The word “Corrected” carries meaning without color. Tokens support local light/dark themes, and long labels wrap at narrow widths. Native properties/events and equivalent examples are available across all seven frameworks. Automated accessibility checks do not constitute manual screen-reader verification.
