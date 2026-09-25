# Agent UI building blocks

All new surfaces use the existing import contract: concise root exports or
individual entrypoints such as `@unofficialbox/box-open-elements/run-summary`.
The four framework packages remain thin optional adapters; the new elements
can be used directly or composed from their headless contracts.

## Status and results

`foundations/status` exports `toStatusKind`, `statusLabel`, `boeStatusGlyph` and
`boeStatusStyles` and `boeStatusDocumentStyles`. `StatusIcon` renders a decorative
16px circle plus a hidden label; set `label` to override its spoken name.
Use the same vocabulary for trace, todo, verdict and approval states.

`approved` and `rejected` retain their own labels and neutral, outlined glyphs;
they never map to `done` or `skipped`. An approved action can still fail during
execution. Keep the decision and execution outcome separate.

Error Toasts remain visible until explicitly dismissed or replaced, even when
the caller supplies a timeout. Non-error Toasts can expire; `duration="0"` and
`mode="sticky"` prevent expiry. Recovery guidance belongs inline as well, not
only in a dismissible notification.

`ResultBlock` is a serializable union of `facts`, `checks`, `table` and
`documents`. `ResultBlocks.blocks` renders any sequence, using an optional
block `id` for stream updates. Set `ResultBlocks.labels` for host verdict
language and `title-style="eyebrow"` for quieter headings. `FactList.rows`,
`CheckList.rows`, and `DocumentList.items` offer standalone forms. Tables
scroll within a focusable region. Unlinked documents are static unless
`selectable-documents` is set; safe URLs open in a new tab with an external
marker and spoken suffix (customizable with `link-suffix`). Selectable rows
emit `document-selected` with `{ id }`.
`resultDocumentIds(blocks)` and `ResultBlocks.documentIds` support citation
deduplication. Never place tokens or private URLs in a public demo.

## Run summary

```ts
import { RunSummary } from "@unofficialbox/box-open-elements/run-summary";
const summary = new RunSummary();
summary.turn = {
  startedAt: Date.now(), steps: [],
  todos: [{ id: "extract", content: "Extract terms with Box AI", status: "in_progress" }],
};
document.body.append(summary);
```

`turn` contains `steps`, `todos`, `startedAt` and optional `endedAt`/`incomplete`.
`incomplete` may be a reason string. With no steps or todos, the settled line
is static rather than a disclosure. Nested traces use `variant="plain"`, with
their parts re-exported as `trace-*`; step sources have their own part and
step durations use the same formatter as the summary.
Set `failed` for a failed turn. `open` defaults to false; `elapsed-threshold`
defaults to 2000ms. The live status label excludes the ticking clock.
`progress`, `formatElapsed` and `splitStepTitle` are pure helpers exported from
`patterns/run`. Timers stop on completion and disconnect.

## Chat stream contract

`AgentSendRequest.messageId` identifies the reply receiving callbacks. IDs are
unique within a controller; use a conversation ID as well across controllers.
`AgentStreamEvent` retains `delta`, `citation`, and `proposal`, and adds:

| kind | Payload | Message field |
| --- | --- | --- |
| `block` | `block: ResultBlock` | `blocks` (same optional ID replaces) |
| `trace` | `step: RunStep` | `trace` (same ID replaces) |
| `todos` | `todos: AgentTodo[]` | `todos` (snapshot) |
| `options` | `options: {label, prompt}[]` | `options` (snapshot) |
| `context` | `context: Record<string, unknown>` | `context` |
| `done` | `status: complete / needs_input / error` | `completeness` |

Optional `seq` starts at 1. Duplicate sequence numbers are ignored. Missing
numbers, invalid sequence values, or a missing `done` produce `completeness.status = "incomplete"` and
`missing[]`. Old transports still finish normally but now show an honest
incompleteness notice until they emit `done`. Messages also carry numeric
`startedAt`/`endedAt` timestamps in milliseconds. `readNdjson(stream)` handles
chunked UTF-8 and CRLF. An `onInvalidLine(line, error)` callback can return
`"skip"` for malformed JSON; without it, malformed JSON throws. Oversized
lines and invalid UTF-8 still throw. The reader releases on completion, error,
cancellation, or early iterator return.

`AgentActionProposal.outcome` is `done` or `failed`, separate from `decision`.
`details` can show result IDs or links below a decided action. Safe links open
in a new tab; unsafe URLs remain text. Set `hide-modify` if the host does not
offer an editor. A failed `resolveAction` rejects and puts `resolveError` on
the affected proposal for an inline alert.
The controller exposes `resolving` while awaiting a decision and suppresses
duplicate submissions. Failed approved actions render an alert and a retry of
the originating request; success suggestions are suppressed. Supply
`resolveAction(id, decision, note?, messageId?)` when proposal IDs repeat across
turns. `AgentChat.focusProposal(messageId, proposalId)` provides a scoped
anchor; `focusComposer()` uses `preventScroll`.

