/**
 * Lockstep rules for the framework adapter packages.
 *
 * The adapters ship the *same version as the core package* and peer-depend on
 * exactly that version. That is stricter than it needs to be for any single
 * release, and deliberately so: pre-1.0 this project lets breaking changes land
 * in minor releases, so an adapter built against 0.6 has no business claiming
 * compatibility with 0.7.
 *
 * The rule exists because the failure mode is *silence*. The adapters sat at
 * `^0.5.0` through the entire 0.6.0 release — a peer range that excluded the
 * only published core version — and nothing failed until someone read the
 * manifests. Checking the numbers agree is the cheap part; checking them on
 * every CI run is the part that matters.
 *
 * Extracted from version-check.ts so the rules are unit-testable without
 * reading the real manifests off disk.
 */

export interface AdapterManifest {
  /** Directory under `packages/`, for the error message. */
  directory: string;
  name: string;
  version: string;
  peerDependencies?: Record<string, string>;
}

export const CORE_PACKAGE = "@unofficialbox/box-open-elements";

/** The peer range an adapter must declare for a given core version. */
export const expectedPeerRange = (coreVersion: string): string => `^${coreVersion}`;

/**
 * Whether the *installed* registry copy of the core package matches the version
 * the manifests promise.
 *
 * The manifest checks above compare declarations with declarations, which is
 * necessary and not sufficient: bumping the peer ranges without refreshing the
 * lockfile leaves the workspace resolving an older published core, and the only
 * symptom is a line of `bun install` output that scrolls past. That is exactly
 * how the ranges reached `^0.7.0` while the lockfile still pinned 0.5.0.
 *
 * `installed` is null when no registry copy is present, and that is a normal
 * state rather than a fault: the root package *is* `${CORE_PACKAGE}`, so
 * whether a registry copy of it gets installed alongside the workspace depends
 * on the environment — the pinned Playwright container installs without one.
 * Treating absence as a failure turned this check into a broken build there.
 * Only a disagreement is drift; nothing installed means nothing to disagree.
 */
export const checkInstalledCore = (
  coreVersion: string,
  installed: string | null,
): string[] => {
  if (installed === null) return [];
  if (installed !== coreVersion) {
    return [
      `${CORE_PACKAGE} resolves to ${installed} but this tree is ${coreVersion} — the lockfile is behind the manifests. Run \`bun update ${CORE_PACKAGE}\` (and revert any dependency it adds to the root package.json).`,
    ];
  }
  return [];
};

/**
 * Every way the adapter manifests can disagree with the core package, as
 * human-readable problems. Empty means they are in lockstep.
 *
 * Returns *all* problems rather than throwing on the first: a version bump
 * touches five manifests, and fixing them one failed run at a time is how a
 * release drags out.
 */
export const checkAdapterLockstep = (
  coreVersion: string,
  manifests: readonly AdapterManifest[],
): string[] => {
  const problems: string[] = [];

  if (manifests.length === 0) {
    return ["No adapter manifests found — the lockstep check would pass vacuously."];
  }

  const wantPeer = expectedPeerRange(coreVersion);

  for (const manifest of manifests) {
    if (manifest.version !== coreVersion) {
      problems.push(
        `${manifest.name}: version ${manifest.version} — expected ${coreVersion}, matching the core package.`,
      );
    }

    const peer = manifest.peerDependencies?.[CORE_PACKAGE];
    if (peer === undefined) {
      problems.push(`${manifest.name}: no peer dependency on ${CORE_PACKAGE}.`);
    } else if (peer !== wantPeer) {
      problems.push(
        `${manifest.name}: peer range "${peer}" — expected "${wantPeer}". ` +
          `A range that excludes the current core version is the bug this check exists to catch.`,
      );
    }
  }

  return problems;
};
