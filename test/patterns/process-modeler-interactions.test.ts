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
  it("does not publish an empty readable workflow before a host document loads", () => {
    const builder = new ProcessModeler(); const readable = vi.fn(); const raw = vi.fn();
    builder.addEventListener("readable-projection-changed", readable);
    builder.addEventListener("projection-changed", raw);
    document.body.append(builder);
    expect(builder.readback.current).toBeNull();
    expect(readable).not.toHaveBeenCalled(); expect(raw).not.toHaveBeenCalled();
    builder.document = structuredClone(projection);
    expect(readable).toHaveBeenCalledTimes(1); expect(raw).toHaveBeenCalledTimes(1);
    expect(builder.version).toBe(0);
    builder.document = undefined;
    expect(builder.readback.current).toBeNull(); expect(builder.readback.lastReadable).toBeNull();
  });
  it("names the desktop building-block pane without duplicating the mobile drawer heading", () => {
    const { root } = fixture();
    expect(root.querySelector('[part=palette-heading]')?.textContent).toBe("Add to the process");
    expect(root.querySelector('[part=pane-drawer][data-pane=palette] [part=pane-title]')?.textContent).toBe("Add to the process");
  });
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
    const hold = root.querySelector<HTMLElement>('[part=hold]')!;
    const canvas = root.querySelector<HTMLElement>('[part=canvas]')!;
    expect(hold.hasAttribute('hidden')).toBe(false);
    expect(hold.parentElement?.getAttribute('part')).toBe('canvas-stack');
    expect(hold.nextElementSibling).toBe(canvas);
    expect(canvas.contains(hold)).toBe(false);
    const styles = root.querySelector('style')?.textContent ?? '';
    expect(styles).toContain('[part=canvas-stack] > [part=hold] { grid-row: 1; }');
    expect(styles).toContain('[part=canvas-stack] > [part=canvas] { grid-row: 2; }');
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
    expect(root.querySelector('[part=urgent-status]')?.getAttribute('aria-live')).toBe('assertive');
    expect(root.querySelector('[part=urgent-status]')?.textContent).toBe('Supply a connection');
  });
  it("shows the ready state when the Checks tab has no problems", () => {
    const { root } = fixture();
    root.querySelector<HTMLButtonElement>('#process-tab-checks')!.click();
    expect(root.querySelector('[part=pane-content]')!.textContent).toContain('Ready to run');
  });
  it("matches the reference toolbar's switch, Checks state, and action order", () => {
    const { builder, root } = fixture();
    const toolbar = root.querySelector<HTMLElement>('[part=toolbar]')!;
    const commands = [...toolbar.querySelectorAll<HTMLElement>('[data-command]')].map(control => control.dataset.command);
    expect(commands.indexOf('checks-status')).toBeLessThan(commands.indexOf('undo'));
    expect(commands.indexOf('undo')).toBeLessThan(commands.indexOf('redo'));
    expect(commands.indexOf('redo')).toBeLessThan(commands.indexOf('tidy'));
    const status = toolbar.querySelector<HTMLButtonElement>('[data-command=checks-status]')!;
    expect(status.textContent).toContain('Ready to run');
    status.click();
    expect(root.querySelector<HTMLButtonElement>('#process-tab-checks')!.getAttribute('aria-selected')).toBe('true');
    builder.lastRun = { label: 'Morning run', steps: { a: { callsPerSecond: 2 } } };
    const toggle = root.querySelector<HTMLInputElement>('[part=run-toggle] input')!;
    expect(toggle.type).toBe('checkbox');
    expect(root.querySelector('style')!.textContent).toContain('[part=run-toggle] input::after');
    toggle.click(); expect(builder.showLastRun).toBe(true);
    builder.setValidation([{ boxId: 'a', message: 'Fix auth' }]);
    expect(status.textContent).toBe('1 problem');
    expect(status.dataset.state).toBe('bad');
  });
  it('shows measured and unmeasured task states from the last run', () => {
    const { builder, root } = fixture();
    builder.document = { ...projection, boxes: projection.boxes.map(box => box.id === 'c' ? { ...box, shape: 'event' as const } : box) };
    builder.lastRun = { label: 'Morning run', steps: { a: { callsPerSecond: 2, p95Ms: 1500, failedShare: 0.125 } } };
    builder.showLastRun = true;
    expect(root.querySelector('[data-box-id=a] [part=metrics]')?.textContent).toBe('2.0/s · p95 1.5 s · 12.5% failed');
    expect(root.querySelector('[data-box-id=b] [part=metrics]')?.textContent).toBe('Not in the last run');
    expect(root.querySelector('[data-box-id=c] [part=metrics]')).toBeNull();
    builder.select('a');
    const report = root.querySelector('[part=inspector-metrics]')!;
    expect(report.textContent).toContain('From Morning run.');
    expect(report.textContent).toContain('95% finished within1.5 s');
    expect(report.textContent).toContain('Failed12.5%');
    builder.select('b');
    expect(root.querySelector('[part=inspector-metrics]')).toBeNull();
    builder.lastRun = { label: 'Partial run', steps: { a: { p95Ms: 100 } } };
    builder.select('a');
    const partial = root.querySelector('[part=inspector-metrics]')!;
    expect(partial.textContent).toContain('Per second–');
    expect(partial.textContent).toContain('Failed–');
  });
  it('shows a host-supplied line traffic share only in Last run view', () => {
    const { builder, root } = fixture();
    builder.document = { ...projection, lines: [{ ...projection.lines[0], share: 0.92 }] };
    builder.lastRun = { label: 'Morning run', steps: {} };
    builder.showLastRun = true;
    const path = root.querySelector<SVGPathElement>('[part=line][data-line-id=ab]')!;
    expect(path.style.strokeWidth).toBe('3.8px');
    const label = root.querySelector<HTMLElement>('[part=connection]')!;
    expect(label.querySelector('small')?.textContent).toBe('92%');
    expect(label.getAttribute('aria-label')).toContain('92% of last-run traffic');
    builder.showLastRun = false;
    expect(root.querySelector('[part=connection] small')).toBeNull();
    expect(root.querySelector<SVGPathElement>('[part=line][data-line-id=ab]')!.style.strokeWidth).toBe('');
  });
  it('keeps narrow selection actions named while hiding the add label', () => {
    const { builder, root } = fixture();
    builder.select('a');
    const add = root.querySelector<HTMLButtonElement>('[data-selection-command=add-next]')!;
    expect(add.getAttribute('aria-label')).toBe('Add next');
    expect(add.querySelector('[part=selection-plus] + span')?.textContent).toBe('Add next');
    expect(root.querySelector('style')?.textContent).toContain(':host([data-narrow]) [part=selection-toolbar] [part=selection-plus] + span { display: none; }');
  });
  it("opens a directional kind chooser from a keyboard port", () => {
    const { builder, root } = fixture(); const requests = vi.fn(); builder.addEventListener("process-edit-request", requests);
    const chooser = root.querySelector<HTMLDialogElement>('[part=insert-chooser]')!;
    chooser.showModal = vi.fn(() => { chooser.open = true; });
    root.querySelector<HTMLButtonElement>('[data-owner=a][data-side=east]')!.click();
    expect(root.querySelector<HTMLDialogElement>('[part=insert-chooser]')!.open).toBe(true);
    expect(root.querySelector('[part=ghost-box]')).toBeNull();
    root.querySelector('box-kind-picker')!.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
    expect(requests.mock.calls[0][0].detail).toMatchObject({ type: "insert", from: "a", to: "b", lineId: "ab", kind: { kind: "call" } });
  });
  it("names the narrow building-block drawer and focuses search when it opens", () => {
    const { builder, root } = fixture();
    Object.assign(builder, { narrowValue: true });
    const drawer = root.querySelector<HTMLDialogElement>('[part=pane-drawer][data-pane=palette]')!;
    drawer.show = vi.fn(() => { drawer.open = true; });
    drawer.close = vi.fn(() => { drawer.open = false; });
    const title = drawer.querySelector<HTMLElement>('[part=pane-title]')!;
    expect(title.textContent).toBe("Add to the process");
    expect(drawer.getAttribute("aria-labelledby")).toBe(title.id);
    const trigger = root.querySelector<HTMLButtonElement>('[data-command=palette]')!;
    // Speech input uses the visible caption; the accessible name must include it.
    expect(trigger.getAttribute('aria-label')?.toLowerCase()).toContain(trigger.textContent!.toLowerCase());
    trigger.focus(); trigger.click();
    expect(drawer.open).toBe(true);
    expect(drawer.show).toHaveBeenCalledOnce();
    expect(root.querySelector<HTMLElement>('[part=pane-scrim]')!.hidden).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(root.activeElement).toBe(drawer.querySelector('[part=search]'));
    expect(drawer.querySelector('[part=pane-close]')?.getAttribute('aria-label')).toBe('Close building blocks');
    drawer.querySelector<HTMLElement>('[part=search]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(drawer.open).toBe(false);
    expect(drawer.inert).toBe(true);
    expect(root.querySelector<HTMLElement>('[part=pane-scrim]')!.hidden).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(root.activeElement).toBe(trigger);
    const css = root.querySelector('style')!.textContent!;
    expect(css).toContain(':host([data-narrow]) [part=pane-drawer] { display: none; position: absolute;');
    expect(css).toContain(':host([data-narrow]) [data-command=palette] { order: -2; }');
    expect(css).toContain(':host([data-phone]) [data-command=undo]');
  });
  it("closes the contained details drawer when its local scrim is clicked", () => {
    const { builder, root } = fixture(); Object.assign(builder, { narrowValue: true });
    const drawer = root.querySelector<HTMLDialogElement>('[part=pane-drawer][data-pane=inspector]')!;
    drawer.show = vi.fn(() => { drawer.open = true; });
    drawer.close = vi.fn(() => { drawer.open = false; });
    const trigger = root.querySelector<HTMLButtonElement>('[data-command=details]')!;
    trigger.focus(); trigger.click();
    expect(drawer.open).toBe(true);
    expect(root.activeElement).toBe(drawer.querySelector('[role=tab][aria-selected=true]'));
    root.querySelector<HTMLElement>('[part=pane-scrim]')!.click();
    expect(drawer.open).toBe(false);
    expect(root.activeElement).toBe(trigger);
  });
  it("opens a contextual keyboard chooser and inserts on the selected step's line", () => {
    const { builder, root, canvas } = fixture();
    const requests = vi.fn(); builder.addEventListener('process-edit-request', requests);
    builder.layout = { boxes: { a: { x: 0, y: 0 }, b: { x: 320, y: 0 }, c: { x: 320, y: 200 } } };
    builder.select('a');
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true, cancelable: true }));
    expect(builder.selected?.id).toBe('b');
    const before = builder.layout.boxes.b.x;
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true, cancelable: true }));
    expect(builder.layout.boxes.b.x).toBe(before + 64);
    builder.select('a');
    const chooser = root.querySelector<HTMLElement>('[part=keyboard-chooser]')!;
    chooser.showPopover = vi.fn(); chooser.hidePopover = vi.fn();
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true, cancelable: true }));
    expect(chooser.showPopover).toHaveBeenCalledOnce();
    expect(root.querySelector<HTMLDialogElement>('[part=insert-chooser]')!.open).toBe(false);
    expect(chooser.querySelector('[part=chooser-title]')?.textContent).toBe('Insert between Read and Save');
    const picker = chooser.querySelector('box-kind-picker')!;
    expect(picker.shadowRoot!.activeElement).toBe(picker.shadowRoot!.querySelector('[part=search]'));
    picker.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
    expect(requests.mock.calls[0][0].detail).toMatchObject({ type: 'insert', lineId: 'ab', from: 'a', to: 'b', kind: { kind: 'call' } });
    expect(chooser.hidePopover).toHaveBeenCalledOnce();
  });
  it("names an end-of-path keyboard add and returns focus on Escape", () => {
    const { builder, root, canvas } = fixture(); builder.select('c');
    const chooser = root.querySelector<HTMLElement>('[part=keyboard-chooser]')!;
    chooser.showPopover = vi.fn(); chooser.hidePopover = vi.fn();
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true, cancelable: true }));
    expect(chooser.querySelector('[part=chooser-title]')?.textContent).toBe('Add after Log');
    const picker = chooser.querySelector('box-kind-picker')!;
    picker.shadowRoot!.querySelector<HTMLInputElement>('[part=search]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(chooser.hidePopover).toHaveBeenCalledOnce();
    expect(root.activeElement).toBe(root.querySelector('[data-box-id=c]'));
  });
  it("adds a path from a catalog-defined gateway instead of inserting on its line", () => {
    const { builder, root, canvas } = fixture();
    const requests = vi.fn(); builder.addEventListener('process-edit-request', requests);
    builder.catalog = [
      { kind: 'decision', label: 'Decision', shape: 'gateway', create: () => ({}) },
      { kind: 'call', label: 'Call', create: () => ({}) },
    ];
    builder.document = { ...projection, boxes: projection.boxes.map(box => box.id === 'a' ? { ...box, kind: 'decision', title: 'Choose path' } : box) };
    builder.select('a');
    const chooser = root.querySelector<HTMLElement>('[part=keyboard-chooser]')!;
    chooser.showPopover = vi.fn(); chooser.hidePopover = vi.fn();
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true, cancelable: true }));
    expect(chooser.querySelector('[part=chooser-title]')?.textContent).toBe('Add a path from Choose path');
    chooser.querySelector('box-kind-picker')!.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
    expect(requests.mock.calls[0][0].detail).toMatchObject({ type: 'add', from: 'a' });
  });
  it("closes the View menu with Escape and announces cancellation only for an active connection", () => {
    const { builder, root, canvas } = fixture();
    const menu = root.querySelector<HTMLDetailsElement>('[part=view-menu]')!;
    menu.open = true;
    menu.querySelector<HTMLElement>('summary')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(menu.open).toBe(false);
    expect(root.activeElement).toBe(menu.querySelector('summary'));
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(root.querySelector('[part=status]')!.textContent).not.toBe('Connecting cancelled');
    // A connecting action is announced when cancelled; idle Escape is silent.
    builder.select('a');
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true, cancelable: true }));
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(root.querySelector('[part=status]')!.textContent).toBe('Connecting cancelled');
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
  it("keeps the dot grid aligned with the authored zoom and pan", () => {
    const { builder, canvas } = fixture();
    builder.setView({ x: 12, y: 24, zoom: 0.7 });
    expect(canvas.style.backgroundSize).toBe('11.2px 11.2px');
    expect(canvas.style.backgroundPosition).toBe('12px 24px');
    builder.setView({ x: -9, y: 5, zoom: 0.4 });
    expect(canvas.style.backgroundSize).toBe('25.6px 25.6px');
    expect(canvas.style.backgroundPosition).toBe('-9px 5px');
  });
  it("retains the inspector process heading in embedded host mode", () => {
    const { builder, root } = fixture();
    builder.processTitle = 'Upload round trip';
    builder.processSummary = '13 steps in 4 sections';
    builder.embedMode = true;
    expect(root.querySelector('[part=process-heading]')?.textContent).toContain('Upload round trip');
    expect(root.querySelector('[part=process-heading]')?.textContent).toContain('13 steps in 4 sections');
    expect(root.querySelector('style')?.textContent).not.toMatch(/:host\(\[embed-mode\]\) \[part=process-heading\]/);
    expect(root.querySelector('style')?.textContent).toContain(':host([data-narrow]:not([embed-mode])) [part=view-menu]');
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
  it('opens a connected-step chooser at an empty port drop and inserts on an east-port click', () => {
    const { builder, root, canvas } = fixture();
    const requests = vi.fn(); builder.addEventListener('process-edit-request', requests);
    const chooser = root.querySelector<HTMLDialogElement>('[part=insert-chooser]')!;
    chooser.showModal = vi.fn(() => { chooser.open = true; });
    const source = builder.layout.boxes.a;
    const east = root.querySelector('[data-owner=a][data-side=east]')!;
    pointer(east, 'pointerdown', source.x + 224, source.y + 32);
    pointer(canvas, 'pointermove', 850, 420);
    expect(root.querySelector('[part=connect-tooltip]')?.textContent).toBe('Drop here to add a connected step');
    expect(root.querySelector<HTMLElement>('[part=connect-tooltip]')?.dataset.invalid).toBe('false');
    pointer(canvas, 'pointerup', 850, 420);
    expect(chooser.open).toBe(true);
    expect(requests).not.toHaveBeenCalled();
    expect(root.querySelector<HTMLElement>('[part=ghost-box]')?.style.left).toBe('850px');
    chooser.querySelector('box-kind-picker')!.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
    expect(requests.mock.calls[0][0].detail).toMatchObject({ type: 'add', from: 'a', fromSide: 'east', position: { x: 850, y: 420 } });
    chooser.open = false;
    pointer(east, 'pointerdown', source.x + 224, source.y + 32);
    pointer(canvas, 'pointerup', source.x + 224, source.y + 32);
    chooser.querySelector('box-kind-picker')!.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
    expect(requests.mock.calls[1][0].detail).toMatchObject({ type: 'insert', lineId: 'ab', from: 'a', to: 'b' });
  });
  it('anchors an empty-drop chooser and cancels it without editing', () => {
    const { builder, root, canvas } = fixture();
    const requests = vi.fn(); builder.addEventListener('process-edit-request', requests);
    const chooser = root.querySelector<HTMLElement>('[part=keyboard-chooser]')!;
    chooser.showPopover = vi.fn(); chooser.hidePopover = vi.fn();
    const source = builder.layout.boxes.a;
    pointer(root.querySelector('[data-owner=a][data-side=east]')!, 'pointerdown', source.x + 224, source.y + 32);
    pointer(canvas, 'pointermove', 850, 420);
    pointer(canvas, 'pointerup', 850, 420);
    expect(chooser.showPopover).toHaveBeenCalledOnce();
    expect(chooser.querySelector('[part=chooser-title]')?.textContent).toBe('Add after Read');
    expect(root.querySelector<HTMLDialogElement>('[part=insert-chooser]')!.open).toBe(false);
    chooser.querySelector('box-kind-picker')!.shadowRoot!.querySelector<HTMLInputElement>('[part=search]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(chooser.hidePopover).toHaveBeenCalledOnce();
    expect(requests).not.toHaveBeenCalled();
  });
  it('anchors line insertion at its midpoint and returns focus on cancellation', () => {
    const { builder, root } = fixture();
    const requests = vi.fn(); builder.addEventListener('process-edit-request', requests);
    const chooser = root.querySelector<HTMLElement>('[part=keyboard-chooser]')!;
    chooser.showPopover = vi.fn(); chooser.hidePopover = vi.fn();
    const insert = root.querySelector<HTMLButtonElement>('[aria-label="Insert a step here: Read to Save"]')!;
    insert.focus(); insert.click();
    expect(chooser.showPopover).toHaveBeenCalledOnce();
    expect(chooser.querySelector('[part=chooser-title]')?.textContent).toBe('Insert between Read and Save');
    expect(root.querySelector<HTMLDialogElement>('[part=insert-chooser]')!.open).toBe(false);
    const midpoint = lineMidpoint(routeProcessLine(projection.lines[0], builder.layout, projection));
    expect(root.querySelector<HTMLElement>('[part=world] > span')?.style.left).toBe(`${midpoint.x}px`);
    chooser.querySelector('box-kind-picker')!.shadowRoot!.querySelector<HTMLInputElement>('[part=search]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(chooser.hidePopover).toHaveBeenCalledOnce();
    expect(root.activeElement).toBe(insert);
    expect(requests).not.toHaveBeenCalled();
    insert.click();
    chooser.querySelector('box-kind-picker')!.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
    expect(requests.mock.calls[0][0].detail).toMatchObject({ type: 'insert', lineId: 'ab', from: 'a', to: 'b' });
  });
  it('keeps an unlabelled line midpoint target reachable as the canvas zooms', () => {
    const { builder, root } = fixture();
    builder.setView({ x: 0, y: 0, zoom: 0.55 });
    expect(root.querySelector<HTMLElement>('[part=world]')!.style.getPropertyValue('--boe-process-inverse-zoom'))
      .toBe(String(1 / 0.55));
    expect(root.querySelector('style')!.textContent).toContain('min-width: calc(24px * var(--boe-process-inverse-zoom, 1))');
    expect(root.querySelector('[part=connection] > span')?.textContent).toBe('');
  });
  it('uses the same anchored chooser from the selected-line toolbar', () => {
    const { builder, root } = fixture(); builder.selectLine('ab');
    const chooser = root.querySelector<HTMLElement>('[part=keyboard-chooser]')!;
    chooser.showPopover = vi.fn(); chooser.hidePopover = vi.fn();
    const insert = root.querySelector<HTMLButtonElement>('[data-selection-command=insert]')!;
    insert.click();
    expect(chooser.showPopover).toHaveBeenCalledOnce();
    expect(chooser.querySelector('[part=chooser-title]')?.textContent).toBe('Insert between Read and Save');
    expect(root.querySelector<HTMLDialogElement>('[part=insert-chooser]')!.open).toBe(false);
  });
  it('uses the directional chooser and inserts on an eastward keyboard action', () => {
    const { builder, root, canvas } = fixture(); builder.select('a');
    const requests = vi.fn(); builder.addEventListener('process-edit-request', requests);
    const chooser = root.querySelector<HTMLElement>('[part=keyboard-chooser]')!;
    chooser.showPopover = vi.fn(); chooser.hidePopover = vi.fn();
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true, altKey: true, bubbles: true, cancelable: true }));
    expect(chooser.showPopover).toHaveBeenCalledOnce();
    expect(chooser.querySelector('[part=chooser-title]')?.textContent).toBe('Insert between Read and Save');
    chooser.querySelector('box-kind-picker')!.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
    expect(requests.mock.calls[0][0].detail).toMatchObject({ type: 'insert', lineId: 'ab', from: 'a', to: 'b' });
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', ctrlKey: true, altKey: true, bubbles: true, cancelable: true }));
    expect(chooser.querySelector('[part=chooser-title]')?.textContent).toBe('Add above Read, connected');
    chooser.querySelector('box-kind-picker')!.shadowRoot!.querySelector<HTMLInputElement>('[part=search]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(root.activeElement).toBe(root.querySelector('[data-box-id=a]'));
  });
  it('inserts between steps from Add next when the selected step has one successor', () => {
    const { builder, root } = fixture(); builder.select('a');
    const requests = vi.fn(); builder.addEventListener('process-edit-request', requests);
    const chooser = root.querySelector<HTMLDialogElement>('[part=insert-chooser]')!;
    chooser.showModal = vi.fn(() => { chooser.open = true; });
    root.querySelector<HTMLButtonElement>('[data-selection-command=add-next]')!.click();
    chooser.querySelector('box-kind-picker')!.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
    expect(requests.mock.calls[0][0].detail).toMatchObject({ type: 'insert', lineId: 'ab', from: 'a', to: 'b' });
  });
  it("selects a marquee and aligns/tidies the selected group with undo", () => {
    const { builder, root, canvas } = fixture();
    builder.layout = { boxes: {
      a: { x: 400, y: 200, width: 224, height: 64 },
      b: { x: 100, y: 100, width: 224, height: 64 },
      c: { x: 700, y: 250, width: 224, height: 64 },
    } };
    const before = builder.layout;
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
  it('makes room for an accepted straight-row insert and undoes its layout atomically', () => {
    const { builder } = fixture();
    builder.layout = { boxes: {
      a: { x: 0, y: 0, width: 224, height: 64 },
      b: { x: 320, y: 0, width: 224, height: 64 },
      c: { x: 700, y: 200, width: 224, height: 64 },
    } };
    const before = builder.layout;
    const original = builder.document!;
    builder.addEventListener('process-edit-request', event => {
      const request = (event as CustomEvent).detail;
      const inserted = { id: 'new', node: {}, title: 'New', kind: 'call' };
      const after = { boxes: [...original.boxes, inserted], lines: [
        { id: 'a-new', from: 'a', to: 'new' }, { id: 'new-b', from: 'new', to: 'b' },
      ] };
      builder.document = after;
      request.accept({ undo: () => { builder.document = original; }, redo: () => { builder.document = after; } });
    });
    builder.requestEdit({ type: 'insert', kind: { kind: 'call', label: 'Call', create: () => ({}) }, lineId: 'ab', from: 'a', to: 'b', position: { x: 272, y: 32 } });
    expect(builder.layout.boxes.new.x).toBe(304);
    expect(builder.layout.boxes.b.x).toBeGreaterThanOrEqual(builder.layout.boxes.new.x + (builder.layout.boxes.new.width ?? 224) + 80);
    expect(builder.layout.boxes.c.x).toBeGreaterThan(before.boxes.c.x);
    builder.undo(); expect(builder.layout).toEqual(before);
    builder.redo(); expect(builder.layout.boxes.new.x).toBe(304);
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
  it("does not echo a new host-controlled selection", () => {
    const { builder } = fixture(); const selection = vi.fn(); builder.addEventListener("selection-changed", selection);
    builder.selectedPath = ["steps", 1, "name"];
    expect(builder.selected?.id).toBe("b"); expect(selection).not.toHaveBeenCalled();
    builder.select("a"); expect(selection).toHaveBeenCalledTimes(1);
    builder.selectedPath = ["steps", 2];
    expect(builder.selected?.id).toBe("c"); expect(selection).toHaveBeenCalledTimes(1);
    builder.selectedPath = null;
    expect(builder.selected).toBeNull(); expect(selection).toHaveBeenCalledTimes(1);
  });
  it("tidies selected boxes in flow order without moving unselected boxes, and undoes", () => {
    const { builder, root } = fixture();
    builder.layout = { boxes: {
      a: { x: 500, y: 300, width: 224, height: 64 },
      b: { x: 100, y: 100, width: 224, height: 64 },
      c: { x: 700, y: 700, width: 224, height: 64 },
    } };
    const before = builder.layout;
    builder.selectMany(["a", "b"]);
    root.querySelector<HTMLButtonElement>('[data-selection-command=space]')!.click();
    expect(builder.layout.boxes.a.x).toBeLessThan(builder.layout.boxes.b.x);
    expect(builder.layout.boxes.a.y).toBe(builder.layout.boxes.b.y);
    expect(builder.layout.boxes.c).toEqual(before.boxes.c);
    builder.undo(); expect(builder.layout.boxes).toEqual(before.boxes);
  });
  it("tidies a selected frame with its descendants as one graph group", () => {
    const builder = new ProcessModeler();
    builder.document = {
      boxes: [
        { id: "frame", kind: "try", title: "Try", frame: true, node: {} },
        { id: "inner", kind: "step", title: "Inside", parentId: "frame", node: {} },
        { id: "next", kind: "step", title: "Next", node: {} },
        { id: "outside", kind: "step", title: "Outside", node: {} },
      ],
      lines: [{ id: "frame-next", from: "frame", to: "next" }],
    };
    document.body.append(builder);
    builder.layout = { boxes: {
      frame: { x: 600, y: 300, width: 400, height: 240 },
      inner: { x: 630, y: 375, width: 224, height: 64 },
      next: { x: 100, y: 100, width: 224, height: 64 },
      outside: { x: 1200, y: 500, width: 224, height: 64 },
    } };
    const before = builder.layout;
    builder.selectMany(["frame", "next"]);
    builder.shadowRoot!.querySelector<HTMLButtonElement>('[data-selection-command=space]')!.click();
    const { frame, inner, next, outside } = builder.layout.boxes;
    expect(frame.x).toBeLessThan(next.x);
    expect(inner.x).toBeGreaterThan(frame.x);
    expect(inner.y).toBeGreaterThan(frame.y);
    expect(outside).toEqual(before.boxes.outside);
    builder.undo(); expect(builder.layout.boxes).toEqual(before.boxes);
  });
  it("emits every readable document version even when the visible labels do not change", () => {
    const { builder } = fixture(); const readable = vi.fn(); builder.addEventListener("readable-projection-changed", readable);
    builder.document = { ...structuredClone(projection), boxes: projection.boxes.map(box => ({ ...box, node: { changed: true } })) };
    expect(builder.version).toBe(1);
    expect(readable).toHaveBeenCalledTimes(1);
    expect(readable.mock.calls[0][0].detail.version).toBe(1);
    builder.refresh(); expect(readable).toHaveBeenCalledTimes(1);
  });
  it("keeps the last readable graph detached while an edit is held", () => {
    const { builder } = fixture(); const readable = vi.fn(); builder.addEventListener("readable-projection-changed", readable);
    const source = structuredClone(projection);
    builder.document = source;
    expect(readable).toHaveBeenCalledTimes(1);
    (readable.mock.calls[0][0].detail.projection.boxes[0] as { title: string }).title = "Changed by listener";
    (source.boxes[0] as { title: string }).title = "Invalid edit";
    builder.setValidation([{ boxId: "a", message: "Fix this step" }]);
    expect(builder.readback.current).toBeNull();
    expect(builder.readback.lastReadable?.boxes[0].title).toBe("Read");
    (builder.readback.lastReadable!.boxes[0] as { title: string }).title = "Changed by reader";
    expect(builder.readback.lastReadable?.boxes[0].title).toBe("Read");
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
  it('keeps a readable zoom after tidying a long process', () => {
    const { builder } = fixture();
    const boxes = Array.from({ length: 12 }, (_, index) => ({ id: `step-${index}`, node: {}, title: `Step ${index}`, kind: 'call' }));
    builder.document = { boxes, lines: boxes.slice(1).map((box, index) => ({ id: `line-${index}`, from: boxes[index].id, to: box.id })) };
    builder.setView({ x: 0, y: 0, zoom: 0.7 });
    builder.tidy();
    expect(builder.view.zoom).toBeGreaterThanOrEqual(0.7);
    Object.assign(builder, { narrowValue: true });
    builder.tidy();
    expect(builder.view.zoom).toBeGreaterThanOrEqual(0.55);
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
    expect(root.querySelector<HTMLButtonElement>('[data-selection-command=add-next]')?.getAttribute('aria-label')).toBe('Add next');
    expect(root.querySelector<HTMLButtonElement>('[data-selection-command=add-failure]')?.getAttribute('aria-label')).toBe('If it fails');
    const chooser = root.querySelector<HTMLElement>('[part=keyboard-chooser]')!;
    chooser.showPopover = vi.fn(); chooser.hidePopover = vi.fn();
    const requests = vi.fn(); builder.addEventListener('process-edit-request', requests);
    root.querySelector<HTMLButtonElement>('[data-selection-command=add-failure]')!.click();
    expect(chooser.querySelector('[part=chooser-title]')?.textContent).toBe('If a step in Try fails');
    expect(chooser.showPopover).toHaveBeenCalledOnce();
    chooser.querySelector('box-kind-picker')!.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
    expect(requests.mock.calls[0][0].detail).toMatchObject({ type: 'add', from: 'try', routeLabel: 'If it fails', dashed: true });
    builder.document = { ...builder.document!, lines: [...projection.lines, { id: 'try-a', from: 'try', to: 'a', label: 'If it fails', dashed: true }] };
    expect(root.querySelector<HTMLButtonElement>('[data-selection-command=add-next]')?.getAttribute('aria-label')).toBe('Add next');
    expect(root.querySelector('[data-selection-command=add-failure]')).toBeNull();
  });
  it('matches reference selection actions for Start, End, Try and ordinary steps', () => {
    const { builder, root } = fixture();
    builder.document = { ...projection, boxes: [
      { id: 'start', kind: 'start', title: 'Start', shape: 'event', node: {} },
      ...projection.boxes,
      { id: 'end', kind: 'end', title: 'End', shape: 'event', node: {} },
    ] };
    const actions = () => [...root.querySelectorAll<HTMLButtonElement>('[part=selection-toolbar] button')].map(button => button.getAttribute('aria-label'));
    builder.select('start');
    expect(actions()).toEqual(['Add next']);
    expect(root.querySelector('[data-selection-command=add-next] [part=selection-plus]')?.getAttribute('aria-hidden')).toBe('true');
    builder.select('a');
    expect(actions()).toEqual(['Add next', 'Duplicate', 'Delete']);
    builder.select('end');
    expect(actions()).toEqual(['Duplicate', 'Delete']);
    builder.select(null);
    builder.selectLine('ab');
    expect(actions()).toContain('Insert a step');
    expect(root.querySelector('[data-selection-command=insert] [part=selection-plus]')).toBeTruthy();
  });
  it('does not offer outgoing ports or Add next on a Finish step', () => {
    const { builder, root } = fixture();
    builder.document = { ...projection, boxes: [...projection.boxes, { id: 'finish', kind: 'finish', title: 'Finish', shape: 'event', node: {} }] };
    builder.select('finish');
    expect(root.querySelector('[data-owner=finish][part=port]')).toBeNull();
    expect(root.querySelector('[data-selection-command=add-next]')).toBeNull();
  });
});
