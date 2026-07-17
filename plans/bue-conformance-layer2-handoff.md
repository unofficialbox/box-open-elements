# Handoff — box-ui-elements conformance, Layer 2 (live visual)

**For the next session.** Read this, then
[`plans/bue-conformance-execplan.md`](./bue-conformance-execplan.md). It captures
hard-won environment findings so you don't re-derive them.

## Where things stand

- **Layer 1 (source-level geometry) is DONE and merged** — PR #76, squashed to
  `main` as `67a6749`. `bun run bue-conformance` diffs `src/foundations/geometry`
  against real upstream box-ui-elements SCSS (pinned `v26.0.0`), **17/17
  conformant**. Tooling: `tools/bue-conformance/{signals,manifest,audit}.ts`;
  report `docs/audits/bue-conformance-audit.md`; 37 tests.
- **Layer 2 (live colour / shadow / interaction-state capture) is NOT done** —
  it needs a real browser to read computed styles / pixels from a rendered
  reference. This handoff is about unblocking that.

## The goal of Layer 2

For each surface, render the **upstream** reference and **box-open-elements**'
component in a browser, read `getComputedStyle` (and/or capture pixels), and diff
the values Sass functions hide from Layer 1: background/text colours, box-shadows,
and hover/focus/active states. Extend the audit report with a colour/shadow
section.

## Environment findings (READ — these cost real time to discover)

1. **Network egress to Box hosts is gated by the environment network policy.**
   In this run it was opened (Custom allowlist). To reach the reference from a
   fresh session, the environment must allow (Custom + defaults, or Full):
   ```text
   opensource.box.com     # public Storybook (no auth)
   *.boxcdn.net
   *.box.com  *.ent.box.com  app.box.com   # only if targeting the tenant
   ```
   Verify first thing: `curl -sS --cacert /root/.ccr/ca-bundle.crt -o /dev/null -w '%{http_code}\n' https://opensource.box.com/box-ui-elements/index.json` → expect `200`.

2. **Headless Chromium CANNOT use the egress proxy directly.** Launching
   `chromium.launch({ proxy: { server: process.env.HTTPS_PROXY } })` gives
   `net::ERR_CONNECTION_RESET` for **every** host — including allow-listed ones
   that `curl` reaches at 200 (`raw.githubusercontent.com` resets too). It is a
   TLS-layer reset by the MITM proxy, **not** box-specific:
   - `ignoreHTTPSErrors: true` does **not** help (so it is not cert trust).
   - `--disable-http2` and `--disable-quic` do **not** help.
   - The proxy log (`curl "$HTTPS_PROXY/__agentproxy/status"`) shows **no**
     rejection for the target host — the reset is mid-stream, unfixable from
     inside the session.

3. **WORKAROUND THAT WORKS: curl-backed request interception.** Launch Chromium
   with **no proxy**, intercept every request with `page.route`, fetch the bytes
   with `curl` (which works through the proxy), and `route.fulfill`. Chromium then
   makes no real outbound connections. **Proven** to load pages with no reset.
   Force correct MIME on `.js`/`.css`/`.json` or ES modules won't execute:
   ```ts
   import { chromium } from "playwright-core";
   import { readFileSync, rmSync } from "node:fs";
   import { tmpdir } from "node:os";
   import { join } from "node:path";
   const CA = "/root/.ccr/ca-bundle.crt";
   // SSRF guard: only fetch documented Box / Storybook hosts. The browser (or a
   // compromised page) can request arbitrary URLs; never turn this harness into
   // an open server-side fetcher. Keep --max-redirs 0 so redirects can't escape
   // the allowlist — if a real redirect is needed, re-check its Location here.
   const ALLOW = [/^opensource\.box\.com$/, /(^|\.)box\.com$/, /(^|\.)ent\.box\.com$/, /(^|\.)boxcdn\.net$/];
   const allowed = (u: string) => { try { const h = new URL(u).hostname; return ALLOW.some(re => re.test(h)); } catch { return false; } };
   const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" }); // NO proxy
   const page = await browser.newPage();
   let n = 0;
   await page.route("**/*", async (route) => {
     const url = route.request().url();
     if (!/^https:\/\//.test(url) || !allowed(url)) return route.abort();
     const tmp = join(tmpdir(), `route-${process.pid}-${n++}.bin`);
     try {
       const p = Bun.spawnSync(["curl","-sS","--cacert",CA,"--max-time","40","--max-redirs","0","-o",tmp,"-w","%{content_type}|%{http_code}",url]);
       if (p.exitCode !== 0) return route.abort();
       const [ctype, code] = p.stdout.toString().split("|");
       const buf = readFileSync(tmp);
       const path = url.split("?")[0];
       const mime = /\.(js|mjs)$/.test(path) ? "text/javascript"
         : /\.css$/.test(path) ? "text/css"
         : /\.json$/.test(path) ? "application/json"
         : (ctype||"application/octet-stream").split(";")[0];
       await route.fulfill({ status: Number(code)||200, contentType: mime, body: buf });
     } catch { await route.abort(); }
     finally { rmSync(tmp, { force: true }); }
   });
   ```
   (For POST/XHR add `-X`, `-d`, and header passthrough — forward auth/cookie
   headers **only** to allow-listed origins. Handle cookies for the tenant path
   with `curl -c/-b` — see below.)

