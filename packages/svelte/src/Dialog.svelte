<script lang="ts">
  import type { Snippet } from "svelte";
  import { Dialog as DialogElement } from "@unofficialbox/box-open-elements/dialog";

  DialogElement.register();

  type DialogSize = "small" | "medium" | "large" | "fullscreen";
  type Props = {
    element?: DialogElement;
    open?: boolean;
    heading?: string;
    description?: string;
    confirmLabel?: string;
    size?: DialogSize;
    onOpenChanged?: (event: CustomEvent<{ open: boolean }>) => void;
    onConfirm?: (event: CustomEvent<null>) => void;
    onCancel?: (event: CustomEvent<null>) => void;
    children?: Snippet;
    [key: string]: unknown;
  };

  let {
    element = $bindable(),
    open = false,
    heading,
    description,
    confirmLabel,
    size,
    onOpenChanged,
    onConfirm,
    onCancel,
    children,
    ...rest
  }: Props = $props();

  $effect(() => {
    if (!element) return;
    const bindings: Array<[string, EventListener | undefined]> = [
      ["open-changed", onOpenChanged as EventListener | undefined],
      ["confirm", onConfirm as EventListener | undefined],
      ["cancel", onCancel as EventListener | undefined],
    ];
    for (const [eventName, listener] of bindings) {
      if (listener) element.addEventListener(eventName, listener);
    }
    return () => {
      for (const [eventName, listener] of bindings) {
        if (listener) element?.removeEventListener(eventName, listener);
      }
    };
  });
</script>

<box-dialog
  bind:this={element}
  {...rest}
  {open}
  {heading}
  {description}
  {confirmLabel}
  {size}
>
  {@render children?.()}
</box-dialog>
