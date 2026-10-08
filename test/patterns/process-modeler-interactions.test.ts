import { afterEach, describe, expect, it, vi } from "vitest";
import { ProcessModeler, routeProcessLine, lineMidpoint, type ProcessProjection } from "../../src/patterns/process-modeler/index.js";

const projection: ProcessProjection = {
  boxes: [
    { id: "a", node: {}, title: "Read", kind: "call", path: ["steps", 0], fingerprint: "read" },
    { id: "b", node: {}, title: "Save", kind: "call", path: ["steps", 1], fingerprint: "save" },
    { id: "c", node: {}, title: "Log", kind: "call", path: ["steps", 2], fingerprint: "log" },
  ],
  lines: [{ id: "ab", from: "a", to: "b" }],
};
function fixture() {
  const builder = new ProcessModeler(); builder.document = structuredClone(projection);
  builder.catalog = [{ kind: "call", label: "Call", create: () => ({}) }];
  document.body.append(builder);
  const root = builder.shadowRoot!;
  return { builder, root, canvas: root.querySelector<HTMLElement>('[part=canvas]')! };
}
function pointer(target: Element, type: string, x: number, y: number, extra = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { clientX: x, clientY: y, pointerId: 1, button: 0, ...extra }); target.dispatchEvent(event);
}
afterEach(() => document.body.replaceChildren());
describe("Process Modeler prototype interactions", () => {
  it("loads fingerprint positions, selects by nested field path, and versions graph changes", () => {
    const { builder } = fixture(); const changes = vi.fn(); builder.addEventListener("projection-changed", changes);
    builder.load(structuredClone(projection), { version: 7, positions: { '["steps",0]': { fingerprint: "read", position: { x: 100, y: 90 } } }, selectedPath: ["steps", 0, "title"] });
    expect(builder.layout.boxes.a.x).toBe(100); expect(builder.selectedPath).toEqual(["steps", 0]); expect(builder.version).toBe(7);
    builder.document = { ...projection, boxes: projection.boxes.map(box => ({ ...box, title: `${box.title}!` })) };
    expect(builder.version).toBe(8); expect(changes).toHaveBeenCalledTimes(2);
    builder.refresh(); expect(changes).toHaveBeenCalledTimes(2);
  });
  it("lets the host own read-back checks and only announces readable versions", () => {
    const { builder, root } = fixture();
    const readable = vi.fn(); const raw = vi.fn();
    builder.addEventListener("readable-projection-changed", readable);
    builder.addEventListener("projection-changed", raw);
    builder.model = { project: document => document, validate: () => [{ boxId: "a", message: "Host cannot read this drawing" }] };
    expect(root.querySelector('[data-box-id=a]')?.getAttribute("data-invalid")).toBe("true");
    expect(readable).not.toHaveBeenCalled();
    // Changing only the validation policy does not invent a new graph version.
    expect(raw).not.toHaveBeenCalled();
    builder.model = { project: document => document, validate: () => [] };
    expect(root.querySelector('[data-box-id=a]')?.getAttribute("data-invalid")).toBe("false");
    expect(readable).toHaveBeenCalledTimes(1);
    builder.refresh();
    expect(readable).toHaveBeenCalledTimes(1);
    expect(builder.readback.current).not.toBeNull();
    builder.setValidation([{ boxId: 'a', message: 'Fix this path' }]);
    expect(builder.readback.current).toBeNull();
    expect(builder.readback.lastReadable).not.toBeNull();
    expect(root.querySelector('[part=hold]')!.hasAttribute('hidden')).toBe(false);
    root.querySelector<HTMLButtonElement>('[part=hold] button')!.click();
    expect(root.querySelector<HTMLButtonElement>('#process-tab-checks')!.getAttribute('aria-selected')).toBe('true');
  });
  it("supports path selection before connection to the DOM", () => {
    const builder = new ProcessModeler(); builder.document = structuredClone(projection); builder.selectedPath = ["steps", 1];
    document.body.append(builder); expect(builder.selected?.id).toBe("b");
  });
  it("emits detached position snapshots for move and undo", () => {
    const { builder } = fixture(); const positions = vi.fn(); builder.addEventListener("positions-changed", positions);
    builder.move("a", 180, 90); expect(positions.mock.calls[0][0].detail.positions.find((p: { id: string }) => p.id === "a").position.x).toBe(180);
    positions.mock.calls[0][0].detail.positions[0].position.x = 999;
    expect(builder.layout.boxes.a.x).toBe(180); builder.undo(); expect(positions).toHaveBeenCalledTimes(2);
  });
  it("uses current group semantics and toggles selection through the outline", () => {
    const { builder, root } = fixture(); builder.select("a");
    const box = root.querySelector('[data-box-id=a]')!;
    expect(box.getAttribute("role")).toBe("group"); expect(box.getAttribute("aria-current")).toBe("true"); expect(box.hasAttribute("aria-selected")).toBe(false);
    const outline = root.querySelectorAll<HTMLButtonElement>('[part=outline-list] button'); outline[1].click(); expect(builder.selected?.id).toBe("b");
    expect(root.querySelector('[part=selection-toolbar]')!.getAttribute('aria-label')).toBe("Selected steps");
  });
  it("shows host variables/connections and supports roving detail tabs", () => {
    const { builder, root } = fixture(); builder.connections = [{ name: "Box", kind: "OAuth" }]; builder.variables = [{ name: "fileId", description: "Input" }];
    const tabs = root.querySelectorAll<HTMLButtonElement>('[role=tab]'); tabs[2].click(); expect(root.querySelector('[part=pane-content]')!.textContent).toContain("fileIdInput");
    tabs[2].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })); expect(tabs[3].getAttribute("aria-selected")).toBe("true");
    expect(root.querySelector('[part=pane-content]')!.textContent).toContain("Box (OAuth)");
    tabs[4].click(); expect(root.querySelector('[part=pane-content]')!.textContent).toContain("Shift+drag");
  });
  it("uses host checks instead of generic vocabulary checks, with links back to the box", () => {
    const { builder, root } = fixture(); builder.model = { project: doc => doc, validate: () => [{ boxId: "b", message: "Supply a connection" }] };
    builder.document = { ...projection, lines: [...projection.lines, { id: "ba", from: "b", to: "a" }] };
    expect(root.querySelector('[part=checks]')!.textContent).not.toContain("loop"); expect(root.querySelector('[part=checks]')!.textContent).toContain("Supply a connection");
    const button = [...root.querySelectorAll<HTMLButtonElement>('[part=checks] button')].find(button => button.textContent === "Supply a connection")!;
    button.click(); expect(builder.selected?.id).toBe("b");
  });
  it("opens a directional kind chooser from a keyboard port", () => {
    const { builder, root } = fixture(); const requests = vi.fn(); builder.addEventListener("process-edit-request", requests);
    const chooser = root.querySelector<HTMLDialogElement>('[part=insert-chooser]')!;
    chooser.showModal = vi.fn(() => { chooser.open = true; });
    root.querySelector<HTMLButtonElement>('[data-owner=a][data-side=east]')!.click();
    expect(root.querySelector<HTMLDialogElement>('[part=insert-chooser]')!.open).toBe(true);
    expect(root.querySelector('[part=ghost-box]')?.textContent).toBe('New step');
    root.querySelector('box-kind-picker')!.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
    expect(requests.mock.calls[0][0].detail).toMatchObject({ type: "add", from: "a", fromSide: "east", kind: { kind: "call" } });
  });
  it("names the narrow building-block drawer and focuses search when it opens", () => {
    const { root } = fixture();
    const drawer = root.querySelector<HTMLDialogElement>('[part=pane-drawer][data-pane=palette]')!;
    drawer.showModal = vi.fn(() => { drawer.open = true; });
    const title = drawer.querySelector<HTMLElement>('[part=pane-title]')!;
    expect(title.textContent).toBe("Add to the process");
    expect(drawer.getAttribute("aria-labelledby")).toBe(title.id);
    root.querySelector<HTMLButtonElement>('[data-command=palette]')!.click();
    expect(drawer.open).toBe(true);
    expect(root.activeElement).toBe(drawer.querySelector('[part=search]'));
    expect(drawer.querySelector('[part=pane-close]')?.getAttribute('aria-label')).toBe('Close building blocks');
  });
  it("supports the design keyboard model and keeps chooser search focused", () => {
    const { builder, root, canvas } = fixture();
    builder.layout = { boxes: { a: { x: 0, y: 0 }, b: { x: 320, y: 0 }, c: { x: 320, y: 200 } } };
    builder.select('a');
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true, cancelable: true }));
    expect(builder.selected?.id).toBe('b');
    const before = builder.layout.boxes.b.x;
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true, cancelable: true }));
    expect(builder.layout.boxes.b.x).toBe(before + 64);
    const chooser = root.querySelector<HTMLDialogElement>('[part=insert-chooser]')!;
    chooser.showModal = vi.fn(() => { chooser.open = true; });
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true, cancelable: true }));
    expect(chooser.open).toBe(true);
    const picker = chooser.querySelector('box-kind-picker')!;
    expect(picker.shadowRoot!.activeElement).toBe(picker.shadowRoot!.querySelector('[part=search]'));
  });
  it("supports host-authored nested outlines and a validated 25–200% view", () => {
    const { builder, root } = fixture();
    builder.processTitle = 'Upload round trip'; builder.processSummary = '3 steps';
    builder.outline = [{ title: 'Prepare', children: [{ title: 'Read file', description: 'Gets a file', boxId: 'a' }] }];
    expect(root.querySelector('[part=process-heading]')!.textContent).toContain('Upload round trip');
    expect(root.querySelector('[part=pane-content]')!.textContent).toContain('Gets a file');
    root.querySelector<HTMLButtonElement>('[part=outline-list] button')!.click(); expect(builder.selected?.id).toBe('a');
    builder.setView({ x: 12, y: 24, zoom: 0.7 }); expect(builder.view).toEqual({ x: 12, y: 24, zoom: 0.7 });
    builder.setView({ x: 0, y: 0, zoom: 2.1 }); expect(builder.view.zoom).toBe(0.7);
  });
  it("draws host field descriptors and sends controlled changes back to the host", () => {
    const { builder, root } = fixture(); const changes = vi.fn(); const edits = vi.fn();
    builder.addEventListener('process-field-change-request', changes);
    builder.addEventListener('process-edit-request', edits);
    builder.fields = { a: [{ key: 'action', label: 'Box action', kind: 'search', value: 'Upload file', options: [{ value: 'Upload file', label: 'Upload file' }] }, { key: 'retry', label: 'Retry', kind: 'boolean', value: false }] };
    builder.select('a');
    const input = root.querySelector<HTMLInputElement>('[part=editor] [data-field=action]')!;
    expect(input.getAttribute('list')).toBeTruthy(); input.value = 'Download file'; input.dispatchEvent(new Event('change'));
    expect(changes.mock.calls[0][0].detail).toMatchObject({ boxId: 'a', key: 'action', value: 'Download file' });
    root.querySelector<HTMLButtonElement>('[part=inspector-actions] button')!.click();
    expect(edits.mock.calls[0][0].detail).toMatchObject({ type: 'duplicate', sourceId: 'a' });
  });
  it('browses grouped actions and searches all actions with combobox semantics', () => {
    const { builder, root } = fixture(); const changes = vi.fn(); builder.addEventListener('process-field-change-request', changes);
    builder.fields = { a: [{ key: 'action', label: 'Box action', kind: 'action', value: 'files.upload', options: [
      { value: 'files.upload', label: 'Upload file', group: 'Files' },
      { value: 'files.download', label: 'Download file', group: 'Files' },
      { value: 'users.get', label: 'Get user', group: 'Users' },
    ] }] };
    builder.select('a');
    const input = root.querySelector<HTMLInputElement>('[data-field=action]')!;
    expect(input.getAttribute('role')).toBe('combobox');
    root.querySelector<HTMLButtonElement>('[part=action-caret]')!.click();
    expect(input.getAttribute('aria-expanded')).toBe('true');
    root.querySelector<HTMLButtonElement>('[part=action-group]')!.click();
    expect(root.querySelectorAll('[part=action-option]')).toHaveLength(2);
    input.value = 'download'; input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(root.querySelectorAll('[part=action-option]')).toHaveLength(1);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(changes.mock.calls[0][0].detail).toMatchObject({ boxId: 'a', key: 'action', value: 'files.download' });
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });
  it("draws a connection by dragging a port, but cancellation never edits", () => {
    const { builder, root, canvas } = fixture(); const requests = vi.fn(); builder.addEventListener("process-edit-request", requests);
    const from = builder.layout.boxes.a, to = builder.layout.boxes.b;
    pointer(root.querySelector('[data-owner=a][data-side=east]')!, 'pointerdown', from.x + 220, from.y + 48);
    pointer(canvas, 'pointermove', to.x + 20, to.y + 20); expect(root.querySelector('[part=connection-preview]')).not.toBeNull();
    expect(root.querySelector('[part=connect-tooltip]')?.textContent).toBe('Connect to Save');
    pointer(canvas, 'pointerup', to.x + 20, to.y + 20); expect(requests.mock.calls[0][0].detail).toMatchObject({ type: "connect", from: "a", to: "b", fromSide: "east" });
    expect(root.querySelector('[part=connect-tooltip]')).toBeNull();
    pointer(root.querySelector('[data-owner=a][data-side=south]')!, 'pointerdown', 150, 130);
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    pointer(canvas, 'pointerup', to.x + 20, to.y + 20); expect(requests).toHaveBeenCalledTimes(1);
    expect(root.querySelector('[part=status]')?.textContent).toBe('Connecting cancelled');
    expect(root.querySelector('[part=status]')?.getAttribute('role')).toBe('status');
    expect(root.querySelector('style')?.textContent).toContain('[part=sr-only], [part=status]');
  });
  it("selects a marquee and aligns/spaces the selected group with undo", () => {
    const { builder, root, canvas } = fixture(); const before = builder.layout;
    pointer(canvas, 'pointerdown', 0, 0, { shiftKey: true }); pointer(canvas, 'pointermove', 900, 400); pointer(canvas, 'pointerup', 900, 400);
    expect(builder.selectedBoxes).toHaveLength(3);
    root.querySelectorAll<HTMLButtonElement>('[part=selection-toolbar] button')[0].click();
    const positions = builder.layout.boxes; expect(positions.a.y).toBe(positions.b.y); expect(positions.c.y).toBe(positions.b.y);
    builder.undo(); expect(builder.layout).toEqual(before);
    root.querySelectorAll<HTMLButtonElement>('[part=selection-toolbar] button')[1].click(); expect(builder.history.canUndo).toBe(true);
  });
  it("offers six alignments, distribution and a section for multiple steps", () => {
    const { builder, root } = fixture();
    builder.selectMany(['a', 'b']);
    expect(root.querySelector('[part=process-title]')!.textContent).toBe('2 steps selected');
    expect(root.querySelectorAll('[part=arrange-actions] button')).toHaveLength(9);
    root.querySelector<HTMLButtonElement>('[part=arrange-actions] button')!.click();
    expect(builder.layout.boxes.a.x).toBe(builder.layout.boxes.b.x);
    root.querySelectorAll<HTMLButtonElement>('[part=arrange-actions] button')[8].click();
    expect(builder.layout.sections).toHaveLength(1);
    builder.undo(); expect(builder.layout.sections ?? []).toHaveLength(0);
  });
  it("inserts a palette drop on a routed line and highlights its hit target", () => {
    const { builder, root, canvas } = fixture(); const requests = vi.fn(); builder.addEventListener("process-edit-request", requests);
    const point = lineMidpoint(routeProcessLine(projection.lines[0], builder.layout, projection));
    const event = (type: string) => { const event = new Event(type, { bubbles: true, cancelable: true }); Object.assign(event, { clientX: point.x, clientY: point.y, dataTransfer: { getData: () => 'call' } }); canvas.dispatchEvent(event); };
    event('dragover'); expect(root.querySelector('[data-line-id=ab][part=line]')!.getAttribute('data-drop')).toBe('true');
    event('drop'); expect(requests.mock.calls[0][0].detail).toMatchObject({ type: 'insert', lineId: 'ab', from: 'a', to: 'b' });
  });
  it("never exposes ports or commits selection edits when locked", () => {
    const { builder, root } = fixture(); builder.selectMany(['a', 'b']); builder.locked = true;
    expect(root.querySelector('[part=port]')).toBeNull(); const edit = vi.fn(); builder.addEventListener('process-edit-request', edit);
    root.querySelectorAll<HTMLButtonElement>('[part=selection-toolbar] button')[2].click(); expect(edit).not.toHaveBeenCalled();
  });
  it("accepts an existing-box insert position atomically and restores it on undo", () => {
    const { builder, root, canvas } = fixture(); const before = builder.layout;
    const point = lineMidpoint(routeProcessLine(projection.lines[0], before, projection));
    const requests = vi.fn(event => event.detail.accept({ undo() {}, redo() {} })); builder.addEventListener('process-edit-request', requests);
    const original = before.boxes.c;
    pointer(root.querySelector('[data-box-id=c]')!, 'pointerdown', original.x + 10, original.y + 10);
    pointer(canvas, 'pointermove', point.x, point.y); pointer(canvas, 'pointerup', point.x, point.y);
    expect(requests.mock.calls[0][0].detail).toMatchObject({ type: 'insert', boxId: 'c', lineId: 'ab' });
    expect(builder.layout.boxes.c).not.toEqual(before.boxes.c); builder.undo(); expect(builder.layout).toEqual(before);
  });
  it("requests grouping on a frame drop and restores refused visual movement", () => {
    const { builder, root, canvas } = fixture();
    builder.document = { ...projection, boxes: [...projection.boxes, { id: 'frame', node: {}, title: 'Try', kind: 'try', frame: true }] };
    const layout = builder.layout; layout.boxes.frame = { x: 700, y: 400, width: 320, height: 180 }; builder.layout = layout;
    const requests = vi.fn(); builder.addEventListener('process-edit-request', requests); const original = builder.layout.boxes.c;
    pointer(root.querySelector('[data-box-id=c]')!, 'pointerdown', original.x + 10, original.y + 10);
    pointer(canvas, 'pointermove', 750, 450); pointer(canvas, 'pointerup', 750, 450);
    expect(requests.mock.calls[0][0].detail).toMatchObject({ type: 'reparent', boxId: 'c', parentId: 'frame' });
    expect(root.querySelector<HTMLElement>('[data-box-id=c]')!.style.left).toBe(`${original.x}px`);
  });
  it("adjusts an authored orthogonal route with keyboard and undo", () => {
    const { builder, root } = fixture(); const layout = builder.layout; layout.boxes.b = { x: 500, y: 300 };
    layout.lines = { ab: [{ x: 360, y: 88 }, { x: 360, y: 348 }] }; builder.layout = layout;
    const before = builder.layout;
    const adjust = root.querySelector<HTMLButtonElement>('[part=connection-actions] [data-segment]')!; expect(adjust).not.toBeNull();
    adjust.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    expect(builder.layout.lines).not.toEqual(before.lines); builder.undo(); expect(builder.layout).toEqual(before);
  });
  it("names and selects lines, then resets a hand-adjusted route", () => {
    const { builder, root } = fixture();
    const layout = builder.layout; layout.boxes.b = { x: 500, y: 300 }; layout.lines = { ab: [{ x: 360, y: 88 }, { x: 360, y: 348 }] }; builder.layout = layout;
    const label = root.querySelector<HTMLElement>('[part=connection]')!;
    expect(label.getAttribute('aria-label')).toContain('Read to Save');
    label.click(); expect(builder.selectedLine?.id).toBe('ab');
    expect(root.querySelector('[part=line]')!.getAttribute('data-selected')).toBe('true');
    root.querySelector<HTMLButtonElement>('[data-selection-command=reset-line]')!.click();
    expect(builder.layout.lines?.ab).toBeUndefined();
  });
  it("offers 24px endpoint grips and requests host-owned reattachment", () => {
    const { builder, root } = fixture(); const requests = vi.fn(); builder.addEventListener('process-edit-request', requests);
    builder.selectLine('ab');
    const grip = root.querySelector<HTMLButtonElement>('[part=end-grip][data-end=to]')!;
    expect(grip).not.toBeNull(); expect(grip.getAttribute('aria-label')).toContain('Reattach end');
    grip.click(); root.querySelector<HTMLElement>('[data-box-id=c]')!.click();
    expect(requests.mock.calls[0][0].detail).toMatchObject({ type: 'reattach', lineId: 'ab', to: 'c' });
  });
  it("deduplicates controlled selection echoes and notifies when a selected box disappears", () => {
    const { builder } = fixture(); const selection = vi.fn(event => { builder.selectedPath = event.detail.path; });
    builder.addEventListener('selection-changed', selection); builder.select('b'); expect(selection).toHaveBeenCalledTimes(1);
    builder.selectedPath = ['steps', 1]; expect(selection).toHaveBeenCalledTimes(1);
    builder.document = { boxes: projection.boxes.filter(box => box.id !== 'b'), lines: [] };
    expect(selection).toHaveBeenCalledTimes(2); expect(builder.selectedPath).toBeNull();
  });
  it("keeps the box mounted through a plain pointer click and supports Shift-click selection", () => {
    const { builder, root, canvas } = fixture(); builder.select('b');
    const box = root.querySelector<HTMLElement>('[data-box-id=a]')!;
    pointer(box, 'pointerdown', 50, 50, { shiftKey: true }); pointer(canvas, 'pointerup', 50, 50, { shiftKey: true });
    expect(root.querySelector('[data-box-id=a]')).toBe(box);
    box.dispatchEvent(new MouseEvent('click', { shiftKey: true, bubbles: true })); expect(builder.selectedBoxes).toHaveLength(2);
  });
  it("ignores descendant capture loss when touch capture transfers to the canvas", () => {
    const { builder, root, canvas } = fixture(); const position = builder.layout.boxes.a;
    const box = root.querySelector('[data-box-id=a]')!;
    pointer(box, 'pointerdown', position.x + 10, position.y + 10);
    pointer(canvas, 'pointermove', position.x + 70, position.y + 10);
    pointer(box, 'lostpointercapture', position.x + 70, position.y + 10);
    pointer(canvas, 'pointerup', position.x + 70, position.y + 10);
    expect(builder.layout.boxes.a.x).toBe(position.x + 60);
  });
  it("supports cyclic host node references and projection copies without spurious versions", () => {
    const { builder } = fixture(); const node: { self?: unknown } = {}; node.self = node;
    const document = { ...projection, boxes: projection.boxes.map(box => ({ ...box, node })) };
    builder.model = { project: doc => ({ boxes: doc.boxes.map(box => ({ ...box, node: { original: box.node } })), lines: doc.lines }) };
    expect(() => { builder.document = document; }).not.toThrow(); const version = builder.version;
    builder.refresh(); expect(builder.version).toBe(version);
  });
  it("ignores other pointers during a port gesture", () => {
    const { builder, root, canvas } = fixture(); const requests = vi.fn(); builder.addEventListener('process-edit-request', requests);
    const from = builder.layout.boxes.a, to = builder.layout.boxes.b;
    pointer(root.querySelector('[data-owner=a][data-side=east]')!, 'pointerdown', from.x + 220, from.y + 48);
    pointer(canvas, 'pointermove', to.x, to.y, { pointerId: 2 }); pointer(canvas, 'pointerup', to.x, to.y, { pointerId: 2 });
    expect(requests).not.toHaveBeenCalled();
    pointer(canvas, 'pointerup', to.x + 20, to.y + 20); expect(requests).toHaveBeenCalledTimes(1);
  });
  it("allows the host to refuse group moves without moving frame descendants", () => {
    const { builder, root, canvas } = fixture(); builder.document = { ...projection, boxes: [...projection.boxes, { id: 'frame', node: {}, title: 'Frame', kind: 'try', frame: true }, { id: 'child', node: {}, title: 'Child', kind: 'call', parentId: 'frame' }] };
    builder.selectMany(['frame', 'a']); const before = builder.layout;
    const move = vi.fn(event => event.preventDefault()); builder.addEventListener('move-request', move);
    const pos = before.boxes.frame;
    pointer(root.querySelector('[data-box-id=frame]')!, 'pointerdown', pos.x + 10, pos.y + 10); pointer(canvas, 'pointermove', pos.x + 50, pos.y + 10); pointer(canvas, 'pointerup', pos.x + 50, pos.y + 10);
    expect(move).toHaveBeenCalledTimes(1); expect(builder.layout).toEqual(before);
    builder.removeEventListener('move-request', move);
    pointer(root.querySelector('[data-box-id=frame]')!, 'pointerdown', pos.x + 10, pos.y + 10); pointer(canvas, 'pointermove', pos.x + 50, pos.y + 10); pointer(canvas, 'pointerup', pos.x + 50, pos.y + 10);
    expect(builder.layout.boxes.child.x - before.boxes.child.x).toBe(builder.layout.boxes.frame.x - before.boxes.frame.x);
  });
  it('holds Space to pan over a step without moving or selecting it', () => {
    const { builder, root, canvas } = fixture(); builder.select('a'); builder.setView({ x: 0, y: 0, zoom: 1 });
    const before = builder.layout.boxes.b;
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    pointer(root.querySelector('[data-box-id=b]')!, 'pointerdown', 50, 50);
    pointer(canvas, 'pointermove', 90, 75); pointer(canvas, 'pointerup', 90, 75);
    canvas.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
    expect(builder.view.x).toBe(40); expect(builder.view.y).toBe(25);
    expect(builder.layout.boxes.b).toEqual(before); expect(builder.selected?.id).toBe('a');
  });
  it('resizes a selected frame by pointer and arrow keys', () => {
    const { builder, root, canvas } = fixture();
    builder.document = { ...projection, boxes: [...projection.boxes, { id: 'frame', node: {}, title: 'Frame', kind: 'try', frame: true }] };
    builder.select('frame'); builder.setView({ x: 0, y: 0, zoom: 1 });
    const before = builder.layout.boxes.frame;
    const handle = root.querySelector<HTMLElement>('[part=frame-resize]')!;
    expect(handle).not.toBeNull();
    pointer(handle, 'pointerdown', 20, 20); pointer(canvas, 'pointermove', 52, 36); pointer(canvas, 'pointerup', 52, 36);
    expect(builder.layout.boxes.frame.width).toBe((before.width ?? 224) + 32);
    expect(builder.layout.boxes.frame.height).toBe((before.height ?? 64) + 16);
    root.querySelector<HTMLElement>('[part=frame-resize]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    expect(builder.layout.boxes.frame.width).toBe((before.width ?? 224) + 48);
  });
  it('shows an explicit repeating-frame mark and animates tidy only when motion is allowed', () => {
    const { builder, root } = fixture();
    builder.document = { ...projection, boxes: [...projection.boxes, { id: 'repeat', node: {}, title: 'Repeat', kind: 'host-repeat', frame: true, loopMark: true }] };
    expect(root.querySelector('[data-box-id=repeat] [part=loop-mark]')?.textContent).toBe('↻');
    builder.move('a', 900, 600);
    const animate = vi.fn(); const original = Element.prototype.animate;
    Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: animate });
    try { builder.tidy(); expect(animate).toHaveBeenCalled(); }
    finally { Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: original }); }
  });
  it('marks authored pinned connection ends', () => {
    const { builder, root } = fixture();
    builder.document = { ...projection, lines: [{ ...projection.lines[0], fromSide: 'east', toSide: 'west' }] };
    expect(root.querySelectorAll('[part=pinned-end]')).toHaveLength(2);
  });
  it('pins a dragged connection when dropped on a target edge point', () => {
    const { builder, root, canvas } = fixture(); const requests = vi.fn(); builder.addEventListener('process-edit-request', requests);
    builder.setView({ x: 0, y: 0, zoom: 1 });
    const from = builder.layout.boxes.a, to = builder.layout.boxes.b;
    pointer(root.querySelector('[data-owner=a][data-side=east]')!, 'pointerdown', from.x + (from.width ?? 224), from.y + (from.height ?? 64) / 2);
    pointer(canvas, 'pointermove', to.x, to.y + (to.height ?? 64) / 2);
    expect(root.querySelector('[data-owner=b][data-side=west]')?.getAttribute('data-hot')).toBe('true');
    pointer(canvas, 'pointerup', to.x, to.y + (to.height ?? 64) / 2);
    expect(requests.mock.calls[0][0].detail).toMatchObject({ type: 'connect', from: 'a', to: 'b', fromSide: 'east', toSide: 'west' });
  });
  it('shows a palette drag ghost over the canvas and clears it on leave', () => {
    const { root, canvas } = fixture();
    root.querySelector<HTMLElement>('[part=choice]')!.dispatchEvent(new Event('dragstart', { bubbles: true }));
    const drag = new Event('dragover', { bubbles: true, cancelable: true }); Object.assign(drag, { clientX: 250, clientY: 180 }); canvas.dispatchEvent(drag);
    expect(root.querySelector('[part=palette-ghost]')?.textContent).toBe('Call');
    canvas.dispatchEvent(new Event('dragleave')); expect(root.querySelector('[part=palette-ghost]')).toBeNull();
  });
  it('adds reader notes from the shared catalog to layout, not the workflow graph', () => {
    const { builder, root } = fixture();
    builder.catalog = [{ kind: 'call', label: 'Call', group: 'Steps', create: () => ({}) }, { kind: 'note', label: 'Note', group: 'For readers', placement: 'note', create: () => ({}) }];
    const edits = vi.fn(); builder.addEventListener('process-edit-request', edits);
    const choice = Array.from(root.querySelectorAll<HTMLButtonElement>('[part=choice]')).find(button => button.textContent?.includes('Note'))!;
    choice.click();
    expect(builder.layout.notes?.[0].text).toBe('Note'); expect(root.querySelector('[part=note]')?.textContent).toBe('Note');
    expect(edits).not.toHaveBeenCalled();
  });
  it('offers an If it fails branch only until a Try frame has one', () => {
    const { builder, root } = fixture();
    builder.document = { ...projection, boxes: [...projection.boxes, { id: 'try', kind: 'try', title: 'Try', frame: true, node: {} }] };
    builder.select('try');
    expect(root.querySelector<HTMLButtonElement>('[data-selection-command=add-next]')?.textContent).toBe('If it fails');
    const chooser = root.querySelector<HTMLDialogElement>('[part=insert-chooser]')!; chooser.showModal = vi.fn(() => { chooser.open = true; });
    const requests = vi.fn(); builder.addEventListener('process-edit-request', requests);
    root.querySelector<HTMLButtonElement>('[data-selection-command=add-next]')!.click();
    chooser.querySelector('box-kind-picker')!.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
    expect(requests.mock.calls[0][0].detail).toMatchObject({ type: 'add', from: 'try', routeLabel: 'If it fails', dashed: true });
    builder.document = { ...builder.document!, lines: [...projection.lines, { id: 'try-a', from: 'try', to: 'a', label: 'If it fails', dashed: true }] };
    expect(root.querySelector<HTMLButtonElement>('[data-selection-command=add-next]')?.textContent).toBe('Add next');
  });
});
