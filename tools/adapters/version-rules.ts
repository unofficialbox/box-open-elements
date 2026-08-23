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
 * Released versions, newest first, read from the CHANGELOG's `## X.Y.Z` headings.
 *
 * The CHANGELOG is already machine-read at release time — `cut-release.yml`
 * awks a version's section out for the GitHub Release notes — so treating it as
 * the record of what has shipped is established, not a new coupling.
 */
export const parseReleasedVersions = (changelog: string): string[] =>
  [...changelog.matchAll(/^## (\d+\.\d+\.\d+)/gm)].map(match => match[1] as string);

/**
 * Whether the lockfile's pinned core is one this tree may legitimately carry.
 *
 * The mandatory check: the lockfile is committed, so unlike an installed copy
 * it exists in every environment — CI runner, pinned container, and a
 * contributor's laptop alike.
 *
 * It accepts *two* versions, and the second one is the whole subtlety. The
 * lockfile can only pin a version that exists on npm, so during a release the
 * tree is at the new version while the registry still has only the old one —
 * the pin cannot be refreshed until after publishing. Demanding an exact match
 * makes every release PR unpassable, which is precisely what happened on the
 * first release after this rule landed: the tree said 0.8.0, npm said 0.7.0,
 * and CI refused a change that was correct.
 *
 * So the previous released version is allowed, and the caller reports the lag
 * rather than passing silently.
 *
 * **Known blind spot**, stated rather than hidden: once a release lands, a
 * lockfile still pinning the previous version keeps passing until the release
 * after it. Closing that costs the ability to release at all, so the process
 * carries it instead — RELEASING.md makes refreshing the pin a required
 * post-publish step. What this still catches is the failure that motivated it:
 * a pin left behind across *several* releases, silently, for weeks.
 */
export const checkLockfileCore = (
  coreVersion: string,
  locked: string | null,
  releasedVersions: readonly string[] = [],
): string[] => {
  if (locked === null) return [];
  if (locked === coreVersion) return [];

  const previousRelease = releasedVersions.find(version => version !== coreVersion);
  if (previousRelease !== undefined && locked === previousRelease) return [];

  return [
    `bun.lock pins ${CORE_PACKAGE}@${locked} but this tree is ${coreVersion}` +
      (previousRelease === undefined ? "" : ` (previous release: ${previousRelease})`) +
      `. Run \`bun update ${CORE_PACKAGE}\` (and revert the dependency it adds to the root package.json).`,
  ];
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
  releasedVersions: readonly string[] = [],
): string[] => {
  if (installed === null) return [];
  if (installed === coreVersion) return [];

  // Same release-window tolerance as the lockfile rule, and for the same
  // reason: the installed copy comes from the registry, which cannot have this
  // tree's version until after it is published.
  const previousRelease = releasedVersions.find(version => version !== coreVersion);
  if (previousRelease !== undefined && installed === previousRelease) return [];

  return [
    `${CORE_PACKAGE} resolves to ${installed} but this tree is ${coreVersion} — the installed copy is stale. Run \`bun install\`.`,
  ];
};
