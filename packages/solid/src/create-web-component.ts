import { createRenderEffect, mergeProps, onCleanup, splitProps, untrack, type Component, type JSX } from "solid-js";
import { createDynamic } from "solid-js/web";

export type WebComponentProps = Omit<JSX.HTMLAttributes<HTMLElement>, "ref" | "onCancel">;
export type CreateWebComponentOptions<E extends HTMLElement, P> = {
  tagName: string;
  sync: (element: E, props: P) => void;
  propertyNames?: ReadonlyArray<keyof P & string>;
  events?: ReadonlyArray<{ propName: keyof P & string; eventName: string }>;
};

/** A stable host with reactive property synchronization and owner-scoped listeners. */
export function createWebComponent<E extends HTMLElement, P extends object>(
  options: CreateWebComponentOptions<E, P>,
): Component<P & { ref?: E | ((element: E) => void) }> {
  return props => {
    // splitProps preserves Solid's getter-backed props; spreading here would
    // freeze signal values at component creation.
    const [, host] = splitProps(props, [
      ...(options.propertyNames ?? []),
      ...(options.events ?? []).map(binding => binding.propName),
      "ref",
    ] as Array<keyof typeof props>);
    return createDynamic(() => options.tagName, mergeProps(host, {
      ref(element: E) {
        const subscriptions = (options.events ?? []).map(binding => {
          const listener = (event: Event) => {
            const handler = props[binding.propName];
            if (typeof handler === "function") untrack(() => handler(event));
          };
          element.addEventListener(binding.eventName, listener);
          return { ...binding, listener };
        });
        onCleanup(() => {
          for (const binding of subscriptions) element.removeEventListener(binding.eventName, binding.listener);
        });
        createRenderEffect(() => options.sync(element, props));
        const ref = props.ref;
        if (typeof ref === "function") ref(element);
      },
    }));
  };
}
