// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  CORE_PACKAGE,
  checkAdapterLockstep,
  checkCorePeerRanges,
  checkInstalledCore,
  checkLockfileCore,
  expectedPeerRange,
  parseLockedCoreVersion,
  parseReleasedVersions,
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
  it("passes when every adapter carries the core version", () => {
    const manifests = ["react", "angular", "vue", "svelte"].map(directory =>
      adapter({ directory, name: `@unofficialbox/box-open-elements-${directory}` }),
    );
    expect(checkAdapterLockstep("0.7.0", manifests)).toEqual([]);
  });

  it("catches an adapter left behind at the previous version", () => {
    const problems = checkAdapterLockstep("0.7.0", [
      adapter(),
      adapter({
        directory: "vue",
        name: "@unofficialbox/box-open-elements-vue",
        version: "0.6.0",
      }),
    ]);
    expect(problems).toEqual([expect.stringContaining("box-open-elements-vue")]);
    expect(problems[0]).toContain("0.6.0");
  });

  it("reports every problem at once, not just the first", () => {
    // A version bump touches five manifests; surfacing them one failed CI run
    // at a time is how a release drags across an afternoon.
    const problems = checkAdapterLockstep("0.7.0", [
      adapter({ version: "0.6.0" }),
      adapter({
        directory: "vue",
        name: "@unofficialbox/box-open-elements-vue",
        version: "0.5.0",
      }),
    ]);
    expect(problems).toHaveLength(2);
  });

  it("refuses to pass vacuously when no manifests were found", () => {
    // A glob that stops matching must fail loudly. A lockstep check that
    // silently examines nothing is worse than no check: it reports success.
    expect(checkAdapterLockstep("0.7.0", [])).toEqual([
      expect.stringContaining("No adapter manifests found"),
    ]);
  });
});

