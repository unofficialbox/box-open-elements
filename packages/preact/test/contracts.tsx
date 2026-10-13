import { Button, TextField, Select, Dialog } from "../src/index.js";
const controls = <>
  <Button disabled={false} onClick={event => { event.currentTarget.focus(); event.preventDefault(); }} />
  <TextField value="hello" onValueChanged={event => { const value: string = event.detail.value; event.currentTarget.value = value; }} ref={element => element?.focus()} />
  <Select options={[{ label: "One", value: "1" }]} />
  <Dialog open={false} onCancel={event => event.preventDefault()}><span slot="footer">Footer</span></Dialog>
</>;
// @ts-expect-error boolean control properties are not string attributes
const badBoolean = <TextField disabled="false" />;
// @ts-expect-error structured options must contain string values
const badOptions = <Select options={[{ label: "One", value: 1 }]} />;
// @ts-expect-error event payload stays typed
const badEvent = <TextField onValueChanged={event => { const value: number = event.detail.value; }} />;
void [controls, badBoolean, badOptions, badEvent];
