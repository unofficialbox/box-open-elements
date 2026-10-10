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
