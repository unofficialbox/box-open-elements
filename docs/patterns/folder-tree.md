# Folder tree and structural diff

Import `FolderTree` / `FolderTreeDiff` from the root, `/folder-tree`,
`/folder-tree-diff`, or `/patterns/folder-tree`. React wrappers are available
from the React package and its matching flat entries. Native element property
and event declarations support React JSX, Vue, Angular, Svelte, Solid and Preact.

These read-only surfaces consume a flat `nodes` snapshot with unique `id`s,
optional `parentId`, `name` and `type` (`folder`, `file`, `web_link`, `other`).
Parents may appear after children. Missing parents render as roots; cycles and
duplicate IDs throw before replacing the current snapshot. Replace snapshots
rather than mutating objects. No component fetches, authenticates, matches,
detects moves, routes, or reads file contents.

```ts
import { FolderTree } from '@unofficialbox/box-open-elements/folder-tree';
const tree = document.createElement('box-folder-tree');
tree.label = 'Project folders';
tree.nodes = [{ id: 'projects', name: 'Projects', type: 'folder',
  hasChildren: true, loadState: 'unloaded' }];
tree.addEventListener('load-children', async ({ detail: { id } }) => {
  // Host owns cancellation, stale-request protection, pagination and errors.
  // Write loadState:'loading', then replace nodes with fetched children and
  // loadState:'loaded' (or 'partial', 'error', 'unavailable').
});
document.body.append(tree);
```

`expandedIds`, `selectedIds`, and `activeId` accept authoritative host state.
User interaction updates state and emits `expanded-changed` (`id`, `node`,
`expanded`, `expandedIds`), `selected-changed` (`id`, `node`, `selectedIds`),
`active-changed` (`id`, `node`) and `item-activated` (`id`, `node`). Host writes
are silent. A host may synchronously echo or reject intent. Selection is single;
`selectionDisabled` disables it. External active changes move focus only when
focus is already within the tree. Data replacement keeps rows keyed by ID.

Expanding an unloaded, partial or failed branch emits `load-children` once per
attempt. Collapse and expand retries; loading/unavailable branches do not request
again. A load-state or count transition clears the request guard. Hosts writing
expansion directly own initiating their loads. `hasChildren` allows unknown
children; `childCount` is the host's direct child count, never an inferred total.
`partial` marks incomplete snapshots. Per-node `loadState` marks incomplete
branches. Counts and filtering describe loaded items only.

`filter` performs case-insensitive name matching, retaining and opening ancestors.
Clearing it restores the stored expansion. Closed descendants are omitted from
DOM; indexing and visible traversal are iterative. Fully expanded large snapshots
still render all visible rows; host pagination bounds this cost.

Use `status`, `description`, and `metadata` strings for supplementary row text.
Slots `status-${id}`, `metadata-${id}`, and `actions-${id}` allow host content.
Keep actions read-only and label them with their row context. Host actions own
their keyboard handling. Style through `::part(item)`, `content`, `name`, `icon`,
`disclosure`, `description`, `metadata`, `status`, `state`, `actions`, and `tree`.
All text is inserted as text; IDs are never interpolated into selectors or HTML.

## Structural diff

A `FolderTreeDiffNode` extends the tree node with `path`, required `status`
(`equal`, `changed`, `added`, `removed`, `moved`), optional `before` / `after`
(`name`, `path`, metadata record), and `hasChangedDescendants`.
The host supplies the complete structural comparison, including one-sided
children under removed/added folders. `metadata` is the optional formatted
summary; metadata records are retained for host detail panels without guessing
how arbitrary fields should be formatted.

```ts
const diff = document.createElement('box-folder-tree-diff');
diff.leftLabel = 'Source'; diff.rightLabel = 'Destination';
diff.mode = 'side-by-side'; // or 'unified'
diff.nodes = [
  { id:'root', name:'Projects', path:'/Projects', type:'folder', status:'equal' },
  { id:'new', parentId:'root', name:'Brief.pdf', path:'/Projects/Brief.pdf',
    type:'file', status:'added' },
];
diff.addEventListener('selected-changed', event => showDetails(event.detail.node));
```

Changed ancestors open on initial/new-node snapshots unless the host supplied
`expandedIds`. User collapses persist on repeated snapshots. `changesOnly` keeps
changed nodes plus ancestor context; its button emits `changes-only-changed`.
Counts cover the loaded snapshot; `partial` prefixes them with “Loaded items”.
`nextDifference(1 | -1)` and the named Previous/Next controls cycle through loaded
name-matching differences, opening ancestors and emitting `difference-navigated`.
One treeitem represents both sides; absent cells say “Not present”. Moved rows
show source and destination paths. Color supplements visible status text.

## Keyboard, themes and responsive QA

One roving tab stop exposes tree/treeitem roles, level, expanded/selected/busy,
and sibling position/size. Up/Down move visible rows, Home/End reach their ends,
Right expands or enters children, Left collapses or returns to parent, Enter
activates, Space selects. Collapse/filter/removal recovers focus to a surviving
ancestor or first visible row; empty trees retain a focusable tree container.
Live status announces loading, errors, partial coverage and result counts.

Docs-site examples include mixed file/folder trees and unified/side-by-side
comparisons with every status and partial branches. Use the docs theme switch
at **1440px** and **390px**; rows wrap and indentation is visually capped at deep
levels while ARIA retains the actual depth. Compare modes share row height.
Manual screen-reader verification is separate from automated semantics/axe tests
and remains pending until a person records the screen reader, browser and flows.

A future heatmap can reuse these IDs and hierarchy with a separate host adapter
for a folder child list or metadata-query result. Keep direct versus recursive,
file versus folder, total versus query-match counts and loaded-page versus
complete coverage explicit in that adapter; they are not extra tree state.
