import { hydrate, render } from "solid-js/web";
import { App, update, hide, show, transition, refs, calls, controller } from "./app.js";
import { acceptance } from "../../jsx-acceptance.js";
const root = document.getElementById("app")!;
const serverHosts = Array.from(root.querySelectorAll("box-text-field, box-select, box-button, box-dialog, box-combobox, box-drawer, boe-adapter-probe"));
const dispose = root.hasChildNodes() ? hydrate(() => <App />, root) : render(() => <App />, root);
Object.assign(window, { runAcceptance: () => {
  if (serverHosts.some(host => host !== document.getElementById(host.id))) throw new Error("Hydration replaced a server host");
  return acceptance({ update, hide, show, transition, refs, calls, controller, dispose });
} });
