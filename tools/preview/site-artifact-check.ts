import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Run against the actual artifact before upload, rather than trusting build exit codes. */
export function checkSiteArtifact(root: string): void {
  for (const file of ["index.html", "main.js", "styles.css", "lib/index.js", "components/table/index.html",
    "workshop/index.html", "workshop/app.js", "workshop/styles.css"]) {
    if (!existsSync(resolve(root, file))) throw new Error(`Incomplete site artifact: missing ${file}`);
  }
  const index = readFileSync(resolve(root, "index.html"), "utf8");
  if (!index.includes('href="./workshop/"')) throw new Error("Incomplete site artifact: missing Workshop navigation");
  const table = readFileSync(resolve(root, "components/table/index.html"), "utf8");
  if (!table.includes('href="../../workshop/"')) throw new Error("Incomplete site artifact: invalid nested Workshop navigation");
  const workshop = readFileSync(resolve(root, "workshop/index.html"), "utf8");
  for (const ref of ['src="./app.js"', 'href="./styles.css"']) {
    if (!workshop.includes(ref)) throw new Error(`Invalid Workshop entrypoint: missing ${ref}`);
  }
}

if (import.meta.main) {
  checkSiteArtifact(resolve("docs-site/dist"));
  console.log("Site artifact checked: docs, library, Workshop entrypoint and assets present.");
}
