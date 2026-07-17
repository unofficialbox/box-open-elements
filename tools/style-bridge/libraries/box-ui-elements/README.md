# box-ui-elements (bridge library snapshot)

Bridgeable subset of [box-ui-elements](https://github.com/box/box-ui-elements) stylesheets
for the Content Explorer selector-bridge config.

| Path | Upstream source |
| --- | --- |
| `content-explorer/ContentExplorer.scss` | `src/elements/content-explorer/ContentExplorer.scss` |
| `content-explorer/Content.scss` | `src/elements/content-explorer/Content.scss` |
| `content-explorer/Footer.scss` | `src/elements/content-explorer/Footer.scss` |
| `content-explorer/index.scss` | Local entry that composes the three sheets |
| `common/_variables.scss` | **Shim** — only simple `$variables` the bridge can substitute. Upstream `elements/common/_variables.scss` also pulls mixin-heavy style imports that are outside the supported subset. |

Refresh the SCSS copies from upstream when Content Explorer chrome changes; keep the variables shim intentionally small.
