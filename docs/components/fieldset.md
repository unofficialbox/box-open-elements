# Fieldset labels

`box-fieldset` groups its slotted controls with a native legend. `hideLabel`
(`hide-label`) visually clips a provided legend while retaining its accessible
group name. It does not hide the controls or remove the legend from the DOM.

`labelCase` (`label-case`) accepts `"uppercase"` (the existing default) or
`"preserve"`, which displays names and identifiers in their supplied case.

```html
<box-fieldset label="box-admin" hide-label label-case="preserve">
  <box-text-field label="Name" value="box-admin"></box-text-field>
</box-fieldset>
```

Both options can be changed after connection. The default visible legend,
body spacing, disabled ownership, and description behavior are retained.
