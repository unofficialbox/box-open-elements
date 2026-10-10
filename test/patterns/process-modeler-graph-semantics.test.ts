import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProcessModeler, routeProcessLine, arrangeProcess, type ProcessProjection } from '../../src/patterns/process-modeler/index.js';
import { graphChecks } from '../../src/patterns/process-modeler/bridge.js';

const graph: ProcessProjection = {
  boxes: [
    { id: 'a', kind: 'step', title: 'Read', node: {} },
    { id: 'b', kind: 'step', title: 'Save', node: {} },
    { id: 'n', kind: 'host-memo', title: 'Note', description: 'Safe <b>memo</b>', role: 'note', node: {} },
  ],
  lines: [
    { id: 'ab', from: 'a', to: 'b' },
    { id: 'nb', from: 'n', to: 'b', role: 'association', fromSide: 'east', points: [{ x: 900, y: 900 }], share: 1 },
  ],
};
function fixture() {
  const element = new ProcessModeler(); element.document = structuredClone(graph);
  element.layout = { boxes: { a: { x: 40, y: 40 }, b: { x: 400, y: 40 }, n: { x: 200, y: 200, width: 208, height: 80 } } };
  element.catalog = [{ kind: 'step', label: 'Step', create: () => ({}) }, { kind: 'host-memo', label: 'Note', create: () => ({}) }];
  document.body.append(element);
  const root = element.shadowRoot!, canvas = root.querySelector<HTMLElement>('[part=canvas]')!;
  const key = (key: string, modifiers = {}) => canvas.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key, ...modifiers }));
  return { element, root, key };
}
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });
describe('Native graph note and association roles', () => {
  it('renders safe note text independent of kind, detail, metrics and flow counts', () => {
    const { element, root } = fixture();
    element.lastRun = { label: 'Run', steps: { n: { callsPerSecond: 9 } } }; element.showLastRun = true;
    const note = root.querySelector('[data-box-id=n]')!;
    expect(note.getAttribute('data-shape')).toBe('note');
    expect(note.querySelector('[part=note-body]')?.textContent).toBe('Safe <b>memo</b>');
    expect(note.querySelector('b,[part=icon],[part=run-metrics]')).toBeNull();
    expect(note.getAttribute('aria-label')).not.toContain(' in');
    expect(root.querySelector('[data-box-id=b]')?.getAttribute('aria-label')).toContain('1 in');
    element.detail = 'technical';
    expect(root.querySelector('[data-box-id=n] [part=note-body]')?.textContent).toBe('Safe <b>memo</b>');
  });

  it('selects every graph identity with Ctrl+A, preserves local note namespaces and suppresses flow insertion', () => {
    const { element, root, key } = fixture(); element.setNote({ id: 'n', text: 'Local', x: 10, y: 10 });
    key('a', { ctrlKey: true });
    expect(element.selection).toEqual([{ type: 'box', id: 'a' }, { type: 'box', id: 'b' }, { type: 'box', id: 'n' }, { type: 'line', id: 'ab' }, { type: 'line', id: 'nb' }, { type: 'note', id: 'n' }]);
    element.select('n'); key('n');
    expect(root.querySelector('[part=keyboard-chooser]')?.hasAttribute('popover')).toBe(true);
    expect((element as any).keyboardInsertion).toBeUndefined();
    key('ArrowRight', { ctrlKey: true, altKey: true }); expect(element.selected?.id).toBe('n');
    expect(root.querySelector('[data-selection-command=add-next]')).toBeNull();
    expect(root.querySelector('[data-selection-command=duplicate]')).not.toBeNull();
    root.querySelector<HTMLButtonElement>('[data-box-id=n] [part=port]')!.click();
    expect((element as any).connecting).toBe('n');
    expect((element as any).keyboardInsertion).toBeUndefined();
    key('Escape'); expect((element as any).connecting).toBeNull();
  });

  it('routes associations straight without arrows, pins, route controls or Insert across selection refresh', () => {
    const { element, root } = fixture();
    expect(routeProcessLine(graph.lines[1], element.layout, graph)).toEqual([{ x: 408, y: 240 }, { x: 400, y: 72 }]);
    for (let repeat = 0; repeat < 3; repeat++) {
      element.selectLine('nb'); element.refresh();
      const path = root.querySelector('[part=line][data-line-id=nb]')!;
      expect(path.hasAttribute('marker-end')).toBe(false); expect(path.getAttribute('stroke-dasharray')).toBe('2 4');
      expect(root.querySelector('[data-line-id=nb][data-segment],[part=end-grip][data-line-id=nb]')).toBeNull();
      expect(root.querySelector('[data-selection-command=insert],[data-selection-command=reset-line]')).toBeNull();
      expect(root.querySelector('[data-selection-command=delete-line]')).not.toBeNull();
    }
    element.selectLine('ab'); expect(root.querySelector('[data-selection-command=insert]')).not.toBeNull();
    expect(root.querySelector('[part=line][data-line-id=ab]')!.hasAttribute('marker-end')).toBe(true);
  });

  it('rejects direct role-invalid mutations and leaves association routes unchanged', () => {
    const { element } = fixture(); const requested = vi.fn(); element.addEventListener('process-edit-request', requested);
    for (const type of ['insert', 'reattach', 'reset-line'] as const) element.requestEdit({ type, lineId: 'nb', from: 'a', to: 'b' });
    element.requestEdit({ type: 'insert', lineId: 'ab', boxId: 'n' });
    element.requestEdit({ type: 'add', from: 'n' });
    element.routeLine('nb', [{ x: 100, y: 100 }]); element.resetLine('nb');
    expect(requested).not.toHaveBeenCalled(); expect(element.layout.lines?.nb).toBeUndefined();
    element.requestEdit({ type: 'disconnect', lineId: 'nb' }); expect(requested).toHaveBeenCalledTimes(1);
  });

  it('ignores notes and associations in default checks, ranks and flow-only arrangements', () => {
    const flow = { boxes: graph.boxes.slice(0, 2), lines: graph.lines.slice(0, 1) };
    expect(graphChecks(graph)).toEqual(graphChecks(flow));
    expect(arrangeProcess(graph)).toEqual(arrangeProcess(flow));
    const { element } = fixture(); const note = element.layout.boxes.n;
    element.selectMany(['a', 'b', 'n']); element.arrangeSelection('top');
    expect(element.layout.boxes.n).toEqual(note);
    element.tidy(); expect(element.layout.boxes.n).toEqual(note);
  });

  it('uses only flow outgoing edges when adding next and duplicates a graph note once with undo/redo', () => {
    const { element, root } = fixture(); const requests: any[] = [];
    element.addEventListener('process-edit-request', event => { const request = (event as CustomEvent).detail; requests.push(request);
      if (request.type !== 'duplicate') return;
      const before = element.document!;
      const after = { ...before, boxes: [...before.boxes, { ...before.boxes[2], id: 'copy' }] };
      element.document = after; request.accept({ selectionIds: ['copy'], undo: () => { element.document = before; }, redo: () => { element.document = after; } });
    });
    element.select('n'); root.querySelector<HTMLButtonElement>('[data-selection-command=duplicate]')!.click();
    expect(requests).toHaveLength(1); expect(requests[0].sourceId).toBe('n');
    expect(element.document!.boxes.find(b => b.id === 'copy')?.role).toBe('note');
    element.undo(); expect(element.document!.boxes.some(b => b.id === 'copy')).toBe(false);
    element.redo(); expect(element.document!.boxes.find(b => b.id === 'copy')?.role).toBe('note');
  });

  it('validates association mutations before mounting and retains mixed identities on Shift-click', () => {
    const pending = new ProcessModeler(); pending.document = structuredClone(graph);
    const requests = vi.fn(); pending.addEventListener('process-edit-request', requests);
    pending.requestEdit({ type: 'insert', lineId: 'nb' }); expect(requests).not.toHaveBeenCalled();
    const { element, root } = fixture(); element.selectLine('nb');
    root.querySelector('[data-box-id=n]')!.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
    expect(element.selection).toEqual([{ type: 'box', id: 'n' }, { type: 'line', id: 'nb' }]);
    expect([...root.querySelectorAll('[part=selection-toolbar] button')].map(button => button.getAttribute('aria-label'))).toEqual(['Line up', 'Tidy these', 'Delete']);
    root.querySelector('[data-box-id=n]')!.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
    expect(element.selection).toEqual([{ type: 'line', id: 'nb' }]);
  });

  it('centers the floating toolbar above bounds and flips below a high selection', () => {
    const { element, root } = fixture();
    const canvas = root.querySelector<HTMLElement>('[part=canvas]')!;
    Object.defineProperties(canvas, { clientWidth: { value: 1000 }, clientHeight: { value: 800 } });
    const toolbar = root.querySelector<HTMLElement>('[part=selection-toolbar]')!;
    element.setView({ x: 0, y: 0, zoom: 1 }); element.select('n');
    expect(toolbar.style.left).toBe('304px'); expect(toolbar.style.top).toBe('188px');
    element.setView({ x: 0, y: -180, zoom: 1 });
    expect(toolbar.style.top).toBe('152px');
    element.selectLine('nb');
    expect(toolbar.style.left).toBe('404px'); expect(toolbar.style.top).toBe('14px');
  });

  it('keeps Try failure insertion available with dashed or failure-labelled associations', () => {
    const { element, root } = fixture();
    const boxes = [{ ...graph.boxes[0], kind: 'try' }, ...graph.boxes.slice(1)];
    for (const attachment of [{ dashed: true }, { label: 'If it fails' }]) {
      element.document = { boxes, lines: [{ id: 'an', from: 'a', to: 'n', role: 'association', ...attachment }] };
      element.select('a');
      expect(root.querySelector('[data-selection-command=add-failure]')).not.toBeNull();
    }
    element.document = { boxes, lines: [{ id: 'ab', from: 'a', to: 'b', dashed: true }] };
    expect(root.querySelector('[data-selection-command=add-failure]')).toBeNull();
  });

  it('places unsaved graph notes clear of flows in either root order and of each other', () => {
    for (const noteFirst of [true, false]) {
      const element = new ProcessModeler();
      const flow = graph.boxes[0], note = graph.boxes[2];
      element.document = { boxes: [...(noteFirst ? [note, flow] : [flow, note]), { ...note, id: 'n2' }], lines: [] };
      document.body.append(element);
      const positions = Object.values(element.layout.boxes);
      for (let i = 0; i < positions.length; i++) for (let j = i + 1; j < positions.length; j++) {
        const a = positions[i], b = positions[j];
        expect(a.x >= b.x + (b.width ?? 224) || b.x >= a.x + (a.width ?? 224) || a.y >= b.y + (b.height ?? 64) || b.y >= a.y + (a.height ?? 64)).toBe(true);
      }
      element.remove();
    }
  });

  it('does not start canvas gestures for association pointer targets before Shift-click', () => {
    const { element, root } = fixture(); element.select('n');
    const hit = root.querySelector('[part=line-hit][data-line-id=nb]')!;
    hit.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 1, shiftKey: true }));
    expect((element as any).marquee).toBeUndefined(); expect((element as any).drag).toBeUndefined();
    hit.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
    expect(element.selection).toEqual([{ type: 'box', id: 'n' }, { type: 'line', id: 'nb' }]);
  });

  it('measures automatic note bodies and reroutes endpoints after short or multiline text changes', () => {
    let height = 38.125;
    const measure = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return { x: 0, y: 0, top: 0, left: 0, right: 208, bottom: height, width: 208, height: this.getAttribute('part') === 'note-body' ? height : 0, toJSON() {} };
    });
    try {
      const { element, root } = fixture();
      element.layout = { boxes: { a: { x: 40, y: 400 }, b: { x: 40, y: 600 }, n: { x: 40, y: 40 } } };
      for (const nextHeight of [38.125, 74.375]) {
        height = nextHeight; element.refresh();
        expect(element.layout.boxes.n.height).toBe(height);
        expect(root.querySelector<HTMLElement>('[data-box-id=n]')!.style.height).toBe(`${height}px`);
        expect(routeProcessLine(graph.lines[1], element.layout, graph)[0]).toEqual({ x: 144, y: 40 + height });
      }
    } finally { measure.mockRestore(); }
  });

  it('respects authoritative saved and accepted note heights after automatic measurement and undo/redo', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, top: 0, left: 0, right: 208, bottom: 38.125, width: 208, height: 38.125, toJSON() {} });
    const { element } = fixture();
    const document = { ...graph, boxes: graph.boxes.map(b => b.id === 'n' ? { ...b, path: ['note'], fingerprint: 'memo' } : b) };
    element.document = document; element.layout = { boxes: { n: { x: 300, y: 40 } } };
    expect(element.layout.boxes.n.height).toBe(38.125);
    element.load(document, { positions: [{ id: 'n', path: ['note'], fingerprint: 'memo', position: { x: 300, y: 40, width: 208, height: 120 } }] });
    expect(element.layout.boxes.n.height).toBe(120);
    element.layout = { boxes: { n: { x: 300, y: 40 } } };
    element.addEventListener('process-edit-request', event => {
      const layout = element.layout; layout.boxes.n.height = 120;
      (event as CustomEvent).detail.accept({ layout, undo() {}, redo() {} });
    }, { once: true });
    element.requestEdit({ type: 'duplicate', sourceId: 'n' });
    expect(element.layout.boxes.n.height).toBe(120);
    element.undo(); expect(element.layout.boxes.n.height).toBe(38.125);
    element.redo(); expect(element.layout.boxes.n.height).toBe(120);
    element.layout = { boxes: { n: { x: 300, y: 40 } } };
    element.resize('n', 208, 140); expect(element.layout.boxes.n.height).toBe(140);
    element.undo(); expect(element.layout.boxes.n.height).toBe(38.125);
    element.redo(); expect(element.layout.boxes.n.height).toBe(140);
  });

  it('keeps default and host-arranged notes inside their ancestor frames', () => {
    const boxes = [{ id: 'o', kind: 'try', title: 'Outer', frame: true, node: {} }, { id: 'f', kind: 'try', title: 'Frame', frame: true, parentId: 'o', node: {} }, { ...graph.boxes[2], parentId: 'f' }];
    for (const arranged of [undefined, { boxes: { o: { x: 20, y: 20, width: 600, height: 400 }, f: { x: 40, y: 40, width: 320, height: 180 }, n: { x: 80, y: 120, width: 208 } } }]) {
      const element = new ProcessModeler();
      if (arranged) element.model = { project: doc => doc as ProcessProjection, arrange: () => arranged };
      element.document = { boxes, lines: [] }; document.body.append(element);
      const { f, n } = element.layout.boxes;
      expect(n.x).toBeGreaterThanOrEqual(f.x); expect(n.y).toBeGreaterThanOrEqual(f.y);
      expect(n.x + (n.width ?? 208)).toBeLessThanOrEqual(f.x + (f.width ?? 320));
      expect(n.y + (n.height ?? 64)).toBeLessThanOrEqual(f.y + (f.height ?? 180));
      if (arranged) expect(n.y).toBe(120);
      element.remove();
    }
  });

  it('publishes first-render checks and readable state after natural note geometry is finalized', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, top: 0, left: 0, right: 208, bottom: 38.125, width: 208, height: 38.125, toJSON() {} });
    const element = new ProcessModeler();
    element.document = { ...graph, lines: [{ id: 'ab', from: 'a', to: 'b' }] };
    element.layout = { boxes: { a: { x: 40, y: 40 }, b: { x: 650, y: 40 }, n: { x: 300, y: 40, width: 208 } }, lines: { ab: [{ x: 350, y: 90 }] } };
    const published = vi.fn(); element.addEventListener('readable-projection-changed', published);
    document.body.append(element);
    expect((element as any).routedLines.get('ab').length).toBeGreaterThan(0);
    expect(element.readback.checks).toEqual([]); expect(element.readback.current).not.toBeNull();
    expect(published).toHaveBeenCalledTimes(1);
  });

  it('keeps a flow next insertion on its ordinary edge when associations are present', () => {
    const { element, key } = fixture();
    element.document = { ...graph, lines: [...graph.lines, { id: 'an', from: 'a', to: 'n', role: 'association' }] };
    element.select('a'); key('n');
    const insertion = (element as any).keyboardInsertion ?? (element as any).insertion;
    expect(insertion).toMatchObject({ type: 'insert', lineId: 'ab', from: 'a', to: 'b' });
  });
});
