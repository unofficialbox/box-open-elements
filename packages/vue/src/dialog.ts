import { defineComponent, h, type PropType } from "vue";
import { Dialog as DialogElement } from "@unofficialbox/box-open-elements/dialog";
import { useWebComponent } from "./adapter.js";

DialogElement.register();

export type DialogSize = "small" | "medium" | "large" | "fullscreen";
export type OpenChangedEvent = CustomEvent<{ open: boolean }>;

/** Typed Vue wrapper for the controlled `<box-dialog>`. */
export const Dialog = defineComponent({
  name: "Dialog",
  inheritAttrs: false,
  props: {
    open: Boolean,
    heading: String,
    description: String,
    confirmLabel: String,
    size: String as PropType<DialogSize>,
  },
  emits: {
    "open-changed": (_event: OpenChangedEvent) => true,
    confirm: (_event: CustomEvent<null>) => true,
    cancel: (_event: CustomEvent<null>) => true,
  },
  setup(props, { attrs, slots, emit, expose }) {
    const element = useWebComponent<DialogElement>(
      host => {
        host.open = props.open;
        if (props.heading !== undefined) host.heading = props.heading;
        if (props.description !== undefined) host.description = props.description;
        if (props.confirmLabel !== undefined) host.confirmLabel = props.confirmLabel;
        if (props.size !== undefined) host.size = props.size;
      },
      [
        {
          eventName: "open-changed",
          listener: event => emit("open-changed", event as OpenChangedEvent),
        },
        {
          eventName: "confirm",
          listener: event => emit("confirm", event as CustomEvent<null>),
        },
        {
          eventName: "cancel",
          listener: event => emit("cancel", event as CustomEvent<null>),
        },
      ],
    );
    expose({ get element() { return element.value; } });
    return () => h("box-dialog", { ...attrs, ref: element }, slots.default?.());
  },
});
