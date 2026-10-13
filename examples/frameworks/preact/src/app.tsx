import { useState } from "preact/hooks";
import { Button, TextField, Select, Dialog, Combobox, Drawer, createWebComponent, ExplorerSelectionController, useExplorerSelectionController, type WebComponentProps } from "@unofficialbox/box-open-elements-preact";
export const controller = new ExplorerSelectionController();
controller.setItems([{ id: "a" }, { id: "b" }]);
export const calls: string[] = [];
export const openEvents: string[] = [];
export const refs: Record<string, HTMLElement> = {};
type ProbeElement = HTMLElement & { payload: { count: number }; items: string[] };
type ProbeProps = WebComponentProps & { payload: { count: number }; items: string[]; onExact?: (event: CustomEvent<number>) => void };
const Probe = createWebComponent<ProbeElement, ProbeProps>({ tagName: "boe-adapter-probe", propertyNames: ["payload", "items"], events: [{ propName: "onExact", eventName: "ExactCase" }], sync: (el, props) => { el.payload = props.payload; el.items = props.items; } });
export let update: (n: number) => void;
export let hide: () => void;
export let show: () => void;
export let transition: () => Promise<void>;
export function App(props: { initialOpen?: boolean } = {}) {
  const [n, setN] = useState(0);
  const [visible, setVisible] = useState(true);
  const [open, setOpen] = useState(Boolean(props.initialOpen));
  const [drawerOpen, setDrawerOpen] = useState(Boolean(props.initialOpen));
  const selection = useExplorerSelectionController(controller);
  update = setN; hide = () => setVisible(false); show = () => setVisible(true);
  transition = async () => { setN(30); setN(31); await Promise.resolve(); setN(32); setN(33); };
  return visible ? <form id="form"><TextField id="field" name="title" label="Title" value={String(n)} disabled={n === 2} required ref={el => { refs.field = el!; }} onValueChanged={event => calls.push("value:" + event.detail.value)} />
<Select id="select" label="Choose" options={[{ label: "Item " + n, value: "v" }]} value="v" ref={el => { refs.select = el!; }} />
<Button id="launch" label="Open dialog" onClick={() => setOpen(true)} ref={el => { refs.button = el!; }} />
<Dialog id="dialog" open={open} heading="Adapter dialog" onOpenChanged={event => { openEvents.push("dialog:" + event.detail.open); setOpen(event.detail.open); }} onCancel={event => { event.preventDefault(); calls.push("cancel"); }} ref={el => { refs.dialog = el!; }}><span slot="footer">Footer slot</span><p>Dialog child</p></Dialog>
<Probe id="probe" payload={{ count: n }} items={[String(n)]} ref={el => { refs.probe = el!; }} onExact={n === 4 ? undefined : event => { event.preventDefault(); calls.push("exact:" + n + ":" + event.detail); }} />
<Combobox id="combo" label="Search" options={[{ label: "Alpha " + n, value: "a", description: "First", group: "Letters" }, { label: "Disabled", value: "d", disabled: true }]} ref={el => { refs.combo = el!; }} onValueChanged={event => calls.push("combo:" + event.detail.value)} />
<Drawer id="drawer" open={props.initialOpen ? drawerOpen : undefined} onOpenChanged={event => { openEvents.push("drawer:" + event.detail.open); setDrawerOpen(event.detail.open); }} heading="Drawer proof" ref={el => { refs.drawer = el!; }}><Button id="drawer-button" label={"Action " + n} ref={el => { refs.drawerButton = el!; }} onClick={() => calls.push("drawer-click")} /><span slot="footer">Drawer footer</span></Drawer>
<output id="selection">{selection.selectedItemIds.join(",")}</output></form> : null;
}
