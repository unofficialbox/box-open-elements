// @vitest-environment node

import { describe, expect, it } from "vitest";

describe("Angular adapter server import", () => {
  it("loads without DOM globals", async () => {
    expect(globalThis).not.toHaveProperty("customElements");
    const adapter = await import("../src/index.js");
    expect(adapter.Button).toBeTypeOf("function");
    expect(adapter.Dialog).toBeTypeOf("function");
  });
});
