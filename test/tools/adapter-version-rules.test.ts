// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  CORE_PACKAGE,
  checkAdapterLockstep,
  expectedPeerRange,
} from "../../tools/adapters/version-rules.js";
import type { AdapterManifest } from "../../tools/adapters/version-rules.js";

const adapter = (overrides: Partial<AdapterManifest> = {}): AdapterManifest => ({
  directory: "react",
  name: "@unofficialbox/box-open-elements-react",
  version: "0.7.0",
  peerDependencies: { [CORE_PACKAGE]: "^0.7.0", react: "^19.0.0" },
  ...overrides,
});

describe("checkAdapterLockstep", () => {
  it("passes when every adapter matches the core version and peers on it", () => {
    const manifests = ["react", "angular", "vue", "svelte"].map(directory =>
      adapter({ directory, name: `@unofficialbox/box-open-elements-${directory}` }),
    );
    expect(checkAdapterLockstep("0.7.0", manifests)).toEqual([]);
  });

  it("catches the release that shipped without them — a peer range excluding the core version", () => {
    // The real bug: adapters sat at ^0.5.0 through the whole 0.6.0 release, a
    // range that excluded the only published core version, and nothing failed.
    const problems = checkAdapterLockstep("0.6.0", [
      adapter({ version: "0.6.0", peerDependencies: { [CORE_PACKAGE]: "^0.5.0" } }),
    ]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('"^0.5.0"');
    expect(problems[0]).toContain('"^0.6.0"');
  });

  it("catches an adapter left behind at the previous version", () => {
    const problems = checkAdapterLockstep("0.7.0", [
      adapter(),
      adapter({
        directory: "vue",
        name: "@unofficialbox/box-open-elements-vue",
        version: "0.6.0",
        peerDependencies: { [CORE_PACKAGE]: "^0.7.0" },
      }),
    ]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("box-open-elements-vue");
    expect(problems[0]).toContain("0.6.0");
  });

  it("reports every problem at once, not just the first", () => {
    // A version bump touches five manifests; surfacing them one failed CI run
    // at a time is how a release drags across an afternoon.
    const problems = checkAdapterLockstep("0.7.0", [
      adapter({ version: "0.6.0", peerDependencies: { [CORE_PACKAGE]: "^0.6.0" } }),
      adapter({
        directory: "vue",
        name: "@unofficialbox/box-open-elements-vue",
        version: "0.5.0",
        peerDependencies: { [CORE_PACKAGE]: "^0.5.0" },
      }),
    ]);
    expect(problems).toHaveLength(4); // two versions + two peer ranges
  });

  it("catches a missing peer dependency on the core package", () => {
    const problems = checkAdapterLockstep("0.7.0", [
      adapter({ peerDependencies: { react: "^19.0.0" } }),
    ]);
    expect(problems).toEqual([
      expect.stringContaining("no peer dependency on @unofficialbox/box-open-elements"),
    ]);
  });

  it("refuses to pass vacuously when no manifests were found", () => {
    // A glob that stops matching must fail loudly. A lockstep check that
    // silently examines nothing is worse than no check: it reports success.
    expect(checkAdapterLockstep("0.7.0", [])).toEqual([
      expect.stringContaining("No adapter manifests found"),
    ]);
  });

  it("requires the exact caret range, not merely a satisfying one", () => {
    // `>=0.7.0` and `*` both admit the current core version today and admit a
    // breaking 0.8.0 tomorrow. Pre-1.0 that is precisely what must not happen.
    for (const peer of [">=0.7.0", "*", "^0.7", "0.7.0", "~0.7.0"]) {
      const problems = checkAdapterLockstep("0.7.0", [
        adapter({ peerDependencies: { [CORE_PACKAGE]: peer } }),
      ]);
      expect(problems, `expected ${peer} to be rejected`).toHaveLength(1);
    }
  });
});

describe("expectedPeerRange", () => {
  it("is the caret range for the core version", () => {
    expect(expectedPeerRange("0.7.0")).toBe("^0.7.0");
    expect(expectedPeerRange("1.2.3")).toBe("^1.2.3");
  });
});
