// Rendered Workshop regression: inline-size-contained tables need a real host width.
// Run after site:build; checks the actual deployable artifact, not a synthetic table.
import { chromium, firefox } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../../docs-site/dist/', import.meta.url));
const engine = process.env.BOE_TABLE_BROWSER || 'chrome';
const dir = process.env.BOE_TABLE_EVIDENCE_DIR || '/tmp/boe-workshop-table-sizing';
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
const url = `http://127.0.0.1:${server.address().port}/workshop/`;
const results = [];
let browser;
try {
  browser = await (engine === 'firefox' ? firefox : chromium).launch(engine === 'firefox'
    ? {} : { executablePath: process.env.BOE_TABLE_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  for (const theme of ['light', 'dark']) for (const width of [390, 320, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: theme });
    await context.addInitScript(theme => localStorage.setItem('boe-workshop-theme', theme), theme);
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()); });
    await page.goto(url);
    assert.equal(await page.title(), 'Box Open Elements — Workshop');
    assert.equal(page.url(), url);
    await page.locator('.nav-item[data-id="table"]').click();
    const compact = page.locator('box-table[label="Recent runs"]');
    const view = compact.getByRole('button', { name: 'View for Oct 12, 11:45 AM · dry run', exact: true });
    await view.waitFor({ state: 'visible', timeout: 30000 });
    assert.equal(await page.locator('#stage h1').innerText(), 'Table');
    const geometry = await page.locator('.variant-canvas > box-table').evaluateAll(tables => tables.map(table => {
      const canvas = table.parentElement, style = getComputedStyle(canvas);
      const shell = table.shadowRoot.querySelector('[part="shell"]');
      const b = table.getBoundingClientRect();
      return { label: table.getAttribute('label'), hostWidth: b.width, hostHeight: b.height,
        available: canvas.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
        shellWidth: shell.getBoundingClientRect().width,
        rows: table.shadowRoot.querySelectorAll('[part="row"]').length };
    }));
    await page.locator('figure.variant:has(box-table[label="Recent runs"])').screenshot({ path: `${dir}/${engine}-${width}-${theme}-compact.png` });
    writeFileSync(`${dir}/${engine}-${width}-${theme}-geometry.json`, JSON.stringify(geometry, null, 2));
    assert.equal(geometry.length, 8, 'All authored Table variants must render');
    for (const table of geometry) {
      assert.ok(table.hostWidth > 160, `${table.label}: collapsed host ${table.hostWidth}px`);
      assert.ok(Math.abs(table.hostWidth - table.available) <= 1, `${table.label}: must fit the canvas`);
      assert.ok(table.shellWidth > 160 && table.hostHeight > 20);
    }
    const summary = await compact.evaluate(table => {
      const root = table.shadowRoot, row = root.querySelector('[part="row"]'), shell = root.querySelector('[part="shell"]');
      const value = row.querySelector('th [part="stacked-value"]');
      const range = document.createRange(); range.selectNodeContents(value);
      const text = range.getBoundingClientRect(), bounds = shell.getBoundingClientRect();
      return { current: row.getAttribute('aria-current'), marker: getComputedStyle(row).boxShadow,
        hidden: [...row.querySelectorAll('[data-compact="hidden"]')].map(cell => getComputedStyle(cell).display),
        rows: root.querySelectorAll('[part="row"]').length, header: getComputedStyle(root.querySelector('thead')).display,
        text: { width: text.width, height: text.height, left: text.left, right: text.right },
        shell: { left: bounds.left, right: bounds.right, scroll: shell.scrollWidth, client: shell.clientWidth } };
    });
    assert.equal(summary.current, 'true'); assert.notEqual(summary.marker, 'none');
    assert.equal(summary.rows, 3); assert.equal(summary.header, 'none');
    assert.deepEqual(summary.hidden, ['none', 'none']);
    assert.ok(summary.text.width > 20 && summary.text.height > 5);
    assert.ok(summary.text.left >= summary.shell.left && summary.text.right <= summary.shell.right);
    assert.ok(summary.shell.scroll <= summary.shell.client + 1, 'Compact content must not be clipped horizontally');
    await page.evaluate(() => {
      window.workshopActions = [];
      document.querySelector('box-table[label="Recent runs"]').addEventListener('row-action', event => window.workshopActions.push({ rowId: event.detail.rowId, action: event.detail.action }));
    });
    await view.focus(); await page.keyboard.press('Enter');
    assert.deepEqual(await page.evaluate(() => window.workshopActions), [{ rowId: 'run-123', action: 'view' }]);
    assert.equal(await compact.evaluate(table => table.shadowRoot.activeElement?.getAttribute('aria-label')), 'View for Oct 12, 11:45 AM · dry run');
    for (const label of ['Successful call times', 'Run comparison']) {
      await page.locator(`figure.variant:has(box-table[label="${label}"])`).screenshot({ path: `${dir}/${engine}-${width}-${theme}-${label === 'Run comparison' ? 'list' : 'grid'}.png` });
    }
    const neighbors = [];
    for (const [id, title] of [['pagination', 'Pagination'], ['thumbnail-card', 'Thumbnail Card'], ['tree-grid', 'Tree Grid'], ['button', 'Button']]) {
      await page.locator(`.nav-item[data-id="${id}"]`).click();
      assert.equal(await page.locator('#stage h1').innerText(), title);
      await page.waitForFunction(() => [...document.querySelectorAll('#stage .variant-canvas > *')].every(node => node.getBoundingClientRect().height > 1), undefined, { timeout: 30000 });
      const boxes = await page.locator('#stage .variant-canvas > *').evaluateAll(nodes => nodes.map(node => ({ tag: node.localName, width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height })));
      assert.ok(boxes.length > 0 && boxes.every(box => box.width > 20 && box.height > 1), `${title}: meaningful neighboring previews`);
      if (id === 'button') {
        const save = page.locator('.variant-canvas').getByRole('button', { name: 'Save', exact: true });
        await save.focus(); assert.ok(await save.isVisible());
        const size = await save.evaluate(button => ({ width: button.getBoundingClientRect().width, canvas: button.getRootNode().host.parentElement.clientWidth }));
        assert.ok(size.width < size.canvas - 48, 'Intrinsic buttons must not become full-width');
      }
      await page.locator('.variant-grid').screenshot({ path: `${dir}/${engine}-${width}-${theme}-${id}.png` });
      neighbors.push({ id, boxes });
    }
    assert.deepEqual(errors, []);
    results.push({ engine, width, theme, status: 'passed', geometry, summary, neighbors,
      checks: ['artifact-identity', 'all-eight-table-host-widths', 'painted-text-bounds', 'compact-current-hidden-focus-action', 'list-grid-previews', 'neighbor-rendering', 'intrinsic-button-width', 'console'] });
    await context.close();
  }
} finally {
  await browser?.close(); await new Promise(resolve => server.close(resolve));
  writeFileSync(`${dir}/${engine}-RESULTS.json`, JSON.stringify(results, null, 2));
}
console.log(JSON.stringify(results, null, 2));
