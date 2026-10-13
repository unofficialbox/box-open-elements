import { appendFileSync, readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const adapterNames = ["react", "angular", "vue", "svelte", "solid", "preact"];

/** Fail closed before a release mutates tags or GitHub Releases. */
export async function checkReleaseRegistry(version, request = fetch) {
  const packages = await Promise.all(adapterNames.map(async name => {
    const packageName = `@unofficialbox/box-open-elements-${name}`;
    const response = await request(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (response.status === 404) return { packageName, missing: true, published: false };
    if (!response.ok) throw new Error(`${packageName}: registry HTTP ${response.status}; release preflight failed.`);
    const metadata = await response.json();
    if (metadata.name !== packageName || !metadata.versions || typeof metadata.versions !== "object" || Array.isArray(metadata.versions)) {
      throw new Error(`${packageName}: invalid registry metadata; release preflight failed.`);
    }
    return { packageName, missing: false, published: Object.hasOwn(metadata.versions, version) };
  }));
  const missing = packages.filter(pkg => pkg.missing).map(pkg => pkg.packageName);
  if (missing.length) {
    throw new Error(`Release blocked before tags/releases: bootstrap required for ${missing.join(", ")}. ` +
      "An authorized human must create these packages and configure their trusted publishers. See RELEASING.md.");
  }
  return { allPublished: packages.every(pkg => pkg.published), packages };
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const version = JSON.parse(readFileSync("package.json", "utf8")).version;
    const result = await checkReleaseRegistry(version);
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `all-published=${result.allPublished}\n`);
    console.log(`All ${result.packages.length} adapter packages exist; ${result.allPublished ? "all" : "not all"} have ${version}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
