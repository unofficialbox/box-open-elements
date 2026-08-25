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
- The git tag is `v<version>` (e.g. `v0.1.0`). The release workflow **fails** if
  the tag does not match `package.json`'s `version`.

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

The docs-site rail footer renders the package version, inlined at build time, so
bumping `version` changes 23 pixels in all 46 `docs/screenshots/docs-site`
baselines. That is 0.002% of the frame against a 0.1% gate — the pixel diff never
fails on it, so the stale badge simply rides along until some later
`[regen-baselines]` run adopts it alongside whatever that PR actually changed.

Nothing is broken by this, but it does mean a post-release regen shows more
changed files than the PR's own diff explains. When reading an adopted set, a
23-pixel change confined to the bottom-left of the rail is the version badge
catching up, not the PR.

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

The React, Angular, Vue, and Svelte adapters ship **the same version as the core
package** and peer-depend on exactly `^<core version>` — five packages, one
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
all five packages: it tags `vX.Y.Z` *and* `adapters-vX.Y.Z`, publishes both
GitHub Releases, and dispatches `.github/workflows/release-adapters.yml` itself
for the four adapter packages. That last step is the same GITHUB_TOKEN
workaround Route A uses, applied a second time.

Earlier revisions of this section described dispatching a "Cut adapters
release" workflow. No such workflow exists, and trying to dispatch one returns
a 404; `cut-release.yml` has covered the adapters since it was written.

### First publish — done at 0.7.0

All four adapters were bootstrapped onto npm at `0.7.0` from a local session, and
a clean consumer install has been verified against the registry. Nothing here
needs repeating; it is kept because the *reason* recurs for any new package.

Trusted publishing cannot create a package — npm needs it to exist before you can
configure a publisher for it. So the first release of any new package has to come
from a local session with npm credentials:

```bash
git checkout adapters-vX.Y.Z          # publish exactly what was tagged
npm login                             # 2FA prompts once per package
bun install --frozen-lockfile && bun run build:adapters
for package_name in react angular vue svelte; do
  ( cd "packages/$package_name" && npm publish --access public )
done
```

A bootstrap publish carries **no provenance attestation** — that requires the
CI/OIDC environment. The `0.7.0` adapters therefore have none; the core does.

**Remaining one-time step:** on npmjs.com, configure each adapter's Trusted
Publisher for organization `unofficialbox`, this repository, and workflow
`release-adapters.yml`. Until that is done, `Cut release` tags the adapters and
skips their publish rather than failing. After it, every release is OIDC, needs
no token, and gets provenance.

Verify the public package after release:

```bash
for package_name in react angular vue svelte; do
  npm view "@unofficialbox/box-open-elements-$package_name" version
done
```

`@box-open-elements/box-server` remains private and is not published.
