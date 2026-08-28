# Changelog

Notable changes to **`@unofficialbox/box-open-elements`**, newest first, one
section per released version.

The four framework adapters ship the same version as the core and are covered by
the same sections; see [RELEASING.md](./RELEASING.md) for why those five numbers
move together.

The four sections at the foot of the file are headed by date rather than version.
They cover 2026-07-14 through 2026-07-17, before the first tagged release, and
are kept as written.

---

## Unreleased

### Folder uploads, and the drop that used to vanish

`box-drop-zone` read `dataTransfer.files`, which the platform simply cannot use
to describe a directory. Dropping a folder produced an empty list, so the zone
reported nothing and the drop disappeared with no error and no rejection — the
worst kind of failure, because it looks like nothing happened.

The zone now reads the entry list instead, and reads it **synchronously** inside
the `drop` handler: the item list is emptied the moment that handler returns, so
awaiting anything before capturing it loses the drop. Traversal happens
afterwards, off the captured entries, batching through `readEntries` until it
comes back empty — the call caps at about 100 children, and reading it once is
how a 250-file folder silently becomes a 100-file folder. macOS packages
(`.app`, `.rtfd`) arrive as directories the OS also calls a zip; those upload
whole rather than being walked, which would scatter a bundle's internals.

`files-selected` now carries `entries` — each file with the directory it came
from — alongside the existing flat `files` list, which is unchanged. A drop or a
dismissed picker that carries no files now emits nothing at all, where it
previously announced an empty selection.

`box-content-uploader` recreates the dropped tree through a new optional
`createFolder` on `UploadTransport`. It is optional because requiring it would
break every transport already written against the interface; a transport without
it **refuses** a folder drop with a new `folder-unsupported` rejection rather
than flattening the tree into the destination root, which has no undo. Folders
are created lazily, when a file in them actually starts uploading, and the
in-flight promise is shared, so two files racing into the same folder create it
once rather than making two folders with the same name.

`file-limit` caps the queue, defaulting to 100 — matching box-ui-elements. A
default matters here in a way it did not before: a dropped folder can carry
thousands of files, and the queue had no back pressure at all. Files past the cap
are rejected with `file-limit-reached`.

`box-drop-zone` also gained `accept`, and the uploader now fills it in from
`extensions`, so the browse dialog stops offering files the queue would reject.
It is advisory only — a person can still pick "All files", and it does nothing
for a drop — so the queue's own check remains the real one.

Also on the uploader: `directories` turns click-to-browse into a folder picker
(dropped folders are read either way — the platform only forces the choice on the
browse path), `addEntries()` queues pathed files directly, and a burst of queue
events now coalesces into a single re-render, which a 100-file drop needs.

## 0.16.0 — 2026-08-27

One new component. Additive; no existing default changes.

### `box-formatted-duration`

How long something takes or lasts, in the reader's locale — the fifth member of
the formatted-value family, and the one most obviously missing in a content
platform. Retention periods, SLAs and processing times are all durations, and
every host was rendering them by hand.

```html
<box-formatted-duration value="5400"></box-formatted-duration>   <!-- 1 hr, 30 min -->
```

`value` takes a count of seconds **or** an ISO 8601 duration, because hosts have
both: an API field is usually a number, while `<time datetime>` wants the ISO
form. Whichever comes in, the ISO form goes back out, so the exact quantity
survives for anything reading the document rather than looking at it.

`format-style` takes `short` (default), `long` or `narrow`, and `max-units`
controls how much precision to show — two by default, since a duration carries
more than a reader wants to scan.

What it **refuses** is as deliberate as what it formats:

- A **negative value** hides the element. A duration carries no direction, so a
  negative one is a host bug; `box-relative-time` is what expresses "ago".
- **Months and years** are refused. A month is not a fixed number of seconds,
  and `P1M` is ambiguous with a minute besides, so rendering either as a fixed
  span would misstate how long it actually is.

`Intl.DurationFormat` renders it where the browser has it. That API is recent,
so where it is absent the same output is composed from `Intl.NumberFormat`'s
unit style and `Intl.ListFormat`; the two paths were compared across styles and
locales before the fallback was relied on, and a test runs it with
`Intl.DurationFormat` deleted.

Two behaviours came out of testing rather than design, and both are the kind
that would have shipped silently:

- A **trailing zero unit is dropped**, so an exact hour is "1 hr" rather than
  "1 hr, 0 min". Only trailing ones — an interior zero is load-bearing, since
  dropping it would let "1 day, 0 hr" become "1 day, 5 min" and claim a
  precision the two-unit split does not have.
- A **zero duration renders "0 sec"**, because `Intl` formats one to the empty
  string, which would leave a visible element with nothing in it. The option
  that forces that appends "0 sec" to *every* duration in browsers honouring it,
  which Node's `Intl` quietly does not — so it passed in jsdom while being
  visibly wrong in a browser. It is now scoped to the zero case.

## 0.15.0 — 2026-08-26

One new component, and an accuracy pass over documentation that had drifted
away from the repo it describes. Additive; no existing default changes.

### `box-toolbar`

A row of independent controls, contributing the three things a toolbar owes and
hosts routinely skip — `role="toolbar"`, an accessible name, and roving
tabindex — while leaving the controls themselves to the host. Tab reaches the
group once; the arrow keys move within it. `orientation="vertical"` switches to
up/down and sets `aria-orientation` so the announcement matches the behaviour.

It is deliberately not `box-button-group`, which is a `radiogroup`: that one is
for picking exactly one of a set, and its children answer to a shared value. A
toolbar's controls are independent of each other.

Roving tabindex works by moving `tabindex` between elements, so it can only
manage controls the browser already considers focusable. A custom element host
is not focusable unless it carries its own `tabindex`, and the component's scope
says so rather than implying otherwise.

Testing it in Chromium rather than only in jsdom caught a defect worth
recording, because the same shape will recur in any roving-tabindex container:
roving tabindex only writes to the controls it *manages*, and a disabled control
is excluded — so it kept a button's default `tabIndex` of 0 and the toolbar had
two tab stops. Invisible while the control stayed disabled, and controls get
re-enabled at runtime as a matter of course. Every focusable control is now
claimed before one is handed the stop, and a `MutationObserver` watches for
`disabled` toggling and for controls added inside a wrapper — neither of which
fires `slotchange`.

### Documentation that had stopped being true

Four claims were corrected after checking each against the repo or the registry
rather than reasoning about them:

- The components catalog said a generic version of `action-menu`, `table` and
  `breadcrumbs` "remains future work". All three already ship, as `box-menu`,
  `box-table` and `box-breadcrumb` — so the catalog was pointing readers at
  building things that exist. `toolbar` was the one real gap of the six, which
  is why it is in this release; `items` and `list` remain genuinely missing.
- The CHANGELOG's own header described a 2026-07-14..17 snapshot — "55
  commits", "108 stories" — above a file running through 0.14.0 with 148. Read
  as the file's description of itself, so those numbers landed as current.
- `RELEASING.md` said a version bump changes "23 pixels in all 46" docs-site
  baselines. There are 57, and 0.13.0 to 0.14.0 measured 66. Both were frozen at
  an earlier release, so the counts are gone rather than refreshed.
- `RELEASING.md` also listed configuring the adapters' npm Trusted Publishers as
  a remaining step, warning that until then `Cut release` would skip their
  publish. It is done: all four adapters carry provenance attestations, which
  only an OIDC publish produces.

Where a stale number sat in a position that reads as a description of the
current state, it was replaced with a description rather than a fresher number —
a count in that position goes stale by design.

## 0.14.0 — 2026-08-25

A small release: one component gains one attribute. Additive, with no change to
any existing default.

### `box-formatted-number` can choose how wide to write a unit

The `unit` style shipped in 0.13.0 wired but unexercised — no docs variant
showed it, and nothing pinned its behaviour. Building those variants surfaced a
gap rather than just documenting one: `Intl` defaults `unitDisplay` to `short`,
and with no way to override it **"2.5 megabytes" was unreachable**. That is most
of the reason to reach for the unit style at all rather than formatting a number
and writing the unit yourself, so it was worth closing.

`unit-display` takes:

| | |
| --- | --- |
| `short` (default) | `2.5 MB` — what a table wants |
| `narrow` | `2.5MB` |
| `long` | `2.5 megabytes` — for prose, where an abbreviation the reader has to expand in their head is worse than the words |

Failure behaviour matches the rest of the family, where a bad option never
erases a good value:

- An **unrecognised width** falls back to `short` rather than being handed to
  `Intl`, which would throw.
- A **unit `Intl` does not sanction** still renders the number plainly. `Intl`
  accepts a closed list, so `unit="widgets"` is not a label it can use — but the
  number is real.
- A **missing unit** under `format-style="unit"` renders a plain decimal, the
  same as a missing currency code does.

Three docs variants were added: a size, the same size spelled out, and a
duration — units are not only sizes, and `hour`, `day` and `week` come from the
same sanctioned list. The size variant notes when to reach for
`box-formatted-file-size` instead: that one takes a raw byte count and reduces
it, this one takes a magnitude that already knows its unit.

## 0.13.0 — 2026-08-25

A feature release. Everything here is additive — eight new components, a new
foundation, and a new mode on an existing component. Nothing is renamed or
removed, and no existing default changes except `box-alert`, which gains a
glyph.

### The formatted-value family

Reviewing six design systems — Lightning, Carbon, ADF core, ADF
content-services, OpenAI's apps-sdk-ui and Geist — turned up exactly one whole
*category* missing rather than an individual control: read-only renderers for
typed values. Lightning ships eleven of them; box-open-elements shipped none, so
every consumer was hand-rolling locale handling, `<time datetime>` semantics and
invalid-input behaviour, differently each time.

- **`box-formatted-date`** — a date or time, into `<time datetime>` so the exact
  instant survives for anything reading the document rather than looking at it.
- **`box-relative-time`** — how long ago, with `reference-time` pinning what
  "now" means. `box-due-badge` has one for the same reason: output that depends
  on the wall clock cannot be tested or screenshotted deterministically, and a
  list wants every row measured against a single instant.
- **`box-formatted-number`** — decimal, currency, percent and unit styles.
- **`box-formatted-file-size`** — bytes to a readable size, decimal units by
  default to match what the Box product reports.

Three rules are shared in `foundations/format` rather than repeated per
component:

- **A locale is never guessed.** An absent `locale` means `undefined` to `Intl`,
  which is "use the host's" — not a hardcoded `en-US`. Substituting one would
  silently render American dates to a German reader.
- **Invalid input hides the element.** Not `Invalid Date`, not `NaN`, not the
  raw string echoed back. A malformed value is a host bug, and putting its
  wreckage in front of a reader helps nobody.
- **A bad *option* never hides a good value.** A `currency` style with no code,
  an unknown time zone, a rejected unit — each falls back to rendering the value
  plainly rather than erasing it.

`box-formatted-number` takes **`format-style`, not `style`**: `style` is a
global HTML attribute, so the tidier name would have put CSS on the host and
been silently ignored as a formatting instruction.

### Gaps two or more design systems agreed on

| Component | Confirmed by |
| --- | --- |
| `box-code-block` | Carbon, apps-sdk-ui, Geist |
| `box-tile-group` | Carbon (RadioTile/TileGroup), Geist (Choicebox) |
| `box-indicator` | Carbon (Icon/ShapeIndicator), apps-sdk-ui |
| `box-calendar` `mode="range"` | apps-sdk-ui (DateRangePicker), ADF (`search-date-range`) |

