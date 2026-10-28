import { readFile } from "node:fs/promises";
import { checkTreeReleaseCompatibility } from "./release-compatibility-rules.js";
const root = new URL("../../", import.meta.url);
const core = JSON.parse(await readFile(new URL("package.json", root), "utf8")) as { version: string };
const react = JSON.parse(await readFile(new URL("packages/react/package.json", root), "utf8")) as { peerDependencies: Record<string, string> };
const problems = checkTreeReleaseCompatibility(core.version, react.peerDependencies["@unofficialbox/box-open-elements"] ?? "");
if (problems.length) throw new Error(`Release compatibility checks failed:\n${problems.join("\n")}`);
console.log(`Tree entrypoints and React core peer are compatible for release ${core.version}.`);
