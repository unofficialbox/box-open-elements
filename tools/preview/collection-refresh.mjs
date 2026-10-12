import { chromium, firefox } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const dir = process.env.BOE_COLLECTION_EVIDENCE_DIR || path.join(tmpdir(), 'boe-collection-refresh');
const engine = process.env.BOE_COLLECTION_BROWSER || 'firefox';
if (!['chrome', 'firefox'].includes(engine))
    throw new Error('BOE_COLLECTION_BROWSER must be chrome or firefox');
mkdirSync(dir, { recursive: true });
const runtimeDir = path.resolve(repoRoot, 'dist');
const fixture = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Collection refresh regression</title><style>body{margin:12px;font:14px Arial;color:var(--boe-token-text-text);background:var(--boe-token-surface-surface)}main{max-width:100%;padding:12px;min-height:300px}</style><h1>Collection refresh regression</h1><label>Outside focus<input id="outside"></label><main id="stage"></main><script type="module">window.lib=await import('./runtime/index.js');lib.registerBoxDarkDesignSystem();lib.applyDesignTokens(document.documentElement,'box-default');window.ready=true;window.auditErrors=[];addEventListener('unhandledrejection',e=>{auditErrors.push(String(e.reason));e.preventDefault();});</script></html>`;
const server = createServer((q, r) => { try {
    const name = new URL(q.url, 'http://localhost').pathname;
    if (name === '/fixture.html') {
        r.setHeader('Content-Type', 'text/html');
        r.end(fixture);
        return;
    }
    if (!name.startsWith('/runtime/'))
        throw Error('Not found');
    const p = path.resolve(runtimeDir, name.slice('/runtime/'.length));
    if (!p.startsWith(runtimeDir + path.sep))
        throw Error('Not found');
    r.setHeader('Content-Type', p.endsWith('.js') ? 'text/javascript' : 'text/plain');
    r.end(readFileSync(p));
}
catch {
    r.statusCode = 404;
    r.end();
} }).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const browser = await (engine === 'firefox' ? firefox : chromium).launch(engine === 'firefox' ? {} : { ...(process.env.BOE_COLLECTION_CHROME_PATH ? { executablePath: process.env.BOE_COLLECTION_CHROME_PATH } : {}), args: ['--no-sandbox'] });
const rows = [];
const cases = [];
const runSuffix = process.env.BOE_AUDIT_CASES ? '-FILTERED-' + process.env.BOE_AUDIT_CASES.replace(/[^a-zA-Z0-9_-]/g, '_') : '';
const add = (id, tags, families, flow, run) => cases.push({ id, tags, families, flow, run });
const wait = ms => new Promise(r => setTimeout(r, ms));
add('result-block-id-reorder-focus', ['box-result-blocks'], ['A', 'G'], 'stable document block id survives same-position facts update and block reorder', async ({ page }) => { await page.evaluate(() => { window.e = document.createElement('box-result-blocks'); e.selectableDocuments = true; window.docs = { id: 'documents', type: 'documents', title: 'Documents', items: [{ id: 'doc-1', name: 'Invoice.pdf' }] }; window.facts = { id: 'facts', type: 'facts', title: 'Facts', rows: [{ label: 'Amount', value: '$10' }] }; e.blocks = [facts, docs]; stage.append(e); e.shadowRoot.querySelector('button').focus(); }); const positive = await page.evaluate(() => { const b = e.shadowRoot.activeElement; e.blocks = [{ ...facts, rows: [{ label: 'Amount', value: '$20' }] }, docs]; return { focused: e.shadowRoot.activeElement === b, connected: b.isConnected }; }); return await page.evaluate(positive => { const old = e.shadowRoot.activeElement; e.blocks = [docs, facts]; return { status: positive.focused && (!old.isConnected || !e.shadowRoot.activeElement) ? 'confirmed-defect' : 'tested', observed: { positive, oldConnected: old.isConnected, focus: e.shadowRoot.activeElement?.dataset.documentId ?? null, firstBlock: e.shadowRoot.querySelector('section').getAttribute('aria-label') }, expected: 'explicit block id retains document action identity/focus on reorder' }; }, positive); });
add('flow-spine-refresh-focus', ['box-flow-spine'], ['A', 'G'], 'same-node spine refresh reuses card identity without disconnecting active focus', async ({ page }) => await page.evaluate(() => { const e = document.createElement('box-flow-spine'); e.nodes = [{ kind: 'audit', title: 'Audit step' }]; e.catalog = [{ kind: 'audit', label: 'Audit', description: 'Verify', create: () => ({ kind: 'audit' }) }]; stage.append(e); const card = e.shadowRoot.querySelector('box-flow-card'); card.focus(); const before = !!card.shadowRoot.activeElement; e.refresh(); const next = e.shadowRoot.querySelector('box-flow-card'); return { status: before && !next.shadowRoot.activeElement ? 'confirmed-defect' : 'passed', observed: { before, sameCard: card === next, focusPreserved: !!next.shadowRoot.activeElement, cards: e.shadowRoot.querySelectorAll('box-flow-card').length }, expected: 'same controlled graph refresh preserves focused reused card' }; }));
add('document-list-update-focus', ['box-document-list'], ['A', 'G', 'O'], 'selectable document Enter and same-data echo → changed detail with stable document id preserves focused action', async ({ page }) => { await page.evaluate(() => { window.e = document.createElement('box-document-list'); e.selectableDocuments = true; window.items = [{ id: 'doc-1', name: "R&D and Bob's report", detail: 'Draft', href: 'javascript:inertAuditMarker()' }]; e.items = items; window.events = []; e.addEventListener('document-selected', v => { events.push(v.detail.id); e.items = items; }); stage.append(e); e.shadowRoot.querySelector('button').focus(); }); await page.keyboard.press('Enter'); return await page.evaluate(() => { const before = e.shadowRoot.activeElement; const positive = { events: events.slice(), focusPreserved: !!before, links: e.shadowRoot.querySelectorAll('a').length }; e.items = [{ ...items[0], detail: 'Reviewed' }]; return { status: positive.focusPreserved && !e.shadowRoot.activeElement ? 'confirmed-defect' : 'passed', observed: { positive, oldConnected: before?.isConnected, focus: e.shadowRoot.activeElement?.dataset.documentId ?? null }, expected: 'stable document identity preserves action focus on unrelated detail change; unsafe href never activated' }; }); });
for (const mode of ['checkbox', 'assignee'])
    add('task-assignment-focus-' + mode, ['box-task-assignment-panel'], ['A', 'B', 'F', 'G'], 'real ' + mode + ' change keeps focused control for repeated activation', async ({ page }) => { await page.evaluate(() => { window.e = document.createElement('box-task-assignment-panel'); e.heading = 'Audit task'; e.checklist = [{ id: 'one', label: 'Check evidence' }]; e.assignees = [{ id: 'a', name: 'Audit A' }, { id: 'b', name: 'Audit B' }]; stage.append(e); }); if (mode === 'checkbox') {
        await page.locator('box-task-assignment-panel [part=checkbox]').focus();
        await page.keyboard.press('Space');
    }
    else
        await page.locator('box-task-assignment-panel [part=assignee][data-assignee-id=b]').click(); return await page.evaluate(mode => ({ status: !e.shadowRoot.activeElement ? 'confirmed-defect' : 'passed', observed: { mode, focusPart: e.shadowRoot.activeElement?.getAttribute('part') ?? null, assignee: e.currentAssigneeId, checklist: e.checklist }, expected: 'focused changed control remains available for the next keyboard action' }), mode); });
add('result-renderer-native-form-action', ['box-document-list'], ['E', 'F', 'M'], 'public pure document renderer used inside native form → document action does not submit form', async ({ page }) => { await page.evaluate(() => { stage.innerHTML = '<form id="auditForm"></form>'; window.submits = 0; auditForm.addEventListener('submit', v => { v.preventDefault(); submits++; }); auditForm.innerHTML = lib.renderResultBlock({ type: 'documents', items: [{ id: 'doc', name: 'Invoice.pdf' }] }, { selectableDocuments: true }); }); await page.locator('form [data-document-id]').click(); return await page.evaluate(() => ({ status: submits ? 'confirmed-defect' : 'passed', observed: { submits, type: document.querySelector('[data-document-id]').type, markup: document.querySelector('[data-document-id]').outerHTML }, expected: 'public host-composition renderer uses non-submit document action button' })); });
add('r06-document-current-action-handoff-removal', ['box-document-list'], ['A', 'G'], 'current same-ID document controls and native actions survive refresh; caller focus/removal win', async ({ page }) => {
    await page.evaluate(() => { window.e = document.createElement('box-document-list'); e.selectableDocuments = true; e.items = [{ id: 'a', name: 'A', detail: 'Draft' }, { id: 'b', name: 'B' }]; window.events = []; e.addEventListener('document-selected', x => events.push({ id: x.detail.id, text: e.shadowRoot.querySelector('[data-document-id=' + x.detail.id + ']')?.textContent })); stage.append(e); window.old = e.shadowRoot.querySelector('[data-document-id=a]'); old.focus(); e.items = [{ id: 'b', name: 'Current B' }, { id: 'a', name: 'Current A', detail: 'Reviewed' }]; });
    await page.waitForTimeout(60);
    const refreshed = await page.evaluate(() => ({ same: old === e.shadowRoot.querySelector('[data-document-id=a]'), focused: e.shadowRoot.activeElement === old, text: old.textContent }));
    await page.keyboard.press('Enter');
    await page.evaluate(() => e.addEventListener('document-selected', () => outside.focus(), { once: true }));
    await page.keyboard.press('Space');
    const handed = await page.evaluate(() => document.activeElement === outside);
    await page.evaluate(() => { old.focus(); e.addEventListener('click', () => { e.items = e.items.filter(x => x.id !== 'a'); }, { capture: true, once: true }); });
    await page.keyboard.press('Enter');
    const removed = await page.evaluate(() => ({ events: events.slice(), oldConnected: old.isConnected, focus: e.shadowRoot.activeElement?.dataset.documentId }));
    await page.evaluate(() => { outside.focus(); e.remove(); e.items = [{ id: 'c', name: 'Reconnect C' }]; stage.append(e); old.click(); });
    const teardown = await page.evaluate(() => ({ outside: document.activeElement === outside, events: events.slice(), text: e.shadowRoot.textContent }));
    await page.locator('box-document-list button[data-document-id=c]').focus();
    await page.keyboard.press('Enter');
    return await page.evaluate(({ refreshed, handed, removed, teardown }) => ({ status: refreshed.same && refreshed.focused && refreshed.text.includes('Current A') && handed && removed.events.length === 2 && !removed.oldConnected && !removed.focus && teardown.outside && teardown.events.length === 2 && events.length === 3 && events[2].id === 'c' ? 'passed' : 'failed', observed: { refreshed, handed, removed, teardown, events } }), { refreshed, handed, removed, teardown });
});
add('r06-result-block-current-shape-and-stale-link-veto', ['box-result-blocks'], ['A', 'G'], 'block IDs and refreshed metadata stay current; removed native link cannot navigate', async ({ page, context }) => {
    await page.evaluate(() => { window.e = document.createElement('box-result-blocks'); e.selectableDocuments = true; window.docs = { id: 'docs', type: 'documents', title: 'Documents', items: [{ id: 'a', name: 'A', detail: 'Draft' }, { id: 'b', name: 'Link B', href: '#safe' }] }; e.blocks = [{ id: 'facts', type: 'facts', rows: [{ label: 'Amount', value: '10' }] }, docs]; window.events = []; e.addEventListener('document-selected', x => events.push(x.detail.id)); stage.append(e); window.section = e.shadowRoot.querySelectorAll('section')[1]; window.old = e.shadowRoot.querySelector('[data-document-id=a]'); old.focus(); e.blocks = [{ ...docs, items: docs.items.map(x => ({ ...x, name: 'Current ' + x.name, detail: 'Reviewed' })) }, { id: 'facts', type: 'facts', rows: [{ label: 'Amount', value: '20' }] }]; });
    await page.waitForTimeout(60);
    const current = await page.evaluate(() => ({ sameSection: e.shadowRoot.querySelector('section') === section, sameControl: e.shadowRoot.querySelector('[data-document-id=a]') === old, focused: e.shadowRoot.activeElement === old, text: old.textContent, value: e.shadowRoot.querySelector('dd').textContent }));
    await page.evaluate(() => e.selectableDocuments = false);
    const shape = await page.evaluate(() => ({ oldConnected: old.isConnected, focus: e.shadowRoot.activeElement?.dataset.documentId, buttonCount: e.shadowRoot.querySelectorAll('button').length }));
    await page.locator('box-result-blocks a[data-document-id=b]').focus();
    await page.evaluate(() => { window.veto = false; e.addEventListener('click', () => { e.blocks = [{ id: 'facts', type: 'facts', rows: [{ label: 'Current', value: 'Only' }] }]; }, { capture: true, once: true }); e.addEventListener('click', x => { veto = x.defaultPrevented; }, { once: true }); });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(60);
    const vetoed = await page.evaluate(() => ({ veto, events, links: e.shadowRoot.querySelectorAll('a').length, text: e.shadowRoot.textContent }));
    return { status: current.sameSection && current.sameControl && current.focused && current.text.includes('Current A') && current.value === '20' && !shape.oldConnected && !shape.focus && shape.buttonCount === 0 && vetoed.veto && vetoed.events.length === 0 && vetoed.links === 0 && context.pages().length === 1 ? 'passed' : 'failed', observed: { current, shape, vetoed, pages: context.pages().length } };
});
add('r06-task-current-dirty-controls-and-handoff', ['box-task-assignment-panel'], ['A', 'G'], 'checkbox dirty state, assignee and action identity survive author refresh; payload/current caller focus agree', async ({ page }) => {
    await page.evaluate(() => { window.e = document.createElement('box-task-assignment-panel'); e.assignees = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]; e.checklist = [{ id: 'one', label: 'One' }, { id: 'two', label: 'Two' }]; e.actions = [{ id: 'complete', label: 'Complete', tone: 'primary' }]; window.checks = []; window.assigned = []; window.actions = []; e.addEventListener('checklist-changed', x => checks.push(x.detail)); e.addEventListener('assignee-changed', x => assigned.push(x.detail)); e.addEventListener('action', x => { actions.push(x.detail); outside.focus(); }); stage.append(e); window.oldInput = e.shadowRoot.querySelector('[data-item-id=one]'); oldInput.focus(); });
    await page.keyboard.press('Space');
    await page.evaluate(() => e.checklist = e.checklist.map(x => ({ ...x, label: 'Current ' + x.label })).reverse());
    await page.waitForTimeout(60);
    const checkbox = await page.evaluate(() => ({ same: e.shadowRoot.querySelector('[data-item-id=one]') === oldInput, focused: e.shadowRoot.activeElement === oldInput, checked: oldInput.checked, label: oldInput.closest('label').textContent }));
    await page.keyboard.press('Space');
    await page.locator('box-task-assignment-panel [data-assignee-id=b]').focus();
    await page.keyboard.press('Enter');
    await page.evaluate(() => { window.oldAssignee = e.shadowRoot.activeElement; e.assignees = e.assignees.map(x => ({ ...x, name: 'Current ' + x.name })).reverse(); });
    await page.waitForTimeout(60);
    const assignee = await page.evaluate(() => ({ same: e.shadowRoot.querySelector('[data-assignee-id=b]') === oldAssignee, focused: e.shadowRoot.activeElement === oldAssignee, name: oldAssignee.textContent, selected: oldAssignee.getAttribute('aria-selected') }));
    await page.keyboard.press('Space');
    await page.locator('box-task-assignment-panel [part=action]').focus();
    await page.evaluate(() => { window.oldAction = e.shadowRoot.activeElement; e.actions = [{ id: 'complete', label: 'Current Complete' }]; e.heading = 'Current heading'; });
    await page.keyboard.press('Enter');
    return await page.evaluate(({ checkbox, assignee }) => ({ status: checkbox.same && checkbox.focused && checkbox.checked && checkbox.label.includes('Current One') && checks.length === 2 && checks[1].checked === false && checks[1].checklist.find(x => x.id === 'one').label === 'Current One' && assignee.same && assignee.focused && assignee.selected === 'true' && assignee.name.includes('Current B') && assigned.length === 2 && actions.length === 1 && actions[0].assigneeId === 'b' && actions[0].checklist.find(x => x.id === 'one').checked === false && document.activeElement === outside && oldAction === e.shadowRoot.querySelector('[part=action]') && oldAction.dataset.tone === 'neutral' ? 'passed' : 'failed', observed: { checkbox, assignee, checks, assigned, actions, outside: document.activeElement === outside } }), { checkbox, assignee });
});
add('r06-task-capture-removal-teardown-reconnect', ['box-task-assignment-panel'], ['A', 'G'], 'removed capture targets never update current state; reconnect has one current handler', async ({ page }) => {
    await page.evaluate(() => { window.e = document.createElement('box-task-assignment-panel'); e.assignees = [{ id: 'a', name: 'A' }]; e.checklist = [{ id: 'one', label: 'One' }]; e.actions = [{ id: 'complete', label: 'Complete' }]; window.events = []; for (const name of ['checklist-changed', 'assignee-changed', 'action'])
        e.addEventListener(name, x => events.push({ name, detail: x.detail })); stage.append(e); window.oldInput = e.shadowRoot.querySelector('[part=checkbox]'); oldInput.focus(); e.addEventListener('click', () => e.checklist = [], { capture: true, once: true }); });
    await page.keyboard.press('Space');
    await page.locator('box-task-assignment-panel [part=assignee]').focus();
    await page.evaluate(() => e.addEventListener('click', () => e.assignees = [], { capture: true, once: true }));
    await page.keyboard.press('Enter');
    await page.locator('box-task-assignment-panel [part=action]').focus();
    await page.evaluate(() => e.addEventListener('click', () => e.actions = [], { capture: true, once: true }));
    await page.keyboard.press('Enter');
    const removed = await page.evaluate(() => ({ events: events.slice(), oldConnected: oldInput.isConnected }));
    await page.evaluate(() => { outside.focus(); e.remove(); e.checklist = [{ id: 'new', label: 'Reconnect item' }]; e.assignees = [{ id: 'c', name: 'Current C' }]; e.currentAssigneeId = 'c'; e.actions = [{ id: 'new', label: 'New action' }]; stage.append(e); oldInput.click(); });
    const teardown = await page.evaluate(() => ({ events: events.slice(), outside: document.activeElement === outside }));
    await page.locator('box-task-assignment-panel [part=checkbox]').focus();
    await page.keyboard.press('Space');
    await page.locator('box-task-assignment-panel [part=action]').focus();
    await page.keyboard.press('Enter');
    return await page.evaluate(({ removed, teardown }) => ({ status: removed.events.length === 0 && !removed.oldConnected && teardown.events.length === 0 && teardown.outside && events.length === 2 && events[0].detail.itemId === 'new' && events[1].detail.assigneeId === 'c' && events[1].detail.checklist[0].checked === true ? 'passed' : 'failed', observed: { removed, teardown, events } }), { removed, teardown });
});
add('r06-flow-nested-current-model-and-teardown', ['box-flow-spine'], ['A', 'G'], 'same model-node card/button identity survives nested reorder; insertion descriptors remain current', async ({ page }) => {
    await page.evaluate(() => { window.a = { kind: 'audit', title: 'A' }, window.b = { kind: 'audit', title: 'B' }, window.flowParent = { kind: 'audit', title: 'Parent', body: [a, b] }; window.e = document.createElement('box-flow-spine'); e.nodes = [flowParent]; window.selected = []; window.inserted = []; e.addEventListener('node-select', x => { selected.push({ same: x.detail.node === a, title: x.detail.node.title }); }); e.addEventListener('insert-request', x => inserted.push({ same: x.detail.list === flowParent.body, index: x.detail.index, label: x.detail.label })); stage.append(e); window.card = [...e.shadowRoot.querySelectorAll('box-flow-card')].find(c => c.node === a); window.button = card.shadowRoot.querySelector('button'); card.focus(); a.title = 'Current A'; b.title = 'Current B'; flowParent.title = 'Current Parent'; flowParent.body.reverse(); e.refresh(); });
    await page.waitForTimeout(60);
    const refreshed = await page.evaluate(() => ({ same: [...e.shadowRoot.querySelectorAll('box-flow-card')].find(c => c.node === a) === card, button: card.shadowRoot.querySelector('button') === button, focused: card.shadowRoot.activeElement === button, name: button.getAttribute('aria-label') }));
    await page.keyboard.press('Enter');
    await page.evaluate(() => { const p = [...e.shadowRoot.querySelectorAll('box-insert-point')].find(p => p.detail.list === flowParent.body && p.detail.index === 0); p.focus(); });
    await page.keyboard.press('Enter');
    await page.evaluate(() => { card.focus(); e.addEventListener('node-select', () => { outside.focus(); e.refresh(); }, { once: true }); });
    await page.keyboard.press('Space');
    const handoff = await page.evaluate(() => document.activeElement === outside);
    await page.evaluate(() => { e.setNodeFigure(a, { text: 'One item' }); e.remove(); e.nodes = [{ kind: 'audit', title: 'Reconnect C' }]; e.refresh(); stage.append(e); button.click(); });
    const teardown = await page.evaluate(() => ({ outside: document.activeElement === outside, oldConnected: card.isConnected, figure: e.figures.has(a), count: selected.length, cards: [...e.shadowRoot.querySelectorAll('box-flow-card')].map(c => c.node.title) }));
    return await page.evaluate(({ refreshed, handoff, teardown }) => ({ status: refreshed.same && refreshed.button && refreshed.focused && refreshed.name.includes('Current A') && selected.length === 2 && selected.every(x => x.same && x.title === 'Current A') && inserted.length === 1 && inserted[0].same && inserted[0].index === 0 && inserted[0].label.includes('Current B') && handoff && teardown.outside && !teardown.oldConnected && !teardown.figure && teardown.count === 2 && teardown.cards.join(',') === 'Reconnect C' ? 'passed' : 'failed', observed: { refreshed, handoff, teardown, selected, inserted } }), { refreshed, handoff, teardown });
});
for (const tag of ['box-document-list', 'box-result-blocks', 'box-task-assignment-panel', 'box-flow-spine'])
    add('r06-containing-root-handoff-' + tag, [tag], ['A', 'G'], 'owned focus restores in open/closed containing roots and respects root/document caller handoff', async ({ page }) => {
        const outcomes = [];
        for (const mode of ['open', 'closed']) {
            await page.evaluate(({ tag, mode }) => { stage.replaceChildren(); window.outer = document.createElement('div'); stage.append(outer); window.scope = outer.attachShadow({ mode }); window.e = document.createElement(tag); if (tag === 'box-document-list') {
                e.selectableDocuments = true;
                e.items = [{ id: 'a', name: 'A' }];
            }
            else if (tag === 'box-result-blocks') {
                e.selectableDocuments = true;
                e.blocks = [{ id: 'docs', type: 'documents', items: [{ id: 'a', name: 'A' }] }];
            }
            else if (tag === 'box-task-assignment-panel') {
                e.checklist = [{ id: 'a', label: 'A' }];
            }
            else {
                e.nodes = [{ kind: 'audit', title: 'A' }];
            } scope.append(e); window.sibling = document.createElement('button'); sibling.textContent = 'Sibling'; scope.append(sibling); window.target = tag === 'box-flow-spine' ? e.shadowRoot.querySelector('box-flow-card') : e.shadowRoot.querySelector('button,input'); window.inner = target.shadowRoot?.querySelector('button') ?? target; target.focus(); window.refresh = () => { if (tag === 'box-document-list')
                e.items = [{ id: 'a', name: 'Current A' }];
            else if (tag === 'box-result-blocks')
                e.blocks = [{ id: 'docs', type: 'documents', items: [{ id: 'a', name: 'Current A' }] }];
            else if (tag === 'box-task-assignment-panel')
                e.checklist = [{ id: 'a', label: 'Current A' }];
            else {
                e.nodes[0].title = 'Current A';
                e.refresh();
            } }; refresh(); }, { tag, mode });
            await page.waitForTimeout(60);
            const kept = await page.evaluate(() => scope.activeElement === e && e.shadowRoot.activeElement === target && (!target.shadowRoot || target.shadowRoot.activeElement === inner));
            await page.evaluate(() => { sibling.focus(); refresh(); });
            const rootHandoff = await page.evaluate(() => scope.activeElement === sibling);
            await page.evaluate(() => { outside.focus(); refresh(); });
            const documentHandoff = await page.evaluate(() => document.activeElement === outside);
            outcomes.push({ mode, kept, rootHandoff, documentHandoff });
        }
        return { status: outcomes.every(x => x.kept && x.rootHandoff && x.documentHandoff) ? 'passed' : 'failed', observed: outcomes };
    });
for (const spec of [{ width: 1440, theme: 'light' }, { width: 390, theme: 'dark' }]) {
    const context = await browser.newContext({ viewport: { width: spec.width, height: 900 }, colorScheme: spec.theme });
    const page = await context.newPage();
    const external = [];
    await context.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://127.0.0.1:'))
        return r.continue(); external.push(u); return r.abort(); });
    const consoleMessages = [];
    page.on('console', m => { if (['warning', 'error'].includes(m.type()))
        consoleMessages.push({ type: m.type(), text: m.text() }); });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/fixture.html`);
    await page.waitForFunction(() => window.ready);
    for (const c of cases.filter(c => !process.env.BOE_AUDIT_CASES || process.env.BOE_AUDIT_CASES.split(',').includes(c.id))) {
        await page.evaluate(t => { stage.replaceChildren(); lib.applyDesignTokens(document.documentElement, t === 'dark' ? 'box-dark' : 'box-default'); auditErrors.length = 0; outside.focus(); }, spec.theme);
        const start = errors.length, consoleStart = consoleMessages.length;
        let result;
        try {
            result = await c.run({ page, context, engine });
            if (engine === 'chrome') {
                const cdp = await context.newCDPSession(page);
                const ax = await cdp.send('Accessibility.getFullAXTree');
                writeFileSync(`${dir}/${engine}-${spec.width}-${c.id}-AX.json`, JSON.stringify(ax, null, 2));
                if (c.id === 'range-endpoint-names') {
                    const sliders = ax.nodes.filter(n => !n.ignored && n.role?.value === 'slider').map(n => n.name?.value ?? '');
                    result.observed.nativeNames = sliders;
                    result.status = sliders.length !== 2 || sliders.some(n => !n) || new Set(sliders).size < 2 ? 'confirmed-defect' : 'passed';
                }
            }
            await page.screenshot({ path: `${dir}/${engine}-${spec.width}-${c.id}.png` });
        }
        catch (e) {
            result = { status: 'not-tested', harnessError: e.message };
        }
        if (!result || !result.status)
            result = { status: 'not-tested', harnessError: 'case returned no status' };
        if (c.id === 'result-block-id-reorder-focus' && result.status === 'tested') {
            result.originalStatus = result.status;
            result.status = result.observed.positive.focused && result.observed.oldConnected && result.observed.focus === 'doc-1' && result.observed.firstBlock === 'Documents' ? 'passed' : 'failed';
        }
        rows.push({ id: c.id, tags: c.tags, families: c.families, flow: c.flow, engine, ...spec, ...result, consoleMessages: consoleMessages.slice(consoleStart), runtimeErrors: errors.slice(start), unhandled: await page.evaluate(() => auditErrors.slice()), externalBlocked: external.slice(), runtimeSource: 'repository dist build' });
        writeFileSync(`${dir}/${engine}-R06-COLLECTION${runSuffix}.json`, JSON.stringify(rows, null, 2));
    }
    await context.close();
}
await browser.close();
await new Promise(r => server.close(r));
console.log(JSON.stringify(rows.map(r => ({ id: r.id, width: r.width, status: r.status, error: r.harnessError })), null, 2));
if (rows.some(r => r.status !== 'passed' || r.runtimeErrors.length || r.consoleMessages.length || r.unhandled.length || r.externalBlocked.length))
    process.exitCode = 1;