describe("checkCorePeerRanges", () => {
  it("passes when every peer pins the current core", () => {
    expect(
      checkCorePeerRanges("0.7.0", [
        { name: "@unofficialbox/box-open-elements-react", range: "^0.7.0" },
        { name: "@box-open-elements/box-server", range: "^0.7.0" },
      ]),
    ).toEqual([]);
  });

  it("catches the release that shipped without them — a range excluding the core", () => {
    // The real bug: adapters sat at ^0.5.0 through the whole 0.6.0 release, a
    // range that excluded the only published core version, and nothing failed.
    const problems = checkCorePeerRanges("0.6.0", [
      { name: "@unofficialbox/box-open-elements-react", range: "^0.5.0" },
    ]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('"^0.5.0"');
    expect(problems[0]).toContain('"^0.6.0"');
  });

  it("covers a peer that is not one of the four published adapters", () => {
    // box-server keeps its own version line but peers on the same core. The
    // 0.7.0 release left it at ^0.6.0 because the gate only looked at adapters.
    const problems = checkCorePeerRanges("0.7.0", [
      { name: "@unofficialbox/box-open-elements-react", range: "^0.7.0" },
      { name: "@box-open-elements/box-server", range: "^0.6.0" },
    ]);
    expect(problems).toEqual([expect.stringContaining("box-server")]);
  });

  it("requires the exact caret range, not merely a satisfying one", () => {
    // `>=0.7.0` and `*` both admit the current core version today and admit a
    // breaking 0.8.0 tomorrow. Pre-1.0 that is precisely what must not happen.
    for (const range of [">=0.7.0", "*", "^0.7", "0.7.0", "~0.7.0"]) {
      const problems = checkCorePeerRanges("0.7.0", [{ name: "pkg", range }]);
      expect(problems, `expected ${range} to be rejected`).toHaveLength(1);
    }
  });

  it("refuses to pass vacuously when nothing declares the peer", () => {
    expect(checkCorePeerRanges("0.7.0", [])).toEqual([
      expect.stringContaining("No package declares a peer dependency"),
    ]);
  });
});

describe("parseLockedCoreVersion", () => {
  const entry = (name: string, version: string): string =>
    `    "${name}": ["${name}@${version}", "", {}, "sha512-x"],\n`;

  it("reads the core's pinned version out of a lockfile", () => {
    expect(parseLockedCoreVersion(entry(CORE_PACKAGE, "0.7.0"))).toBe("0.7.0");
  });

  it("is not fooled by the adapters, whose names share the prefix", () => {
    // `…-react@0.7.0` starts with the core's name. A loose pattern would report
    // an adapter's version as the core's, and the gate would compare the wrong
    // number while looking like it worked.
    const lockfile =
      entry(`${CORE_PACKAGE}-react`, "0.9.9") +
      entry(`${CORE_PACKAGE}-svelte`, "0.9.9") +
      entry(CORE_PACKAGE, "0.5.0");
    expect(parseLockedCoreVersion(lockfile)).toBe("0.5.0");
  });

  it("returns null when the lockfile pins no registry copy", () => {
    expect(parseLockedCoreVersion(entry(`${CORE_PACKAGE}-vue`, "0.7.0"))).toBeNull();
    expect(parseLockedCoreVersion("")).toBeNull();
  });
});

describe("parseReleasedVersions", () => {
  it("reads released versions newest first, ignoring the Unreleased heading", () => {
    const changelog = "# Changelog\n\n## Unreleased\n\n## 0.8.0 — 2026-08-23\n\n## 0.7.0 — 2026-08-23\n\n## 0.6.0 — 2026-08-22\n";
    expect(parseReleasedVersions(changelog)).toEqual(["0.8.0", "0.7.0", "0.6.0"]);
  });

  it("ignores version-looking text that is not a section heading", () => {
    // Prose mentioning `0.5.0` must not be mistaken for a release record.
    expect(parseReleasedVersions("Left behind at 0.5.0 for two releases.\n")).toEqual([]);
  });

  it("returns nothing for a changelog with no releases yet", () => {
    expect(parseReleasedVersions("# Changelog\n\n## Unreleased\n")).toEqual([]);
  });
});

describe("checkLockfileCore", () => {
  const released = ["0.8.0", "0.7.0", "0.6.0", "0.5.0"];

  it("passes when the lockfile pins the version this tree builds", () => {
    expect(checkLockfileCore("0.7.0", "0.7.0")).toEqual([]);
  });

  it("catches a lockfile left behind by a peer-range bump", () => {
    // The real drift: the manifests moved to ^0.7.0 across two releases while
    // the lockfile still pinned 0.5.0, and the only symptom was a line of
    // `bun install` output. This is the mandatory check because the lockfile is
    // committed — unlike an installed copy it exists in every environment.
    const problems = checkLockfileCore("0.7.0", "0.5.0");
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("bun.lock pins");
    expect(problems[0]).toContain("0.5.0");
    expect(problems[0]).toContain("0.7.0");
  });

  it("still catches that drift when the released history is supplied", () => {
    // The tolerance below must not swallow the bug the rule exists for: 0.5.0
    // is a released version, but it is not the one *before* 0.7.0.
    expect(checkLockfileCore("0.7.0", "0.5.0", released)).toHaveLength(1);
  });

  it("allows the pin to lag by exactly the release in flight", () => {
    // The case that made this rule unshippable: during a release the tree is at
    // the new version while npm still has only the old one, so the lockfile
    // *cannot* be refreshed yet. Demanding an exact match makes every release
    // PR unpassable — which is what happened on the first release after the
    // rule landed.
    expect(checkLockfileCore("0.8.0", "0.7.0", released)).toEqual([]);
  });

  it("refuses a lag of more than one release", () => {
    expect(checkLockfileCore("0.8.0", "0.6.0", released)).toHaveLength(1);
  });

  it("names the previous release in the message, so the fix is obvious", () => {
    expect(checkLockfileCore("0.8.0", "0.6.0", released)[0]).toContain("previous release: 0.7.0");
  });

  it("does not tolerate a lag when no released history is known", () => {
    // Absent a CHANGELOG the rule falls back to strict equality rather than
    // guessing — a tolerance that cannot be justified should not be granted.
    expect(checkLockfileCore("0.8.0", "0.7.0", [])).toHaveLength(1);
  });

  it("accepts a lockfile that pins no registry copy", () => {
    // Nothing pinned means nothing can drift.
    expect(checkLockfileCore("0.7.0", null)).toEqual([]);
  });
});

describe("checkInstalledCore", () => {
  it("passes when the installed core is the version this tree builds", () => {
    expect(checkInstalledCore("0.7.0", "0.7.0")).toEqual([]);
  });

  it("catches a stale installed copy", () => {
    expect(checkInstalledCore("0.7.0", "0.5.0")).toEqual([
      expect.stringContaining("resolves to 0.5.0"),
    ]);
  });

  it("allows the installed copy to lag by exactly the release in flight", () => {
    // Same reason as the lockfile: the registry cannot have this tree's version
    // until it is published.
    expect(checkInstalledCore("0.8.0", "0.7.0", ["0.8.0", "0.7.0"])).toEqual([]);
  });

  it("still catches an installed copy more than one release behind", () => {
    expect(checkInstalledCore("0.8.0", "0.6.0", ["0.8.0", "0.7.0", "0.6.0"])).toHaveLength(1);
  });

  it("accepts no installed copy — that is an environment, not a fault", () => {
    // The root package IS the core package, so whether a registry copy is
    // materialised alongside the workspace depends on the environment: the
    // pinned Playwright container installs without one. An earlier version of
    // this rule failed on absence and broke the visual-regression job. The
    // lockfile check carries the guarantee instead.
    expect(checkInstalledCore("0.7.0", null)).toEqual([]);
  });
});

describe("expectedPeerRange", () => {
  it("is the caret range for the core version", () => {
    expect(expectedPeerRange("0.7.0")).toBe("^0.7.0");
    expect(expectedPeerRange("1.2.3")).toBe("^1.2.3");
  });
});
