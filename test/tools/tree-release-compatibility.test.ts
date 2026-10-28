import { describe, expect, it } from "vitest";
import { checkTreeReleaseCompatibility } from "../../tools/adapters/release-compatibility-rules.js";
describe("tree release compatibility", () => {
  it("blocks publication at the already-published core version without blocking development builds", () => {
    expect(checkTreeReleaseCompatibility("0.42.3", "^0.42.3").join(" ")).toContain("new core release");
  });
  it("rejects an old React core peer at the next lockstep release", () => {
    expect(checkTreeReleaseCompatibility("0.43.0", "^0.42.3")).toEqual(["The React core peer must be ^0.43.0, the release that ships its eager tree imports."]);
    expect(checkTreeReleaseCompatibility("0.43.0", "^0.43.0")).toEqual([]);
    expect(checkTreeReleaseCompatibility("0.42.4", "^0.42.4")).toEqual([]);
    expect(checkTreeReleaseCompatibility("1.0.0", "^1.0.0")).toEqual([]);
  });
  it("rejects invalid and older core versions", () => {
    expect(checkTreeReleaseCompatibility("bad", "^bad")[0]).toContain("Invalid");
    expect(checkTreeReleaseCompatibility("0.41.9", "^0.41.9")[0]).toContain("new core release");
  });
});
