/**
 * Lockstep rules for the packages that depend on the core.
 *
 * Three separate rules, because they answer three different questions:
 *
 * 1. `checkAdapterLockstep` — do the four *published* adapters ship the core's
 *    version? They release together under one number, so anything else is a
 *    release that half-happened.
 * 2. `checkCorePeerRanges` — does every workspace package that peers on the core
 *    pin exactly `^<core version>`? Broader than the four on purpose:
 *    `packages/box-server` peers on the core too, keeps its own version line,
 *    and was left behind at `^0.6.0` by the 0.7.0 release precisely because the
 *    gate only looked at the adapters.
 * 3. `checkLockfileCore` — does the committed lockfile pin that same version?
 *
 * That third rule is the one with teeth, and why it reads the lockfile rather
 * than `node_modules` is worth stating. The root package *is* the core package,
 * so a fresh install does not necessarily materialise a registry copy of it —
 * the pinned Playwright container doesn't. A check reading `node_modules`
 * therefore *silently does not run* in exactly the environment where the drift
 * would otherwise hide. The lockfile is committed, so it is present everywhere
 * and cannot skip.
 *
 * `checkInstalledCore` survives as a diagnostic for environments that do have a
 * copy. It is not the gate.
 *
 * The rules exist because the failure mode is *silence*. The adapters sat at
 * `^0.5.0` through the entire 0.6.0 release — a peer range excluding the only
 * published core version — and nothing failed until someone read the manifests.
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

/** Any workspace package that declares a peer dependency on the core. */
export interface CorePeer {
  name: string;
  range: string;
}

export const CORE_PACKAGE = "@unofficialbox/box-open-elements";

/** The peer range a package must declare for a given core version. */
export const expectedPeerRange = (coreVersion: string): string => `^${coreVersion}`;

/**
 * Whether the four published adapters carry the core's version.
 *
 * Returns *all* problems rather than throwing on the first: a version bump
 * touches five manifests, and fixing them one failed run at a time is how a
 * release drags out.
 */
export const checkAdapterLockstep = (
  coreVersion: string,
  manifests: readonly AdapterManifest[],
): string[] => {
  if (manifests.length === 0) {
    return ["No adapter manifests found — the lockstep check would pass vacuously."];
  }

  return manifests
    .filter(manifest => manifest.version !== coreVersion)
    .map(
      manifest =>
        `${manifest.name}: version ${manifest.version} — expected ${coreVersion}, matching the core package.`,
    );
};

/**
 * Whether every package peering on the core pins exactly this version.
 *
 * Exact, not merely satisfying: `>=0.7.0` and `*` both admit the current core
 * and also admit a breaking 0.8.0, which pre-1.0 is precisely what must not
 * happen.
 */
export const checkCorePeerRanges = (
  coreVersion: string,
  peers: readonly CorePeer[],
): string[] => {
  if (peers.length === 0) {
    return [`No package declares a peer dependency on ${CORE_PACKAGE} — that cannot be right.`];
  }

  const want = expectedPeerRange(coreVersion);
  return peers
    .filter(peer => peer.range !== want)
    .map(
      peer =>
        `${peer.name}: peer range "${peer.range}" — expected "${want}". ` +
        `A range that excludes the current core version is the bug this check exists to catch.`,
    );
};

/**
 * The core version pinned by the committed lockfile, or null when it pins no
 * registry copy at all (nothing depends on one, so nothing can drift).
 *
 * Deliberately narrow: it matches the core's own entry and must not be fooled
 * by `…-react@0.7.0` and friends, whose names share the prefix.
 */
export const parseLockedCoreVersion = (lockfile: string): string | null => {
  const match = /"@unofficialbox\/box-open-elements@(\d+\.\d+\.\d+[^"]*)"/.exec(lockfile);
  return match?.[1] ?? null;
};

/**
 * Whether the lockfile's pinned core matches the version this tree builds.
 *
 * The mandatory check: the lockfile is committed, so unlike an installed copy
 * it exists in every environment — CI runner, pinned container, and a
 * contributor's laptop alike.
 */
export const checkLockfileCore = (coreVersion: string, locked: string | null): string[] => {
  if (locked === null) return [];
  if (locked !== coreVersion) {
    return [
      `bun.lock pins ${CORE_PACKAGE}@${locked} but this tree is ${coreVersion}. ` +
        `Run \`bun update ${CORE_PACKAGE}\` (and revert the dependency it adds to the root package.json).`,
    ];
  }
  return [];
};

/**
 * Whether an *installed* registry copy matches — a diagnostic, not the gate.
 *
 * `installed` is null when no registry copy is present, and that is a normal
 * state rather than a fault: the root package is the core package, so whether a
 * copy is materialised alongside the workspace depends on the environment.
 * Failing on absence turned this into a broken build in the container. The
 * lockfile check above is the one that must not be skippable.
 */
export const checkInstalledCore = (
  coreVersion: string,
  installed: string | null,
): string[] => {
  if (installed === null) return [];
  if (installed !== coreVersion) {
    return [
      `${CORE_PACKAGE} resolves to ${installed} but this tree is ${coreVersion} — the installed copy is stale. Run \`bun install\`.`,
    ];
  }
  return [];
};
