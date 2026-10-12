import { chromium, firefox } from 'playwright-core';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const dir = process.env.BOE_NAVIGATION_EVIDENCE_DIR || path.join(tmpdir(), 'boe-collection-navigation');
const engine = process.env.BOE_NAVIGATION_BROWSER || 'firefox';
if (!['chrome', 'firefox'].includes(engine))
    throw new Error('BOE_NAVIGATION_BROWSER must be chrome or firefox');
mkdirSync(dir, { recursive: true });
const runtimeDir = path.resolve(repoRoot, 'dist');
const fixture = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Collection navigation regression</title><style>body{margin:12px;font:14px Arial;color:var(--boe-token-text-text);background:var(--boe-token-surface-surface)}main{max-width:100%;padding:12px;min-height:300px}</style><h1>Collection navigation regression</h1><label>Outside focus<input id="outside"></label><main id="stage"></main><script type="module">window.lib=await import('./runtime/index.js');lib.registerBoxDarkDesignSystem();lib.applyDesignTokens(document.documentElement,'box-default');window.ready=true;window.auditErrors=[];addEventListener('unhandledrejection',e=>{auditErrors.push(String(e.reason));e.preventDefault();});</script></html>`;
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
const browser = await (engine === 'firefox' ? firefox : chromium).launch(engine === 'firefox' ? {} : { ...(process.env.BOE_NAVIGATION_CHROME_PATH ? { executablePath: process.env.BOE_NAVIGATION_CHROME_PATH } : {}), args: ['--no-sandbox'] });
const rows = [];
const cases = [];
const runSuffix = process.env.BOE_AUDIT_CASES ? '-FILTERED-' + process.env.BOE_AUDIT_CASES.replace(/[^a-zA-Z0-9_-]/g, '_') : '';
const add = (id, tags, families, flow, run) => cases.push({ id, tags, families, flow, run });
const wait = ms => new Promise(r => setTimeout(r, ms));
add('draggable-list-keyboard-reach', ['box-draggable-list'], ['B'], 'Tab and advertised arrow/Home/End controls must allow reaching another reorder handle', async ({ page }) => { await page.evaluate(() => { window.e = document.createElement('box-draggable-list'); e.items = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }, { value: 'c', label: 'Gamma' }]; stage.append(e); const tail = document.createElement('button'); tail.id = 'auditTail'; tail.textContent = 'After list'; stage.append(tail); e.shadowRoot.querySelector('[part=handle]').focus(); }); await page.keyboard.press('End'); const moved = await page.evaluate(() => ({ items: e.items.map(x => x.value), focus: e.shadowRoot.activeElement?.closest('[part=item]')?.dataset.value, status: e.shadowRoot.querySelector('[part=status]').textContent })); await page.keyboard.press('Tab'); return await page.evaluate(moved => ({ status: document.activeElement.id === 'auditTail' && [...e.shadowRoot.querySelectorAll('[part=handle]')].filter(x => x.tabIndex === 0).length === 1 ? 'confirmed-defect' : 'tested', observed: { moved, tabFocus: document.activeElement.id, handles: [...e.shadowRoot.querySelectorAll('[part=handle]')].map(x => ({ id: x.closest('[part=item]').dataset.value, tab: x.tabIndex, name: x.getAttribute('aria-label') })) }, expected: 'keyboard user can choose every item to reorder; arrow keys currently only move same Alpha handle' }), moved); });
add('datalist-whitespace-slot', ['box-datalist-item'], ['C', 'G'], 'formatting whitespace does not suppress fallback label/meta', async ({ page }) => { await page.evaluate(() => { window.e = document.createElement('box-datalist-item'); e.label = 'Invoice.pdf'; e.meta = 'PDF'; e.value = 'invoice'; e.append(document.createTextNode('\n  ')); const list = document.createElement('div'); list.setAttribute('role', 'listbox'); list.setAttribute('aria-label', 'Files'); list.append(e); stage.append(list); }); await page.waitForTimeout(30); return await page.evaluate(() => { const label = e.shadowRoot.querySelector('[part=label]'); return { status: getComputedStyle(label).display === 'none' ? 'confirmed-defect' : 'passed', observed: { label: e.label, labelDisplay: getComputedStyle(label).display, assigned: e.shadowRoot.querySelector('slot').assignedNodes().map(n => ({ type: n.nodeType, text: n.textContent })) }, expected: 'whitespace alone leaves fallback Invoice.pdf visible and named' }; }); });
add('carousel-slotted-hidden-viewport', ['box-carousel'], ['H'], 'slotted slide replaces default viewport → hidden default panel must not paint', async ({ page }) => { await page.evaluate(() => { window.e = document.createElement('box-carousel'); e.label = 'Audit slides'; e.innerHTML = '<div slot="slide" data-title="First"><h2>First slide</h2><p>Owned slide content</p></div><div slot="slide" data-title="Second"><h2>Second slide</h2></div>'; stage.append(e); }); await page.waitForTimeout(30); return await page.evaluate(() => { const v = e.shadowRoot.querySelector('[part=viewport]'); return { status: v.hidden && v.getBoundingClientRect().height > 0 ? 'confirmed-defect' : 'passed', observed: { defaultHidden: v.hidden, defaultDisplay: getComputedStyle(v).display, defaultHeight: v.getBoundingClientRect().height, activeSlideVisible: e.children[0].getBoundingClientRect().height > 0 }, expected: 'hidden default viewport consumes no space in slotted-slide mode' }; }); });
add('carousel-slotted-editor-arrow', ['box-carousel'], ['B'], 'ArrowRight in slotted input edits caret without navigating slides', async ({ page }) => { await page.evaluate(() => { window.e = document.createElement('box-carousel'); e.label = 'Editable slides'; e.innerHTML = '<div slot="slide" data-title="First"><input id="slideInput" aria-label="Slide note" value="ABCDE"></div><div slot="slide" data-title="Second">Second</div>'; stage.append(e); }); await page.waitForTimeout(30); await page.locator('#slideInput').focus(); await page.locator('#slideInput').evaluate(x => x.setSelectionRange(1, 1)); await page.keyboard.press('ArrowRight'); return await page.evaluate(() => ({ status: e.value !== 0 ? 'confirmed-defect' : 'passed', observed: { slide: e.value, caret: slideInput.selectionStart, focused: document.activeElement === slideInput }, expected: 'slide remains0 and caret advances1→2' })); });
add('carousel-dot-focus', ['box-carousel'], ['A', 'G'], 'slotted slide dot activation preserves focus on current navigation control', async ({ page }) => { await page.evaluate(() => { window.e = document.createElement('box-carousel'); e.innerHTML = '<div slot="slide" data-title="First">First</div><div slot="slide" data-title="Second">Second</div>'; stage.append(e); }); await page.waitForTimeout(30); await page.locator('box-carousel [part~=dot][data-index="1"]').click(); return await page.evaluate(() => ({ status: !e.shadowRoot.activeElement ? 'confirmed-defect' : 'passed', observed: { value: e.value, focus: e.shadowRoot.activeElement?.dataset.index ?? null }, expected: 'current dot remains focused for repeated navigation' })); });
for (const mode of ['json', 'slotted'])
    add('carousel-current-dot-lifecycle-' + mode, ['box-carousel'], ['A', 'G'], 'current positional dot keeps identity, names and native repeated actions; removal/caller handoff win', async ({ page }) => {
        await page.evaluate(mode => { window.e = document.createElement('box-carousel'); e.label = 'Carousel'; if (mode === 'json')
            e.items = [{ title: 'First' }, { title: 'Second' }];
        else
            e.innerHTML = '<div slot="slide" data-title="First">First</div><div slot="slide" data-title="Second">Second</div>'; window.events = []; e.addEventListener('value-changed', x => events.push(x.detail.value)); stage.append(e); }, mode);
        await page.waitForTimeout(30);
        await page.locator('box-carousel button[data-index="1"]').focus();
        await page.evaluate(() => window.old = e.shadowRoot.activeElement);
        await page.keyboard.press('Enter');
        await page.evaluate(mode => { if (mode === 'json')
            e.items = [{ title: 'Current first' }, { title: 'Current second' }];
        else
            e.children[1].setAttribute('data-title', 'Current second'); e.label = 'Current carousel'; }, mode);
        await page.waitForTimeout(60);
        const refresh = await page.evaluate(() => ({ same: old === e.shadowRoot.querySelector('[data-index="1"]'), focused: e.shadowRoot.activeElement === old, name: old.getAttribute('aria-label'), value: e.value, current: old.getAttribute('aria-current') }));
        await page.keyboard.press('Space');
        await page.evaluate(() => e.addEventListener('value-changed', () => { outside.focus(); e.label = 'Caller label'; }, { once: true }));
        await page.keyboard.press('Enter');
        const handoff = await page.evaluate(() => document.activeElement === outside);
        await page.evaluate(mode => { if (mode === 'json')
            e.items = [{ title: 'Only' }];
        else
            e.children[1].remove(); }, mode);
        await page.waitForTimeout(60);
        const removed = await page.evaluate(() => ({ connected: old.isConnected, value: e.value, count: e.shadowRoot.querySelectorAll('[part~=dot]').length, events: events.slice() }));
        await page.evaluate(mode => { outside.focus(); e.remove(); if (mode === 'json')
            e.items = [{ title: 'Reconnect' }];
        else
            e.replaceChildren(); stage.append(e); old.click(); }, mode);
        await page.waitForTimeout(30);
        const teardown = await page.evaluate(() => ({ outside: document.activeElement === outside, events: events.slice() }));
        return { status: refresh.same && refresh.focused && refresh.name.includes('Current second') && refresh.value === 1 && refresh.current === 'true' && handoff && !removed.connected && removed.value === 0 && removed.count === 1 && removed.events.length === 3 && teardown.outside && teardown.events.length === 3 ? 'passed' : 'failed', observed: { refresh, handoff, removed, teardown } };
    });
for (const kind of ['input', 'textarea', 'range', 'contenteditable'])
    add('carousel-real-editor-key-' + kind, ['box-carousel'], ['B', 'H'], 'native descendant editing key retains caret/value and active slide while unused viewport consumes no space', async ({ page }) => {
        await page.evaluate(kind => { window.e = document.createElement('box-carousel'); e.label = 'Editors'; const slide = document.createElement('div'); slide.slot = 'slide'; window.editor = document.createElement(kind === 'contenteditable' ? 'div' : kind === 'textarea' ? 'textarea' : 'input'); editor.id = 'currentEditor'; editor.setAttribute('aria-label', 'Editor'); if (kind === 'contenteditable') {
            editor.contentEditable = 'true';
            editor.textContent = 'ABCDE';
        }
        else {
            editor.value = kind === 'range' ? '5' : 'ABCDE';
            if (kind === 'range') {
                editor.type = 'range';
                editor.min = '0';
                editor.max = '10';
            }
        } slide.append(editor); const other = document.createElement('div'); other.slot = 'slide'; other.textContent = 'Other'; e.append(slide, other); stage.append(e); window.events = []; e.addEventListener('value-changed', x => events.push(x.detail.value)); }, kind);
        await page.waitForTimeout(30);
        await page.locator('#currentEditor').focus();
        await page.evaluate(kind => { if (kind === 'input' || kind === 'textarea')
            editor.setSelectionRange(1, 1);
        else if (kind === 'contenteditable')
            getSelection().setPosition(editor.firstChild, 1); }, kind);
        await page.keyboard.press('ArrowRight');
        return await page.evaluate(kind => { const viewport = e.shadowRoot.querySelector('[part=viewport]'); const native = kind === 'range' ? editor.value === '6' : kind === 'contenteditable' ? getSelection().anchorOffset === 2 : editor.selectionStart === 2; return { status: native && document.activeElement === editor && e.value === 0 && events.length === 0 && getComputedStyle(viewport).display === 'none' && viewport.getBoundingClientRect().height === 0 ? 'passed' : 'failed', observed: { kind, native, caret: editor.selectionStart, anchor: getSelection().anchorOffset, editorValue: editor.value, focused: document.activeElement === editor, slide: e.value, events, viewportDisplay: getComputedStyle(viewport).display, height: viewport.getBoundingClientRect().height } }; }, kind);
    });
add('draggable-real-tab-reach-every-row', ['box-draggable-list'], ['B'], 'Tab chooses Beta/Gamma and existing keys reorder that chosen value with caller handoff', async ({ page }) => {
    await page.evaluate(() => { window.e = document.createElement('box-draggable-list'); e.items = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }, { value: 'c', label: 'Gamma' }]; window.events = []; e.addEventListener('reorder', x => events.push(x.detail)); stage.append(e); const tail = document.createElement('button'); tail.id = 'currentTail'; tail.textContent = 'After list'; stage.append(tail); outside.focus(); });
    await page.keyboard.press('Tab');
    const first = await page.evaluate(() => e.shadowRoot.activeElement?.closest('[part=item]')?.dataset.value);
    await page.keyboard.press('Tab');
    const second = await page.evaluate(() => e.shadowRoot.activeElement?.closest('[part=item]')?.dataset.value);
    await page.keyboard.press('ArrowUp');
    const moved = await page.evaluate(() => ({ order: e.items.map(x => x.value), focus: e.shadowRoot.activeElement?.closest('[part=item]')?.dataset.value, events: events.slice() }));
    await page.keyboard.press('Tab');
    const third = await page.evaluate(() => e.shadowRoot.activeElement?.closest('[part=item]')?.dataset.value);
    await page.keyboard.press('Tab');
    const fourth = await page.evaluate(() => e.shadowRoot.activeElement?.closest('[part=item]')?.dataset.value);
    await page.evaluate(() => e.addEventListener('reorder', () => { outside.focus(); e.label = 'Caller list'; }, { once: true }));
    await page.keyboard.press('Home');
    return await page.evaluate(({ first, second, moved, third, fourth }) => ({ status: first === 'a' && second === 'b' && moved.order.join(',') === 'b,a,c' && moved.focus === 'b' && moved.events.length === 1 && moved.events[0].value === 'b' && third === 'a' && fourth === 'c' && e.items.map(x => x.value).join(',') === 'c,b,a' && events.length === 2 && events[1].value === 'c' && document.activeElement === outside && [...e.shadowRoot.querySelectorAll('[part=handle]')].every(h => h.tabIndex === 0) ? 'passed' : 'failed', observed: { first, second, moved, third, fourth, order: e.items.map(x => x.value), events, outside: document.activeElement === outside } }), { first, second, moved, third, fourth });
});
add('datalist-live-text-whitespace-and-reconnect', ['box-datalist-item'], ['C', 'G'], 'whitespace/comments preserve native fallback; direct text changes and reconnect track actual current content', async ({ page }) => {
    await page.evaluate(() => { window.e = document.createElement('box-datalist-item'); e.label = 'Invoice.pdf'; e.meta = 'PDF'; e.value = 'invoice'; window.text = document.createTextNode('\n  '); e.append(text, document.createComment('formatting')); const list = document.createElement('div'); list.setAttribute('role', 'listbox'); list.setAttribute('aria-label', 'Files'); list.append(e); stage.append(list); window.list = list; window.events = []; e.addEventListener('select', x => events.push(x.detail.value)); });
    await page.waitForTimeout(30);
    const fallback = await page.evaluate(() => ({ display: getComputedStyle(e.shadowRoot.querySelector('[part=label]')).display, name: e.shadowRoot.querySelector('[part=label]').textContent, slotted: e.shadowRoot.querySelector('[part=body]').classList.contains('has-slotted') }));
    await page.locator('box-datalist-item [part=item]').focus();
    await page.keyboard.press('Enter');
    await page.evaluate(() => text.data = 'Current authored row');
    await page.waitForTimeout(30);
    const content = await page.evaluate(() => e.shadowRoot.querySelector('[part=body]').classList.contains('has-slotted'));
    await page.evaluate(() => { text.data = '\n '; e.label = 'Current invoice.pdf'; });
    await page.waitForTimeout(30);
    const cleared = await page.evaluate(() => ({ display: getComputedStyle(e.shadowRoot.querySelector('[part=label]')).display, name: e.shadowRoot.querySelector('[part=label]').textContent }));
    await page.evaluate(() => { outside.focus(); e.remove(); text.data = 'Detached author text'; });
    await page.waitForTimeout(30);
    const detached = await page.evaluate(() => e.shadowRoot.querySelector('[part=body]').classList.contains('has-slotted'));
    await page.evaluate(() => list.append(e));
    await page.waitForTimeout(30);
    const reconnected = await page.evaluate(() => ({ slotted: e.shadowRoot.querySelector('[part=body]').classList.contains('has-slotted'), outside: document.activeElement === outside }));
    await page.evaluate(() => text.data = '   ');
    await page.waitForTimeout(30);
    await page.locator('box-datalist-item [part=item]').focus();
    await page.keyboard.press('Space');
    return await page.evaluate(({ fallback, content, cleared, detached, reconnected }) => ({ status: fallback.display !== 'none' && !fallback.slotted && content && cleared.display !== 'none' && cleared.name === 'Current invoice.pdf' && !detached && reconnected.slotted && reconnected.outside && events.join(',') === 'invoice,invoice' ? 'passed' : 'failed', observed: { fallback, content, cleared, detached, reconnected, events } }), { fallback, content, cleared, detached, reconnected });
});
for (const mode of ['open', 'closed'])
    add('carousel-containing-root-focus-' + mode, ['box-carousel'], ['A', 'G'], 'containing-root dot focus survives refresh while sibling/document handoff remain authoritative', async ({ page }) => {
        await page.evaluate(mode => { stage.replaceChildren(); window.outer = document.createElement('div'); stage.append(outer); window.scope = outer.attachShadow({ mode }); window.e = document.createElement('box-carousel'); e.items = [{ title: 'One' }, { title: 'Two' }]; scope.append(e); window.sibling = document.createElement('button'); sibling.textContent = 'Sibling'; scope.append(sibling); window.old = e.shadowRoot.querySelector('[data-index="1"]'); old.focus(); old.click(); e.items = [{ title: 'Current one' }, { title: 'Current two' }]; }, mode);
        await page.waitForTimeout(60);
        const kept = await page.evaluate(() => scope.activeElement === e && e.shadowRoot.activeElement === old);
        await page.evaluate(() => { sibling.focus(); e.label = 'Root caller'; });
        const rootCaller = await page.evaluate(() => scope.activeElement === sibling);
        await page.evaluate(() => { outside.focus(); e.value = 0; });
        const documentCaller = await page.evaluate(() => document.activeElement === outside);
        return { status: kept && rootCaller && documentCaller ? 'passed' : 'failed', observed: { mode, kept, rootCaller, documentCaller } };
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
        if (c.id === 'draggable-list-keyboard-reach' && result.status === 'tested') {
            result.originalStatus = result.status;
            result.status = result.observed.handles.length === 3 && result.observed.handles.every(h => h.tab === 0) && result.observed.moved.items.join(',') === 'b,c,a' && result.observed.moved.focus === 'a' ? 'passed' : 'failed';
        }
        rows.push({ id: c.id, tags: c.tags, families: c.families, flow: c.flow, engine, ...spec, ...result, consoleMessages: consoleMessages.slice(consoleStart), runtimeErrors: errors.slice(start), unhandled: await page.evaluate(() => auditErrors.slice()), externalBlocked: external.slice(), runtimeSource: 'repository dist build' });
        writeFileSync(`${dir}/${engine}-COLLECTION-NAVIGATION${runSuffix}.json`, JSON.stringify(rows, null, 2));
    }
    await context.close();
}
await browser.close();
await new Promise(r => server.close(r));
console.log(JSON.stringify(rows.map(r => ({ id: r.id, width: r.width, status: r.status, error: r.harnessError })), null, 2));
if (rows.some(r => r.status !== 'passed' || r.runtimeErrors.length || r.consoleMessages.length || r.unhandled.length || r.externalBlocked.length))
    process.exitCode = 1;
