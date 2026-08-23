export type CustomEventHandler<
  E extends HTMLElement,
  Detail,
> = (event: CustomEvent<Detail> & { currentTarget: E }) => void;

export type ValueChangedDetail = {
  value: string;
};

/**
 * A callback bound with `addEventListener`, receiving the **native** event.
 *
 * Not a React `SyntheticEvent`. Adapter callbacks are registered directly on
 * the custom element rather than routed through React's delegation, so what
 * arrives is the real DOM event — `event.nativeEvent` does not exist on it, and
 * `stopPropagation` acts on the real tree.
 *
 * That indirection is not a style choice. React delegates from the root
 * container, and an element that relocates itself outside that container —
 * `box-drawer` portals to `document.body` when it opens — stops receiving
 * delegated events entirely. A listener on the element itself travels with it.
 */
export type NativeEventHandler<E extends HTMLElement, Ev extends Event = Event> = (
  event: Ev & { currentTarget: E },
) => void;
