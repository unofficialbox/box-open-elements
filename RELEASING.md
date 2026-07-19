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
- **`NPM_TOKEN` secret (CI route only).** Create a **granular** or **automation**
  npm access token with *read + write* on the `@unofficialbox` scope, and add it
  as a GitHub Actions repository secret named `NPM_TOKEN`
  (Settings → Secrets and variables → Actions). Automation/granular tokens skip
  the interactive 2FA prompt, which a plain token with 2FA-on-writes cannot do in
  CI.

## Versioning

- Follow [semver](https://semver.org). Pre-1.0, breaking changes may land in
  minor releases; communicate them in the changelog.
- Bump `version` in `package.json` and record the change in
  [CHANGELOG.md](./CHANGELOG.md) as part of the release PR.
- The git tag is `v<version>` (e.g. `v0.1.0`). The release workflow **fails** if
  the tag does not match `package.json`'s `version`.

## Route A — GitHub Release (recommended)

1. Land a PR that bumps `package.json` `version` and updates `CHANGELOG.md`.
2. Tag and publish a GitHub Release for that version:
   ```bash
   git checkout main && git pull
   gh release create v0.1.0 --title v0.1.0 --generate-notes
   ```
3. `.github/workflows/release.yml` runs automatically: it checks the tag matches
   the version, runs `bun run verify` (typecheck + coverage tests + build), then
   `npm publish --provenance --access public`. Provenance is attested via OIDC —
   no token is embedded in the tarball, and the npm page shows a provenance
   badge.
4. Watch the run: `gh run watch` (or the Actions tab). A green run means it's live.

You can also trigger the workflow manually (`workflow_dispatch`) without a
release — useful for re-publishing after a failed run — but the tag/version
guard only applies to Release events.

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
import { defineBoxButtonElement } from "@unofficialbox/box-open-elements";
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

`@box-open-elements/react` and `@box-open-elements/box-server` are currently
`private` and are **not** published. If they are opened up later, publish them
under the same org conventions and give each its own version bump.
