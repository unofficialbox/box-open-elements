import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join, extname, resolve, sep } from 'node:path';
import { chromium } from 'playwright-core';

const directory = process.argv[2];
const results = JSON.parse(await readFile(join(directory, 'results.json'), 'utf8'));
const evidence = resolve(process.env.BOE_DOCS_JSX_EVIDENCE_DIR ?? '/tmp/boe-docs-parity-evidence');
await mkdir(evidence, { recursive: true });
const root = resolve(directory);
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const file = resolve(root, '.' + (url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname));
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(file)] ?? 'application/octet-stream' }).end(data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const observations = [];
let baseline;
try {
  for (const result of results) {
    console.log("Checking rendered parity:",result.framework);
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.error(result.framework,error.message); });
    await page.goto(`${origin}/${result.framework}/dist/`);
    await page.waitForFunction(() => typeof window.mountDocsExample === 'function');
    const snapshots = [];
    for (let index = 0; index < result.cases.length; index++) {
      const item = result.cases[index];
      if (!item.tag) continue;
      await page.evaluate(index => window.mountDocsExample(index), index);
      if (process.env.BOE_DOCS_DEBUG) console.log(result.framework,item.file);
      const snapshot = await page.evaluate(({html}) => {
        const root = document.querySelector("#app > app-example") ?? document.querySelector("#app");
        const source = new DOMParser().parseFromString(html, 'text/html');
        const authored = [...source.querySelectorAll("*")].filter(el=>el.localName.startsWith("box-"));
        const actual = [...root.querySelectorAll("*")].filter(el=>el.localName.startsWith("box-"));
        const json = [];
        for (let i=0;i<authored.length;i++) {
          const fields = {};
          for (const attr of authored[i].attributes) {
            if (/^(data-|aria-)/.test(attr.name) || ['class','style'].includes(attr.name)) continue;
            const name = attr.name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
            fields[name] = actual[i] && !(name in actual[i]) && attr.value === "" ? actual[i].hasAttribute(attr.name) : actual[i]?.[name] ?? actual[i]?.getAttribute(attr.name);
          }
          json.push(fields);
        }
        const content = node => [...node.childNodes].filter(child => child.nodeType !== Node.COMMENT_NODE && !["STYLE","SCRIPT"].includes(child.nodeName) && !(child.nodeType === Node.TEXT_NODE && !child.textContent.trim())).map(child => child.nodeType === Node.TEXT_NODE ? child.textContent.replace(/\s+/g,' ').trim() : {tag:child.localName,slot:child.getAttribute('slot'),text:content(child)});
        const styled = [...source.body.querySelectorAll("*")].filter(el=>!["STYLE","SCRIPT"].includes(el.tagName));
        const rendered = [...root.querySelectorAll("*")].filter(el=>!["STYLE","SCRIPT"].includes(el.tagName));
        const styles = styled.map((el,i)=> el.hasAttribute("style") || el.hasAttribute("class") ? Object.fromEntries(["display","gap","fontSize","color"].map(key=>[key,getComputedStyle(rendered[i])[key]])) : null);
        const svg = [...root.querySelectorAll("svg")].map(el => [...el.querySelectorAll("*")].map(node => Object.fromEntries([...node.attributes].filter(attr => /^(fill-rule|clip-rule|stroke-width|stroke-linecap|stroke-linejoin)$/.test(attr.name)).map(attr => [attr.name,attr.value]))));
        return { svg, styles, registered: authored.every(el=>!!customElements.get(el.localName)), tags:actual.map(el=>el.localName), content: content(root), json: JSON.parse(JSON.stringify(json)) };
      }, item);
      assert(snapshot.registered, `${result.framework}/${item.file}: unregistered element`);
      if (baseline) assert.deepEqual(snapshot, baseline[snapshots.length], `${result.framework}/${item.file}: content or data differs from native HTML`);
      snapshots.push(snapshot);
    }
    if (!baseline) baseline = snapshots;
    // Every framework mounts the same controller in two independent owners.
    const intake = result.cases.findIndex(item => item.lesson === 'intake' && item.step === 5);
    for (const width of [1440,390]) {
      await page.setViewportSize({width,height:900});
      await page.evaluate(() => { if(!document.getElementById('second')) {const second=document.createElement('div');second.id='second';document.body.append(second);} });
      await page.evaluate(index => window.mountDocsExample(index), intake);
      await page.evaluate(index => window.mountDocsExample(index,'second'), intake);
      await page.locator('#app input[id="counterparty"]').fill('First');
      await page.locator('#second input[id="counterparty"]').fill('Second');
      assert.equal(await page.locator('#app box-form-wizard').evaluate(el => el.values.counterparty),'First');
      assert.equal(await page.locator('#second box-form-wizard').evaluate(el => el.values.counterparty),'Second');
      await page.evaluate(() => window.unmountDocsExample());
      assert.equal(await page.locator('#second input[id="counterparty"]').inputValue(),'Second');
      await page.evaluate(index => window.mountDocsExample(index), intake);
      assert.equal(await page.locator('#app input[id="counterparty"]').inputValue(),'');
      await page.screenshot({path:join(evidence,`${result.framework}-${width}.png`)});
    }
    assert.deepEqual(errors, [], `${result.framework}: uncaught browser errors`);
    observations.push({framework:result.framework,catalogVariants:snapshots.length,status:'passed',checks:['all native elements registered','slotted/nested content parity','JSON property data parity','same lesson controller','independent instances','unmount/remount','desktop/mobile']});
    await page.close();
  }
  await writeFile(join(evidence,'results.json'),JSON.stringify(observations,null,2));
  console.log(JSON.stringify(observations));
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
