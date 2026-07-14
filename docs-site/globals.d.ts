// Foundation markdown docs are imported as text (Bun `text` loader; see
// docs-site/server.ts) and rendered in-shell.
declare module "*.md" {
  const content: string;
  export default content;
}

// Package version inlined by the static build (docs-site/build.ts) via Bun
// `define`. Undefined in the dev bundle, which fetches /api/status instead.
declare const __BOE_VERSION__: string | undefined;
