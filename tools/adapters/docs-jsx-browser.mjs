import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join, extname, resolve, sep } from 'node:path';
import { chromium } from 'playwright-core';
const directory = process.argv[2];
const results = JSON.parse(await readFile(join(directory, 'results.json'), 'utf8'));
const evidence = resolve(process.env.BOE_DOCS_JSX_EVIDENCE_DIR ?? '/tmp/boe-docs-jsx-evidence');
await mkdir(evidence, { recursive: true });
const root = resolve(directory);
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const file = resolve(root, '.' + (url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname));
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const data = await readFile(file);
    const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(file)] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type }); res.end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const observations = [];
try {
  for (const result of results) {
    const sources = await Promise.all(result.files.map(file => readFile(join(result.project, file), 'utf8')));
    const find = predicate => { const index = result.files.findIndex((file, i) => predicate(file, sources[i])); assert(index >= 0); return index; };
    for (const width of [1280, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => { errors.push(error.message); console.error(result.framework, width, error.message); });
      await page.goto(`${origin}/${result.framework}/dist/`);
      await page.waitForFunction(() => typeof window.mountDocsExample === 'function');
      const mount = index => page.evaluate(index => window.mountDocsExample(index), index);
      // Optional registration must be present, rather than an inert unknown tag.
      await mount(find(file => file === 'code-editor-0.tsx'));
      assert(await page.evaluate(() => !!customElements.get('box-code-editor')));
      await page.locator('box-code-editor').waitFor();
      await page.waitForFunction(() => !!document.querySelector('box-code-editor')?.shadowRoot?.querySelector('.cm-editor'));
      await mount(find((file, code) => file.startsWith('number-input-') && code.includes('value: number | null')));
      await page.evaluate(() => { const form = document.createElement('form'); const app = document.getElementById('app'); app.before(form); form.append(app); });
      const number = page.locator('box-number-input');
      assert.equal(await number.evaluate(el => el.value), null);
      await number.locator('input').fill('7');
      assert.equal(await number.evaluate(el => el.value), 7);
      await number.locator('input').fill('');
      assert.equal(await number.evaluate(el => el.value), null);
      await number.locator('input').fill('5');
      await page.evaluate(() => document.querySelector('form').reset());
      assert.equal(await number.evaluate(el => el.value), null);
      await mount(find(file => file === 'folder-tree-0.tsx'));
      const tree = page.locator('box-folder-tree');
      const rows = tree.locator('[role="treeitem"]');
      assert.equal(await rows.count(), 2);
      await rows.first().focus(); await page.keyboard.press('Space');
      assert.deepEqual(await tree.evaluate(el => el.selectedIds), ['root']);
      await page.keyboard.press('ArrowLeft');
      assert.deepEqual(await tree.evaluate(el => el.expandedIds), []);
      assert.equal(await rows.count(), 1);
      for (const state of ['loading', 'unavailable']) {
        await mount(find((file, code) => file.startsWith('folder-tree-') && code.includes(`label="Projects" ${state}`)));
        assert.equal(await tree.evaluate(el => el.nodes.length), 0);
        assert(await tree.getAttribute(state) !== null);
      }
      await mount(find((file, code) => file.startsWith('folder-tree-diff-') && code.includes('mode="side-by-side"')));
      const diff = page.locator('box-folder-tree-diff');
      assert.equal(await diff.evaluate(el => el.mode), 'side-by-side');
      assert.equal(await diff.evaluate(el => el.leftLabel), 'Source');
      assert.equal(await diff.evaluate(el => el.rightLabel), 'Destination');
      assert.equal(await diff.evaluate(el => el.partial), true);
      // Two copied lesson instances must not share document-wide ID lookups.
      const intake = find(file => file === 'lesson-intake-5.jsx');
      await page.evaluate(() => { const second = document.createElement('div'); second.id = 'second'; document.body.append(second); });
      await mount(intake);
      await page.evaluate(index => window.mountDocsExample(index, 'second'), intake);
      await page.locator('#app input[id="counterparty"]').fill('First');
      await page.locator('#second input[id="counterparty"]').fill('Second');
      assert.equal(await page.locator('#app box-form-wizard').evaluate(el => el.values.counterparty), 'First');
      assert.equal(await page.locator('#second box-form-wizard').evaluate(el => el.values.counterparty), 'Second');
      await page.evaluate(() => window.unmountDocsExample());
      assert.equal(await page.locator('#app').evaluate(el => el.children.length), 0);
      assert.equal(await page.locator('#second input[id="counterparty"]').inputValue(), 'Second');
      await mount(intake);
      assert.equal(await page.locator('#app input[id="counterparty"]').inputValue(), '');
      await page.screenshot({ path: join(evidence, `${result.framework}-${width}.png`), fullPage: false });
      assert.deepEqual(errors, []);
      observations.push({ framework: result.framework, width, status: 'passed', checks: ['optional editor registration', 'nullable controlled input/reset', 'tree controlled selection/collapse', 'loading/unavailable variants', 'diff labels/partial/mode', 'two lesson instances and repeated mount', 'no uncaught errors'] });
      await page.close();
    }
  }
  await import('node:fs/promises').then(fs => fs.writeFile(join(evidence, 'results.json'), JSON.stringify(observations, null, 2)));
  console.log(JSON.stringify(observations));
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
