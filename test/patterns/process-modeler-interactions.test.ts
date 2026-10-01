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
    const outline = root.querySelectorAll<HTMLButtonElement>('[part=pane-content] button'); outline[1].click(); expect(builder.selected?.id).toBe("b");
    expect(root.querySelector('[part=selection-toolbar]')!.getAttribute('aria-label')).toBe("Selected steps");
  });
  it("shows host variables/connections and supports roving detail tabs", () => {
    const { builder, root } = fixture(); builder.connections = [{ name: "Box", kind: "OAuth" }]; builder.variables = [{ name: "fileId", description: "Input" }];
    const tabs = root.querySelectorAll<HTMLButtonElement>('[role=tab]'); tabs[2].click(); expect(root.querySelector('[part=pane-content]')!.textContent).toContain("fileId: Input");
    tabs[2].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })); expect(tabs[3].getAttribute("aria-selected")).toBe("true");
    expect(root.querySelector('[part=pane-content]')!.textContent).toContain("Box (OAuth)");
    tabs[4].click(); expect(root.querySelector('[part=pane-content]')!.textContent).toContain("Shift+drag");
  });
  it("combines generic and host checks, with links back to the box", () => {
    const { builder, root } = fixture(); builder.model = { project: doc => doc, validate: () => [{ boxId: "b", message: "Supply a connection" }] };
    builder.document = { ...projection, lines: [...projection.lines, { id: "ba", from: "b", to: "a" }] };
    expect(root.querySelector('[part=checks]')!.textContent).toContain("loop"); expect(root.querySelector('[part=checks]')!.textContent).toContain("Supply a connection");
    const button = [...root.querySelectorAll<HTMLButtonElement>('[part=checks] button')].find(button => button.textContent === "Supply a connection")!;
    button.click(); expect(builder.selected?.id).toBe("b");
  });
  it("opens a directional kind chooser from a keyboard port", () => {
    const { builder, root } = fixture(); const requests = vi.fn(); builder.addEventListener("process-edit-request", requests);
    const chooser = root.querySelector<HTMLDialogElement>('[part=insert-chooser]')!;
    chooser.showModal = vi.fn(() => { chooser.open = true; });
    root.querySelector<HTMLButtonElement>('[data-owner=a][data-side=east]')!.click();
    expect(root.querySelector<HTMLDialogElement>('[part=insert-chooser]')!.open).toBe(true);
    root.querySelector('box-kind-picker')!.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
    expect(requests.mock.calls[0][0].detail).toMatchObject({ type: "add", from: "a", fromSide: "east", kind: { kind: "call" } });
  });
  it("draws a connection by dragging a port, but cancellation never edits", () => {
    const { builder, root, canvas } = fixture(); const requests = vi.fn(); builder.addEventListener("process-edit-request", requests);
    const from = builder.layout.boxes.a, to = builder.layout.boxes.b;
    pointer(root.querySelector('[data-owner=a][data-side=east]')!, 'pointerdown', from.x + 220, from.y + 48);
    pointer(canvas, 'pointermove', to.x + 20, to.y + 20); expect(root.querySelector('[part=connection-preview]')).not.toBeNull();
    pointer(canvas, 'pointerup', to.x + 20, to.y + 20); expect(requests.mock.calls[0][0].detail).toMatchObject({ type: "connect", from: "a", to: "b", fromSide: "east" });
    pointer(root.querySelector('[data-owner=a][data-side=south]')!, 'pointerdown', 150, 130);
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    pointer(canvas, 'pointerup', to.x + 20, to.y + 20); expect(requests).toHaveBeenCalledTimes(1);
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
});