- **`box-indicator`** is distinct in *shape* as well as colour — disc, tick,
  triangle, diamond, ring. A column of coloured dots is unreadable to anyone who
  cannot separate the colours, and status is exactly what a reader needs from a
  dense list. Without a visible label the tone is announced; with one it stays
  quiet, so nobody hears "Success Signed" where the screen says "Signed".
- **`box-code-block`** sets code as `textContent`, never as markup — a snippet
  is the string most likely on any page to contain angle brackets. It ships **no
  syntax highlighting**, deliberately: doing it properly means a grammar per
  language, and doing it improperly means mis-colouring code a reader is trying
  to trust. Hosts slot pre-rendered markup instead. Long lines scroll rather
  than wrap, because a wrapped line silently changes what the reader believes
  the source says.
- **`box-tile-group`** wraps a real `<input type="radio">` or `checkbox` per
  tile, visually hidden but in the tab order and the accessibility tree, so
  grouping, arrow-key navigation and form participation come from the platform
  rather than being reimplemented on `<div>`s.
- **Range selection lands on `box-calendar`** rather than a new component: the
  grid, the keyboard model and the min/max clamping already live there. `start`
  and `end` are separate attributes rather than an overloaded `value`, which
  would have meant inventing a separator every host then had to parse back out.
  A second click before the first swaps the ends. **`single` stays the default**
  and all twelve existing calendar tests pass untouched.

### Fixed

- **`box-alert` gains a tone glyph.** Removing its border in 0.12.0 left tone
  resting on a 10% tinted fill plus a visually-hidden label — weaker than
  toast's, which pairs a 20% tint with a full-strength coloured glyph. The
  glyphs moved into the shared `tone.ts` both components already imported, so a
  success tick cannot differ between an alert and a toast reporting the same
  outcome. Nothing conformance-pinned moves: the tinted backgrounds still match
  upstream exactly, and the glyph is coloured from a new `--alert-accent` that
  upstream has no equivalent for.

  This is the one visual change consumers will see on upgrade: an icon appears
  in every alert, and the content shifts right to make room for it.

- **Three docs that stated things that were false.** `components/catalog.md`
  called itself the canonical map for `src/components` while listing neither
  `path` nor `grid`. `patterns/catalog.md` still listed a Versions gap that
  `box-version-list` closed, and described the comments write path as future
  work the day after `box-comment-thread` shipped. `RELEASING.md` documented
  dispatching a "Cut adapters release" workflow that does not exist —
  `cut-release.yml` covers all five packages in one dispatch.

- **Visual coverage for the feedback family.** `box-toast`, `box-alert` and
  `box-nudge` had no per-page baselines at all; only the gallery composite
  covered them.

## 0.12.0 — 2026-08-25

A minor rather than a patch. The API additions below are backward compatible,
but every toast, alert and nudge changes appearance on upgrade, and `borderless`
quietly stops meaning anything. `^0.11.0` resolves to `>=0.11.0 <0.12.0`, so a
consumer opts into the restyle instead of finding it on their next install.

- **Comments are a standalone surface: `box-comment-thread`.** They hang off a
  file, a folder, a task or a contract clause just as readily as off a region of
  a document, and until now the only comment-shaped component in the library was
  `box-annotation-thread` — which meant reaching into `patterns/preview` for
  something named after a feature you were not using.

  That component was never coupled to annotations. Its observed attributes were
  `actions`, `composable`, `entries`, `message`, `selected-entry-id` and
  `heading`; its parts were the generic anatomy of a thread. **Nothing tied an
  entry to a place in a document** — no page, no region, no coordinates. Every
  occurrence of the word "annotation" in it was a tag name, a type name, a
  heading string, or a DOM id.

  `patterns/comments` now owns the thread and the model (`CommentEntry`,
  `CommentAction`, `CommentSubmittedDetail`). The model is its own module, so a
  controller, adapter or server route that only transports comments imports the
  types without pulling a custom element along.

- **`box-annotation-thread` finally earns its name.** It becomes a
  specialisation of the above and adds the **anchor** — `page`, `region` and/or
  `quote` — which is the only thing that makes an annotation an annotation. A
  thread with nothing to anchor to belongs on `box-comment-thread`, and its docs
  now say so.

  A region is described to the reader as "Page 2 · region" rather than by its
  coordinates: the numbers place a highlight for a renderer, but they tell a
  reader nothing and a screen reader least of all.

  **Nothing to change on upgrade.** Every attribute, part and event is inherited
  unchanged; `AnnotationThreadAction` and `AnnotationThreadEntrySubmittedDetail`
  alias the new types, `AnnotationThreadEntry` is `CommentEntry & { toolLabel?:
  string }`, and `toolLabel` still renders through an override rather than
  making hosts rename fields. The eleven existing tests pass untouched, which is
  the evidence that nothing moved underneath them.

- **`box-toast`, `box-alert` and `box-nudge` no longer paint borders.** The
  outlines read as heavy. Toast loses its 2px near-black border and three tone
  border colours, alert its 1px border and four, nudge its tinted 1px.

  Eight colour conformance claims pinned those declarations against upstream
  box-ui-elements. They are **retired**, not preserved under an opt-in so the
  audit could go on reporting them: an audit that reports a border
  box-open-elements does not paint is worse than one claim short. The counts
  move 63 → 56 conformant and 9 → 8 accepted — one of the eight was an accepted
  divergence rather than a conformant match — and the CI floor moves with them.

  Tone survives the change. Every toast tone already set a 20% tinted fill *and*
  a full-strength glyph accent, every alert tone a 10% tint, and both carry a
  visually-hidden tone label — so tone was never colour-only, and never rested
  on the border. Verified in Chromium: `0px` / `none` on all three, each tone
  still resolving a distinct background.

  `box-toast` keeps `borderless` as a reflected no-op. It shipped in 0.11.0, and
  removing it would break hosts that set it to get exactly what every toast now
  gives them anyway.

  **Known softness:** `box-alert` has no glyph, so its tone now rests on a 10%
  tint plus the hidden label — a weaker visual signal than toast's. Fixing that
  means either giving alert a tone glyph or touching its conformance-pinned
  background values, so it is left as it is rather than done quietly here.

## 0.11.0 — 2026-08-24

A minor because the rename below is breaking, per the pre-1.0 policy. Consumers
on `^0.10.0` are not handed it on their next install.

- **`box-stage-path` is now `box-path`.** The old name described the data it was
  given rather than the thing on screen, and it collided with the vocabulary of
  the surfaces around it. The rename is total, so there are three edits for a
  consumer, not one:

  | Was | Now |
  | --- | --- |
  | `<box-stage-path>` | `<box-path>` |
  | `import { StagePath }` | `import { Path }` |
  | `".../stage-path"` | `".../path"` |

  The supporting exports moved with it — `StagePathVariant` is `PathVariant`,
  `resolveStagePathVariant` is `resolvePathVariant`, and so on. No alias is
  left behind: pre-1.0, a deprecation shim that has to survive to 1.0 costs
  more than the one-line change it saves.

  The component was reworked against Salesforce's `lightning-progress-indicator`
  at the same time. `variant` is now `"chevron" | "base"` — `"rounded"` is gone,
  along with the button bar it carried. `"base"` is Salesforce's path type: a
  horizontal rail with markers sitting on it, which is what the vertical
  `box-timeline` spine was rebuilt on too, so the two now read as one idea in
  two orientations.

- **New `box-grid`, and a responsive-grid foundation under it.** Adobe
  Spectrum's twelve-column grid, with gutters stepping 16 → 24 → 32 → 40 → 48px
  across Spectrum's breakpoints. Children declare their own placement with
  `data-span`, `data-offset` and `data-row-span`:

  ```html
  <box-grid>
    <article data-span="8">Main</article>
    <aside data-span="4">Sidebar</aside>
  </box-grid>
  ```

  Placement lives on the children rather than in an `items` payload on the host
  because the children are arbitrary content the author already writes — a
  positional payload would silently mis-place everything the moment one was
  inserted. It is applied as generated CSS rules, not inline styles, so the
  author's markup is left untouched.

  The model itself is exported from `foundations/layout` (`BOE_GRID_COLUMNS`,
  `BOE_GRID_BREAKPOINTS`, `boeGridGutterStyles`, `resolveBoeGridPlacement`).
  `box-skeleton` gained a `grid` variant that reads the same
  `--boe-grid-gutter` and the same column model, so a placeholder matches the
  layout it stands in for rather than approximating it.

- **`box-toast` restructured after Salesforce's `lightning-toast`.** Adds
  `heading`, a `mode` of `dismissible` or `sticky`, tone icons, and a
  `borderless` attribute that drops the frame. Colours are unchanged — the
  Salesforce palette would have broken BUE conformance, so the refinement is
  structural only. Tone labelling moved into a shared `tone` module that
  `box-alert` uses too.

- **The graph surfaces now agree on how an edge is drawn.**
  `box-version-graph` and `box-lineage-graph` share one cubic-Bézier
  construction and one arrowhead marker, so a curve looks the same whichever
  surface renders it. Both take an `arrows` attribute — `none`, `start`, `end`
  or `both`, defaulting to `end`.

  `box-provenance-strip` was rebuilt to read as a flow diagram rather than a
  breadcrumb, following React Flow's node anatomy: 6px connection ports on each
  node, arrowhead separators, and a dot-grid ground.

### Fixed

- **The docs-site preview canvas no longer collapses block-level demos.** It was
  a centred wrapping flex container, so every demo laid out at its intrinsic
  width: `box-table`, `box-app-shell` and `box-split-view` measured 0–2px in a
  918px canvas. It is a block container now, so each demo uses the display its
  own stylesheet declares. Its frame also went from 2px to 1px — the heaviness
  around Dialog, Drawer and Popover previews was this frame, not those
  components.

- **`box-contact-datalist-item` was missing from the package barrel**, so the
  tag never upgraded — one of 135 tags, silently inert, with no console error
  and no failing test. A barrel test now compares every entry against
  `src/index.ts` and names any that are unreachable.

## 0.10.0 — 2026-08-23

A minor because the overlay change below is breaking, per the pre-1.0 policy.
Note the ordering: `0.10.0` is **newer** than `0.9.0` — this is the first
release where that distinction is load-bearing, and `^0.9.0` (which resolves to
`>=0.9.0 <0.10.0`) correctly excludes it.

- **Every overlay now uses the top layer, not just `box-drawer`.** 0.9.0 fixed
  the drawer by promoting its scrim with `showModal()` instead of relocating the
  host node. The other seven overlays still painted with `position: fixed`
  alone, which an ancestor with a `transform`, `filter`, `perspective`,
  `contain`, or `will-change` overrides — that ancestor becomes the containing
  block, and the overlay is positioned and clipped against it instead of the
  viewport. None of them had the drawer's node-moving bug, because none of them
  moved; they had the clipping bug the moving was working around.

  A new `foundations/overlay/top-layer` module owns the promotion, and the
  drawer moved onto it too, so there is one implementation rather than eight.
  It exposes two primitives because the choice is about modality, not taste:

  - `promoteModal` / `dismissModal` — `<dialog>` + `showModal()`, for overlays
    that own the screen: `box-dialog`, `box-drawer`, `box-command-palette`,
    `box-shortcuts-overlay`.
  - `promotePopover` / `dismissPopover` — `[popover="manual"]` +
    `showPopover()`, for anchored surfaces that must **not** trap focus or block
    the page: `box-popover`, `box-tooltip`, `box-context-menu`,
    `box-guide-tooltip`. Using the modal primitive for these would be a
    behaviour regression, not merely an overreach.

  Verified in Chromium, since jsdom implements neither API: with a host inside a
  clipping, transformed ancestor, the host stays put and the surface renders
  outside the clip — the modal scrim covers the full viewport, and the anchored
  popover's box extends past the ancestor's bounds.

  **Behaviour changes worth knowing:**

  - Escape on the modal overlays now arrives as the dialog's native `cancel`
    event, routed through each component's existing dismissal so cancelable
    `dismiss` guards and `open` state still hold.
  - Dialog semantics moved onto the `<dialog>` element in each modal overlay.
    The inner panel no longer carries `role="dialog"`/`aria-modal`, which would
    have nested a dialog inside a dialog.
  - The anchored surfaces declare `display` explicitly. They carry
    `popover="manual"`, and the UA sheet hides a popover that is not open — an
    author declaration outranks it, so if `showPopover()` is unavailable or
    fails they render exactly as before and only the top layer is lost.

