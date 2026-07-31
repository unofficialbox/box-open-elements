export type CustomEventHandler<
  E extends HTMLElement,
  Detail,
> = (event: CustomEvent<Detail> & { currentTarget: E }) => void;

export type ValueChangedDetail = {
  value: string;
};
