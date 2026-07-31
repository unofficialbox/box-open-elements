import { mount } from "svelte";

import {
  applyDesignTokens,
  registerBoxDefaultDesignSystem,
} from "@unofficialbox/box-open-elements/foundations/tokens";
import "../../shared.css";
import App from "./App.svelte";

registerBoxDefaultDesignSystem({ setActive: true });
applyDesignTokens(document.documentElement, "box-default");
mount(App, { target: document.querySelector("#app")! });
