# Current Box visual reference contract

Status: active implementation reference for the [Box design-fidelity reconciliation](./box-design-fidelity-reconciliation.md).

The machine-readable source is [`tools/preview/box-visual-reference.json`](../../tools/preview/box-visual-reference.json). It records only visual measurements and source provenance; it stores no credentials or customer content.

## Precedence

1. Authenticated current Box is the appearance oracle.
2. `box-ui-elements` at commit `c5e0f55a948f3ff2532d8012b60506784ebdfa2b` supplies anatomy, behavior, accessibility, and legacy SCSS precedent.
3. Local contracts preserve package and framework boundaries.

If current Box and BUE differ visually, current Box wins. A component with no direct current-Box or BUE analogue must still derive from the shared role grammar instead of inventing isolated geometry.

## Role summary

| Role | Contract |
| --- | --- |
| Typography | `InterVariable, Inter, "Helvetica Neue", Helvetica, Arial, sans-serif`; page heading `21/32` bold; dialog heading `19/24` bold; buttons `16/24` bold; menu `15/20`; file rows `14/20` |
| Control heights | Compact `32px`; default `40px`; global search `48px` |
| Buttons | Flat; `20px` radius at 40px height; primary `#0061d5`; secondary white with `1px rgba(0,0,0,.12)` |
| Toggle | `44×24px`, 40px radius, 2px inset |
| File row | `56px` high; 12px radius; transparent rest/hover; hover shadow `0 1px 4px rgba(0,0,0,.1)`; selected `#f2f7fd` / `#002756` |
| Menu | 251px wide; 12px padding; 20px radius; `1px #e8e8e8`; shallow `0 1px 4px` shadow |
| Menu item | 40px high; 6px padding; 12px radius; `15/20` text |
| Dialog | 480px wide; 24px radius; 40px close control; `#e8e8e8` separators |
| Tabs | Transparent selected surface, dark bold label, brand underline |
| Current sidebar item | `224×40px`; 28px radius; `#004eac` with white content |

## Usage rules

- Use role values, not a universal radius or universal selected style.
- Inter/InterVariable is the target typeface. The inspected live surface computed to Lato, but Lato is reserved for a future explicit legacy BUE context rather than the default repo contract.
- Flat surfaces are the default. Gradients, literal-white inset highlights, and colored shadows require a recorded production reference.
- Focus, hover, active, selected/current, checked, disabled, loading, empty, and error are separate states.
- Use the generated Box icon/illustration inventory rather than text glyphs.
- Update the JSON and this summary together when a dated remeasurement changes a role.
- The reference contract describes the target. Deterministic specimens in `tools/preview/state-matrix.html` expose the current implementation and are expected to show gaps until remediation slices close them.
