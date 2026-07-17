import {
  createElement,
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ForwardedRef,
  type HTMLAttributes,
  type RefCallback,
} from "react";

const assignRef = <T,>(ref: ForwardedRef<T> | undefined, value: T | null): void => {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (ref) {
    ref.current = value;
  }
};

export type BoxWebComponentProps = {
  className?: string;
  style?: CSSProperties;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "style" | "children">;

type CreateWebComponentOptions<E extends HTMLElement, P extends BoxWebComponentProps> = {
  tagName: string;
  define: () => unknown;
  /** Sync React props onto the custom element instance (prefer properties over attributes). */
  sync: (element: E, props: P) => void;
  /** Props assigned by `sync`; omit them from React's host-attribute spread. */
  propertyNames?: ReadonlyArray<keyof P & string>;
  /** Map React callback props to composed custom-element event names. */
  events?: ReadonlyArray<{
    propName: keyof P & string;
    eventName: string;
  }>;
  displayName: string;
};

/**
 * Thin React adapter factory for a box-open-elements custom element.
 * Defines the element once, syncs props via properties, and forwards refs/events.
 */
export const createWebComponent = <E extends HTMLElement, P extends BoxWebComponentProps>(
  options: CreateWebComponentOptions<E, P>,
) => {
  const Component = forwardRef<E, P>(function BoxWebComponent(props, forwardedRef) {
    options.define();
    const localRef = useRef<E | null>(null);
    const latestPropsRef = useRef<P>(props as P);

    const setRefs: RefCallback<E> = useCallback(
      node => {
        localRef.current = node;
        assignRef(forwardedRef, node);
      },
      [forwardedRef],
    );

    useLayoutEffect(() => {
      latestPropsRef.current = props as P;
      const element = localRef.current;
      if (!element) {
        return;
      }
      options.sync(element, props as P);
    });

    useLayoutEffect(() => {
      const element = localRef.current;
      if (!element || !options.events) {
        return;
      }

      const subscriptions = options.events.map(binding => {
        const listener = (event: Event) => {
          const handler = latestPropsRef.current[binding.propName];
          if (typeof handler === "function") {
            (handler as (event: Event) => void)(event);
          }
        };
        element.addEventListener(binding.eventName, listener);
        return { eventName: binding.eventName, listener };
      });

      return () => {
        for (const { eventName, listener } of subscriptions) {
          element.removeEventListener(eventName, listener);
        }
      };
    }, []);

    const { className, style, ...rest } = props;
    const hostProps = { ...rest } as Record<string, unknown>;
    for (const propertyName of options.propertyNames ?? []) {
      delete hostProps[propertyName];
    }
    for (const { propName } of options.events ?? []) {
      delete hostProps[propName];
    }

    return createElement(options.tagName, {
      ...hostProps,
      ref: setRefs,
      className,
      style,
      suppressHydrationWarning: true,
    });
  });

  Component.displayName = options.displayName;
  return Component;
};
