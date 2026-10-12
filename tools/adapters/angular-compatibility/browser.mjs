/** Optional real-browser replay of the exact bundles retained by run.ts. */
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { chromium, firefox } from "playwright-core";
const [engine, executable, ...environments] = process.argv.slice(2);
if (!["chrome", "firefox"].includes(engine) || !environments.length) throw new Error("Usage: node browser.mjs chrome|firefox executable-or-dash environment...");
const browser = await (engine === "firefox" ? firefox : chromium).launch({ headless: true, ...(executable !== "-" ? { executablePath: executable } : {}) });
const rows = [];
try {
  for (const environment of environments) {
    const report = JSON.parse(await readFile(`${environment}/REPORT.json`, "utf8"));
    const bundle = await readFile(`${environment}/bundle/consumer.js`);
    const server = createServer((request, response) => {
      if (request.url === "/bundle.js") { response.setHeader("content-type", "text/javascript; charset=utf-8"); response.end(bundle); }
      else { response.setHeader("content-type", "text/html; charset=utf-8"); response.end('<!doctype html><compatibility-app></compatibility-app><script>window.production=' + (request.url === "/production") + '</script><script src="/bundle.js"></script>'); }
    });
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    try {
      for (const width of [1440, 390]) for (const production of [false, true]) {
        const context = await browser.newContext({ viewport: { width, height: 900 } });
        const page = await context.newPage();
        const errors = [], messages = [], external = [];
        const origin = `http://127.0.0.1:${server.address().port}`;
        await context.route("**/*", route => { if (route.request().url().startsWith(origin + "/")) return route.continue(); external.push(route.request().url()); return route.abort(); });
        page.on("pageerror", error => errors.push(error.message));
        page.on("console", message => { if (["warning", "error"].includes(message.type())) messages.push(message.text()); });
        await page.goto(`${origin}/${production ? "production" : "development"}`);
        const result = await page.evaluate(() => window.compatibilityReady);
        if (!result || result.angularVersion !== report.version || result.routes.length !== 5 || result.teardown !== "passed" || errors.length || messages.length || external.length) throw new Error(JSON.stringify({ version: report.version, engine, width, production, result, errors, messages, external }));
        rows.push({ version: report.version, engine, width, production, result, errors, messages, external });
        await context.close();
      }
    } finally { await new Promise(resolve => server.close(resolve)); }
  }
} finally { await browser.close(); }
await writeFile(`angular-compatibility-${engine}.json`, JSON.stringify(rows, null, 2));
console.log(`${rows.length} real ${engine} compiled compatibility runs passed`);
