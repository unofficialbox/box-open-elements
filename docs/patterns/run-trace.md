# Run Trace density and geometry

`box-run-trace` shows a machine run in execution order. Use `density="compact"`
for a tighter operational trace; the default density keeps the existing rhythm.
Both densities preserve the same statuses, detail controls, and accessible text.

```html
<box-run-trace heading="Upload run" density="compact" class="operations-trace"></box-run-trace>
```

```css
.operations-trace {
  --boe-run-trace-marker-column-width: 1.25rem;
  --boe-run-trace-marker-size: 1rem;
  --boe-run-trace-step-padding-block: 0.3rem;
  --boe-run-trace-step-row-gap: 0.15rem;
  --boe-run-trace-child-row-gap: 0.2rem;
}
```

The connector's inline center is derived from the marker column width and
inline inset. Its start follows the step padding, marker offset, the visible
glyph centered in its column, and the start gap; its end extends across any
inter-step gap. Consumers can change density without styling the internal
connector pseudo-element.

| Custom property | Controls |
| --- | --- |
| `--boe-run-trace-marker-column-width` | Width reserved for the marker and connector spine |
| `--boe-run-trace-marker-size` | Visible status glyph size |
| `--boe-run-trace-marker-inline-inset` | Marker-column inset from the step edge |
| `--boe-run-trace-marker-block-offset` | Marker position below the step's top padding |
| `--boe-run-trace-step-padding-block` | Vertical space within each step row |
| `--boe-run-trace-step-row-gap` | Space between step rows; the connector spans it |
| `--boe-run-trace-step-column-gap` | Space between marker column and body |
| `--boe-run-trace-child-row-gap` | Space between child-task rows |
| `--boe-run-trace-connector-start-gap` | Space between the marker and connector start |
| `--boe-run-trace-connector-end-overhang` | Connector extension below a step, before the next marker |

Set these on `box-run-trace` (or an ancestor) to override either preset. Keep
marker size no larger than marker column width; otherwise the glyph can spill
into the text column. The `plain` variant intentionally hides connectors.
