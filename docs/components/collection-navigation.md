# Collection navigation and host content

Carousel dots keep their native button identity by slide position while current
names and active state refresh, in JSON and slotted modes. Removed dots receive
no replacement focus; caller focus handoffs remain authoritative. Arrow keys in
slotted form controls, contenteditable areas and editing widgets remain native.
The inactive default viewport consumes no space when slotted slides are present.

Every DraggableList handle is tabbable, so Tab/Shift+Tab choose the item before
ArrowUp/ArrowDown or Home/End reorder it. Existing move keys, pointer behavior,
reorder payloads and announcements retain their contracts.

DatalistItem ignores whitespace-only text and comments when deciding whether
host content replaces the fallback label/meta. Actual elements and nonempty text
remain authored content. Direct text changes are observed while connected, and
reconnection resolves current content without accumulating observers/listeners.

Run the repeatable synthetic native fixture in the pinned Firefox container:

```bash
DOCKER_DEFAULT_PLATFORM=linux/amd64 bash tools/preview/container-run.sh \
  'bun run build:core && BOE_NAVIGATION_BROWSER=firefox BOE_NAVIGATION_EVIDENCE_DIR=/work/.regression-tmp/collection-navigation node tools/preview/collection-navigation.mjs'
```

`BOE_NAVIGATION_BROWSER=chrome` and optional `BOE_NAVIGATION_CHROME_PATH` run the
same Chrome cases. The fixture checks actual caret/range editing, Tab choice,
repeated native actions, visible fallback/layout, removal, reconnect and focus
handoff in containing roots.
