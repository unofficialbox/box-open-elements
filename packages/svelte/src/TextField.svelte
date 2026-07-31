<script lang="ts">
  import type { Snippet } from "svelte";
  import { TextField as TextFieldElement } from "@unofficialbox/box-open-elements/text-field";

  TextFieldElement.register();

  type ValueChangedEvent = CustomEvent<{ value: string }>;
  type Props = {
    element?: TextFieldElement;
    label?: string;
    value?: string;
    placeholder?: string;
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
    placeholder,
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

<box-text-field
  bind:this={element}
  {...rest}
  {label}
  {value}
  {placeholder}
  {disabled}
  {name}
  {invalid}
  {errorMessage}
>
  {@render children?.()}
</box-text-field>
