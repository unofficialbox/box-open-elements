import { describe, expect, it, vi } from "vitest";

import { TypedEventEmitter } from "../../src/core/event-emitter.js";

type TestEvents = {
  changed: { value: string };
};

describe("TypedEventEmitter", () => {
  it("delivers payloads to subscribed listeners", () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const listener = vi.fn();

    emitter.on("changed", listener);
    emitter.emit("changed", { value: "a" });

    expect(listener).toHaveBeenCalledWith({ value: "a" });
  });

  it("stops delivering after unsubscribe", () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const listener = vi.fn();

    const unsubscribe = emitter.on("changed", listener);
    unsubscribe();
    emitter.emit("changed", { value: "a" });

    expect(listener).not.toHaveBeenCalled();
  });

  it("clears all listeners", () => {
    const emitter = new TypedEventEmitter<TestEvents>();
    const listener = vi.fn();

    emitter.on("changed", listener);
    emitter.clear();
    emitter.emit("changed", { value: "a" });

    expect(listener).not.toHaveBeenCalled();
  });
});
