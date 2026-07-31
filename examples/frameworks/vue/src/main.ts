import { createApp } from "vue";

import { Button } from "@unofficialbox/box-open-elements/button";
import "@unofficialbox/box-open-elements/select";
import "@unofficialbox/box-open-elements/text-field";
import {
  applyDesignTokens,
  registerBoxDefaultDesignSystem,
} from "@unofficialbox/box-open-elements/foundations/tokens";
import "../../shared.css";
import App from "./App.vue";

registerBoxDefaultDesignSystem({ setActive: true });
applyDesignTokens(document.documentElement, "box-default");
Button.register();
Button.register();

createApp(App).mount("#app");
