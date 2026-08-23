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
