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

/**
 * Host props an adapter accepts, minus the ones adapters redeclare themselves.
 *
 * `onCancel` and `onClick` are React's own delegated handlers, and both are
 * omitted so an adapter can declare a native-event version without colliding —
 * an intersection of two function types is an overload, which no single handler
 * satisfies.
 *
 * For `onClick` the omission is also the safer default. React delegates from
 * its root container, so a delegated click never reaches an element that has
 * relocated outside it, and `box-drawer` relocates its whole subtree to
 * `document.body` when it opens. An adapter that wants a click callback should
 * declare it and bind through `events` below, as `Button` does; leaving React's
 * version available would let callers write a handler that works everywhere
 * except inside an overlay.
 */
export type WebComponentProps = {
  className?: string;
  style?: CSSProperties;
} & Omit<
  HTMLAttributes<HTMLElement>,
  "className" | "style" | "children" | "onCancel" | "onClick"
>;

type CreateWebComponentOptions<E extends HTMLElement, P extends WebComponentProps> = {
  tagName: string;
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
export const createWebComponent = <E extends HTMLElement, P extends WebComponentProps>(
  options: CreateWebComponentOptions<E, P>,
) => {
  const Component = forwardRef<E, P>(function WebComponent(props, forwardedRef) {
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
