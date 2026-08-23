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
 * Host props an adapter accepts.
 *
 * `onCancel` is omitted because `Dialog` redeclares it with a native-event
 * signature, and an intersection of two function types is an overload that no
 * single handler satisfies.
 *
 * React's `onClick` stays. It is delegated from the React root container, which
 * means it does **not** fire for an element that has relocated outside that
 * container — every host inside an open `box-drawer`, which portals its subtree
 * to `document.body`. That is a real trap, but it is React's trap and it catches
 * a plain `<div onClick>` in a drawer just the same; removing the prop from
 * three adapters would not fix the class of bug, only make those three behave
 * unlike every other element in the tree while breaking handlers that work
 * perfectly well outside overlays. An adapter that needs a click callback to
 * survive relocation declares its own and binds through `events` below, as
 * `Button` does.
 */
export type WebComponentProps = {
  className?: string;
  style?: CSSProperties;
} & Omit<
  HTMLAttributes<HTMLElement>,
  "className" | "style" | "children" | "onCancel"
>;

/**
 * What the factory itself requires of an adapter's props.
 *
 * Deliberately narrower than `WebComponentProps`: the factory reads `className`
 * and `style` and spreads the rest, so those two are the whole requirement.
 * Constraining to the full host-prop type instead would forbid an adapter from
 * *narrowing* a host prop — `Button` redeclaring `onClick` as a native-event
 * handler is not assignable to React's `MouseEventHandler` (parameters are
 * contravariant, and a `SyntheticEvent` is not a `MouseEvent`), so the whole
 * prop would have to come off the base type for every adapter to keep one
 * adapter's narrowing legal. Each adapter still builds its props from
 * `WebComponentProps`; the constraint just stops one adapter's choice from
 * dictating the shared type.
 */
type AdapterHostProps = {
  className?: string;
  style?: CSSProperties;
};

type CreateWebComponentOptions<E extends HTMLElement, P extends AdapterHostProps> = {
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
export const createWebComponent = <E extends HTMLElement, P extends AdapterHostProps>(
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
