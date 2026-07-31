import {
  onBeforeUnmount,
  onMounted,
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

  onMounted(() => {
    if (!element.value) return;
    for (const binding of events) {
      element.value.addEventListener(binding.eventName, binding.listener);
    }
  });

  onBeforeUnmount(() => {
    if (!element.value) return;
    for (const binding of events) {
      element.value.removeEventListener(binding.eventName, binding.listener);
    }
  });

  return element;
};
