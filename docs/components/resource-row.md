# Resource row

`box-resource-row` presents a resource to select while keeping trailing actions
independent. It is not a listbox option: use it inside a normal list (`<ul>`
with each row in an `<li>`) when a row also has actions.

```html
<ul>
  <li>
    <box-resource-row label="Production Box" value="production" selected
      meta="Enterprise 12345&#10;Last checked today" status="Ready">
      <span slot="icon" aria-hidden="true">B/</span>
      <box-badge slot="status" label="Ready" tone="success"></box-badge>
      <button slot="actions" type="button" aria-label="Remove Production Box">Remove</button>
    </box-resource-row>
  </li>
</ul>
```

The inner selection button derives its accessible name from the visible label
and metadata. `aria-pressed` reports selection; `aria-describedby` references the visible
status without repeating the metadata. Slotted status text or label changes stay
current even when they follow a row update. Enter/Space activate it and emit `select` with `{ value }`; the host
sets `selected` after accepting that event. Actions in the `actions` slot keep
their own focus, name and events and never emit `select`. `disabled` disables
only selection; action availability remains the host's decision. `active` is a
visual emphasis, not a second keyboard-focus model. At container widths below
320px the status and actions move beneath the selection target.

The `status` text attribute is a non-interactive descriptor. A slotted status
badge is optional; if used, the component suppresses the duplicate plain-text
status. The selection button describes the visible slotted badge's `aria-label`, `label`, or text, falling back to the `status` attribute when no status element is slotted,
so hosts need not duplicate it.
