/** New eager React entrypoints first ship after the already-published 0.42.3. */
export function checkTreeReleaseCompatibility(coreVersion: string, reactCorePeer: string): string[] {
  const version = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(coreVersion);
  if (!version) return [`Invalid core release version: ${coreVersion}`];
  const [major, minor, patch] = version.slice(1).map(Number) as [number, number, number];
  const newer = major > 0 || minor > 42 || (minor === 42 && patch > 3);
  const problems: string[] = [];
  if (!newer) problems.push("Folder tree entrypoints require a new core release after 0.42.3; bump the core and adapters together before publishing.");
  if (reactCorePeer !== `^${coreVersion}`) problems.push(`The React core peer must be ^${coreVersion}, the release that ships its eager tree imports.`);
  return problems;
}
