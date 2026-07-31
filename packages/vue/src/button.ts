import { defineComponent, h } from "vue";
import { Button as ButtonElement } from "@unofficialbox/box-open-elements/button";
import { useWebComponent } from "./adapter.js";

ButtonElement.register();

/** Typed Vue wrapper for `<box-button>`. */
export const Button = defineComponent({
  name: "Button",
  inheritAttrs: false,
  props: {
    label: String,
    tone: String,
    size: String,
    disabled: Boolean,
  },
  setup(props, { attrs, slots, expose }) {
    const element = useWebComponent<ButtonElement>(host => {
      if (props.label !== undefined) host.label = props.label;
      if (props.tone !== undefined) host.tone = props.tone;
      if (props.size !== undefined) host.size = props.size;
      host.disabled = props.disabled;
    });
    expose({ get element() { return element.value; } });
    return () => h("box-button", { ...attrs, ref: element }, slots.default?.());
  },
});
