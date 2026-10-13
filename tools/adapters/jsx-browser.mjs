import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium, firefox } from 'playwright-core';

const root = resolve('.framework-validation');
const evidence = resolve(process.env.BOE_JSX_EVIDENCE_DIR ?? '/tmp/boe-jsx-evidence');
await mkdir(evidence, { recursive: true });
const html = {};
const hydrationScript = {};
for (const framework of ['solid', 'preact']) {
  const rendered = await import(`${root}/${framework}-ssr/server.js`);
  html[framework] = rendered.html;
  hydrationScript[framework] = rendered.hydrationScript ?? '';
}
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/favicon.ico') { res.writeHead(204).end(); return; }
    const [framework, ...parts] = url.pathname.split('/').filter(Boolean);
    if (!['solid', 'preact'].includes(framework)) { res.writeHead(404).end(); return; }
    const path = resolve(root, framework, parts.length && parts[0] !== 'hydrate' ? parts.join('/') : 'index.html');
    if (!path.startsWith(`${root}/${framework}/`)) { res.writeHead(403).end(); return; }
    let body = await readFile(path);
    if (extname(path) === '.html') {
      let text = body.toString().replaceAll('"/assets/', `"/${framework}/assets/`);
      if (parts[0] === 'hydrate') text = text.replace('</head>', `${hydrationScript[framework]}</head>`).replace('<main id="app"></main>', `<main id="app">${html[framework]}</main>`);
      body = text;
    }
    res.setHeader('Content-Type', extname(path) === '.js' ? 'text/javascript' : extname(path) === '.html' ? 'text/html' : 'application/octet-stream');
    res.end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const engine = process.env.BOE_JSX_BROWSER ?? 'chrome';
let browser;
try {
  browser = await (engine === 'firefox' ? firefox.launch({ headless: true, timeout: 20000 }) : chromium.launch({ headless: true, ...(engine === 'chrome' ? { channel: 'chrome' } : {}) }));
} catch (error) { server.close(); throw error; }
const rows = [];
try {
  for (const framework of ['solid', 'preact']) for (const mode of ['client', 'hydrate']) for (const width of [1280, 390]) {
    console.log(`Checking ${framework} ${mode} ${engine} ${width}`);
    const page = await browser.newPage({ viewport: { width, height: 850 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()); });
    await page.goto(`http://127.0.0.1:${server.address().port}/${framework}/${mode === 'hydrate' ? 'hydrate' : ''}`);
    if (await page.title() !== `${framework} BOE acceptance`) throw new Error('Wrong page identity');
    try { await page.waitForFunction(() => typeof window.runAcceptance === 'function', null, { timeout: 10000 }); }
    catch (error) { throw new Error(`${framework} ${mode}: ${errors.join('; ')}; ${error.message}`); }
    await page.locator('box-text-field').waitFor();
    if (await page.locator('vite-error-overlay').count()) throw new Error('Framework overlay');
    await page.screenshot({ path: `${evidence}/${framework}-${mode}-${engine}-${width}.png`, fullPage: true });
    const result = await page.evaluate(() => window.runAcceptance());
    if (errors.length) throw new Error(JSON.stringify(errors));
    rows.push({ framework, mode, engine, version: browser.version(), width, ...result, errors });
    await page.close();
  }
  await writeFile(`${evidence}/${engine}.json`, JSON.stringify(rows, null, 2));
  console.log(JSON.stringify(rows));
} finally { await browser.close(); server.close(); }
