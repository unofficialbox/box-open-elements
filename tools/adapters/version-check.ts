const adapterDirectories = ["react", "angular", "vue", "svelte"] as const;

type PackageManifest = {
  name: string;
  version: string;
};

const manifests = await Promise.all(
  adapterDirectories.map(async directory => ({
    directory,
    manifest: await Bun.file(`packages/${directory}/package.json`).json() as PackageManifest,
  })),
);

const expectedVersion = process.env.ADAPTER_VERSION ?? manifests[0]!.manifest.version;
const mismatches = manifests.filter(({ manifest }) => manifest.version !== expectedVersion);

if (mismatches.length > 0) {
  const details = manifests
    .map(({ manifest }) => `${manifest.name}: ${manifest.version}`)
    .join("\n");
  throw new Error(
    `Adapter versions must remain in lockstep at ${expectedVersion}.\n${details}`,
  );
}

console.log(
  `Adapter version ${expectedVersion}: ${manifests.map(({ manifest }) => manifest.name).join(", ")}`,
);
