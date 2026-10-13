// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { adapterNames, checkReleaseRegistry } from "../../tools/adapters/release-preflight.mjs";

const registry = (missing: string[] = [], published: string[] = []) => async (url: string) => {
  const name = decodeURIComponent(url.split("/").at(-1)!);
  const framework = name.replace("@unofficialbox/box-open-elements-", "");
  return missing.includes(framework)
    ? new Response("not found", { status: 404 })
    : Response.json({ name, versions: published.includes(framework) ? { "0.42.2": {} } : {} });
};

describe("release bootstrap preflight", () => {
  it("blocks unbootstrapped additions even when the original four have published", async () => {
    await expect(checkReleaseRegistry("0.42.2", registry(["solid", "preact"], ["react", "angular", "vue", "svelte"])))
      .rejects.toThrow("Release blocked before tags/releases: bootstrap required for @unofficialbox/box-open-elements-solid, @unofficialbox/box-open-elements-preact");
  });
  it("allows existing packages whose next version is not yet published", async () => {
    expect((await checkReleaseRegistry("0.42.2", registry())).allPublished).toBe(false);
  });
  it("identifies already-complete reruns", async () => {
    expect((await checkReleaseRegistry("0.42.2", registry([], adapterNames))).allPublished).toBe(true);
  });
  it("fails closed on registry outages, transport errors, or malformed metadata", async () => {
    await expect(checkReleaseRegistry("0.42.2", async () => new Response("outage", { status: 503 }))).rejects.toThrow("registry HTTP 503");
    await expect(checkReleaseRegistry("0.42.2", async () => { throw new Error("network unavailable"); })).rejects.toThrow("network unavailable");
    await expect(checkReleaseRegistry("0.42.2", async () => Response.json({ versions: {} }))).rejects.toThrow("invalid registry metadata");
  });
  it("runs the actual preflight before every release mutation and does not silently skip missing packages later", () => {
    const workflow = readFileSync(".github/workflows/cut-release.yml", "utf8");
    const preflight = workflow.indexOf("node tools/adapters/release-preflight.mjs");
    expect(preflight).toBeGreaterThan(0);
    for (const mutation of ["git tag ", "gh release create", "gh workflow run release"]) {
      expect(workflow.indexOf(mutation)).toBeGreaterThan(preflight);
    }
    expect(workflow).toContain("steps.adapter-preflight.outputs.all-published");
    expect(workflow).not.toContain("Tag $TAG is in place; dispatch");
    const publisher = readFileSync(".github/workflows/release-adapters.yml", "utf8");
    const publishPreflight = publisher.indexOf("node tools/adapters/release-preflight.mjs");
    expect(publishPreflight).toBeGreaterThan(publisher.indexOf("Refusing to publish from"));
    expect(publishPreflight).toBeLessThan(publisher.indexOf('npm publish "./packages/$name"'));
    for (const name of adapterNames) {
      expect(JSON.parse(readFileSync(`packages/${name}/package.json`, "utf8")).name).toBe(`@unofficialbox/box-open-elements-${name}`);
    }
  });
});
