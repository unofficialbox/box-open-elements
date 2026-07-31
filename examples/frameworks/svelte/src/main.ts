import { mount } from "svelte";

import { Button } from "@unofficialbox/box-open-elements/button";
import "@unofficialbox/box-open-elements/select";
import "@unofficialbox/box-open-elements/text-field";
import {
  applyDesignTokens,
  registerBoxDefaultDesignSystem,
} from "@unofficialbox/box-open-elements/foundations/tokens";
import "../../shared.css";
import App from "./App.svelte";

registerBoxDefaultDesignSystem({ setActive: true });
applyDesignTokens(document.documentElement, "box-default");
Button.register();
Button.register();

mount(App, { target: document.querySelector("#app")! });
