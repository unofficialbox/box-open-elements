import { h, type ComponentChildren, type HTMLAttributes, type Ref } from "preact";
import { useCallback, useLayoutEffect, useRef } from "preact/hooks";

export type WebComponentProps = Omit<HTMLAttributes<HTMLElement>, "ref" | "onCancel"> & { children?: ComponentChildren };
export type CreateWebComponentOptions<E extends HTMLElement, P> = {
  tagName: string;
  sync: (element: E, props: P) => void;
  propertyNames?: ReadonlyArray<keyof P & string>;
  events?: ReadonlyArray<{ propName: keyof P & string; eventName: string }>;
};

/** Native Preact 11 component: ref is a prop, without preact/compat or React. */
export function createWebComponent<E extends HTMLElement, P extends object>(
  options: CreateWebComponentOptions<E, P>,
) {
  return function WebComponent(props: P & { ref?: Ref<E> }) {
    const element = useRef<E | null>(null);
    const committed = useRef(props);
    const setRef = useCallback((node: E | null) => {
      element.current = node;
      if (typeof props.ref === "function") return props.ref(node);
      if (props.ref) props.ref.current = node;
    }, [props.ref]);
    // Only committed renders affect listeners, including interrupted renders.
    useLayoutEffect(() => {
      committed.current = props;
      if (element.current) options.sync(element.current, props);
    });
    useLayoutEffect(() => {
      const node = element.current;
      if (!node) return;
      const subscriptions = (options.events ?? []).map(binding => {
        const listener = (event: Event) => {
          const handler = committed.current[binding.propName];
          if (typeof handler === "function") handler(event);
        };
        node.addEventListener(binding.eventName, listener);
        return { ...binding, listener };
      });
      return () => {
        for (const binding of subscriptions) node.removeEventListener(binding.eventName, binding.listener);
      };
    }, []);
    const host = { ...props } as Record<string, unknown>;
    delete host.ref;
    for (const name of options.propertyNames ?? []) delete host[name];
    for (const binding of options.events ?? []) delete host[binding.propName];
    return h(options.tagName, { ...host, ref: setRef });
  };
}