`ScrollPinController` is reusable for live lists. Call `connect(content)` with
an inner content element for resize observation, `contentChanged(true)` for a
new message, and `disconnect()` on teardown. Upward wheel/touch/keyboard or
scrollbar-gutter drag unpins; passive scroll events do not. `behind` becomes
true only when content grows while unpinned; `jump()` re-pins and
honours reduced motion.

## Workspace

`AgentWorkspaceController(createSession)` owns independent chat controllers.
The factory receives `(id, seed?)`. `newChat()` reuses an untouched chat,
`restore(id, seed?)` adds a persisted conversation, `remove(id)` can be undone
with `restore(id)`, `select(id)` keeps other sessions alive, and `destroy()`
tears down owned controllers. `summaries` exposes word-cut
titles and waiting/working status. `details` exposes context, approvals with
message IDs, and deduplicated sources in first-seen order.

Assign it to `AgentWorkspace.workspaceController`. `header`, `chats`,
`conversation`, and `details` slots allow host compositions. `hide-toggles`
suppresses the default controls; `open(pane, boolean)` and `toggle(pane)` let
hosts control panes. `pane-change`, `chats-change`, and
`conversation-selected` events report state. Default conversations remain
mounted while hidden, preserving their controllers and scroll positions, but
are not created when the `conversation` slot is filled.
At widths below 900px, side panes become mutually exclusive drawers. At wide
widths, `viewer-key` scopes persisted pane preferences; details starts open at
1200px. Storage failures fall back to in-memory defaults.

The docs and workshop share five simulated scenarios: Overview, Streaming,
Approval, Failure and Empty. Run scenario streams a delayed response; switching
conversations does not interrupt it. Approval deliberately demonstrates an
approved action that fails execution, while rejection makes no change. Sources
have no live file links. No provider requests or writes occur.

Use **Expand workspace** for the full three-pane layout (at least 1200px wide);
the normal docs column demonstrates drawers. Escape or Exit expanded view
returns to the page. Fullscreen availability depends on the browser. The demo
returns a teardown callback that detaches the host, aborts pending streams and
destroys every owned session on navigation or variant changes. The Code tab
shows the same ownership pattern for a host-supplied transport and token.

## Developer call console

Place `CallConsole` on a separate developer page. Assign a
`CallConsoleController(transport)` and call `connect()`. The optional
`createCallConsoleTransport("/calls")` adapter uses:

- `GET /calls`: `CallEntry[]` snapshot.
- `GET /calls/stream`: SSE named `snapshot`, `call`, `clear`; each data payload
  is a matching `CallEvent` object. Bare event payloads are also accepted.
  Same IDs replace pending entries.
- `DELETE /calls`: clear, returning 204.

The console filters by service/errors, distinguishes `rpcError` from HTTP
success, provides a keyboard-resizable split view, and copies HTTP text with a
textarea fallback. Hosts own controller connection lifetimes.
Use `heading`, `hide-heading`, and `serviceLabels` for host language;
`isFailed(entry)` overrides failure classification. `CallConsoleController`
keeps the newest 300 entries by default; pass `maxEntries` to change the cap.

Search matches method, URL, summary and service. Arrow Up/Down and Home/End
select requests while focus is in the list; Tab reaches filters and copy
controls. The panes stack at container widths below 640px. Empty, filtered-empty,
connecting, reconnecting and unavailable states are explicit; Reconnect retries
the controller. Failed clear requests retain the existing calls and report an
error. Copy controls are unavailable without a selected request.

Events: `call-selected` carries only `{ id }`; `filters-changed` carries
`{ service, errorsOnly, query }`; `calls-cleared` follows a successful clear.
Section copies emit the shared `code-copied` event. Selection events deliberately
exclude headers and bodies. Requests must already be redacted by the server;
this inspector is not an authorization boundary.

The docs/workshop demo is labeled simulated. It includes successful Box calls,
a failed tool under HTTP 200, an HTTP 403, an expected MCP 405 and a pending
request. Simulate request inserts and settles a request; Reset demo restores
the fixtures. Variants cover empty and connection states. No demo requests go
to a real provider, and teardown cancels the simulated stream.

The private server package exports `CallLog`, `loggedFetch`, redaction helpers
and `createCallLogHandler(log, authorize)`. Mount only behind developer access
control. Authorization and cookies, token/secret JSON fields, OAuth codes and
URL credentials are redacted before log emission. Unknown text bodies are
omitted; capture is bounded to 1MiB. GET event streams are not consumed.
Pass `{mcp: true}` as the fourth `loggedFetch` argument to classify GET/DELETE
405 responses as expected. Generic HTTP 405 responses remain failures.
JSON-RPC errors and `isError: true` tool results count as failures even on 2xx.

```mermaid
sequenceDiagram
  participant Host
  participant Session as AgentChatController
  participant Transport
  participant UI as AgentChat
  Host->>Session: send(body)
  Session->>Transport: sendMessage(messageId, onEvent, signal)
  Transport-->>Session: delta / block / trace / proposal / done
  Session-->>UI: messagesChanged
  UI->>Session: resolveAction(proposalId, decision, messageId)
  Session->>Transport: resolveAction
  Transport-->>Session: decision and outcome
  Session-->>UI: actionResolved
```
