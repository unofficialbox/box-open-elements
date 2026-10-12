import { chromium, firefox } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
// Run after build:core. The pinned Playwright container provides Firefox.
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const dir = process.env.BOE_TABLE_EVIDENCE_DIR || path.join(tmpdir(), 'boe-table-host-content');
const engine = process.env.BOE_TABLE_BROWSER || 'firefox';
if (!['firefox', 'chrome'].includes(engine))
    throw new Error('BOE_TABLE_BROWSER must be firefox or chrome');
mkdirSync(dir, { recursive: true });
const runtimeDir = path.resolve(repoRoot, 'dist');
const fixture = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Table host-content regression</title><style>body{font:14px Arial;color:var(--boe-token-text-text);background:var(--boe-token-surface-surface)}</style><h1>Table host-content regression</h1><label>Outside focus<input id="outside"></label><main id="stage"></main><script type="module">window.lib=await import('./runtime/index.js');lib.registerBoxDarkDesignSystem();lib.applyDesignTokens(document.documentElement,'box-default');window.ready=true;</script></html>`;
const server = createServer((q, r) => { try {
    const name = new URL(q.url, 'http://localhost').pathname;
    if (name === '/fixture.html') {
        r.setHeader('Content-Type', 'text/html');
        r.end(fixture);
        return;
    }
    if (!name.startsWith('/runtime/'))
        throw new Error('Not found');
    const p = path.resolve(runtimeDir, name.slice('/runtime/'.length));
    if (!p.startsWith(runtimeDir + path.sep))
        throw new Error('Not found');
    r.setHeader('Content-Type', p.endsWith('.js') ? 'text/javascript' : 'text/plain');
    r.end(readFileSync(p));
}
catch {
    r.statusCode = 404;
    r.end();
} }).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const browser = await (engine === 'firefox' ? firefox : chromium).launch(engine === 'firefox' ? {} : { ...(process.env.BOE_TABLE_CHROME_PATH ? { executablePath: process.env.BOE_TABLE_CHROME_PATH } : {}), args: ['--no-sandbox'] });
const results = [];
for (const profile of [{ width: 1440, theme: 'light' }, { width: 390, theme: 'dark' }]) {
    const context = await browser.newContext({ viewport: { width: profile.width, height: 900 }, colorScheme: profile.theme });
    const page = await context.newPage(), errors = [], consoleErrors = [], external = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (['error', 'warning'].includes(m.type()))
        consoleErrors.push(m.text()); });
    await context.route('**/*', r => { if (r.request().url().startsWith('http://127.0.0.1:'))
        return r.continue(); external.push(r.request().url()); return r.abort(); });
    await page.goto(`http://127.0.0.1:${server.address().port}/fixture.html`);
    await page.waitForFunction(() => window.ready);
    await page.evaluate(theme => lib.applyDesignTokens(document.documentElement, theme === 'dark' ? 'box-dark' : 'box-default'), profile.theme);
    for (const mode of ['open', 'closed'])
        for (const inner of [false, true]) {
            await page.evaluate(({ mode, inner }) => { stage.replaceChildren(); window.outer = document.createElement('div'); outer.id = 'outer-host'; stage.append(outer); window.scope = outer.attachShadow({ mode }); window.t = document.createElement('box-table'); t.label = 'Nested Table'; t.selectionMode = 'multiple'; t.columns = [{ key: 'name', label: 'Name', hostContent: true }]; t.rows = [{ id: 'a', cells: { name: 'A' } }, { id: 'b', cells: { name: 'B' } }]; scope.append(t); window.input = document.createElement('input'); input.setAttribute('aria-label', 'Nested host input'); input.value = 'Synthetic'; window.control = inner ? document.createElement('div') : input; if (inner)
                control.attachShadow({ mode: 'open' }).append(input); control.slot = 'cell-a-name'; t.append(control); window.sibling = document.createElement('button'); sibling.textContent = 'Sibling host control'; scope.append(sibling); input.focus(); }, { mode, inner });
            const snapshot = () => page.evaluate(() => ({ documentTag: document.activeElement?.tagName, documentId: document.activeElement?.id, scopeTag: scope.activeElement?.tagName, kept: scope.activeElement === control && (control === input || control.shadowRoot.activeElement === input), sibling: scope.activeElement === sibling, outside: document.activeElement === outside, selected: t.selectedIds, value: input.value }));
            const before = await snapshot();
            await page.evaluate(() => { t.rows = [...t.rows].reverse(); t.selectedIds = ['b']; });
            await page.waitForTimeout(60);
            const settled = await snapshot();
            await page.keyboard.press('End');
            const native = await snapshot();
            await page.evaluate(() => { sibling.focus(); t.rows = [...t.rows].reverse(); });
            await page.waitForTimeout(60);
            const sameRootHandoff = await snapshot();
            await page.evaluate(() => { outside.focus(); t.selectedIds = []; });
            await page.waitForTimeout(60);
            const documentHandoff = await snapshot();
            results.push({ name: 'nested-table-slot-focus', engine, ...profile, mode, inner, status: before.kept && settled.kept && native.kept && native.selected.join(',') === 'b' && sameRootHandoff.sibling && documentHandoff.outside ? 'passed' : 'failed', observed: { before, settled, native, sameRootHandoff, documentHandoff } });
            // A host can hand off focus synchronously when Firefox restores the control.
            await page.evaluate(() => { input.focus(); input.addEventListener('focus', () => outside.focus(), { once: true }); t.rows = [...t.rows].reverse(); });
            await page.waitForTimeout(60);
            const duringRender = await snapshot();
            results.push({ name: 'nested-table-restoration-focus-handoff', engine, ...profile, mode, inner, status: engine === 'firefox' ? duringRender.outside ? 'passed' : 'failed' : duringRender.kept || duringRender.outside ? 'passed' : 'failed', observed: duringRender });
        }
    for (const hostPart of ['row-action', 'expander']) {
        await page.evaluate(hostPart => { stage.replaceChildren(); window.panel = document.createElement('div'); stage.append(panel); panel.attachShadow({ mode: 'open' }).innerHTML = '<slot name="panel-content" part="cell-slot"></slot>'; window.t = document.createElement('box-table'); t.slot = 'panel-content'; t.label = 'Projected Table'; t.selectionMode = 'multiple'; t.columns = [{ key: 'name', label: 'Name', hostContent: true }]; t.rows = [{ id: 'a', detail: 'Details', cells: { name: 'A' }, actions: [{ key: 'view', label: 'View' }] }]; panel.append(t); window.actions = []; t.addEventListener('row-action', e => actions.push(e.detail)); window.hostButton = document.createElement('button'); hostButton.slot = 'cell-a-name'; hostButton.setAttribute('part', hostPart); hostButton.dataset.rowId = 'a'; hostButton.dataset.actionKey = 'view'; hostButton.textContent = 'Independent host button'; t.append(hostButton); }, hostPart);
        await page.locator('box-table [part=row-action]').filter({ hasText: 'View' }).focus();
        await page.keyboard.press('Enter');
        const action = await page.evaluate(() => ({ actions: actions.map(e => ({ rowId: e.rowId, action: e.action })), selected: t.selectedIds }));
        await page.locator('box-table [part=expander]').filter({ hasNotText: 'Independent' }).focus();
        await page.keyboard.press('Enter');
        const expansion = await page.evaluate(() => ({ expanded: t.expandedRows, details: t.shadowRoot.querySelector('[part=detail-row]')?.textContent }));
        await page.evaluate(() => hostButton.click());
        const collision = await page.evaluate(() => ({ count: actions.length, expanded: t.expandedRows, selected: t.selectedIds }));
        results.push({ name: 'projected-table-native-action-expander-host-collision', engine, ...profile, hostPart, status: action.actions.length === 1 && action.actions[0].rowId === 'a' && action.actions[0].action === 'view' && action.selected.length === 0 && expansion.expanded.join(',') === 'a' && collision.count === 1 && collision.expanded.join(',') === 'a' && collision.selected.length === 0 ? 'passed' : 'failed', observed: { action, expansion, collision } });
    }
    results.push({ name: 'page-health', engine, ...profile, status: errors.length === 0 && consoleErrors.length === 0 && external.length === 0 ? 'passed' : 'failed', errors, consoleErrors, external });
    await context.close();
}
await browser.close();
await new Promise(r => server.close(r));
writeFileSync(`${dir}/${engine}-RESULTS.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results.map(r => ({ name: r.name, mode: r.mode, inner: r.inner, width: r.width, status: r.status, observed: r.status === 'failed' ? r.observed : undefined })), null, 2));
if (results.some(r => r.status !== 'passed'))
    process.exitCode = 1;
