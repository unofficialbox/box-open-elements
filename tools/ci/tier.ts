import { readFileSync } from "node:fs";

export type CheckTier = "major" | "minor" | "patch" | "hotfix";

const TIERS: CheckTier[] = ["major", "minor", "patch", "hotfix"];

export function versionTier(base: string, current: string): CheckTier | null {
  const parse = (value: string): number[] => {
    const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(value);
    if (!match) throw new Error(`Invalid package version: ${value}`);
    return match.slice(1, 4).map(Number);
  };
  const [baseMajor, baseMinor, basePatch] = parse(base);
  const [major, minor, patch] = parse(current);
  if (major > baseMajor) return "major";
  if (major < baseMajor) throw new Error(`Version went backwards: ${base} -> ${current}`);
  if (minor > baseMinor) return "minor";
  if (minor < baseMinor || patch < basePatch) throw new Error(`Version went backwards: ${base} -> ${current}`);
  return patch > basePatch ? "patch" : null;
}

export function checkTier(base: string, current: string, labels: string[]): CheckTier {
  const selected = TIERS.filter((tier) => labels.includes(`release:${tier}`));
  if (selected.length > 1) throw new Error(`Conflicting release-tier labels: ${selected.join(", ")}`);
  const bump = versionTier(base, current);
  if (selected[0] && bump && selected[0] !== bump && !(selected[0] === "hotfix" && bump === "patch")) {
    throw new Error(`release:${selected[0]} conflicts with ${base} -> ${current} (${bump})`);
  }
  return selected[0] ?? bump ?? "patch";
}

if (import.meta.main) {
  const base = process.env.BASE_VERSION;
  if (!base) throw new Error("BASE_VERSION is required");
  const current = JSON.parse(readFileSync("package.json", "utf8")).version as string;
  const labels = JSON.parse(process.env.PR_LABELS ?? "[]") as string[];
  const tier = checkTier(base, current, labels);
  const full = tier === "major" || tier === "minor";
  const result = `tier=${tier}\nfull=${full}\n`;
  if (process.env.GITHUB_OUTPUT) {
    const { appendFileSync } = await import("node:fs");
    appendFileSync(process.env.GITHUB_OUTPUT, result);
  }
  process.stdout.write(result);
}