- **Adapter tests now run against this tree's core, not the published one.**
  `packages/*/test` resolved `@unofficialbox/box-open-elements` to whatever was
  last released, so a core change could not be validated by an adapter test
  until after it shipped — while `box-drawer` was being rewritten, the React
  test covering that behaviour was exercising the previous release's drawer and
  passing. Worse, it disagreed with the type layer: `tsconfig` already mapped
  those specifiers to `src`, so types came from the working tree while runtime
  came from the registry.

  `vitest.config.ts` now resolves the core to `src`, mirroring the `exports`
  map, and a regression test asserts the identity (`pkg.X === src.X`) that
  cannot be faked by coincidentally identical source.

## 0.9.0 — 2026-08-23

A minor because the change below is breaking, per the pre-1.0 policy: `^0.8.0`
resolves to `>=0.8.0 <0.9.0`, so a consumer on that range opts in rather than
being handed the new drawer behaviour on their next install.

- **`box-drawer` no longer moves its own node.** It covered the page by
  relocating itself to `document.body` when opened, leaving a placeholder
  comment behind. That worked visually and broke every framework that owns the
  node: React unmounting a tree containing an open drawer threw
  `NotFoundError: The node to be removed is not a child of this node`, because
  the node it tried to remove was no longer its child. Fixes #200.

  The scrim is now a `<dialog>` promoted with `showModal()`. The top layer
  renders outside the normal flow, so the drawer still covers the viewport —
  including from inside an ancestor with a `transform`, `filter`, or `contain`,
  which is the case that makes `position: fixed` resolve against that ancestor
  and is presumably why the node was being moved in the first place.

  Verified in Chromium rather than assumed, since jsdom implements neither
  `showModal` nor `showPopover`: with the host inside a 300×200 clipping,
  transformed ancestor, the host stays put and the scrim measures the full
  1000×700 viewport at the origin.

  **Behaviour changes worth knowing:**

  - The drawer's host element stays where you put it, open or closed. Code
    depending on `document.body` being its parent while open — or on the
    `box-drawer-placeholder` comment — will need updating.
  - Escape is now handled by the dialog's native `cancel` event, routed through
    the same cancelable `dismiss` guard as the close button and backdrop, so a
    host calling `preventDefault()` still keeps the drawer open.
  - Dialog semantics moved to the `<dialog>` itself. `[part="drawer"]` no longer
    carries `role="dialog"`/`aria-modal`, which would have nested a dialog
    inside a dialog; the `<dialog>` is labelled by the heading instead.
  - Where `showModal` is unavailable the drawer still renders and behaves; it
    simply does not get the top layer.

## 0.8.0 — 2026-08-23

A minor rather than a patch, deliberately. The `Button` type change below is
breaking, and `^0.7.0` resolves to `>=0.7.0 <0.8.0` — releasing it as `0.7.1`
would hand every consumer on that range a compile error they never opted into.

- **React `Button` `onClick` works inside `box-drawer`.** The callback was
  routed through React's `onClick`, which is delegated from the React root
  container — and `box-drawer` moves its whole subtree to `document.body` when
  it opens, out of that container, so the delegated click never arrived and the
  handler silently did nothing. Reported by box-dispatch, who were working
  around it with their own `addEventListener` bridge.

  `Button` now binds `click` through the adapter factory's `events` map, which
  registers the listener on the element itself so it travels with it. `Select`,
  `TextField` and `Dialog` already bound this way; `Button` was the one adapter
  that didn't.

  **Breaking (types), `Button` only:** `onClick` receives a native `MouseEvent`,
  not a React `SyntheticEvent`, and is typed
  `NativeEventHandler<ButtonElement, MouseEvent>` to say so. A handler declared
  as `MouseEventHandler<ButtonElement>` no longer type-checks. `Select`,
  `TextField` and `Dialog` are unaffected and keep React's delegated `onClick`.

  That containment took a change to the factory, which now constrains adapter
  props to what it actually uses (`className`, `style`) instead of the full
  host-prop type. Under the stricter constraint `Button` narrowing `onClick` was
  only legal if the prop came off the shared type for *every* adapter — a much
  wider break than the fix needs. Delegated `onClick` on the other three is a
  trap inside an open drawer, but it is React's trap and it catches a plain
  `<div onClick>` identically; it is now documented rather than removed.

  Scope, checked rather than assumed: `box-drawer` is the **only** component in
  the library that relocates itself, so it is the only surface where this can
  happen — `box-dialog` and the other overlays use the top layer and stay put.
  And React is the only adapter with root-container delegation: Vue and Angular
  bind listeners directly to the element, and compiling `Button.svelte` shows
  Svelte emitting `onclick` as an element property with no `$.delegate` call at
  all.

---

## 0.7.0 — 2026-08-23