4. **The public BUE Storybook is blocked by a Service Worker.** Its stories use
   **MSW (Mock Service Worker)**; under interception the SW registration fails
   (`[MSW] Failed to register the Service Worker`) and stories error before
   mounting. The curl-interception loads the shell but the component never
   renders. So the **public-Storybook path is a dead end** without solving MSW
   (stub `navigator.serviceWorker` and hope presentational stories render without
   mocks — untested, low confidence).

5. **The tenant app has no MSW.** `app.box.com` / `kadams.ent.box.com` is a plain
   React SPA, so wall #4 doesn't apply — but it needs **login**, and the
   credentials only load in a **fresh session**:
   - Set `BOX_USERNAME` / `BOX_PASSWORD` as environment variables in the env
     config (they are absent this session; env vars load at container start).
     The account uses username/password (not SSO), per the owner.
   - Login is a POST + cookie session; the interception harness must persist and
     replay cookies (`curl -c/-b cookiejar`, and forward `Set-Cookie`). Watch for
     2FA / device-verification / CAPTCHA — if any fires, capture a screenshot and
     stop.

## Reference facts

- Story index (public Storybook): `https://opensource.box.com/box-ui-elements/index.json`
  — **778 stories**. Render one at `iframe.html?id=<storyId>&viewMode=story`.
  Example IDs: `components-badges-badge--regular`, button/menu/modal families.
- Browser: `/opt/pw-browsers/chromium`, driven via `playwright-core` (already a
  devDependency). Reuse the launch pattern in `tools/preview/capture.ts`.
- box-open-elements renders its own components as Web Components; render them
  locally (build + a minimal page, or the docs-site) to read BOE-side computed
  styles — no network needed for the BOE half.

## Recommended path (pick in the new session)

Ranked by ROI given the walls above:

- **C — Compiled-CSS extraction (no browser).** Fetch the Storybook's compiled
  CSS-in-JS bundles via `curl`, extract the resolved colour/shadow declarations
  (post-Sass), and add them as `review`→auto colour/shadow claims. Gets most of
  Layer 2's unique value without fighting the browser. Medium effort.
- **A — Ship Layer 1 as the deliverable; run Layer 2 off-proxy.** Layer 2's live
  capture genuinely wants an environment **without** a MITM proxy (a local
  machine / different CI). Accept the boundary; don't burn cycles here.
- **B — Tenant path.** Fresh session + `BOX_USERNAME/PASSWORD`, curl-interception
  harness (no MSW), automate login, capture `/folder/0` computed styles. Highest
  effort + auth risk (2FA), but the only *live* path not blocked by MSW.
- **D — Beat the Storybook MSW** (stub the service worker). Lowest confidence.

**Suggested first move next session:** verify network (`curl` the index.json),
then attempt **C** — it reuses the working `curl` fetch path and sidesteps both
the Chromium-proxy and MSW walls. Fall back to **B** only if the owner
specifically wants the live tenant view and has set the creds.

## Files / commands

| | |
| --- | --- |
| Harness | `tools/bue-conformance/{signals,manifest,audit}.ts` |
| Report | `docs/audits/bue-conformance-audit.md` (+ `.data.json`) |
| Plan | `plans/bue-conformance-execplan.md` |
| Run audit | `bun run bue-conformance` |
| Tests | `bun run test test/tools/bue-conformance.test.ts` |
| Gate | `bun run verify` |
| Proxy state | `curl -sS "$HTTPS_PROXY/__agentproxy/status"` |
