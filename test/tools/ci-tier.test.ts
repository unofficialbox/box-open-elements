import { describe, expect, it } from "vitest";
import { checkTier, versionTier } from "../../tools/ci/tier.js";

describe("CI release tier", () => {
  it("defaults unversioned PRs to targeted patch checks", () => {
    expect(checkTier("0.28.7", "0.28.7", [])).toBe("patch");
    expect(checkTier("0.28.7", "0.28.7", ["release:hotfix"])).toBe("hotfix");
  });

  it("recognizes minor and major version bumps without labels", () => {
    expect(versionTier("0.28.7", "0.29.0")).toBe("minor");
    expect(versionTier("0.28.7", "1.0.0")).toBe("major");
    expect(checkTier("0.28.7", "0.28.8", [])).toBe("patch");
  });

  it("uses a label when feature work precedes the release bump", () => {
    expect(checkTier("0.28.7", "0.28.7", ["release:minor"])).toBe("minor");
  });

  it("rejects conflicting labels and version bumps", () => {
    expect(() => checkTier("0.28.7", "0.28.7", ["release:major", "release:minor"])).toThrow();
    expect(() => checkTier("0.28.7", "0.29.0", ["release:patch"])).toThrow();
    expect(() => versionTier("0.28.7", "0.28.6")).toThrow();
  });
});
