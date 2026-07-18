# Handoff — box-ui-elements conformance, round 5 (live Box web app capture)

**For the next session — ideally a LOCAL one (see §2).** Read this, then
[`plans/bue-conformance-execplan.md`](./bue-conformance-execplan.md) and
[`plans/bue-conformance-layer2-handoff.md`](./bue-conformance-layer2-handoff.md).
This captures hard-won environment findings so you don't re-derive them.

## Where things stand (all merged to `main`)

- **Layer 1 — source geometry.** `bun run bue-conformance` diffs
  `src/foundations/geometry` against real upstream box-ui-elements SCSS (pinned
  `v26.0.0`). 17/17 conformant. (PR #76.)
- **Layer 2 — colour / shadow / interaction state (static).** `bun run
  bue-conformance:color` reads the **compiled** Storybook CSS (post-Sass) and
  diffs box-open-elements' shipped colour/shadow/state values. **26 claims,
  20 conformant / 6 review**, covering button / menu-item / badge / checkbox /
  radio / tooltip. Harness:
  `tools/bue-conformance/{color-signals,css-extract,color-manifest,color-audit}.ts`;
  report `docs/audits/bue-conformance-color-audit.md`. (PRs #78, #79.) Rounds 1-4
  exhausted what's resolvable **without a browser** (compiled-CSS extraction +
  webpack chunk map + `color-mix()` evaluator + verbatim compound-selector match).
- **De-shine.** Flattened a systemic skeuomorphic gloss recipe
  (`linear-gradient(180deg, surface → darker)` fills + `inset 0 1px 0
  rgba(255,255,255,~0.8)` sheen) across ~28 UI-chrome surfaces to flat Box
  design. Preserved chart data-viz, skeleton shimmer, colour-picker spectrum,
  illustration artwork. (PR #80.)

## The goal of round 5

Capture styling from the **real Box web app** (`app.box.com`) — the actual
production UI — as the conformance *ground truth*, and diff box-open-elements
against it. This is stronger than the component-library Storybook reference the
static layers use: the webapp is how Box actually renders. For each surface,
`getComputedStyle` (and/or pixels) the live element and record background / text
/ border colours, box-shadows, and hover/focus/active states, then emit them in
the audit's claim format for comparison.

## 1. Why this needs a live browser (and the wall in the cloud sandbox)

box-ui-elements colours are produced by Sass functions and now, in the webapp, by
a running React app + design tokens — the resolved values only exist at render
time. So round 5 genuinely needs a rendered browser reading computed styles.

**In the Claude-Code-on-web (remote) sandbox this is blocked**, re-confirmed this
session:

- The sandbox is an isolated cloud container. It has **no bridge to your local
  machine or browser** — it cannot drive your real Chrome or reuse your Box login.
- All outbound traffic is forced through a MITM proxy. `curl` traverses it, but
  **Chromium's TLS is reset by it**: `net::ERR_TUNNEL_CONNECTION_FAILED` /
  `net::ERR_CONNECTION_RESET` for every host (with proxy) — verified again on
  `example.com` and `app.box.com`. `--ignore-certificate-errors` /
  `ignoreHTTPSErrors` / `NODE_EXTRA_CA_CERTS` do **not** help; it is a
  proxy-layer reset, not cert trust.
- The only in-sandbox way to render a live page is the **curl-interception
  harness**: launch Chromium with **no proxy**, intercept every request with
  `page.route`, fetch the bytes with `curl`, and `route.fulfill`. Proven to load
  pages, but authenticating the Box app through it (login POST + cookie shuttling
  + possible 2FA/device-check/CAPTCHA) is fiddly and risky.

## 2. Recommended path — run this LOCALLY

Run Claude Code (CLI or IDE extension) **on your own machine**. A local session
can drive your real Chrome — with your existing Box login — directly, exactly the
way other local agents do. No proxy, no login automation, no auth walls.

Two local sub-options:

- **A1 — attach to your logged-in Chrome over CDP.** Start Chrome with a
  debugging port and an existing profile that's already signed in to Box:
  ```bash
  # macOS example — quit Chrome first
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --remote-debugging-port=9222 --user-data-dir="$HOME/box-capture-profile"
  # sign in to app.box.com in that window once, then run the capture script
  ```
  Then Playwright `chromium.connectOverCDP('http://localhost:9222')`, grab the
  existing context, navigate, and read styles. Nothing is automated about login.
- **A2 — persistent context.** `chromium.launchPersistentContext(userDataDir,
  {headless:false})`, sign in once by hand, and reuse that `userDataDir` on every
  later run.

## 3. Fallback path — capture in THIS remote sandbox with an imported session

If you must stay remote: export your authenticated Box state from your browser
(Playwright `storageState` JSON, or the session cookies) and hand it over. Load it
into the sandbox Chromium via the curl-interception harness (see the harness
skeleton in `bue-conformance-layer2-handoff.md` §3; forward the cookies on each
allow-listed request with `curl -b`, capture `Set-Cookie` with `-c`). Any device
re-challenge mid-session still stops you. Lower confidence than the local path.

## 4. Environment facts (this account / this repo)

- Credentials load as env vars **at container start**: `BOX_USERNAME`
  (a `@boxdemo.com` account) and `BOX_PASSWORD` (len 20) — username/password, not
  SSO, per the owner. Present this session.
- Reachability via `curl` (proxy + `--cacert /root/.ccr/ca-bundle.crt`), verified:
  `app.box.com/login` → 200, `account.box.com` → 302, `api.box.com/oauth2/authorize`
  → 200, `cdn01.boxcdn.net` → 301.
- Browser binary: `/opt/pw-browsers/chromium`, driven via `playwright-core`
  (already a devDependency). `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`.
- box-open-elements renders its own components as Web Components; render them
  locally (build + a page, or the docs-site) to read the BOE-side computed styles
  — no network needed for the BOE half.

## 5. What to capture (surfaces → box-open-elements components)

Sign in and open the file browser (`app.box.com/folder/0`); the ContentExplorer
chrome exposes most of these. Read `getComputedStyle` for `background-color`,
`color`, `border-color`, `box-shadow` — base and `:hover` / `:focus-visible` /
`:active` (drive states with Playwright `hover()` / `focus()`):

| Real webapp element | box-open-elements | box-ui-elements class hint |
| --- | --- | --- |
| Primary action buttons (New, Upload) | `box-button` (primary) | `.btn-primary` |
| Secondary buttons | `box-button[data-tone="neutral"]` | `.btn` |
| Row action `⋯` menu items | `box-menu-item` | `.menu-item` |
| Status/label badges | `box-badge` | `.badge`, `.badge-*` |
| Checkboxes / radios | `box-checkbox` / `box-radio-group` | `.checkbox-*` / `.radio-*` |
| Tooltips | `box-tooltip` | `.bdl-Tooltip` |
| Search / text inputs | form controls | `.text-input-*` |
| Content rows, modals, tree | collections / overlays | `.bdl-*` |

## 6. How to wire results into the conformance program

Emit captured values as JSON matching the audit's per-claim shape
(`{ id, surface, property, state, value }`) so they can diff against the
box-open-elements side the same way `color-audit.ts` does. Cleanest integration:
add a `color-manifest`-style **webapp manifest** whose upstream side is the
captured JSON (instead of the compiled Storybook CSS), reusing `color-signals.ts`
(`parseColor`, `normalizeShadow`, `parseColorMix`, `compareColor`) verbatim.
Verdict policy stays the same: exact match → `conformant`; differences →
`review` (box-open-elements tracks modernised Blueprint; the webapp may render a
different theme), never auto-`drift`. Add a report section
`docs/audits/bue-conformance-webapp-audit.md`.

## 7. Capture-script skeleton (local, path A1)

```ts
import { chromium } from "playwright-core"; // or "playwright"
const browser = await chromium.connectOverCDP("http://localhost:9222");
const ctx = browser.contexts()[0];               // your logged-in context
const page = ctx.pages()[0] ?? await ctx.newPage();
await page.goto("https://app.box.com/folder/0", { waitUntil: "networkidle" });

const read = (sel: string) => page.$eval(sel, el => {
  const s = getComputedStyle(el);
  return { backgroundColor: s.backgroundColor, color: s.color,
           borderColor: s.borderColor, boxShadow: s.boxShadow };
});
// drive states: await page.hover(sel) / page.focus(sel), then read again.
// collect { id, surface, selector, state, ...styles } rows → write JSON.
await browser.close();
```

Guard rails: read-only navigation; never mutate/delete Box content; if any
device-verification / 2FA / CAPTCHA appears on a headless/automated attempt,
screenshot and stop rather than retrying against a real account.
