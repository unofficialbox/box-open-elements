// Foundation markdown docs are imported as text (Bun `text` loader; see
// docs-site/server.ts) and rendered in-shell.
declare module "*.md" {
  const content: string;
  export default content;
}
