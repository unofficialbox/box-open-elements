import { defineComponent, h, type PropType } from "vue";
import { Select as SelectElement } from "@unofficialbox/box-open-elements/select";
import { useWebComponent } from "./adapter.js";
import type { ValueChangedEvent } from "./text-field.js";

SelectElement.register();

export type SelectOption = { label: string; value: string };

/** Typed Vue wrapper for `<box-select>`, including structured options. */
export const Select = defineComponent({
  name: "Select",
  inheritAttrs: false,
  props: {
    label: String,
    value: String,
    options: Array as PropType<SelectOption[]>,
    disabled: Boolean,
    name: String,
    invalid: Boolean,
    errorMessage: String,
  },
  emits: {
    "value-changed": (_event: ValueChangedEvent) => true,
  },
  setup(props, { attrs, slots, emit, expose }) {
    const element = useWebComponent<SelectElement>(
      host => {
        if (props.label !== undefined) host.label = props.label;
        if (props.value !== undefined) host.value = props.value;
        if (props.options !== undefined) host.options = props.options;
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
    return () => h("box-select", { ...attrs, ref: element }, slots.default?.());
  },
});
