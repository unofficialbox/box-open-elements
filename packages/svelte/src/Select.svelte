<script lang="ts">
  import type { Snippet } from "svelte";
  import { Select as SelectElement } from "@unofficialbox/box-open-elements/select";

  SelectElement.register();

  type SelectOption = { label: string; value: string };
  type ValueChangedEvent = CustomEvent<{ value: string }>;
  type Props = {
    element?: SelectElement;
    label?: string;
    value?: string;
    options?: SelectOption[];
    disabled?: boolean;
    name?: string;
    invalid?: boolean;
    errorMessage?: string;
    onValueChanged?: (event: ValueChangedEvent) => void;
    children?: Snippet;
    [key: string]: unknown;
  };

  let {
    element = $bindable(),
    label,
    value,
    options,
    disabled = false,
    name,
    invalid = false,
    errorMessage,
    onValueChanged,
    children,
    ...rest
  }: Props = $props();

  $effect(() => {
    if (!element || !onValueChanged) return;
    const listener = onValueChanged as EventListener;
    element.addEventListener("value-changed", listener);
    return () => element?.removeEventListener("value-changed", listener);
  });
</script>

<box-select
  bind:this={element}
  {...rest}
  {label}
  {value}
  {options}
  {disabled}
  {name}
  {invalid}
  {errorMessage}
>
  {@render children?.()}
</box-select>
