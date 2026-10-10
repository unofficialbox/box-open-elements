// This compilation unit has one opt-in import and no root/native-types import.
// It must compile independently, so another fixture cannot mask missing imports.
import type {} from "@unofficialbox/box-open-elements/react-jsx";

const annotation: HTMLElementTagNameMap["box-annotation-thread"] = document.createElement("box-annotation-thread");
annotation.addEventListener("entry-submitted", event => {
  const body: string = event.detail.body;
  const reply: string | null = event.detail.inReplyToId;
  void [body, reply];
  // @ts-expect-error inherited event details are not untyped
  const invalid: number = event.detail.body;
  void invalid;
});
document.createElement("box-document-list").addEventListener("document-selected", event => {
  const id: string | undefined = event.detail.id;
  void id;
  // @ts-expect-error this inherited event has no selectedIds array
  void event.detail.selectedIds;
});
document.createElement("box-chip").addEventListener("select", event => {
  const selected: boolean = event.detail.selected;
  void selected;
});
document.createElement("box-resource-row").addEventListener("select", event => {
  const value: string = event.detail.value;
  void value;
  // @ts-expect-error same event name, different element-specific detail
  void event.detail.selected;
});

const view = <>
  <box-path stages={[{ id: "draft", label: "Draft" }]} hasError={false} />
  <box-table rows={[{ id: "r", cells: { name: "Document" } }]} />
  <box-document-list items={[{ id: "d", name: "Document" }]}
    labels={{ pass: "Accepted" }} selectableDocuments={true}
    ondocument-selected={event => { const id: string | undefined = event.detail.id; void id; }} />
  <box-explorer-items controller={null} itemGesture="split" />
  <box-annotation-thread heading="Review" composable={true}
    entries={[{ id: "c", author: "Reader", body: "Comment", toolLabel: "Highlight" }]}
    onentry-submitted={event => { const body: string = event.detail.body; void body; }} />
  <box-formatted-file-size value="1024" locale="de-DE" />
  <box-text-field required={true} invalid={false} errorMessage="Check the value" />
  <box-chip onselect={event => { const selected: boolean = event.detail.selected; void selected; }} />
  <box-resource-row selected={true} onselect={event => {
    const value: string = event.detail.value; void value;
    // @ts-expect-error select payloads must not bleed across elements
    void event.detail.selected;
  }} />
  <box-alert open={true} />
  {/* @ts-expect-error items must be structured records */}
  <box-document-list items="documents" />
  {/* @ts-expect-error rows must be structured records */}
  <box-table rows="rows" />
  {/* @ts-expect-error hasError is a reflected boolean property */}
  <box-path hasError="true" />
  {/* @ts-expect-error subclass overrides retain their precise property type */}
  <box-annotation-thread entries={[{ id: "c", author: "Reader", body: "Comment", toolLabel: 3 }]} />
  {/* @ts-expect-error inherited locale remains a string */}
  <box-formatted-file-size locale={42} />
</>;
void view;
