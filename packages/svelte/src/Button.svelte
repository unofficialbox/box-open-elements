<script lang="ts">
  import type { Snippet } from "svelte";
  import { Button as ButtonElement } from "@unofficialbox/box-open-elements/button";

  ButtonElement.register();

  type Props = {
    element?: ButtonElement;
    label?: string;
    tone?: string;
    size?: string;
    disabled?: boolean;
    onClick?: (event: MouseEvent) => void;
    children?: Snippet;
    [key: string]: unknown;
  };

  let {
    element = $bindable(),
    label,
    tone,
    size,
    disabled = false,
    onClick,
    children,
    ...rest
  }: Props = $props();

</script>

<box-button
  bind:this={element}
  {...rest}
  {label}
  {tone}
  {size}
  {disabled}
  onclick={onClick}
>
  {@render children?.()}
</box-button>
