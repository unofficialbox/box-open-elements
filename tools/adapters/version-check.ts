import { readdir } from "node:fs/promises";

import {
  CORE_PACKAGE,
  checkAdapterLockstep,
  checkCorePeerRanges,
  checkInstalledCore,
  checkLockfileCore,
  parseLockedCoreVersion,
  parseReleasedVersions,
} from "./version-rules.js";
import type { AdapterManifest, CorePeer } from "./version-rules.js";

const adapterDirectories = ["react", "angular", "vue", "svelte"] as const;

const coreVersion = (await Bun.file("package.json").json() as { version: string }).version;

const manifests: AdapterManifest[] = await Promise.all(
  adapterDirectories.map(async directory => {
    const manifest = await Bun.file(`packages/${directory}/package.json`).json() as Omit<
      AdapterManifest,
      "directory"
    >;
    return { ...manifest, directory };
  }),
);

// Every workspace package that peers on the core, not only the four published
// in lockstep: box-server keeps its own version line but peers on the same
// core, and the 0.7.0 release left its range at ^0.6.0 precisely because the
// gate looked only at the adapters. Discovered rather than listed, so a package
// added later is covered without anyone remembering to add it here.
const peers: CorePeer[] = [];
for (const entry of await readdir("packages", { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const manifest = (await Bun.file(`packages/${entry.name}/package.json`)
    .json()
    .catch(() => null)) as { name?: string; peerDependencies?: Record<string, string> } | null;
  const range = manifest?.peerDependencies?.[CORE_PACKAGE];
  if (manifest?.name !== undefined && range !== undefined) {
    peers.push({ name: manifest.name, range });
  }
}

const lockedCore = parseLockedCoreVersion(
  await Bun.file("bun.lock")
    .text()
    .catch(() => ""),
);

// The lockfile may legitimately lag by one release — it can only pin what npm
// already has — so the rule needs to know what the previous release was.
const releasedVersions = parseReleasedVersions(
  await Bun.file("CHANGELOG.md")
    .text()
    .catch(() => ""),
);

const installedCore = await Bun.file(`node_modules/${CORE_PACKAGE}/package.json`)
  .json()
  .then((manifest: { version: string }) => manifest.version)
  .catch(() => null);

const problems = [
  ...checkAdapterLockstep(coreVersion, manifests),
  ...checkCorePeerRanges(coreVersion, peers),
  ...checkLockfileCore(coreVersion, lockedCore, releasedVersions),
  ...checkInstalledCore(coreVersion, installedCore, releasedVersions),
];

if (problems.length > 0) {
  throw new Error(
    `Packages must line up with the core version (${coreVersion}):\n` +
      problems.map(problem => `  - ${problem}`).join("\n"),
  );
}

console.log(
  `Adapters in lockstep at ${coreVersion}: ${manifests.map(manifest => manifest.name).join(", ")}`,
);
console.log(`  peers on the core (${String(peers.length)}): ${peers.map(peer => peer.name).join(", ")}`);
console.log(
  lockedCore === null
    ? "  bun.lock pins no registry copy of the core"
    : `  bun.lock pins ${lockedCore}${lockedCore === coreVersion ? "" : ` (lagging ${coreVersion} — refresh after publishing)`}`,
);
// Say so rather than passing quietly, so a skipped diagnostic is never mistaken
// for one that ran.
console.log(
  installedCore === null
    ? "  (no registry copy installed here — resolution diagnostic skipped)"
    : `  registry copy resolves to ${installedCore}`,
);
