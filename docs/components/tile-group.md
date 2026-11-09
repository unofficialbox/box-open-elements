# Tile group choices

`box-tile-group` uses native radios (or checkboxes with `multiple`). Keep the
primary `label` short; `description`, `meta` and `status` add context without
replacing the option's accessible name. For unavailable choices, include both
`disabled: true` and a `disabledReason` that explains what would enable them.

```html
<box-tile-group name="solution" legend="Choose a solution"></box-tile-group>
<script type="module">
  import "@unofficialbox/box-open-elements/tile-group";
  const group = document.querySelector("box-tile-group");
  group.options = [
    {
      id: "clm", label: "Contract workflows",
      description: "Manage contracts across Box and Salesforce.",
      meta: "Legal operations",
      status: { label: "Available", tone: "success" },
    },
    {
      id: "regulated", label: "Regulated workflows",
      description: "Additional compliance review required.",
      meta: "Enterprise", status: { label: "Coming soon", tone: "warning" },
      disabled: true, disabledReason: "Ask an administrator",
    },
  ];
</script>
```

The control's accessible name remains its label; description, metadata,
status and disabled reason are linked with `aria-describedby`. Disabled
choices remain visible and expose their reason, but cannot be selected. Long
metadata wraps on narrow screens rather than truncating the label.

The host participates in its owning form through `ElementInternals`. Each checked,
enabled option submits under `name`; `multiple` submits repeated entries. Empty
selection or an empty name submits nothing. Native shadow controls retain radio
and checkbox keyboard behavior. A native disabled fieldset, or the host's
`disabled` attribute, disables editing and omits the group from submission.
`form` can associate the host with a form by ID outside its ancestors. Form reset
restores the initial checked selection, including disabled choices, and state
restoration updates both the public value and checked controls.

## Compact choices

Use `layout="chips"` (or `group.layout = "chips"`) for short labels. Pills wrap
in wide containers. At container widths of 40rem or less they form one locally
scrolling row with an edge fade; its legend stays visible. The `options` part
identifies the scroll container. The fieldset can shrink without widening the
page. The default `layout="tiles"` retains the card grid.

```html
<box-tile-group name="scenario" legend="Scenario" layout="chips"
  options='[{"id":"baseline","label":"Baseline"},{"id":"optimized","label":"Optimized"}]'>
</box-tile-group>
```

Chip layout shows the label; description, metadata, status and disabled reason
remain in the native control's accessible description. Radio/checkbox keyboard
behavior, disabled choices, selection events and form submission are unchanged.
Use tiles when that extra context needs to be visible.

Selected choices expose both `tile` and `tile-selected` parts. Style
`::part(tile-selected)` after `::part(tile)` to retain a distinct selection
when overriding chip or tile borders and backgrounds.
