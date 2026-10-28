import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Workspace examples validate this checkout, while packed consumers separately
// validate npm resolution. The registry pin may lag until a release is live.
const root = new URL("../../", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("package.json", root), "utf8")) as {
  name: string;
  exports: Record<string, { import?: string }>;
};
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const localCoreAliases = Object.entries(manifest.exports)
  .filter((entry): entry is [string, { import: string }] => typeof entry[1].import === "string")
  .sort(([a], [b]) => b.length - a.length)
  .map(([key, target]) => ({
    find: new RegExp(`^${escape(manifest.name + key.slice(1)).replace("\\*", "(.+)")}$`),
    replacement: fileURLToPath(new URL(target.import, root)).replace("*", "$1"),
  }));
