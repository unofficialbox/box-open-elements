# Agent takeover handoff

**Date:** 2026-07-17  
**Repo:** [unofficialbox/box-open-elements](https://github.com/unofficialbox/box-open-elements)  
**Base branch:** `main` @ `1652899` (through PR **#71**)
**Recent changelog:** [CHANGELOG.md](../CHANGELOG.md) (git-derived, 2026-07-14 – 2026-07-17)

Read this file first, then `BACKLOG.md`, `docs/HANDOFF.md`, and the subsystem doc for whatever you touch.

---

## 30-second orientation

| Item | State |
| --- | --- |
| **Stack** | Bun + TypeScript Web Components; Vitest + jsdom; coverage-gated CI |
| **Live site** | https://unofficialbox.github.io/box-open-elements/ (push `main` → GitHub Pages) |
| **Workshop** | Internal only — `storybook/`, **108** extracted stories → docs-site variant dropdown |
| **Fidelity program** | **Complete** (Batches 0–7 + #41 + #42) |
| **Open PR** | None after #71 at this snapshot; verify with `gh pr list` before starting |
| **Next product gaps** | Explorer `recents` (needs transport contract), configurable columns, more React wrappers |

---

## What just shipped (last 3 days on `main`)

High-signal merged work — full PR list in [CHANGELOG.md](../CHANGELOG.md).

1. **Fidelity program closed** — security, `BaseElement`, dark mode, interaction states, forms/a11y, polish (#29–#42).
2. **Explorer + docs-site** — search/item contract, host chrome, metadata-query variant, build-alongs (Explorer/Share/Preview), guidance cards (#43–#45, #55–#58, #60).
3. **Workshop** — 108 stories; batches 3–5 (#48–#52, #59).
4. **Foundations** — iconography generator, brand imagery, token/shell docs, theming/motion, coverage gate (#45–#47, #54, #63–#64).
5. **Density + BUE visual** — full-catalog audit, `boeOverlay` / `boePanel`, control/overlay/drawer conformance (#61–#67).
6. **Adapters + agents** — React PoC (`@box-open-elements/react`), recommend-next-step rule (#68–#69).
7. **Style bridge** — first real BUE Content Explorer selector-bridge config and engine hardening (#70), followed by this takeover/changelog snapshot (#71).

---

## Latest completed slice: PR #70

| Field | Value |
| --- | --- |
| Merged commit | `c9eca7a` |
| CI | Verify + Pixel + CodeRabbit **pass** |
| State | **Merged** to `main` on 2026-07-17 |

### What #70 adds

- First real **selector-bridge** config for box-ui-elements Content Explorer SCSS
- Vendored snapshot: `tools/style-bridge/libraries/box-ui-elements/`
- Config: `tools/style-bridge/configs/box-ui-elements/content-explorer.config.json`
- Regenerate: `bun run style-bridge:bue-explorer`
- ExecPlan: `plans/style-bridge-bue-explorer-execplan.md`
- Engine fixes: Sass partial imports, nest flatten, safe `//` strip, at-rule parent scope, comma selector expansion
- Tests: `test/tools/style-bridge.test.ts` (14 cases)

## Standard agent workflow

### Branch naming

```
cursor/<descriptive-name>-7eb7
```

All new branches use prefix `cursor/` and suffix `-7eb7`.

### Before finishing any turn

```bash
bun run verify                    # must pass before commit
git add … && git commit && git push -u origin <branch>
# ManagePullRequest: create or update PR; mark ready (not draft) for CodeRabbit
# Poll until Verify + Pixel + CodeRabbit green
```

### Key commands

| Task | Command |
| --- | --- |
| Typecheck | `bun run typecheck` |
| Tests | `bun run test` |
| Full gate | `bun run verify` |
| Docs dev | `bun run docs` |
| Pixel CI locally | `bun run test:regression:pixel` (Docker) |
| Style bridge | `bun run style-bridge:bue-explorer` |
| Density audit | `bun tools/density-audit.ts` |
| PR checks | `gh pr checks <n>` |

### PR / CI rules (from `AGENTS.md`)

- Open **draft** PRs first, then mark **ready** so CodeRabbit runs.
- Poll `gh pr checks` until green; fix red immediately.
- Commit and push each iteration; update the PR every turn that lands changes.
- End substantive replies with a **concrete next step + why** (repo rule).

---

## Architecture reminders

| Layer | Location | Rules |
| --- | --- | --- |
| Core | `src/core/` | `BaseElement`, `FormAssociatedElement` |
| Foundations | `src/foundations/` | tokens, motion, geometry, a11y — no transport |
| Components | `src/components/<category>/` | Web Components; `--boe-token-*` with hex fallbacks |
| Patterns | `src/patterns/<area>/` | workflows own controllers; explorer transport in `box-transport.ts` |
| React adapter | `packages/react/` | `createWebComponent` — extend as needed |
| Docs site | `docs-site/` | Real examples only — no placeholder cards |
| Style bridge | `tools/style-bridge/` | Config-driven third-party SCSS → BOE selectors/tokens |

Taxonomy: `docs/taxonomy.md`. API rules: `docs/api-guidelines.md`.

---

## Open backlog (prioritized)

From `BACKLOG.md` — do **not** invent placeholder content.

| Priority | Item | Blocker / notes |
| ---: | --- | --- |
| 1 | More **React wrappers** via `createWebComponent` | PoC in #68 |
| 2 | Explorer **`recents` view** | Needs real transport contract — do not fake as folder listing |
| 3 | **Configurable / permission-gated columns** | Contract/design TBD |
| 4 | Additional **style-bridge configs** | Only when restyling a concrete third-party stylesheet |
| 5 | **Motion literal migration** | Opportunistic — `tools/migrate-motion-literals.ts` |
| 6 | Next **build-along lesson** | Only when a new workflow needs guided teaching |

BUE visual conformance is largely done; remaining work is opportunistic polish per `docs/foundations/geometry.md`.

---

## Gotchas (save yourself time)

1. **jsdom `ElementInternals`** — stubs omit `setFormValue` / `setValidity`; use `getMirroredFormValue(el.internals)` in form tests.
2. **Screenshot baselines** — regen inside pinned container: `bun run baselines:regen` (needs Docker).
3. **Calendar demos** — pin `today` / `month` / `value` for deterministic pixels (see `docs-site/examples.ts`).
4. **`color-mix` trap** — never use the same token on both operands when tokenizing white.
5. **Docs-site + gallery** — keep `docs-site/examples.ts` and `tools/preview/gallery.html` in sync.
6. **Style-bridge `out/`** — gitignored; library bridge test is the regression gate, not committed CSS.
7. **Workshop `setup()`** — runs live in workshop UI; extraction strips `setup` from `workshop.json`.

---

## File map for common tasks

| If you are… | Start here |
| --- | --- |
| Changing a component | `src/components/…`, matching test in `test/components/…` |
| Explorer behavior | `src/patterns/content-explorer/`, `docs/patterns/content-explorer.md` |
| Docs / examples | `docs-site/examples.ts`, `docs-site/lessons.ts` |
| Public API / exports | `package.json` exports, `docs/migration-map.md` |
| CI failure | `.github/workflows/ci.yml`, `gh pr checks`, skill: fix-ci |
| Style bridge | `docs/integration/style-bridge.md`, `tools/style-bridge/bridge.ts` |

---

## Suggested first session for the next agent

1. Confirm the checkout starts from current `origin/main`; this snapshot is `1652899` through #71.
2. Pick **React wrapper expansion**, or wait on **explorer recents** until its transport is defined.
3. Run focused tests first, then **`bun run verify`** before publishing the slice.

---

## Related docs

- Long-lived handoff: [docs/HANDOFF.md](./HANDOFF.md)
- Open work tracker: [BACKLOG.md](../BACKLOG.md)
- Agent conventions: [AGENTS.md](../AGENTS.md)
- 3-day changelog: [CHANGELOG.md](../CHANGELOG.md)
