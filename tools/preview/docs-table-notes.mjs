// Browser interaction regression for Table's authored variant notes.
// Run after site:build; tests the actual static publishing artifact.
import { chromium, firefox } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../../docs-site/dist/', import.meta.url));
const engine = process.env.BOE_TABLE_BROWSER || 'chrome';
const dir = process.env.BOE_TABLE_EVIDENCE_DIR || '/tmp/boe-docs-table-notes';
assert.ok(['chrome', 'firefox'].includes(engine));
mkdirSync(dir, { recursive: true });
const server = createServer((request, response) => {
  try {
    let name = new URL(request.url, 'http://localhost').pathname;
    if (name.endsWith('/')) name += 'index.html';
    const file = path.resolve(root, '.' + name);
    assert.ok(file.startsWith(root));
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
    response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    response.end(readFileSync(file));
  } catch { response.writeHead(404); response.end(); }
}).listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const url = `http://127.0.0.1:${server.address().port}/components/table/`;
const results = [];
let browser;
try {
  browser = await (engine === 'firefox' ? firefox : chromium).launch(engine === 'firefox'
    ? {} : { executablePath: process.env.BOE_TABLE_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  for (const theme of ['light', 'dark']) for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: theme });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()); });
    await page.goto(url);
    await page.getByRole('combobox', { name: 'Preview variant' }).waitFor({ timeout: 30000 });
    assert.equal(await page.title(), 'Table — Box Open Elements');
    assert.equal(page.url(), url);
    const toggle = page.getByRole('button', { name: theme === 'dark' ? 'Switch to dark mode' : 'Switch to light mode', exact: true });
    if (await toggle.count()) await toggle.click();
    await page.getByRole('tab', { name: 'Code', exact: true }).click();
    const framework = page.locator('.code-frameworks-note');
    const originalFrameworkText = await framework.innerText();
    const guide = framework.getByRole('link', { name: 'Frameworks guide', exact: true });
    assert.ok(await guide.isVisible());
    const originalHref = await guide.getAttribute('href');
    const transitions = [];
    for (const [variant, expected] of [
      ['Compact run list with actions', 'At phone widths the header and Status summary'],
      ['Descriptors and expandable rows', 'Badge and link cells are descriptors'],
      ['Loading', 'Click to select; Ctrl/Cmd-click to toggle'],
      ['Compact run list with actions', 'At phone widths the header and Status summary'],
    ]) {
      await page.getByRole('tab', { name: 'Preview', exact: true }).click();
      await page.getByRole('combobox', { name: 'Preview variant' }).selectOption({ label: variant });
      await page.getByRole('tab', { name: 'Code', exact: true }).click();
      assert.ok(await guide.isVisible(), `${variant}: Frameworks guide must survive`);
      assert.equal(await guide.getAttribute('href'), originalHref);
      assert.equal(await framework.innerText(), originalFrameworkText);
      const note = page.locator('#variant-note');
      assert.ok(await note.isVisible(), `${variant}: selected note must be visible`);
      const text = await note.innerText();
      assert.ok(text.startsWith(expected), `${variant}: stale variant note: ${text}`);
      transitions.push({ variant, note: text });
    }
    await page.screenshot({ path: `${dir}/${engine}-${width}-${theme}-code.png`, fullPage: true });
    assert.deepEqual(errors, []);
    results.push({ engine, width, theme, status: 'passed', transitions,
      checks: ['identity', 'rendering', 'console', 'framework-guide-preserved', 'selected-note-current', 'repeated-variant-switching'] });
    await context.close();
  }
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
  writeFileSync(`${dir}/${engine}-RESULTS.json`, JSON.stringify(results, null, 2));
}
console.log(JSON.stringify(results, null, 2));
