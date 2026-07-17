export type BoxCustomEventHandler<
  E extends HTMLElement,
  Detail,
> = (event: CustomEvent<Detail> & { currentTarget: E }) => void;

export type BoxValueChangedDetail = {
  value: string;
};
