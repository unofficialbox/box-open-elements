import {
  shallowRef,
  watchEffect,
  type ShallowRef,
} from "vue";

export type EventBinding = {
  eventName: string;
  listener: (event: Event) => void;
};

/** Shared lifecycle bridge for Vue wrappers around custom-element hosts. */
export const useWebComponent = <E extends HTMLElement>(
  sync: (element: E) => void,
  events: readonly EventBinding[] = [],
): ShallowRef<E | undefined> => {
  const element = shallowRef<E>();

  watchEffect(() => {
    if (element.value) sync(element.value);
  });

  watchEffect(onCleanup => {
    const host = element.value;
    if (!host) return;
    for (const binding of events) {
      host.addEventListener(binding.eventName, binding.listener);
    }
    onCleanup(() => {
      for (const binding of events) {
        host.removeEventListener(binding.eventName, binding.listener);
      }
    });
  }, { flush: "post" });

  return element;
};
