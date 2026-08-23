import { checkAdapterLockstep } from "./version-rules.js";
import type { AdapterManifest } from "./version-rules.js";

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

const problems = checkAdapterLockstep(coreVersion, manifests);

if (problems.length > 0) {
  throw new Error(
    `Adapters must ship the core version (${coreVersion}) and peer-depend on it:\n` +
      problems.map(problem => `  - ${problem}`).join("\n"),
  );
}

console.log(
  `Adapters in lockstep at ${coreVersion}: ${manifests.map(manifest => manifest.name).join(", ")}`,
);
