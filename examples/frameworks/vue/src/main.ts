import { createApp } from "vue";

import {
  applyDesignTokens,
  registerBoxDefaultDesignSystem,
} from "@unofficialbox/box-open-elements/foundations/tokens";
import "../../shared.css";
import App from "./App.vue";

registerBoxDefaultDesignSystem({ setActive: true });
applyDesignTokens(document.documentElement, "box-default");
createApp(App).mount("#app");
