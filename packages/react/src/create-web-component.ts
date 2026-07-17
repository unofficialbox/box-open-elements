import {
  createElement,
  forwardRef,
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

    const setRefs: RefCallback<E> = node => {
      localRef.current = node;
      assignRef(forwardedRef, node);
    };

    useLayoutEffect(() => {
      const element = localRef.current;
      if (!element) {
        return;
      }
      options.sync(element, props as P);
    });

    const { className, style, ...rest } = props;

    return createElement(options.tagName, {
      ...rest,
      ref: setRefs,
      className,
      style,
      suppressHydrationWarning: true,
    });
  });

  Component.displayName = options.displayName;
  return Component;
};
