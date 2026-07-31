import { render } from "svelte/server";
import { Button, Dialog } from "@unofficialbox/box-open-elements-svelte";

const button = render(Button, { props: { label: "Server button" } });
const dialog = render(Dialog, {
  props: { open: false, heading: "Server dialog" },
});

if (!button.body.includes("<box-button") || !dialog.body.includes("<box-dialog")) {
  throw new Error(`Unexpected Svelte SSR output: ${button.body} ${dialog.body}`);
}

console.log("Svelte adapter SSR hosts rendered successfully.");
