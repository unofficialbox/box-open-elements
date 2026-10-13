import { hydrate, render } from "preact";
import { App, update, hide, show, transition, refs, calls, openEvents, controller } from "./app.js";
import { acceptance } from "../../jsx-acceptance.js";
const initialOpen = location.pathname.includes("initial-");
const root = document.getElementById("app")!;
const serverHosts = Array.from(root.querySelectorAll("box-text-field, box-select, box-button, box-dialog, box-combobox, box-drawer, boe-adapter-probe"));
if (root.hasChildNodes()) hydrate(<App initialOpen={initialOpen} />, root); else render(<App initialOpen={initialOpen} />, root);
const dispose = () => render(null, root);
Object.assign(window, { runAcceptance: async () => {
  if (serverHosts.some(host => host !== document.getElementById(host.id))) throw new Error("Hydration replaced a server host");
  if (initialOpen) {
    if (openEvents.filter(value => value === "dialog:true").length !== 1 || openEvents.filter(value => value === "drawer:true").length !== 1) throw new Error("Initial open-changed events were lost or duplicated");
    if (!refs.dialog.hasAttribute("open") || !refs.drawer.hasAttribute("open")) throw new Error("Initial overlay props were not applied");
    Object.assign(refs.dialog, { open: false }); Object.assign(refs.drawer, { open: false });
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  }
  return acceptance({ update, hide, show, transition, refs, calls, controller, dispose });
} });
