import { defineComponent, h } from "vue";
import { TextField as TextFieldElement } from "@unofficialbox/box-open-elements/text-field";
import { useWebComponent } from "./adapter.js";

TextFieldElement.register();

export type ValueChangedDetail = { value: string };
export type ValueChangedEvent = CustomEvent<ValueChangedDetail>;

/** Typed Vue wrapper for `<box-text-field>`. */
export const TextField = defineComponent({
  name: "TextField",
  inheritAttrs: false,
  props: {
    label: String,
    value: String,
    placeholder: String,
    disabled: Boolean,
    name: String,
    invalid: Boolean,
    errorMessage: String,
  },
  emits: {
    "value-changed": (_event: ValueChangedEvent) => true,
  },
  setup(props, { attrs, slots, emit, expose }) {
    const element = useWebComponent<TextFieldElement>(
      host => {
        if (props.label !== undefined) host.label = props.label;
        if (props.value !== undefined) host.value = props.value;
        if (props.placeholder !== undefined) host.placeholder = props.placeholder;
        if (props.name !== undefined) host.name = props.name;
        if (props.errorMessage !== undefined) host.errorMessage = props.errorMessage;
        host.disabled = props.disabled;
        host.invalid = props.invalid;
      },
      [{
        eventName: "value-changed",
        listener: event => emit("value-changed", event as ValueChangedEvent),
      }],
    );
    expose({ get element() { return element.value; } });
    return () => h("box-text-field", { ...attrs, ref: element }, slots.default?.());
  },
});
