# Releasing

Maintainer guide for cutting a release of **`@unofficialbox/box-open-elements`**
to npm. (Contributor setup lives in [CONTRIBUTING.md](./CONTRIBUTING.md).)

The package publishes to the npmjs org **`unofficialbox`** as a public scoped
package. Two routes are supported: an automated GitHub Actions release
(recommended — it attaches an npm provenance attestation) and a manual local
publish.

## One-time setup

- **npm org membership.** You must be a member of the `unofficialbox` npm org
  with publish rights (`npm org ls unofficialbox` should list you after
  `npm login`).
- **Trusted publisher (CI route — no secret).** The release workflow publishes
  with npm **OIDC trusted publishing**, so there is no long-lived `NPM_TOKEN` to
  create or store. On npmjs.com, open the package's **Settings → Trusted
  Publisher**, choose **GitHub Actions**, and enter the org (`unofficialbox`),
  this repository, and the workflow filename (`release.yml`). npm then trusts a
  short-lived credential minted from the workflow's OIDC token at publish time.
  - *First publish only:* if npm requires the package to exist before you can add
    a trusted publisher, do one initial local publish (Route B) to create it,
    then configure the trusted publisher for every release after that.

## Versioning

- Follow [semver](https://semver.org). Pre-1.0, breaking changes may land in
  minor releases; communicate them in the changelog.
- Bump `version` in `package.json` and record the change in
  [CHANGELOG.md](./CHANGELOG.md) as part of the release PR.
- Update the versioned GitHub documentation links in `README.md` to the new
  `v<version>` tag. The npm tarball also includes the agent UI, motion, and API
  guidelines so installed hosts can read the matching contract.
- The git tag is `v<version>` (e.g. `v0.1.0`). The release workflow **fails** if
  the tag does not match `package.json`'s `version`.

### PR check tiers

CI infers major/minor/patch from a `package.json` version bump. Feature PRs
usually do not bump the version yet, so they default to the patch lane: typecheck,
tests related to changed code, and a core build when core code changes. Mark a
feature PR `release:major` or `release:minor` when it is intended for that
release tier; that runs the full coverage/build/framework, conformance, and
pinned-browser pixel gates. `release:patch` and `release:hotfix` explicitly use
the targeted lane. Conflicting labels or a label that contradicts a version bump
fail CI rather than silently selecting a lighter gate. A manual CI dispatch runs
the full gate regardless of tier. Superseded PR runs are cancelled.

Patch/hotfix PRs still need focused browser review for visible changes. The npm
publish workflow retains its full verification gate for every release; PR
selection only avoids repeatedly running that expensive gate during iteration.

## Route A — Cut release workflow (recommended)

1. Land a PR that bumps `package.json` `version` and updates `CHANGELOG.md`.
2. Dispatch **Cut release** on `main` (Actions tab, or
   `gh workflow run cut-release.yml --ref main`).

`.github/workflows/cut-release.yml` reads the version from `package.json`, tags
`vX.Y.Z` at `main`, and publishes a GitHub Release whose notes are that
version's `CHANGELOG.md` section — then dispatches `release.yml`, which runs
`bun run verify` (typecheck + coverage tests + build) and `npm publish --access
public` via **OIDC trusted publishing** (no token), with provenance.

The extra dispatch is deliberate: a Release created by a workflow's
`GITHUB_TOKEN` fires no `release: published` event (GitHub suppresses those to
prevent recursion), so the publish has to be triggered explicitly —
`workflow_dispatch` is exempt from that rule.

The workflow refuses to run off `main`, refuses to move an existing tag, and
skips the npm dispatch when the version is already published, so a re-run after
a partial failure fills in only what is missing.

**A green Cut release run does not mean the package is published.** Cut release
only tags, publishes the GitHub Release, and *dispatches* the publish; the verify
gate and `npm publish` run afterwards in `release.yml` and can still fail there.
Watch that second run to completion, then confirm the version is actually on npm:

```bash
gh run watch --exit-status                            # 1. the Cut release run
gh run list --workflow release.yml --limit 1          # 2. find the run it dispatched
gh run watch <release-run-id> --exit-status           # 3. wait for the publish itself
npm view @unofficialbox/box-open-elements version     # 4. live when this matches
```

Step 3 is the one that matters and the easy one to skip: `gh run list` only
prints the run, it does not wait for it or fail when it fails. `--exit-status`
makes a failed run a non-zero exit rather than a line of output you have to
read.

### Refresh the lockfile pin after publishing — this is a required step

`bun.lock` pins a registry copy of the core, and it can only pin a version that
npm already has. So during a release the tree is at the new version while the
pin still names the old one, and it cannot be refreshed until after the publish
lands:

```bash
bun update @unofficialbox/box-open-elements   # after the new version is live
# then revert the `dependencies` block this adds to the root package.json —
# the root package IS the core, and it must not depend on itself
```

`tools/adapters/version-check.ts` accommodates that window by accepting a pin
one release behind, and prints `bun.lock pins X (lagging Y — refresh after
publishing)` when it does.

**That tolerance is why this step is required rather than tidy.** The gate
cannot tell a release in flight from a pin nobody refreshed afterwards, so a
stale pin keeps passing until the *next* release moves the goalposts. The
process closes what the rule deliberately cannot: refresh it, in its own small
PR, once the version is live on npm.

An exact-match rule was tried first and had to be relaxed — it made every
release PR unpassable, since the pin can never match a version that is not
published yet.

### A version bump quietly dirties every docs-site baseline

The docs-site rail footer renders the package version, inlined at build time by
`docs-site/build.ts`, so bumping `version` dirties **every** baseline in
`docs/screenshots/docs-site` — all of them, whatever the count is when you read
this. The change is tens of pixels in a glyph-sized box at the bottom-left of
the rail: 0.13.0 to 0.14.0 measured 66 pixels, 0.0049% of the frame against a
0.1% gate. The exact count depends on which digits change, so treat the order of
magnitude as the point rather than the number.

Well under the gate, so the pixel diff never fails on it and the stale badge
rides along until some later `[regen-baselines]` run adopts it alongside
whatever that PR actually changed.

Nothing is broken by this, but it does mean a post-release regen shows more
changed files than the PR's own diff explains. When reading an adopted set, a
small change confined to the bottom-left of the rail — and present in *every*
frame — is the version badge catching up, not the PR.

Contrast a change confined to the left **column** (roughly x19–146 at the
current rail width) that also appears in every frame: that is the nav rail
growing a row, which happens when a release adds a component or a category. That
one **does** exceed the gate — adding `box-toolbar` failed 19 baselines at
0.157–0.380% — so the visual check goes red until a regen adopts it, and the
failure is expected rather than a defect.

Those percentages are the ones the check itself reports. A hand-rolled exact-match
pixel count reads roughly double, because the comparator allows a little
anti-aliasing tolerance — so when measuring a diff yourself to decide whether a
regen is benign, compare your number against your own baseline, not against the
0.1% gate.

### Route A′ — publish an existing tag by hand

Creating the GitHub Release yourself still works and still triggers
`release.yml`:

```bash
git checkout main && git pull
gh release create v0.7.0 --title v0.7.0 \
  --notes-file <(awk '/^## 0.7.0 /{found=1; next} found && /^## /{exit} found' CHANGELOG.md)
```

The `awk` extraction stops *before* the next `##` heading — the same bounded
read `cut-release.yml` uses. A `sed` range (`/^## 0.7.0/,/^## /p`) prints its
terminating line, so it would staple the following version's heading onto the
release notes.

`release.yml` also accepts a manual `workflow_dispatch`, useful for re-publishing
after a failed run. **Select the `vX.Y.Z` tag as the ref, not a branch.** The
workflow's first step — before it installs anything from the checkout — refuses
any ref that is not a tag named exactly `v<package.json version>`. Otherwise a
dispatch from `main` (the ref the Actions UI offers first) would publish whatever
`main` happens to hold, under whatever version its `package.json` names, and the
job holds a live npm publishing credential while doing it.

## Route B — local publish

No provenance badge (provenance requires the CI/OIDC environment), but useful for
a one-off:

```bash
git checkout main && git pull
npm login                 # 2FA as needed
bun install
bun run verify
npm publish --access public
```

- `--access public` is **required** for scoped packages (they default to
  restricted).
- The `prepublishOnly` script rebuilds `dist/` before packing, so the tarball
  always ships a fresh build. `dist/` itself is git-ignored.
- If 2FA-on-writes is enabled, npm prompts for a one-time code during publish.

## Verify the release

```bash
npm view @unofficialbox/box-open-elements version
npm view @unofficialbox/box-open-elements dist.tarball
```

Consumers then install and import:

```bash
npm i @unofficialbox/box-open-elements
```
```ts
import { Button } from "@unofficialbox/box-open-elements";
// or a subpath, e.g. "@unofficialbox/box-open-elements/foundations/tokens"
```

## What's in the published tarball

`files` is restricted to `dist`, so the package ships only the built library
(plus `README.md` and `LICENSE`, which npm always includes). Verify before a
first publish with:

```bash
npm pack --dry-run
```

## Sub-packages

The React, Angular, Vue, Svelte, SolidJS, and Preact adapters ship **the same version as the core
package** and peer-depend on exactly `^<core version>` — seven packages, one
number. `bun run adapters:version` enforces both halves and runs inside `verify`,
so a drifted manifest fails CI rather than reaching npm.

That strictness is deliberate. Pre-1.0 a breaking change can land in a minor
release, so an adapter built against 0.6 has no business claiming compatibility
with 0.7. The cost is that **every core release is also an adapter release** —
which is the point of the gate: the 0.6.0 release shipped with the adapters
peering `^0.5.0`, a range that excluded the only published core version, and
nothing failed because the old check only compared the adapters with each other.

Release tags are `adapters-vX.Y.Z`, matching the core's `vX.Y.Z`. **There is no
separate adapters dispatch** — the single **Cut release** run in Route A does
all seven packages: it tags `vX.Y.Z` *and* `adapters-vX.Y.Z`, publishes both
GitHub Releases, and dispatches `.github/workflows/release-adapters.yml` itself
for the six adapter packages once bootstrapped. That last step is the same GITHUB_TOKEN
workaround Route A uses, applied a second time.

Earlier revisions of this section described dispatching a "Cut adapters
release" workflow. No such workflow exists, and trying to dispatch one returns
a 404; `cut-release.yml` has covered the adapters since it was written.

### Historical first publish at 0.7.0

The original React, Angular, Vue, and Svelte adapters were bootstrapped onto npm
at `0.7.0` from a local session, and a clean registry install was verified. This
historical record does not include SolidJS or Preact. The new-package procedure
below publishes only explicitly approved additions; do not repeat a historical
four-package or six-package publication loop.

A local direct bootstrap publish carries **no provenance attestation** — that requires the
CI/OIDC environment. The `0.7.0` adapters therefore have none; the core does.

The React, Angular, Vue, and Svelte Trusted Publishers **are configured** on npmjs.com, for
organization `unofficialbox`, this repository, and workflow
`release-adapters.yml`. Every adapter release since has been OIDC: no token, and
provenance on the four published adapters. Earlier revisions of this section listed that
configuration as a remaining one-time step, and warned that until it was done
`Cut release` would tag the adapters and skip their publish — neither applies
any more.

Verify the public packages after release, including that OIDC actually ran —
a publish that fell back to some other route would be missing its attestation:

```bash
for package_name in react angular vue svelte solid preact; do
  npm view "@unofficialbox/box-open-elements-$package_name" version
done

# Provenance on the version just published; empty output means it is missing.
npm view "@unofficialbox/box-open-elements-react@$(node -p "require('./package.json').version")" \
  dist.attestations
```

`@box-open-elements/box-server` remains private and is not published.

### SolidJS and Preact bootstrap (verified at 0.42.2)

`@unofficialbox/box-open-elements-solid` and
`@unofficialbox/box-open-elements-preact` were independently reviewed in #591,
merged at `03fa63b33105dbcef9a6c1e6eed770db2e554cb4`, and human-published at
`0.42.2` on 2026-10-13. Both artifacts match the approved pack contents and passed
normal public-registry installation, JSX types, SSR and browser consumers.
Neither human bootstrap has OIDC provenance.

### Completed 0.42.3 release and first OIDC publication

The core and all six adapters were published at `0.42.3` on 2026-10-13 from
`0fdd3ccfd282933ef183e80186375b74343e35a8`, after independent review and bounded
merge/release approval. The [core publication run](https://github.com/unofficialbox/box-open-elements/actions/runs/38465775465)
and [adapter publication run](https://github.com/unofficialbox/box-open-elements/actions/runs/38465771066)
succeeded through the existing OIDC workflows with signed provenance. The
adapter job published all six packages and skipped none. This was the first
successful trusted-publisher use for SolidJS and Preact; it validates their
publishers independently of the earlier setup report and human bootstrap.

The [core release](https://github.com/unofficialbox/box-open-elements/releases/tag/v0.42.3)
and [adapter release](https://github.com/unofficialbox/box-open-elements/releases/tag/adapters-v0.42.3)
are complete. All seven registry versions and `latest` tags were verified at
`0.42.3`, with adapter core peers at `^0.42.3`. Tarball integrity, approved pack
contents, source/workflow provenance, and fresh registry consumers were checked.
The SolidJS and Preact consumers passed 48 routes across current Chrome and
pinned Chromium/Firefox, including SSR hydration.

The required post-publication registry core pin refresh was completed in
[PR #593](https://github.com/unofficialbox/box-open-elements/pull/593), merged at
`424998eb587bafe2c9d90e3b0ccb2606744ad731`. Its only change was the `bun.lock`
core resolution and integrity from `0.42.2` to `0.42.3`.
[Final main CI](https://github.com/unofficialbox/box-open-elements/actions/runs/38469504127)
and the [docs deployment](https://github.com/unofficialbox/box-open-elements/actions/runs/38469504146)
succeeded at that commit. Historical `0.42.2` tags were unchanged.

For future new packages, an already-published bootstrap version is skipped by
the workflow and cannot validate a new publisher. Use the next explicitly
approved release for that validation; do not republish the bootstrap version.

`cut-release.yml` checks registry bootstrap before creating any tags or GitHub
Releases. `release-adapters.yml` checks it after its mandatory tag guard and
before any npm publication. Missing packages, outages, or invalid metadata fail
explicitly; package existence does not verify trusted-publisher settings.

#### Reference: bounded first bootstrap (already completed for SolidJS/Preact)

1. Resolve the explicitly approved **source commit, package names, and version**.
   Use a reviewed bootstrap commit containing these packages; an older
   `adapters-vX.Y.Z` tag without them cannot be used. Check the manifests match
   that approved version and core peer range. For direct bootstrap, choose an
   approved version whose core peer is already publicly available; verify it
   with `npm view @unofficialbox/box-open-elements@APPROVED_VERSION version`.
   If a candidate peers on an unpublished core, stop and coordinate an approved
   bootstrap version/plan rather than changing manifests or creating tags to
   bypass the preflight. Historical bootstrap approval does not authorize
   publication of a new version.
2. In a clean checkout of that exact approved commit, run
   `bun install --frozen-lockfile`, `bun run verify`, `bun run bundles:check`, and
   `bun run adapters:pack-check`. Inspect each selected package with
   `npm pack ./packages/solid --dry-run --ignore-scripts` and the equivalent
   Preact command. Confirm its public exports and intended contents.
3. An existing authorized `unofficialbox` npm maintainer performs the first
   publication from their own terminal/session, completing npm's 2FA themselves.
   Do not send session credentials or OTPs through chat, create automation
   tokens, change organization grants, or run this from an unapproved branch.
   After explicit approval for **both** additions only:

   ```bash
   for package_name in solid preact; do
     npm publish "./packages/$package_name" --access public
   done
   ```

   If approval covers only one, execute only that package's command. If a
   partial bootstrap fails, inspect public versions and publish only the still
   missing approved version; never overwrite or republish the existing four.
4. Verify each public name/version and a fresh consumer registry install.
   Human bootstrap does not establish OIDC provenance or validate a trusted
   publisher. Do not mark the adapters Supported from manifests alone.
5. Creating a trusted publisher is a persistent package-specific access grant.
   Obtain separate explicit approval per package; ordinary publication approval
   does not authorize account/settings changes. At each new package's npm
   **Settings → Trusted Publisher**, select GitHub
   Actions and configure only: organization/user `unofficialbox`, repository
   `box-open-elements`, workflow filename `release-adapters.yml` (no path), and
   blank environment because the current job declares none. Allow direct
   `npm publish`, as used by that workflow; it does not need an additional
   dist-tag-management grant. Do not alter the four existing package publishers.
6. Arrange publisher setup when the next explicitly approved OIDC release can
   complete within npm's current two-day first-publish validation window. The
   existing workflow skips versions already published by bootstrap, so merely
   dispatching that same version will not validate either new publisher. Do not
   invent an unapproved version to satisfy the window; defer configuration if
   necessary. An approved later release must use the common core/adapter version
   and matching `adapters-vX.Y.Z` tag, on GitHub-hosted runners.
7. Confirm the successful OIDC job, registry versions, fresh consumer installs,
   and `dist.attestations` for **both** additions. Only then record published
   availability/provenance in the support matrix.

Why human bootstrap was needed: before creation, the two new names had no
public package settings/trusted-publisher relationship. This repository's
direct-publish workflow authenticates through package-specific OIDC relationships
and cannot establish that initial relationship. npm also documents staged publishing that
can create a public placeholder for a missing package; that is still a registry
write requiring separate approval and human authorization, and is not the
current release workflow. No staging or publication is performed by these steps
until explicitly approved.

References: [npm scoped public publication](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/)
and [trusted publisher setup and validation](https://docs.npmjs.com/trusted-publishers/).
