// Browser regression for #583. Run after bun run build:core.
import { chromium, firefox } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(fileURLToPath(new URL('../../dist/', import.meta.url)));
const engine = process.env.BOE_SEGMENTED_BROWSER || 'chrome';
const dir = process.env.BOE_SEGMENTED_EVIDENCE_DIR || '/tmp/boe-segmented-reflow';
assert.ok(['chrome', 'chromium', 'firefox'].includes(engine));
mkdirSync(dir, { recursive: true });
const fixture = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Segmented control reflow</title>
<style>body{margin:16px;font:14px Arial;background:var(--boe-token-surface-surface);color:var(--boe-token-text-text)}h1{font-size:20px}#stage{margin-block:24px}#status{overflow-wrap:anywhere}</style>
<h1>Load shape</h1><button id="outside" type="button">Outside focus</button>
<form id="form"><input name="existing" value="preserved" type="hidden"><div id="stage"><box-segmented-control id="control" label="Load shape"></box-segmented-control></div><button id="submit">Submit</button></form><p id="status" role="status">Choose a load shape</p>
<script type="module">
window.lib=await import('/runtime/index.js');lib.registerBoxDefaultDesignSystem();lib.registerBoxDarkDesignSystem();
window.shapes=[{label:'Steady',value:'steady'},{label:'Spike',value:'spike'},{label:'Soak',value:'soak'},{label:'In stages',value:'stages'},{label:'Capacity test',value:'capacity'}];
window.control=document.querySelector('#control');control.options=shapes;
window.changes=[];control.addEventListener('value-changed',e=>{changes.push(e.detail.value);document.querySelector('#status').textContent=e.detail.value});
window.submits=0;document.querySelector('#form').addEventListener('submit',e=>{e.preventDefault();submits++});window.ready=true;
</script></html>`;
const server = createServer((request, response) => {
  try {
    const name = new URL(request.url, 'http://localhost').pathname;
    if (name === '/') { response.setHeader('Content-Type', 'text/html'); response.end(fixture); return; }
    if (name === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    assert.ok(name.startsWith('/runtime/'));
    const file = path.resolve(root, name.slice(9));
    assert.ok(file.startsWith(root + path.sep));
    response.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : 'text/plain');
    response.end(readFileSync(file));
  } catch { response.writeHead(404); response.end(); }
}).listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const url = `http://127.0.0.1:${server.address().port}/`;
const results = [];
let browser;
try {
  browser = await (engine === 'firefox' ? firefox : chromium).launch(engine === 'chrome'
    ? { executablePath: process.env.BOE_SEGMENTED_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', timeout: 30000 }
    : { headless: true, timeout: 30000 });
  for (const theme of ['light', 'dark']) for (const width of [320, 390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()); });
    await page.goto(url);
    await page.waitForFunction(() => window.ready);
    assert.equal(await page.title(), 'Segmented control reflow');
    assert.equal(await page.getByRole('heading', { name: 'Load shape' }).count(), 1);
    await page.evaluate(theme => lib.applyDesignTokens(document.documentElement, theme === 'dark' ? 'box-dark' : 'box-default'), theme);
    const measure = () => page.evaluate(() => {
      const group = control.shadowRoot.querySelector('[part=control]');
      const buttons = [...group.querySelectorAll('button')];
      const rect = group.getBoundingClientRect();
      return { page: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
        stage: document.querySelector('#stage').clientWidth, host: control.getBoundingClientRect().width,
        group: [group.scrollWidth, group.clientWidth, rect.width],
        rows: new Set(buttons.map(button => button.getBoundingClientRect().top)).size,
        contained: buttons.every(button => { const b = button.getBoundingClientRect(); return b.left >= rect.left && b.right <= rect.right + 1 && button.scrollWidth <= button.clientWidth + 1; }) };
    });
    // Reproduce the original unbounded inline-flex on this exact fixture.
    const before = await page.evaluate(() => {
      const style = control.shadowRoot.querySelector('style');
      const original = style.textContent;
      style.textContent = original.replace(/\s*(max-width: 100%;|min-width: 0;|flex-wrap: wrap;|box-sizing: border-box;|overflow-wrap: anywhere;)/g, '');
      const group = control.shadowRoot.querySelector('[part=control]');
      const size = { width: group.getBoundingClientRect().width, page: document.documentElement.scrollWidth };
      style.textContent = original;
      return size;
    });
    if (width === 320) assert.ok(before.width > width, JSON.stringify(before));
    const layouts = [];
    for (const layout of ['separated', 'attached']) {
      await page.evaluate(layout => { control.layout = layout; }, layout);
      const geometry = await measure();
      assert.ok(geometry.page[0] <= geometry.page[1], JSON.stringify(geometry));
      assert.ok(geometry.host <= geometry.stage + 1 && geometry.group[2] <= geometry.stage + 1);
      assert.ok(geometry.group[0] <= geometry.group[1] + 1 && geometry.contained);
      assert.equal(geometry.rows > 1, width < 1440);
      if (width === 1440 && layout === 'separated') assert.equal(geometry.group[2], before.width);
      layouts.push({ layout, ...geometry });
      await page.screenshot({ path: `${dir}/${engine}-${width}-${theme}-${layout}.png`, fullPage: true });
    }
    await page.evaluate(() => { control.layout = 'separated'; control.options = shapes.map(o => ({ ...o, disabled: o.value === 'spike' })); control.value = 'steady'; });
    const radio = value => page.locator('#control').locator(`[data-value="${value}"]`);
    await radio('steady').focus();
    for (const [key, value] of [['ArrowRight', 'soak'], ['ArrowDown', 'stages'], ['End', 'capacity'], ['ArrowRight', 'steady'], ['ArrowLeft', 'capacity'], ['ArrowUp', 'stages'], ['Home', 'steady']]) {
      await page.keyboard.press(key);
      assert.equal(await page.evaluate(() => control.value), value);
      assert.equal(await page.evaluate(() => control.shadowRoot.activeElement?.dataset.value), value);
      assert.equal(await radio(value).getAttribute('aria-checked'), 'true');
      assert.equal(await page.locator('#control').locator('[tabindex="0"]').count(), 1);
    }
    await radio('capacity').click(); assert.equal(await page.evaluate(() => control.value), 'capacity');
    const count = await page.evaluate(() => changes.length);
    await radio('capacity').press('Space'); assert.equal(await page.evaluate(() => changes.length), count);
    assert.equal(await page.evaluate(() => submits), 0);
    assert.deepEqual(await page.evaluate(() => [...new FormData(document.querySelector('#form'))]), [['existing', 'preserved']]);
    await page.getByRole('button', { name: 'Submit', exact: true }).click(); assert.equal(await page.evaluate(() => submits), 1);
    await page.locator('#outside').focus(); await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => control.shadowRoot.activeElement?.dataset.value), 'capacity');
    assert.equal(await radio('capacity').evaluate(el => el.matches(':focus-visible')), true);
    await page.screenshot({ path: `${dir}/${engine}-${width}-${theme}-focus.png`, fullPage: true });
    // Host-controlled relabel/reorder/value writes retain keyed focus and emit no changes.
    assert.equal(await page.evaluate(() => {
      const node = control.shadowRoot.activeElement, count = changes.length;
      for (let i = 0; i < 6; i++) { control.options = [...control.options].reverse().map(o => ({ ...o, label: o.value === 'capacity' ? 'Capacity test updated' : o.label })); control.value = i % 2 ? 'steady' : 'stages'; }
      return control.shadowRoot.activeElement === node && changes.length === count;
    }), true);
    await page.locator('#outside').focus();
    await page.evaluate(() => { control.options = shapes; control.value = 'soak'; });
    assert.equal(await page.evaluate(() => document.activeElement.id), 'outside');
    await page.evaluate(() => {
      window.override = () => { control.value = 'steady'; document.querySelector('#outside').focus(); };
      control.addEventListener('value-changed', override);
    });
    await radio('soak').focus(); await page.keyboard.press('End');
    assert.equal(await page.evaluate(() => control.value), 'steady');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'outside');
    await page.evaluate(() => { control.removeEventListener('value-changed', override); control.disabled = true; });
    assert.equal(await page.locator('#control').locator('button:disabled').count(), 5);
    assert.equal(await page.locator('#control').locator('[tabindex="0"]').count(), 0);
    await page.evaluate(() => { const count = changes.length; control.shadowRoot.querySelector('button').click(); window.assertNoChange = changes.length === count; });
    assert.equal(await page.evaluate(() => window.assertNoChange), true);
    await page.evaluate(() => { control.disabled = false; control.options = shapes.map(o => ({ ...o, disabled: true })); });
    assert.equal(await page.locator('#control').locator('[tabindex="0"]').count(), 0);
    // Smaller parents, flex/grid hosts, one overlong word, a long phrase, empty options.
    for (const display of ['block', 'flex', 'grid']) for (const parentWidth of [160, 64]) {
      await page.evaluate(({ display, parentWidth }) => {
        Object.assign(document.querySelector('#stage').style, { display, width: `${parentWidth}px` });
        control.options = [{ label: 'CapacityTest'.repeat(15), value: 'long' }, { label: 'Capacity test with a very long descriptive label', value: 'phrase' }];
      }, { display, parentWidth });
      const geometry = await measure();
      assert.ok(geometry.page[0] <= geometry.page[1] && geometry.host <= parentWidth + 1 && geometry.group[0] <= geometry.group[1] + 1 && geometry.contained, JSON.stringify({ display, parentWidth, geometry }));
    }
    await page.evaluate(() => { control.options = []; });
    assert.equal(await page.locator('#control').getByRole('radio').count(), 0);
    assert.deepEqual(errors, []);
    results.push({ engine, version: browser.version(), width, theme, before, layouts, interactions: 'passed' });
    await context.close();
  }
  writeFileSync(`${dir}/${engine}-results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally { await browser?.close(); server.close(); }