Row virtualization across both shapes it comes in — a fixed-height engine for
`box-table` and a cumulative-offset engine for the grouped `box-audit-log` — a
docs-site rail that reveals where you are, and the framework adapters brought
into strict lockstep with the core package — they now ship the *same* version
number and peer-depend on exactly it, enforced in CI. Contains
[#193](https://github.com/unofficialbox/box-open-elements/pull/193) onward,
with 1,778 tests and clean conformance and visual-regression gates.

- **`box-audit-log` windows a grouped log** with `virtualize`, over a new
  `resolveOffsetWindow` (`src/core/offset-window.ts`). `box-table`'s engine
  multiplies a row count by one row height; an audit log mixes short headings
  with tall event rows, and a collapsed section is a heading alone — so this
  one walks a cumulative offset index, O(n) to build and O(log n) to search.
  A section scrolled into from the middle still renders its own heading,
  because `[part="group-body"]` is `aria-labelledby` the toggle inside it;
  the heading's height comes back out of the top spacer so the content does
  not drift. The plan is a pure function for the usual reason, and the usual
  reason paid twice — a browser check caught two faults jsdom cannot show:

  - An unmeasured scroller plans an empty window, and an empty window renders
    nothing to measure, so the log stayed **blank on first paint** and never
    recovered. A `ResizeObserver` breaks the circle and earns its place
    afterwards on container resize.
  - Two heights per row kind is an estimate, and on a 2,000-event log it ran
    0.9% long — 116,061px against 115,002px real. Scrolled fully down, the
    plan still believed a screenful remained, and **the last 14 events could
    not be reached at all**. The plan now reads the scroll position as a
    fraction of the real range and applies it to the estimated one, so both
    ends agree. Per-row measured heights would remove the drift itself; that
    is the same work the wrapped-cell case in `box-table` is waiting on.
  - Sampling *one* event row's height and adopting it ran away: rows are not
    uniform (`summary`, `evidence` and `correlationId` are each optional), so
    adopting one row's height moved the window, which rendered a different
    first row, which measured differently. **55 full rebuilds in 0.9 seconds
    while nothing was scrolling**, the sample flipping between 33px and
    166.5px. Heights are now averaged across every rendered row, and adoption
    is capped per row set — the average being stable is an argument about
    typical data, and this is a path where being wrong costs the frame rate.
  - The viewport observer is re-armed on reconnection. `setupListeners` runs
    once, on first connect, but the teardown runs every disconnect, so a
    re-inserted log kept its listeners and lost its observer.
  - Grouping, flattening and the offset index are cached per row set. The
    scroll path asks "did the window move?" every frame, and answering it was
    re-parsing the whole `events` attribute and rebuilding the index — twice
    per frame, O(n), on the surface whose point is not being O(n).

- The adapter publish is resumable
  ([#195](https://github.com/unofficialbox/box-open-elements/pull/195)). Four
  unconditional `npm publish` steps fail fast, so a re-run after a partial
  release hit the first already-published package and never reached the ones
  still missing — the documented recovery could not actually recover. Each
  package now checks its own published version and skips only an exact match.

- **Adapters are versioned identically to the core package**, not on their own
  line. `tools/adapters/version-check.ts` now fails the build unless every
  adapter's `version` equals the core version *and* its peer range is exactly
  `^<core version>` — it previously only checked the adapters agreed with each
  other, which is why `^0.5.0` sat there through the whole 0.6.0 release,
  excluding the only published core version, without anything failing. The rules
  live in a pure `version-rules.ts` so they are testable without reading
  manifests off disk. The four adapters jump 0.2.0 → 0.7.0; none had been
  published, so no consumer is affected by the renumbering.

- Review follow-ups to #193 — findings that arrived after it merged:

  - **`virtualize` no longer windows a collection whose rows can expand.** The
    window derives the whole scroll range from `rows.length * rowHeight`, but an
    expanded row renders a second `<tr>` that arithmetic knows nothing about:
    the spacers under-report the real height, and `scrollTop` stops mapping to
    the right absolute row, so the table would scroll to the wrong record.
    Windowing is now suppressed when any row declares `detail`, and
    `renderedWindow` returns `null` so a host can see that it was. The test is
    the data, not what happens to be open — flipping windowing as a row toggled
    would jump the viewport mid-scroll.
  - **`release.yml` refuses to publish from a non-tag ref, before it runs
    anything from the checkout.** The tag/version guard ran only for `release`
    events, so a manual `workflow_dispatch` — from `main`, the ref the Actions
    UI offers first — could publish an untagged tree under whatever version
    `package.json` named. The guard now applies to every trigger, and runs as
    the first step after checkout: the job holds `id-token: write`, and
    `bun install` executes the root package's own lifecycle scripts, so a guard
    sitting after the install left a window where a hostile ref could mint a
    publish credential first. It also compares the ref name whole rather than
    stripping the `v`, which had let a bare `X.Y.Z` tag through. The automated
    path already dispatches on the tag, so it is unaffected.
  - `RELEASING.md`: a green Cut release run means the publish was *dispatched*,
    not that it succeeded — the verify gate and `npm publish` run afterwards in
    `release.yml`. Documented watching that second run through to completion
    with `--exit-status`, since `gh run list` neither waits for a run nor fails
    when it fails, before checking npm for the version. Also
    replaced the manual release-notes `sed` range, which stapled the next
    version's heading onto the notes, with the bounded `awk` `cut-release.yml`
    already uses.

- Row virtualization for `box-table`, over a shared windowing engine
  ([#193](https://github.com/unofficialbox/box-open-elements/pull/193)):

  - **`resolveRowWindow`** (`src/core/virtualize.ts`) — pure, shared, fixed row
    height. Returns the rendered slice plus the spacer heights, and guarantees
    `paddingTop + rendered + paddingBottom === totalHeight` at every scroll
    position, so the scroll range never drifts under the pointer. Shared rather
    than per-component so `box-table`, `box-audit-log`, and `box-tree-grid`
    cannot end up with three definitions of "near the viewport".
  - **`box-table` opts in** with `virtualize`. Row indices stay absolute, so
    selection, shift-range, and `activateRow` still address the full collection;
    keyboard bounds come from the data rather than the rendered slice, and
    `focusRowByIndex` scrolls an unrendered row into the window before focusing
    it. Spacer rows are not `[part="row"]`, so navigation never lands on one.
    Scroll coalesces to a frame and skips the render entirely while the resolved
    slice is unchanged.
  - `row-height` is an estimate: the element measures a real row after first
    paint and adopts it. A declared height that is wrong by a few pixels
    otherwise accumulates into a visibly wrong scroll range over thousands of
    rows.
  - `box-audit-log` is deliberately not converted — its rows are grouped, and
    windowing across group boundaries is a different algorithm.

- Docs-site rail reveals the active entry when the restored scroll leaves it
  below the fold ([#193](https://github.com/unofficialbox/box-open-elements/pull/193)).
  The decision is a pure `resolveRailReveal`; an entry taller than the viewport
  aligns to the top instead of centring, which would push its first line
  off-screen.

- Framework adapters to 0.2.0, peers on `^0.6.0`
  ([#193](https://github.com/unofficialbox/box-open-elements/pull/193)). They
  carry the `ExplorerSelectionController` re-export from #188, and their previous
  `^0.5.0` peer range excluded the current core release. Example apps now resolve
  the core package through `paths` to the local build, so a release-prep PR no
  longer trips TypeScript's private-field nominal check by loading two copies of
  the same class.

---

## 0.6.0 — 2026-08-22

Feature release: the CLM horizontal-coverage and component-opportunity
programs (work queue, versions, lineage, agent chat, audit, command palette,
notifications, form wizard, timeline, diff, compare view, signature ceremony,
stage path, due badge, shortcuts overlay) plus the box-dispatch intake
(`box-run-trace`, per-step progress statuses, table descriptors/expansion/
states, drawer and master-detail upgrades, form parity, and the generated
global tag map). Contains
[#146](https://github.com/unofficialbox/box-open-elements/pull/146) through
[#188](https://github.com/unofficialbox/box-open-elements/pull/188), with
1,695 tests and clean conformance and visual-regression gates. 139 workshop
stories; deterministic visual-baseline capture.

- Dispatch intake rounds 4-7 ([#188](https://github.com/unofficialbox/box-open-elements/pull/188)):

  - **`box-run-trace`** — machine execution trace for a job, pipeline, or
    agent run, under a new Runs pattern category. `resolveRunSteps` is pure:
    an explicit per-step status wins; a failure shadows the queue behind it
    as *Skipped* — a dead run must not show work as still coming, the same
    rule the signature ceremony applies after a decline; timestamps derive
    running/succeeded/pending. Durations, expandable per-step detail with a
    `detail-<id>` slot, child tasks with live `box-progress-bar` rows, and a
    summary chip that doubles as a polite status region so attribute-driven
    updates announce themselves. The family reads: `box-timeline` = what
    people did, `box-audit-log` = what was recorded, `box-run-trace` = what
    the machine executed. Full docs-site/workshop/gallery coverage
    (139 extracted workshop stories).
  - **`box-table`**: declarative cell descriptors (`text | badge | link`) the
    table renders itself — never HTML strings, so cells stay injection-proof
    and non-http(s) hrefs render as plain text; row expansion with a
    `detail-<id>` slot; loading/error/empty states stated in words with
    loading winning over a stale error; stacked card rows
    (`stacked="always" | "auto"`) that keep grid semantics; typed
    `sort` / `selection-changed` / `row-toggled` details.
  - **`box-drawer`**: `dismiss` is now cancelable and names its source —
    `preventDefault()` is the whole unsaved-changes guard, and the backdrop
    now asks before closing where it used to close silently; `header` and
    sticky `footer` slots; `size` presets small/medium/large/full; every
    drawer is the whole screen under 640px; `busy` veils and inerts the body
    while Close stays reachable.
  - **`box-split-view`**: `collapse="auto"` master-detail — under a 640px
    container the primary pane takes the full width and the secondary
    becomes a slide-over the host shows with `detail-open`; Escape asks via
    `detail-dismissed` without closing anything itself.
  - Reference rows updated for every API the intake extended, plus
    composition recipes: master-detail (selection lives in the list),
    nav-sidebar active item/badges and rail-to-drawer via `box-drawer`, the
    shared form-field contract on the field pages, and the
    progress-steps / stage-path / run-trace distinction.
  - All seven CodeRabbit findings on the PR fixed and mutation-verified,
    including two latent same-class bugs the review exposed in neighbouring
    components (`box-signature-ceremony` roster clearing;
    `box-progress-steps` text-field validation).

- Dispatch intake rounds 1-3 ([#187](https://github.com/unofficialbox/box-open-elements/pull/187)),
  responding to the box-dispatch project's gaps-and-enhancements document —
  every claim verified against source before acceptance
  (`plans/dispatch-intake.md`):

  - **Accessibility fixes found during verification**: `box-table` sorting
    was mouse-only (WCAG 2.1.1) — sortable headers now wrap a real button
    with the sort state in its accessible name; `box-nav-sidebar` collapsed
    rows lost their only accessible name — labels now mirror onto
    `aria-label` and `title` while collapsed, never overwriting a
    host-authored name.
  - **`box-progress-steps` per-step status model**: optional
    `complete | blocked | failed | disabled` status (plus `statusNote`) over
    a pure exported `resolveStepStates`; currency stays derived from `value`
    and is stated separately, so a failed step can be failed *and* current
    and stays interactive while blocked/disabled are real disabled buttons
    skipped by keyboard navigation; every state in words with a polite live
    region.
  - **Form parity**: `box-select` gains `loading` ("Loading options…") and
    `empty-text` so an async load that comes back empty says so;
    `box-text-field` gains `autocomplete` passthrough (password managers
    could not classify the field through the shadow boundary) and an opt-in
    Show/Hide `reveal` for passwords.
  - **Generated global tag map** (`src/element-maps.ts`, `bun run
    maps:generate`): `HTMLElementTagNameMap` entries for every element plus
    `BoxElementTagName`, so `createElement`/`querySelector` are typed in any
    framework — the zero-dependency answer to the typed-callbacks and
    React-wrapper requests. Typed event details exported where shapes are
    stable.

- Docs-site, workshop, and gallery coverage for `box-signature-ceremony`
  (138 extracted workshop stories), under a new Signature category. Three
  variants — sequential mid-ceremony, parallel, and **declined** — because
  the declined case is the rule the component exists to enforce, and a docs
  page that only showed the happy path would leave it invisible.

- Fixed `box-signature-ceremony` telling a party their turn had not come yet
  when the ceremony had actually stopped. After a decline, everyone behind it
  read "Not yet their turn", which implies the document is still moving
  toward them; it now reads "Ceremony stopped". Building the declined variant
  is what surfaced it — the state was right, the wording was not.

- Signature ceremony status: `box-signature-ceremony`, party-oriented signing
  progress — who signs, in what order, and who can act right now.

  `resolveCeremony` is pure, so the rules that decide who may sign are
  testable on their own and a host can drive its own surface, or its reminder
  emails, from the same function rather than reimplementing the ordering and
  drifting from what the UI shows.

  Three rules in priority order. **A decline stops the ceremony** — nobody
  who has not already signed is shown as able to act, not even in parallel
  mode where they otherwise all could. That is the one worth being strict
  about: a declined document is dead until the host revives it, and inviting
  someone to sign against it wastes their time and can produce a signature on
  a document the counterparty has already refused. **Sequential grants
  exactly one turn**, to the first unsigned party, so a later party can never
  appear actionable before an earlier one has signed. **Parallel grants every
  turn at once.**

  Read-only by design: signing happens in the signature provider's own flow,
  so the component states position rather than offering a button that would
  have to duplicate that flow's authority. Every state is stated in words as
  well as colour.

- Docs-site, workshop, and gallery coverage for `box-compare-view`
  (137 extracted workshop stories), with two slotted contract sections of
  **different lengths** so the page demonstrates why the default is
  proportional rather than merely asserting it.

- Fixed `box-compare-view` ignoring a height set on the element. The frame's
  `block-size: 100%` resolved against the internal host wrapper, which had
  auto height, so the panes sized to their content, never overflowed, and the
  scroll lock had nothing to do — the component's whole purpose was inert in
  its most obvious usage. Building the docs page is what surfaced it: the
  demo scrolled nowhere.

- Synchronized-scroll comparison shell: `box-compare-view`, scroll-locked
  side-by-side panes for doc-vs-doc review — the cases the diff table cannot
  serve, where the things being compared are rendered documents rather than
  lines of text.

  `mapScrollPosition` is pure, so the mapping is testable without a layout
  engine and a host can reuse it to drive its own panes. Proportional by
  default, mapping by fraction of the scrollable range, because that is the
  only sane behaviour when the two documents are different lengths — the
  shorter one would otherwise run out long before the longer one finished.
  Absolute mode keeps the same pixel offset, for two renderings of the *same*
  document where proportional mapping would slowly drift them apart.

  The subtle part is the **feedback loop**. Scrolling the left pane sets the
  right pane's `scrollTop`, which fires the right pane's own scroll event,
  which would scroll the left pane back. Each programmatic scroll marks the
  pane it is about to move so that pane's next scroll event is swallowed —
  and the mark is dropped immediately when the assignment does not actually
  move anything (already there, or clamped at an end), since no event will
  arrive and a stale mark would swallow the user's next real scroll instead.

- Docs-site, workshop, and gallery coverage for `box-wizard-summary`
  (136 extracted workshop stories). The demo's field list is deliberately
  declared out of step order, so the page demonstrates the section ordering
  rather than merely asserting it, and the collected values include a
  `false` and an unfilled field so the "No" and the placeholder are both
  visible. Contract value carries a `format` function, which is why the
  example sets fields as a property — the documented reason that path
  exists.

- Wizard review step: `box-wizard-summary`, the card that shows everything a
  `box-form-wizard` has collected, grouped by the step that collected it,
  with a per-step Edit control.

  It is read-only and emits `edit-requested` rather than navigating itself,
  so the host stays in charge of the wizard — the same intent contract the
  other patterns use. `summarizeWizardValues` and `formatWizardValue` are
  pure, so a host can drive its own review surface from the same functions.

  Two decisions are load-bearing. Sections follow **step order**, not the
  order fields were declared, so the summary reads back in the sequence it
  was filled in. And a field naming a step that does not exist lands in a
  trailing section instead of being dropped — a review card exists so
  someone can confirm what they are about to submit, and a mistyped `stepId`
  silently hiding a row would let them confirm a value they never saw. A
  visibly odd extra section is a bug someone reports; a missing row is a bug
  nobody notices.

  Smaller things that matter: `false` renders as "No" rather than a blank,
  because a false answer is an answer and must not read as unanswered; an
  uncollected field renders a placeholder rather than an empty line; and
  each Edit control is named for its step, since five buttons all called
  "Edit" tell a screen-reader user nothing about which one goes where.

- Visual baselines are now deterministic. Three separate sources of churn
  meant a screenshot could change without the UI changing, so every regen
  needed forensic work to tell a real change from noise — the last batch
  needed a shift-scoring script to clear two images it had never touched.

  **Animations were caught mid-flight.** The spinner landed on a different
  rotation phase every run, drifting `feedback.png` for three rounds
  running. Both capture scripts now screenshot with `animations: "disabled"`,
  which rewinds animations to their first frame.

  **Section clips moved with the page.** Gallery sections were photographed
  from one tall page, and glyphs rasterise against their position in the
  viewport — so adding a row to any section shifted every section below it
  by a pixel. That is how `explorer-element.png` (12,601 pixels) and
  `specialized.png` entered the last diff untouched. Each section is now
  photographed alone, with its siblings hidden and the scrollbar gutter
  pinned, so its capture cannot depend on anything else on the page.

  **Streamed demos were captured mid-stream.** A route's ready marker says
  it rendered, not that it stopped moving: the agent-chat demo streams on a
  timer, and two runs of the same commit produced baselines 43,000 pixels
  apart — one caught mid-sentence with the caret showing. Docs-site shots
  now wait for two consecutive frames to be byte-identical before capturing.
  The gate is route-agnostic, so it also covers whatever asynchronous demo
  comes next.

  Verified empirically rather than by inspection: two full capture runs of
  an unchanged tree are byte-identical, and adding a row to one gallery
  section now changes that section's baseline **and nothing else** — where
  before the same edit moved two unrelated images.

- Docs-site, workshop, and gallery coverage for the three elements that
  landed since the last docs batch: `box-shortcuts-overlay`,
  `box-stage-path`, and `box-due-badge`. Registry entries, live examples with
  per-variant setups, Storybook stories (135 extracted workshop stories), a
  gallery row, and three docs-site shot routes.

  The shortcuts sheet is fed the **same** `clmCommands` array the command
  palette gets, which is the demonstration the component exists for — so
  `clmCommands` gained more shortcuts, written with `+` separators since that
  is what the sheet splits on to render each key as its own `<kbd>`. The
  palette's hints change with it, which is the point: one catalogue, two
  surfaces, no way to document a shortcut the palette does not offer.

  `box-shortcuts-overlay` is deliberately absent from the pixel-diff gallery.
  Like the palette it is a fixed full-viewport overlay, so mounting it there
  would cover the sheet rather than add a row to it.

- Keyboard shortcuts overlay: `box-shortcuts-overlay`, the pair to
  `box-command-palette` that makes keyboard-first real.
  It reads the **same** `CommandDescriptor[]` the palette does and lists only
  the commands that declare a `shortcut`. One catalogue driving both surfaces
  is the point: a shortcut cannot end up documented but unreachable, or
  reachable but undocumented, because there is only one place to add it.
  `groupShortcutCommands` and `splitShortcutKeys` are pure, so a host can
  render its own sheet from the same data. Keys render as `<kbd>` elements
  with the full combination as the accessible name and the `+` separators
  hidden from assistive tech.
  The `?` hotkey never fires while someone is typing — it is an ordinary
  character in every text field on the page — and never with a modifier held.
  Modal with focus trap and restore; Escape, the close button, and a backdrop
  press all dismiss.

  Three follow-up fixes from review. The typing guard read `event.target` on a
  document listener, which is retargeted to the shadow host once an event
  crosses a shadow boundary — and seventeen components here wrap a native
  input in shadow DOM, so `?` typed into a `box-text-field` saw the wrapper
  and the sheet stole the character; it reads `event.composedPath()[0]` now.
  `splitShortcutKeys` dropped a literal `+` key, so `mod++` rendered as just
  `mod` while the accessible name still announced the full combination. And
  Escape only closed the sheet while focus was still inside it, which makes a
  modal a trap the moment focus leaves.

- Two supporting micro-components from build-order slot 6.

  **`box-stage-path`** — the horizontal chevron lifecycle tracker every
  record header wants (Draft → In Review → Approved → Executed). Distinct
  from `box-progress-steps`, which is a vertical setup rail for a task the
  reader is working through: this states where a *record* sits, is read-only,
  and lives in a header. Rendered as an ordered list with the current stage
  marked `aria-current="step"` and completed stages carrying a ✓, so sequence
  and position both survive without the chevron geometry — which is
  decoration, and collapses on narrow viewports. An unknown `current` id
  leaves every stage upcoming rather than silently marking the path done.

  **`box-due-badge`** — SLA/aging urgency, stating the answer to the question
  a due badge exists for: *how late is this?* "Overdue by 3 days" rather than
  a bare date. The label always carries the urgency in words, so colour is
  never the only signal, and a supplied `label` overrides the wording but not
  the derived tone — an override must not make a breach look calm. Day counts
  are measured between UTC day boundaries, so "tomorrow" is 1 whether it is
  23 hours away or 25.

  The due-bucket engine moved to `components/feedback/due-types` and is
  re-exported from `patterns/work-queue/types`, so that public import path is
  unchanged. Patterns compose components, not the reverse. The work-queue
  keeps rendering its due column inline — it already had the affordance, and
  the duplication worth removing was the *bucketing logic*, not five lines of
  CSS; the badge exists for the surfaces that have no such column.

- Docs site + workshop pages for the three elements that landed since the
  last batch: **Command Palette**, **Notification Bell**, and **Notification
  Inbox**. Registry entries, live examples, Storybook stories (132 extracted
  workshop stories), gallery rows, and docs-site shot routes.
  The notification-inbox example ships two variants, each carrying the setup
  — the docs-site keeps live setups only when the *example* supplies the
  variants, so a page whose story has multiple variants and whose example has
  one renders an empty panel. The inbox demo also plays the *host*: because
  the element emits intents rather than mutating its own list, Mark read and
  Dismiss only take effect when something writes back, and the demo does.
  The palette example opens on load for the screenshot but deliberately does
  not reopen itself on dismiss: it is a fixed full-viewport overlay, and
  re-arming it would leave a reader unable to reach the page behind it.
  All three pages were smoke-tested headless end to end — the recency boost
  putting Review first, `cv` finding *Compare versions* by initials with two
  highlighted runs, the bell's count reaching its accessible name, and the
  inbox's host write-back dropping the unread pill from 3 to 2.

- Notification inbox: `box-notification-bell` + `box-notification-inbox`,
  the triage surface for approvals waiting, SLA breaches, and mentions.
  Toasts are transient and unordered, which is the wrong shape for work you
  have to come back to.
  The engine is pure: `groupNotifications` sections by `type`, leading with
  the most unread, then the most items, then label — so what needs attention
  rises and order never depends on input order — while inside a section
  unread lead read and then run newest first, with undated records sinking.
  `type` is an open vocabulary, humanized into headings unless the host
  supplies `type-labels`.
  The bell puts the unread count in its **accessible name** ("Notifications,
  3 unread"), not only in a badge, because a red dot alone tells a
  screen-reader user nothing; past `max` the badge abbreviates to `9+` while
  the label keeps the true number, since the abbreviation is a layout
  concession and the number is the fact. It derives the count from records
  when given them, or accepts a bare `unread-count` when the host keeps the
  list server-side.
  The inbox filters All/Unread, offers per-row Mark read / Dismiss and bulk
  Mark all read, downgrades unsafe entity hrefs to plain text, and samples
  and restores focus across rebuilds so acting on a row does not drop the
  reader to the top of the panel.
  **Mutations are intents, never local state changes**: the element never
  marks anything read on its own — the host owns the write and feeds back a
  new list, so the inbox can never disagree with the server about what has
  been seen. Server-side paging is a tracked depth limitation.

- Command palette (CLM gap 4 — the last unbuilt numbered gap in
  `plans/clm-horizontal-coverage.md`): `box-command-palette`, a
  keyboard-first action launcher over the existing overlay and listbox
  machinery. The match/rank/group engine is pure and DOM-free, so a host can
  drive its own launcher from the same functions: `matchCommands` scores an
  exact label above a prefix above a substring above a subsequence, rewards
  word starts and consecutive runs (so `cv` finds "**C**ompare **v**ersions"),
  matches hidden `keywords` without highlighting them, ranks disabled
  commands last, and breaks ties by input order rather than object identity;
  `groupCommandMatches` buckets into sections with the ungrouped section
  trailing; `splitCommandLabel` yields the highlight runs.
  The shell follows the ARIA combobox-with-listbox pattern: focus stays in
  the search input and the active option is named through
  `aria-activedescendant`, which is what lets Up/Down browse while the query
  stays editable. Arrow keys cross section headings in one flat index space
  and wrap at both ends; Home/End jump; Escape and backdrop press dismiss;
  focus returns to whatever opened it. An optional `hotkey` (`mod+k`, where
  `mod` is Cmd or Ctrl per platform) opens it globally, and the listener is
  removed on disconnect.

- Docs site + workshop pages for the two patterns that landed after the
  earlier six-pattern batch: **Agent Chat**, **Audit Log**, and **Activity
  Density**. Registry entries, live examples, Storybook stories (extracted to
  129 workshop stories), gallery rows, and docs-site shot routes.
  The examples are live rather than static: agent-chat streams a real reply
  on a timer so the preview shows the caret and a composer that stays usable
  mid-stream, then lands two citation chips and a human-in-the-loop action
  card whose Approve/Reject exist only because the demo transport implements
  `resolveAction`. The audit log ships three variants — by day, by actor, and
  drilled down to one workflow run — each with its own setup, because the
  docs-site keeps live setups only when the *example* supplies the variants;
  a page with workshop variants and a single example silently renders an
  empty surface. The gallery's agent-chat demo uses a synchronous transport
  and awaits the send before the ready flag, since that page is a pixel-diff
  baseline and a timer-driven stream would not be reproducible.
  All three pages were smoke-tested headless end to end (streamed reply with
  its cards, six day sections narrowing to three on correlation drill-down,
  and the density grid's tab stop landing on the most recent active day).

- Audit (patterns round 4i — opportunity 3 of the component roadmap): the
  aggregation, faceting, and export layer over the `box-timeline` event
  contract. `AuditEvent` *is* `TimelineEvent`, so one source feeds the flat
  feed and the audit view without a second model. The engine is pure and
  DOM-free: `groupAuditEvents` builds collapsible day/actor/action sections
  (days newest-first with a trailing undated section; actor and action
  sections by count with label tie-breaks, so order never depends on input
  order), `filterAuditEvents` applies the facets — a date-only bound covers
  the whole UTC day, and a date bound excludes undated events rather than
  implying they fall inside the window — `summarizeAuditFacets` derives
  option counts from the unfiltered set so choosing one facet can never
  empty another's list, `toAuditCsv` renders RFC 4180 output with
  spreadsheet-formula values neutralized, and `computeActivityDensity`
  builds the calendar-heatmap window.
  `box-audit-log` renders the sections with counts and actor tallies, a
  stable toolbar (group-by, actor/action facets, date range) that survives
  every content rebuild, correlation-id drill-down to one workflow run, and
  an Export CSV button that exports exactly what the filters left on screen.
  `box-activity-density` is the managerial heatmap: days with activity are
  labelled buttons in a roving-tabindex grid (arrows move by day and week),
  each emitting `day-selected` with that day's events. Day keys, day labels,
  and row timestamps are all UTC, so a viewer's timezone can never split one
  audit day across two sections. Server-side paging and row virtualization
  for production-scale logs are tracked depth limitations.

- **Security fix — protocol-relative evidence/citation hrefs.** The
  unsafe-href downgrade that guards evidence and citation chips accepted any
  value starting with `/`, which includes the protocol-relative form
  `//evil.example/x` that a browser resolves to an *external* origin (and
  `/\evil.example`, which some parsers normalize to it). An author-supplied
  record could therefore still render as an anchor to an attacker's host.
  The path branch now requires a single leading slash. The check had been
  copied into three patterns and drifted; it now lives in one internal
  module that `box-timeline`, `box-agent-chat`, and `box-audit-log` all
  import, with regression tests in each.

- Agent Chat (patterns round 4h — opportunity 1 of the component roadmap,
  the largest and most strategic gap): new `agent-chat` workflow pattern,
  shaped as a workflow rather than a widget. `AgentChatController` runs a
  streaming session over a narrow `AgentChatTransport` whose `sendMessage`
  emits typed events (`delta` / `citation` / `proposal`) through an
  `onEvent` channel, folding them into one growing agent message; `stop()`
  aborts a generation and keeps the partial reply (a stop is not a
  failure), transport failures mark the reply errored, and human-in-the-loop
  decisions route through an optional `resolveAction` capability.
  `box-agent-chat` renders the thread with role bubbles, avatars, and a
  streaming caret, plus the two card types that matter more than the
  bubbles: **citation chips** (the timeline's evidence contract, including
  its unsafe-href downgrade) emitting `citation-selected`, and **HITL
  action cards** where a proposed action is approved or rejected inline —
  the CLM "human-governed AI recommendations" requirement delivered where
  the conversation happens — with Modify surfaced as intent for the host's
  own editor. The composer sits outside the patched thread region so a
  streaming reply never disturbs what the reader is typing, and the thread
  only follows the stream when they are already scrolled to the bottom.
- Build Along: Intake Workspace — the composition lesson. Five steps
  assemble a contract-intake workspace from three independent patterns:
  the form wizard captures and validates the request, its `submitted`
  event files a work item into a work-queue transport, and the queue's
  `item-mutated` events write the timeline — none of the three patterns
  knows the others exist. Ships the full build-along treatment: cumulative
  vanilla steps with delta highlighting, live per-step previews (the
  outcome preview is fully interactive end-to-end), per-step React /
  Angular / Vue / Svelte components, and flat package entries
  (`form-wizard`, `timeline`, `diff-viewer`, `work-queue`,
  `workload-board`, `version-list`, `version-graph`, `lineage-graph`,
  `provenance-strip`) so framework imports load one element at a time.

- Lineage (patterns round 4g — opportunity 2 of the component roadmap):
  new `lineage` workflow pattern for clause provenance, pairing with the
  diff viewer. `LineageNode` reuses the git-style `parents[]` topology but
  types each link (`LineageParentLink`) with a deviation severity
  (none/minor/major) and note — the "show me every executed contract that
  deviates from clause 4.2, and what the deviation is" contract.
  `box-lineage-graph` renders the provenance DAG over the versions
  pattern's `computeVersionGraphLayout` (the shared-machinery payoff from
  round 4f) with deviation-toned SVG edges; every node is an HTML button
  emitting `node-selected` with roving arrow-key focus, and every
  derivation edge is also a per-row chip button emitting `edge-selected`
  with the parent/child pair — the diff viewer's input — so edge
  activation is keyboard-accessible without SVG hit targets.
  `box-provenance-strip` is the linear ancestry sibling for record
  headers (oldest → newest chips, newest marked current).

- Versions (patterns round 4f — CLM gap 5 + opportunity 4 of the component
  roadmap): new `versions` workflow pattern — one branch/merge history
  model, two projections. `VersionNode` carries topology through a
  `parents[]` array exactly as git does; the pure `computeVersionGraphLayout`
  assigns lanes git-network style (first child continues its parent's lane,
  siblings branch to the lowest free lane, merges release lanes for reuse)
  and degrades with warnings on malformed topology instead of throwing.
  `box-version-list` is the accessible core contract: topological
  newest-first rows with kind markers and status tones, `version-selected`,
  two-toggle compare pairing emitting `compare-requested` with the older
  side as `baseId` (feeding `box-diff-viewer` directly), and
  `can-restore`/`can-promote` gated intent events for confirm-before-apply
  hosts. `box-version-graph` renders the same model as a git network — SVG
  branch/merge curves under one HTML button per node with roving arrow-key
  focus — as progressive enhancement over the list. The layout engine is
  shared machinery for the future clause-lineage graph.

- Work Queue (patterns round 4e — opportunity 5 of the component roadmap):
  new `work-queue` workflow pattern with two projections over one headless
  session. `WorkQueueController` runs filtered, abort-superseded loads over
  a narrow `WorkQueueTransport` (`loadItems` plus optional
  claim/reassign/complete/escalate capabilities) with mutation-then-reload
  and full lifecycle events. `box-work-queue` is the individual triage
  list — rows grouped by pure due buckets (Overdue → Due today → Due this
  week → Later; deterministic via `reference-time`), risk/priority badges,
  per-row Claim/Complete/Escalate, and Reassign surfaced as a
  `reassign-requested` intent event for the host's confirm-before-apply
  flow. `box-workload-board` is the supervisor view — swimlanes by
  assignee (roster-ordered with visible spare capacity, overdue counts,
  `wip-limit` over-capacity flags) or by status (the pipeline/kanban
  projection), with a summary strip. Both elements accept an external
  `queueController` to share one session on the same page. Drag-and-drop
  lane moves are a tracked depth limitation.

- Diff viewer (patterns round 4d — CLM gap 2, the M1-critical clause
  comparison surface): new `diff` pattern with a pure, DOM-free engine —
  line-level LCS (prefix/suffix trim; a DP-size cap degrades to
  whole-replacement instead of blowing up on hostile input), similar
  removed/added lines paired into `changed` rows, word-level segments
  with whitespace coalescing, and stats plus navigable change ranges.
  `box-diff-viewer` renders `split` (side-by-side) and `inline` (unified)
  modes from one table — synchronized scrolling by construction —
  with per-document line-number gutters, `del`/`ins` word-level
  semantics, a stats chip, and prev/next change navigation emitting
  `change-focused`. Also adds `plans/component-opportunities.md`: the
  five roadmap-review opportunity areas (AI agent chat, clause lineage,
  audit aggregation, git-style version graph, work-queue family) with
  designs and the resequenced build order.

- Timeline (patterns round 4c — CLM gap 3): new `timeline` composition
  pattern, the append-only activity feed the approvals history, audit
  trail, and sidebar `activity` tab all need. `box-timeline` renders a
  tone-marked event spine from a validated `events` payload — actor,
  action, badge, summary, `<time>` timestamps, monospace correlation ids —
  with evidence chips emitting `evidence-selected` (unsafe hrefs downgrade
  from links to buttons), a `has-more` → `load-more` paging contract, and
  an optional composer gated on `composable` emitting `entry-submitted`.
  Closes the known-gaps activity-feed entry at display level; a full
  comment create/edit/delete transport contract remains future work.

- Form Wizard (patterns round 4b — first gap from the CLM horizontal
  coverage plan): new `form-wizard` workflow pattern for multi-step forms
  such as contract-intake flows. `FormWizardController` owns the step
  sequence, a value store, and per-step validation gating: Next and
  forward jumps run the step's `WizardStepValidator` (message +
  field-error contract), backward navigation and visited-step jumps never
  re-validate, optional steps skip gates, `saveDraft` emits unvalidated
  values for the host to persist, and `submit` validates every required
  step — navigating to the first failure — before emitting `submitted`.
  The `box-form-wizard` element composes `box-progress-steps` as a gated
  step rail with slot-per-step panels (a step's id doubles as its slot
  name), a `role="alert"` step-error line, and a Back/Next/Submit footer
  with an opt-in Save-draft button.

- Content Sidebar (patterns round 3d): new `content-sidebar` composition
  pattern closing the ContentSidebar entry of the catalog's known-gaps list. The
  `box-content-sidebar` element composes the catalog's `box-tabs` into the
  upstream tabbed details/activity/metadata/versions shell: hosts supply
  panels through named slots (`slot="details"` etc.), and
  `resolveSidebarTabs` shows the default tabs that actually have slotted
  content — or an explicit `tabs` configuration verbatim, including custom
  tab ids with matching slot names. `active-tab` reflects and falls back to
  the first tab when invalid, tab clicks emit `tab-changed`, a `collapsible`
  sidebar collapses its body with `collapsed-changed`, and the region is a
  labelled `complementary` landmark. The `versions` tab slot reserves space
  for the still-missing versions surface.

- Content Uploader (patterns round 3c): new `content-uploader` workflow
  pattern closing the next entry of the catalog's known-gaps list.
  `ContentUploaderController` is a headless upload queue over a narrow
  `UploadTransport` contract: constraint-validated enqueue (extension
  allowlist + max file size, `itemRejected` reasons), a concurrency-limited
  pump (default 2), per-item AbortController cancellation, retry/remove/
  clear-completed, and full lifecycle events ending in `queueDrained`.
  `createBoxUploadTransport` implements the contract with multipart
  `POST /files/content` against the Box upload host (chunked upload sessions
  are a future transport behind the same contract). The
  `box-content-uploader` element composes the existing `box-drop-zone` and
  `box-progress-bar` primitives into a drop-zone + queue surface: rows are
  rebuilt only on structural changes while progress bars are patched in
  place, with per-row cancel/retry/remove and a live summary footer.

- Content Picker (patterns round 3b): new `content-picker` workflow pattern
  closing the top entry of the catalog's known-gaps list.
  `ContentPickerController` composes the explorer headless blocks (same
  transport contract, navigation, search, pagination) with a cross-folder pick
  roster: type / extension / `maxSelectable` constraints (`isItemPickable`),
  `togglePick` with `selectionRejected` reasons (`not-selectable`,
  `limit-reached`; `maxSelectable: 1` replaces instead), and a
  `choose`/`cancel` contract emitting `chosen`/`cancelled`. The
  `box-content-picker` element renders the browse surface with a
  choose/cancel footer, live selection count, disabled non-eligible rows
  (folders stay navigable), and configurable button labels.

- Annotation lifecycle (patterns round 3): the three annotation components
  gain write paths and fixes from the patterns review. `box-annotation-thread`
  and `box-annotation-inspector` get composers (gated on a `composable`
  attribute) emitting `entry-submitted` / `reply-submitted`; replies can carry
  `id`/`createdAt`; all payload types are exported. Fixes: valid ARIA list
  semantics in the thread (ul/li/listitem), tool/color selection in the
  toolbar no longer destroys focus (in-place aria-pressed/tabindex patching),
  composer drafts and focus survive attribute updates, and annotation colors
  are validated before being interpolated into inline styles (CSS-injection
  guard).

- Preview rework (patterns round 2): the provider-adapter contract can now
  actually drive a preview engine — `mount`/`unmount` with a stable stage node
  the shell owns (`createViewer(container)` boots the real engine and returns
  a teardown), a typed `sendCommand` channel with numeric `page`/`pageCount`/
  `zoomPercent` state rendered as paging/zoom controls, and a
  `status`/`errorMessage` lifecycle rendered as a busy stage, error alert, and
  status chip. Fixes: detach + reattach no longer kills live adapter sync,
  unmount resets stale readiness, rejected provider actions surface as
  `action-error` instead of vanishing, the sidebar column collapses when
  empty, and the duplicate `provider-action` event was removed (listen to
  `action`).

- Content Explorer rework (patterns round 1 of the deep patterns review):
  headless sorting (`setSort` + transport sort params, mapped to the Box API),
  a mutation layer (`createFolder` / `renameItem` / `deleteItem` transport
  capabilities, controller methods with post-mutation refresh, and
  `itemMutated` / `mutationFailed` events), permission-gated item actions
  (`requiresPermission` on `ExplorerItemAction`, rendered disabled), abortable
  in-flight loads, and real-Box folder-metadata resolution (a metadata-less
  first page now fetches `GET /folders/:id` for the name and breadcrumb path).
  Fixes: ancestor breadcrumb clicks truncate the trail instead of reordering
  it, `disconnect()` resets to the root consistently, the composed shell no
  longer steals focus on unrelated state updates, hostile item ids are escaped,
  and the shell exposes its live controller for adapter pairing. The patterns
  catalog now carries an honest gap list vs upstream box-ui-elements
  (ContentPicker, ContentUploader, ContentSidebar, versions, comments).

- Docs-site design pass on the coral accent: the active rail item is now a
  haloed coral dot with a uniform item indent (was a coral edge bar), and
  guidance-card titles (Usage / Best practices / Keyboard) render in coral
  with the card edge bar removed. Added an opt-in `[regen-baselines]` CI
  workflow that adopts container-rendered visual baselines from the runner,
  for environments that can't run the pinned container locally.
- Added the committed conformance-program home (`docs/audits/README.md`): the
  three audits, the verdict model, current coverage, the surveyed-and-skipped
  list, and the quarterly snapshot refresh runbook (next due ≈ 2026-10-18);
  updated stale "conformant-count floor" wording now that the colour audit is
  strict-gated.
- Broadened the Layer 2 colour conformance audit to alert, breadcrumb, and chip
  (12 new claims, 60 → 72 total; CI conformant floor 55 → 63). Upstream's
  inline-alert tone palette resolves to the same tint math `alert.ts` ships as
  `color-mix()`. Surveyed but skipped for lack of a usable upstream anchor:
  datalist-item, pagination, icon-button, and the alert brand-info tone.
- Broadened the Layer 2 colour conformance audit to 4 more component families —
  select, dialog, toast, and progress-bar (15 new claims, 45 → 60 total; the
  CI conformant floor rises 41 → 55). Tabs was surveyed but box-ui-elements
  ships no tabs styling in its Storybook CSS, so it has no upstream anchor.
- Cross-referenced the Layer 2 colour conformance audit's `review` verdicts
  against the live-Box-app capture (`docs/audits/box-webapp-reference.data.json`):
  4 previously-ambiguous Storybook-vs-live-Box differences now auto-resolve to a
  confirmed `accepted-divergence`, and a genuine tooltip-text drift got fixed —
  0 `review` rows remain, so CI now gates the audit with `--strict`.
- Promoted React, Angular, Vue, and Svelte adapters to lockstep `0.1.0` release
  candidates with production package exports and one trusted-publishing train.
- Added typed `Dialog` and `useExplorerSelectionController` integrations plus
  server-rendering and hydration coverage.
- Added runnable React, Angular, Vue, and Svelte validation apps to the full CI
  gate, including Next.js and Svelte SSR hosts.
- Added Angular standalone directives and selection signal, Vue typed wrappers
  and composable, and Svelte typed wrappers and readable store.

---

## 0.5.0 — 2026-07-31

Breaking pre-1.0 feature release introducing a concise, auto-registering public
API plus runtime themes and design profiles. The release contains
[#143](https://github.com/unofficialbox/box-open-elements/pull/143) and
[#144](https://github.com/unofficialbox/box-open-elements/pull/144), with 1,114
tests and clean conformance and visual-regression gates.

**Breaking public API**

- Replaced public `Box*Element` classes and `defineBox*Element()` helpers with
  concise PascalCase exports such as `Accordion`, `Avatar`, `Button`, and
  `Switch`.
- Importing from the package root now automatically registers the complete
  `box-*` catalog. Tree-shakable component entrypoints such as
  `@unofficialbox/box-open-elements/accordion` register only their component.
- Added an idempotent static `register()` escape hatch for custom registries and
  isolated test realms.
- Removed the old Box-prefixed React adapter exports in favor of `Button`,
  `Select`, `TextField`, and concise supporting types.
- Made package imports safe during server-side rendering when `HTMLElement` and
  `customElements` are unavailable.

**Themes and design profiles**

- Added preferred typed semantic design-token names (for example,
  `surfacePrimary`, `textPrimary`, and `borderDefault`) while preserving Box's
  repetitive upstream keys as compatibility aliases.
- Added typed, persistent design profiles for runtime density, geometry,
  typography, elevation, and motion switching, with `box-default` and
  `compact-neutral` built-ins.

**Foundations**

- Added a framework-neutral theme controller with persistent `light`, `dark`,
  and `system` preferences; OS color-scheme observation; atomic design-system
  activation and token application; stale-token cleanup for custom bundles;
  scoped roots; `data-theme` / `color-scheme` synchronization; and the
  `boe:theme-change` event.
- Added `createThemeInitializationScript()` for pre-paint theme metadata in SSR
  and static shells. The docs site now uses the controller for both theme
  toggles and applies its initial theme before CSS loads.

**Documentation and tooling**

- Updated the documentation site, framework examples, Storybook, gallery,
  package guidance, and Markdown references to the concise API.
- Added the text-based `B/` favicon and refreshed the project banner and package
  presentation.
- Added public API, optimized-entrypoint, SSR, and auto-registration contract
  coverage, plus updated pinned-container visual baselines.

---

## 0.4.0 — 2026-07-21

Feature release working through the **remaining box-ui-elements audit items** —
the Medium/Low-severity behavioural gaps and the last net-new component left
after the 0.3.0 program. Additive — no breaking changes. 13 PRs
([#128](https://github.com/unofficialbox/box-open-elements/pull/128)–[#140](https://github.com/unofficialbox/box-open-elements/pull/140)),
now **78 components** and **1096 tests**; conformance 0 drift; pixel gate clean.

**Overlay primitive**

- **Fixed a latent `trackAnchor` bug** in `foundations/overlay`: an optional-call
  short-circuited its argument, so `anchorFloating` never ran without an
  `onReposition` callback — silently breaking fixed-coordinate positioning for
  both tooltip and popover. Split into compute-then-notify, with DOM regression
  coverage ([#128](https://github.com/unofficialbox/box-open-elements/pull/128)).

**New component**

- **`box-guide-tooltip`** — a guided-tour callout that points at a target (`for`
  id or slotted `anchor`), positioned on the overlay primitive; `heading`, body
  slot, `step`/`total` indicator, and Back/Next/Close controls emitting
  `next`/`back`/`close` with `detail.step`
  ([#140](https://github.com/unofficialbox/box-open-elements/pull/140)).

**Overlays**

- **`tooltip`** — moved onto the overlay primitive (escapes overflow, flips);
  `placement`, `theme` (default/error/callout), and a rich-content slot
  ([#128](https://github.com/unofficialbox/box-open-elements/pull/128)).
- **`dropdown`** — menu positioned on the overlay primitive with `placement`
  ([#129](https://github.com/unofficialbox/box-open-elements/pull/129)).

**Forms**

- **`select`** — `multiple` (native multi-select + `values` array, form-mirrored),
  option `group` (optgroup dividers), and per-option `disabled`
  ([#134](https://github.com/unofficialbox/box-open-elements/pull/134)).
- **`combobox`** — real ARIA listbox replacing the native datalist: type-to-filter,
  `aria-activedescendant` keyboard nav, group dividers, per-option descriptions,
  overlay-positioned popup (free-text still commits)
  ([#135](https://github.com/unofficialbox/box-open-elements/pull/135)).
- **`text-field`** — `type` passthrough, leading `icon` slot, trailing
  `loading`/`valid` status ([#132](https://github.com/unofficialbox/box-open-elements/pull/132)).
- **`search-field`** — `loading` spinner + form submission on Enter/submit
  ([#132](https://github.com/unofficialbox/box-open-elements/pull/132)).
- **`checkbox`** — `description` subsection ([#132](https://github.com/unofficialbox/box-open-elements/pull/132)).
- **`date-field`** — `clearable` + `clear()`; **`time-field`** — 12h/24h
  `setTimeString()` parsing + `parse-error`; **`radio-group`** — per-option
  `description`/`disabled` ([#133](https://github.com/unofficialbox/box-open-elements/pull/133)).
- **`category-selector`** — `max-links` overflow "More" menu (overlay-positioned)
  ([#137](https://github.com/unofficialbox/box-open-elements/pull/137)).

**Feedback**

- **`spinner`** `size`; **`chip`** status palette / `size` / `icon` slot;
  **`badge`** count semantics (`max`, `hide-when-zero`, `animate`)
  ([#130](https://github.com/unofficialbox/box-open-elements/pull/130)).
- **`alert`** & **`error-mask`** rich-content slots; **`help-text`** error role
  (`role="alert"`); **`toast`** declarative `duration`, `action` slot, wrapping
  ([#131](https://github.com/unofficialbox/box-open-elements/pull/131)).

**Collections & identity**

- **`avatar`** `badge` (online / external); **`carousel`** slotted slides;
  **`grid-view`** per-tile `tile-<value>` slot (slotRenderer parity)
  ([#136](https://github.com/unofficialbox/box-open-elements/pull/136)).
- **`datalist-item`** content slot + `active`; **`contact-datalist-item`**
  `external` marker + `subtitle`; **`draggable-list`** per-item `row-<value>`
  slot ([#138](https://github.com/unofficialbox/box-open-elements/pull/138)).

**Navigation & layout**

- **`link-button`** `target`/`rel` (auto-`noopener` for `_blank`) + rich children;
  **`accordion`** `borderless` + per-item `panel-<value>` slots
  ([#137](https://github.com/unofficialbox/box-open-elements/pull/137)).
- **`sidebar-toggle-button`** `direction` + action-aware tooltip; **`nav-sidebar`**
  grouped-nav styling hooks (`[data-nav-group]`, `<hr>`)
  ([#139](https://github.com/unofficialbox/box-open-elements/pull/139)).

---

## 0.3.0 — 2026-07-21

Feature release closing the **box-ui-elements coverage audit** (Steps 1–4): a
behavioural gap analysis of our catalog against `box/box-ui-elements`, then the
build-out. Additive — no breaking changes.

**Foundations (two force-multipliers)**

- **Viewport-aware overlay positioning** (`foundations/overlay`) — a shared
  `resolvePosition` / `anchorFloating` / `trackAnchor` primitive with flip,
  shift, and collision handling, exported for consumers building their own
  overlays. `popover` moved onto it (12 placements, no more edge-clipping)
  ([#116](https://github.com/unofficialbox/box-open-elements/pull/116)).
- **Shared form-field features** — `FormAssociatedElement` gains `required`
  (indicator + `aria-required`), `description` (help text + `aria-describedby`),
  and `hideLabel`; applied to text-field, date-field, search-field, and select
  ([#117](https://github.com/unofficialbox/box-open-elements/pull/117)).

**New components (5)**

- **`box-thumbnail-card`** — rich file/grid card with thumbnail + details slots;
  optional interactive (keyboard-activated) mode.
- **`box-badgeable`** — corner-badge wrapper (also closes the avatar badge gap).
- **`box-breadcrumb`** — file-path trail with overflow-collapse into an ellipsis.
- **`box-context-menu`** — right-click / Shift+F10 menu, cursor-anchored on the
  overlay primitive, full keyboard menu.
- **`box-table`** — semantic, selectable data table: single / Ctrl-click /
  Shift-range selection, keyboard model, and host-owned sortable headers
  ([#118](https://github.com/unofficialbox/box-open-elements/pull/118),
  [#119](https://github.com/unofficialbox/box-open-elements/pull/119),
  [#120](https://github.com/unofficialbox/box-open-elements/pull/120),
  [#121](https://github.com/unofficialbox/box-open-elements/pull/121)).

**Component upgrades (5, all backward-compatible)**

- **`box-tabs`** — real tab **panels** (`role=tabpanel`, slotted per option); it
  was previously only a tab strip.
- **`box-button`** — `is-loading` spinner, `icon` slot, and `type="submit"|"reset"`
  (form-associated).
- **`box-dialog`** — `size` (small/medium/large/fullscreen) + background
  scroll-lock.
- **`box-menu`** — item composition: section headers, separators, link items,
  and checkable items (`menuitemcheckbox`).
- **`box-pill-selector-dropdown`** — `allow-custom` turns it into a
  collaborator/email **token input**: type + Enter/comma to add, paste-to-create,
  and `pattern` validation with `invalid-entry`
  ([#122](https://github.com/unofficialbox/box-open-elements/pull/122)–[#126](https://github.com/unofficialbox/box-open-elements/pull/126)).

## 0.2.1 — 2026-07-20

Patch release: responsiveness fixes to two content-explorer pattern components.
The rest of the work in this window is docs-site only and does not ship in the
package.

- **`box-explorer-table` shrinks instead of overflowing its host.** Its nowrap
  header row gave it a wide min-content width, so it pushed out of grid/flex
  containers at narrow widths. `:host { min-width: 0 }` lets it shrink and the
  table scrolls within its own frame
  ([#110](https://github.com/unofficialbox/box-open-elements/pull/110)).
- **`box-filter-bar` reflows to one column when constrained.** Its media-query
  fallback measured the viewport, not the host (a shadow-DOM gotcha), so a narrow
  bar on a wide screen kept three columns and overflowed. Now uses zero grid
  track floors plus `min-width: 0`, keeping the three-up layout at natural width
  while compressing under constraint
  ([#110](https://github.com/unofficialbox/box-open-elements/pull/110)).

Docs site (not published): Community-brand restyle with a landing page
([#108](https://github.com/unofficialbox/box-open-elements/pull/108)); rail,
canvas-containment, VS Code code colours, and a masthead theme toggle
([#109](https://github.com/unofficialbox/box-open-elements/pull/109)); official
framework icons, beautified snippets, and per-lesson framework sections
([#111](https://github.com/unofficialbox/box-open-elements/pull/111),
[#112](https://github.com/unofficialbox/box-open-elements/pull/112)).

## 0.2.0 — 2026-07-19

First release cut through the automated OIDC release workflow (`0.1.0` was the
bootstrap publish that created the package; no functional code changed between
them). Notable work landed since the last changelog window:

- **box-ui-elements conformance program** — CI-gated on three axes: Layer 1
  geometry vs upstream SCSS, Layer 2 colour/state vs the compiled Storybook CSS
  (45 grounded claims, with a conformant-count floor), and a live-Box **webapp
  reference** covering colour, geometry, and interaction states.
- **Gallery-review component polish** — flat Box tree/tree-grid disclosure
  chevrons ([#92](https://github.com/unofficialbox/box-open-elements/pull/92)),
  grid-view/dual-listbox fill-width
  ([#93](https://github.com/unofficialbox/box-open-elements/pull/93)),
  item-details empty-avatar fix + chart-panel bar scaling
  ([#94](https://github.com/unofficialbox/box-open-elements/pull/94)), and real
  Box iconography in grid-view/nav-sidebar
  ([#95](https://github.com/unofficialbox/box-open-elements/pull/95)).
- **npm packaging** — scoped as `@unofficialbox/box-open-elements`, published
  via a provenance-attested **OIDC trusted-publishing** workflow (no token);
  planning docs purged and contributor + maintainer guides added
  ([#98](https://github.com/unofficialbox/box-open-elements/pull/98)–[#102](https://github.com/unofficialbox/box-open-elements/pull/102)).

---

## 2026-07-17 — React adapter, agent rules, and BUE style bridge

| PR | Summary |
| --- | --- |
| [#70](https://github.com/unofficialbox/box-open-elements/pull/70) | First real **style-bridge** library config: BUE Content Explorer SCSS → `box-content-explorer` / `::part(…)` + token hooks; engine hardening; `bun run style-bridge:bue-explorer`; 14 focused tests. |
| [#71](https://github.com/unofficialbox/box-open-elements/pull/71) | Git-derived three-day changelog and agent-takeover snapshot. |

Both PRs are merged on `main`; #70 passed Verify, Visual regression, and CodeRabbit before merge.

---

## 2026-07-16 — BUE visual conformance, density, motion, React, agent rules

### Merged PRs

| PR | Title |
| --- | --- |
| [#69](https://github.com/unofficialbox/box-open-elements/pull/69) | Always-on rule: recommend next step with why (`.cursor/rules/recommend-next-step.mdc`, `AGENTS.md`) |
| [#68](https://github.com/unofficialbox/box-open-elements/pull/68) | React adapter PoC: `@box-open-elements/react` + `Button` + `createWebComponent` |
| [#67](https://github.com/unofficialbox/box-open-elements/pull/67) | BUE drawer + denser pattern shells via `boePanel` |
| [#66](https://github.com/unofficialbox/box-open-elements/pull/66) | BUE overlays/tabs/toast/alert/badge/avatar/error-mask via `boeOverlay` |
| [#65](https://github.com/unofficialbox/box-open-elements/pull/65) | BUE visual conformance P0: geometry tokens + everyday controls |
| [#64](https://github.com/unofficialbox/box-open-elements/pull/64) | Full density peer-consistency pass + Foundations markdown tables |
| [#63](https://github.com/unofficialbox/box-open-elements/pull/63) | Motion vocabulary migration + explorer list/table presentation |
| [#62](https://github.com/unofficialbox/box-open-elements/pull/62) | Full catalog density audit — segmented-control chrome bands |
| [#61](https://github.com/unofficialbox/box-open-elements/pull/61) | Density + demo fidelity pass for docs-site surfaces |
| [#60](https://github.com/unofficialbox/box-open-elements/pull/60) | Explorer metadata-query host chrome + workshop adapter stories |
| [#59](https://github.com/unofficialbox/box-open-elements/pull/59) | Workshop batch 5: stories **64 → 101** |
| [#58](https://github.com/unofficialbox/box-open-elements/pull/58) | Docs-site Preview build-along lesson |
| [#57](https://github.com/unofficialbox/box-open-elements/pull/57) | Docs-site Share build-along lesson |
| [#56](https://github.com/unofficialbox/box-open-elements/pull/56) | Workshop batch 4: stories **49 → 64** |
| [#55](https://github.com/unofficialbox/box-open-elements/pull/55) | Explorer host chrome demo (filter-bar, saved views, list/table swap) |
| [#54](https://github.com/unofficialbox/box-open-elements/pull/54) | Coverage baseline gate + reactivate deferred foundations work |

### Highlights

- **Geometry foundations:** `boeOverlay`, `boePanel`, control sizing aligned to box-ui-elements BDL (`docs/foundations/geometry.md`).
- **Motion:** shared `boeMotionDuration` / `interactive` (140ms); maintainer script `tools/migrate-motion-literals.ts`.
- **Density:** `tools/density-audit.ts`, `tools/apply-density-consistency.ts`, report in `tmp/density-audit-report.json`.
- **Coverage gate:** `bun run verify` now runs coverage with floors — see `docs/coverage-baseline.md`.
- **Workshop:** extracted story count **108** (catalog parity including explorer adapters).
- **Build-alongs:** Explorer, Share, and Preview lessons in `docs-site/lessons.ts`.

---

## 2026-07-15 — Fidelity batches finish, explorer, docs-site, workshop, tooling

### Merged PRs

| PR | Title |
| --- | --- |
| [#53](https://github.com/unofficialbox/box-open-elements/pull/53) | Docs sync after workshop batch 3 |
| [#52](https://github.com/unofficialbox/box-open-elements/pull/52) | Workshop batch 3: JSON options/items (**34 → 49** stories) |
| [#51](https://github.com/unofficialbox/box-open-elements/pull/51) | Docs sync after #49 and #50 |
| [#50](https://github.com/unofficialbox/box-open-elements/pull/50) | Agent CI polling + stuck-run cancel/retry guidance |
| [#49](https://github.com/unofficialbox/box-open-elements/pull/49) | Workshop status sync + expand to **34** stories |
| [#48](https://github.com/unofficialbox/box-open-elements/pull/48) | Workshop guidance stories for docs-site Usage cards |
| [#47](https://github.com/unofficialbox/box-open-elements/pull/47) | Brand imagery closed (Blueprint + box-ui-elements vectors) |
| [#46](https://github.com/unofficialbox/box-open-elements/pull/46) | Token consumption vs shell guidance + API-tab inventory |
| [#45](https://github.com/unofficialbox/box-open-elements/pull/45) | Iconography generator (`bun run icons:generate`) |
| [#44](https://github.com/unofficialbox/box-open-elements/pull/44) | Docs-site Usage / Best practices / Keyboard guidance cards |
| [#43](https://github.com/unofficialbox/box-open-elements/pull/43) | Explorer search + enriched item columns + UI chrome |
| [#42](https://github.com/unofficialbox/box-open-elements/pull/42) | Design-heavy fidelity leftovers (popover, tooltip, gestures, layout) |
| [#41](https://github.com/unofficialbox/box-open-elements/pull/41) | Medium/low fidelity audit nits |
| [#40](https://github.com/unofficialbox/box-open-elements/pull/40) | Batch 7: multi-value form association + skeleton short-circuit |
| [#39](https://github.com/unofficialbox/box-open-elements/pull/39) | Batch 5: form association + invalid state |
| [#38](https://github.com/unofficialbox/box-open-elements/pull/38) | Batch 4: ARIA keyboard nav + heading semantics |
| [#37](https://github.com/unofficialbox/box-open-elements/pull/37) | Docs sync after Batches 0–3/6 |
| [#35](https://github.com/unofficialbox/box-open-elements/pull/35) | Batch 3: focus-visible + hover/active/disabled helpers |
| [#33](https://github.com/unofficialbox/box-open-elements/pull/33) | Batch 1 complete: all catalog/pattern elements on `BaseElement` |
| [#32](https://github.com/unofficialbox/box-open-elements/pull/32) | Form/action components → `BaseElement` architecture |
| [#31](https://github.com/unofficialbox/box-open-elements/pull/31) | Batch 1: render helper + focus/input fidelity (button, checkbox, radio-group) |

### Fidelity program (completed)

| Batch | Scope |
| --- | --- |
| 0 | Security: 3 injection/XSS fixes (link-button, skeleton, content-explorer) |
| 1 | `BaseElement` render contract across full catalog |
| 2 | Dark-mode `color-mix(…, white)` → token surfaces (94 files) |
| 3 | Shared interaction-state CSS helpers |
| 4 | ARIA/keyboard + native heading semantics |
| 5 | `FormAssociatedElement` on 13 everyday controls |
| 6 | `title` → `heading`, broken examples, token labels |
| 7 | Multi-value form association polish |
| + | Medium/low nits (#41), design-heavy leftovers (#42) |

Audit driver scored 109 components against the reference.

---

## 2026-07-14 — CI, deploy, fidelity audit kickoff, build-alongs

### Merged PRs (#21–#30)

Infrastructure and early fidelity work shipped via the design-system rebuild series:

| PR | Theme |
| --- | --- |
| #21–#28 | Storybook workshop, docs-site shell, build-along scaffolding, theming QA |
| [#29](https://github.com/unofficialbox/box-open-elements/pull/29) | Fidelity Batches 0, 2, 6 + audit follow-ups |
| [#30](https://github.com/unofficialbox/box-open-elements/pull/30) | GitHub Pages deploy (`bun run site:build` → `docs-site/dist`) |

### Highlights

- **Component fidelity audit** harness + report (all 109 components).
- **CI visual regression:** pinned Playwright container, pixel-diff gate (`bun run test:regression:pixel`).
- **Docs-site:** deployable static site, variant dropdown, in-shell foundation markdown, Explorer build-along lesson.
- **Design QA:** token-driven focus rings and status pills.

---

## Contributors (git shortlog, 2026-07-14 – 2026-07-17)

| Commits | Author |
| ---: | --- |
| 34 | Kyle @ Unofficial Box |
| 16 | Cursor Agent |
| 5 | cursor[bot] |

---

## Verification commands (unchanged)

```bash
bun run verify          # typecheck + coverage-gated tests + build
bun run test:regression:pixel   # CI pixel gate locally (Docker)
bun run style-bridge:bue-explorer   # BUE Content Explorer bridge
```

See `AGENTS.md`, `BACKLOG.md`, and `docs/HANDOFF.md` for ongoing orientation.
