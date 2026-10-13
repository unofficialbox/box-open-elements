import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkSiteArtifact } from "../../tools/preview/site-artifact-check.js";

const dirs: string[] = [];
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });
const fixture = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "boe-site-")); dirs.push(dir);
  for (const file of ["main.js", "styles.css", "lib/index.js", "components/table/index.html", "workshop/app.js", "workshop/styles.css"]) {
    mkdirSync(dirname(join(dir, file)), { recursive: true }); writeFileSync(join(dir, file), "content");
  }
  writeFileSync(join(dir, "components/table/index.html"), '<a href="../../workshop/">Workshop</a>');
  writeFileSync(join(dir, "index.html"), '<a href="./workshop/">Workshop</a>');
  writeFileSync(join(dir, "workshop/index.html"), '<link href="./styles.css"><script src="./app.js"></script>');
  return dir;
};
describe("site publishing smoke check", () => {
  it("accepts the complete docs plus Workshop artifact", () => { expect(() => checkSiteArtifact(fixture())).not.toThrow(); });
  it.each(["workshop/index.html", "workshop/app.js", "workshop/styles.css"])("rejects a missing %s before upload", file => {
    const dir = fixture(); rmSync(join(dir, file)); expect(() => checkSiteArtifact(dir)).toThrow(`missing ${file}`);
  });
  it("rejects Workshop links that incorrectly resolve below a component route", () => {
    const dir = fixture(); writeFileSync(join(dir, "components/table/index.html"), '<a href="./workshop/">Workshop</a>');
    expect(() => checkSiteArtifact(dir)).toThrow("invalid nested Workshop navigation");
  });
  it("rejects missing navigation and invalid Workshop asset references", () => {
    const dir = fixture(); writeFileSync(join(dir, "index.html"), "docs only");
    expect(() => checkSiteArtifact(dir)).toThrow("missing Workshop navigation");
    writeFileSync(join(dir, "index.html"), '<a href="./workshop/">Workshop</a>');
    writeFileSync(join(dir, "workshop/index.html"), '<script src="/app.js"></script>');
    expect(() => checkSiteArtifact(dir)).toThrow("Invalid Workshop entrypoint");
  });
});
