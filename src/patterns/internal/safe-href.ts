/**
 * One definition of "may this author-supplied href become a real link?",
 * shared by every surface that renders evidence or citation chips
 * (`box-timeline`, `box-agent-chat`, `box-audit-log`). Internal: it is not
 * re-exported from any pattern barrel.
 *
 * Three copies of this check previously drifted apart, which is exactly how
 * the protocol-relative hole below survived in all of them.
 *
 * Allowed: absolute `http(s)`, a same-document fragment, and a rooted path.
 * The path branch requires a *single* leading slash — `//evil.example/x` is
 * protocol-relative and a browser resolves it to an external origin, and
 * `/\evil.example` is normalized to that same form by some parsers. Anything
 * else (including `javascript:`, `data:`, and leading-whitespace tricks)
 * fails the test, and the caller renders a button instead of an anchor.
 */
export const isSafeHref = (value: string): boolean =>
  /^https?:\/\//i.test(value) || /^\/(?![/\\])/.test(value) || value.startsWith("#");
