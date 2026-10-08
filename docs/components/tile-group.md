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
