# Disclosure and text actions

Use `box-button tone="text"` for in-place actions inside prose or hints. It
remains a native button, with the shared focus ring and loading/disabled
behavior. Use LinkButton for navigation, not an action without an href.

Accordion keeps its existing single-open `value` behavior. Opt into independent
panels with `multiple` and `values` (a property array or JSON attribute).
Interaction emits `values-changed` with `{ values: string[] }` in this mode;
single-open mode still emits `value-changed`.

```html
<box-accordion multiple values='["options","hosts"]'
  items='[{"label":"More options","summary":"api.box.com","value":"options"},{"label":"Other hosts","summary":"none","value":"hosts"}]'>
  <div slot="panel-options">Rich options content</div>
  <div slot="panel-hosts">Host settings</div>
</box-accordion>
```

`summary` is secondary plain text in the trigger. Reassign `items` when summaries
change; open state is preserved. Rich panel slots remain `panel-{value}`. The
label and summary are escaped, never interpreted as markup. Multiple mode
starts closed unless `values` is supplied; single-open defaults are unchanged.
