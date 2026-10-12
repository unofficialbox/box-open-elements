# Readonly text and selection

`box-text-field` and `box-text-area` support the boolean `readonly` attribute and
`.readonly` property, following `box-code-editor`'s existing property spelling.
They reflect it to the native control's `readOnly`. Readonly text stays enabled,
focusable, selectable, and included in FormData. Hosts can still update `.value`.
Setting `.readonly = false` removes the attribute and restores native editing.

Call `.select()` after connecting the element to focus and select the current
rendered native text, for example after showing a copy fallback:

```ts
import "@unofficialbox/box-open-elements/text-area";

const summary = document.createElement("box-text-area");
summary.label = "Run summary";
summary.value = "Synthetic run summary";
summary.readonly = true;
document.body.append(summary);
summary.select();
```

The method returns synchronously; the component queues no selection request. Native selection events keep their platform timing. Before initial connection,
while detached, or while disabled (including a native disabled fieldset), it is a
no-op. Native visibility/focusability and input-type selection behavior apply.
A focus listener that detaches/disables the control or explicitly moves focus
elsewhere is respected. Selecting text emits no component value-change event.

When composing pending form-state repairs, retain the authoritative-value
reconciliation contract: selection forwards to the current native value and
does not create a new host value write or overwrite an in-flight native edit.
