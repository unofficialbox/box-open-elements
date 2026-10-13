export type CustomEventHandler<E extends HTMLElement, Detail> = (event: CustomEvent<Detail> & { currentTarget: E }) => void;
export type NativeEventHandler<E extends HTMLElement, Ev extends Event = Event> = (event: Ev & { currentTarget: E }) => void;
export type ValueChangedDetail = { value: string };
