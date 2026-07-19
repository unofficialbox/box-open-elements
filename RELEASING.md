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

## Route A — GitHub Release (recommended)

1. Land a PR that bumps `package.json` `version` and updates `CHANGELOG.md`.
2. Tag and publish a GitHub Release for that version:
   ```bash
   git checkout main && git pull
   gh release create v0.1.0 --title v0.1.0 --generate-notes
   ```
3. `.github/workflows/release.yml` runs automatically: it checks the tag matches
   the version, runs `bun run verify` (typecheck + coverage tests + build), then
   `npm publish --access public` authenticated via **OIDC trusted publishing**
   (no token). Provenance is generated automatically, so the npm page shows a
   provenance badge.
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
