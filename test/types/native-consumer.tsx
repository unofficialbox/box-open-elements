import type { Path, Table, TextField } from "@unofficialbox/box-open-elements";
import type {} from "@unofficialbox/box-open-elements/native-types";
import type {} from "@unofficialbox/box-open-elements/react-jsx";

const path: Path = document.createElement("box-path");
const table: Table = document.createElement("box-table");
const field: TextField = document.createElement("box-text-field");

path.stages = [{ id: "draft", label: "Draft" }];
path.hasError = true;
table.rows = [{ id: "row-1", cells: { name: "Contract" } }];

table.addEventListener("selection-changed", event => {
  const selectedIds: string[] = event.detail.selectedIds;
  void selectedIds;
  // @ts-expect-error selectedIds are strings, not numbers
  const invalid: number[] = event.detail.selectedIds;
  void invalid;
});
field.addEventListener("value-changed", event => {
  const value: string = event.detail.value;
  void value;
});
document.createElement("box-datalist-item").addEventListener("select", event => {
  const value: string = event.detail.value;
  void value;
});
document.createElement("box-notification-bell").addEventListener("toggle", event => {
  const expanded: boolean = event.detail.expanded;
  void expanded;
});
document.createElement("box-toast").addEventListener("dismiss", event => {
  const source: "timeout" | "close-button" = event.detail.source;
  void source;
});

const view = <>
  <box-path stages={[{ id: "draft", label: "Draft" }]} hasError={true} />
  <box-table rows={[{ id: "row-1", cells: { name: "Contract" } }]}
    onselection-changed={event => { const ids: string[] = event.detail.selectedIds; void ids; }} />
  <box-resource-row selected={true} />
  <box-alert open={true} />
  <box-text-field onvalue-changed={event => { const value: string = event.detail.value; void value; }} />
  {/* @ts-expect-error stages must be structured records */}
  <box-path stages="draft" />
  {/* @ts-expect-error reflected booleans are not string values */}
  <box-resource-row selected="true" />
  {/* @ts-expect-error open is a boolean property */}
  <box-alert open="true" />
</>;

void view;

// Helper-dispatched and controller-forwarded events retain native payload types.
document.createElement("box-process-modeler").addEventListener("selection-changed", event => {
  const path: readonly (string | number)[] | null = event.detail.path;
  void path;
  // @ts-expect-error path is not a number
  const invalid: number = event.detail.path;
  void invalid;
});
document.createElement("box-form-wizard").addEventListener("submitted", event => {
  const values: Record<string, unknown> = event.detail.values;
  void values;
  // @ts-expect-error submitted does not carry a step index
  void event.detail.stepIndex;
});
document.createElement("box-form-wizard").addEventListener("step-changed", event => {
  const index: number = event.detail.stepIndex;
  void index;
});
const helperEvents = <>
  <box-process-modeler onselection-changed={event => { const path: readonly (string | number)[] | null = event.detail.path; void path; }} />
  <box-form-wizard onsubmitted={event => { const values: Record<string, unknown> = event.detail.values; void values; }}
    onstep-changed={event => { const index: number = event.detail.stepIndex; void index; }} />
</>;
void helperEvents;


const mixedModeler = document.createElement('box-process-modeler');
mixedModeler.selectItems([{ type: 'box', id: 'step' }, { type: 'line', id: 'edge' }, { type: 'note', id: 'reader' }]);
mixedModeler.addEventListener('process-selection-copy-request', event => {
  const items: readonly import('@unofficialbox/box-open-elements').ProcessSelectionItem[] | undefined = event.detail.selection;
  event.detail.refuse('Unsupported mixed capture');
  void items;
  // @ts-expect-error selection is a typed item array, not string IDs
  const invalid: readonly string[] | undefined = event.detail.selection;
  void invalid;
});


mixedModeler.addEventListener('move-request', event => {
  const id: string = event.detail.boxId;
  const x: number = event.detail.position.x;
  void id; void x;
});

const destructiveDialog = document.createElement("box-dialog");
destructiveDialog.confirmTone = "danger";
// @ts-expect-error only the supported confirmation tones are accepted
destructiveDialog.confirmTone = "warning";
