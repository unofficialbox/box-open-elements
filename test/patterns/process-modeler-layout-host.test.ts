import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProcessModeler, type ProcessLayout, type ProcessProjection, type ProcessLayoutEditRequest } from '../../src/patterns/process-modeler/index.js';
const graph: ProcessProjection = { boxes: [
  { id: 'a', kind: 'custom', title: 'A', node: { section: null } },
  { id: 'b', kind: 'custom', title: 'B', node: { section: null } },
], lines: [{ id: 'ab', from: 'a', to: 'b', fromSide: 'east', toSide: 'west', points: [{ x: 300, y: 32 }], label: 'Keep' }] };
function fixture() {
  const b = new ProcessModeler(); b.document = structuredClone(graph); document.body.append(b);
  b.layout = { boxes: { a: { x: 100, y: 101 }, b: { x: 500, y: 205 } }, lines: { ab: [{ x: 350, y: 30 }] }, notes: [{ id: 'note', text: 'About A', x: 0, y: 0 }] };
  b.history.clear(); return b;
}
function host(b: ProcessModeler, callback: (request: ProcessLayoutEditRequest) => void) {
  b.model = { project: doc => doc as ProcessProjection, layoutEdit: (_doc, request) => callback(request) };
}
afterEach(() => document.body.replaceChildren());
describe('host-owned atomic Tidy and sections', () => {
  it('tidies document routes, associated notes and layout in one accepted undo/redo', () => {
    const b = fixture(); const beforeDoc = b.document; const before = b.layout;
    const afterDoc = structuredClone(graph); delete afterDoc.lines[0].fromSide; delete afterDoc.lines[0].toSide; delete afterDoc.lines[0].points;
    const after: ProcessLayout = { boxes: { a: { x: 96, y: 144 }, b: { x: 400, y: 144 } }, notes: [{ id: 'note', text: 'About A', x: 128, y: 40 }], lines: {} };
    const apply = vi.fn(request => { expect(request.type).toBe('tidy'); expect(request.sourceIds).toBeNull(); expect(request.layout).toEqual(before); b.document = afterDoc; request.accept({ layout: after, undo: () => { b.document = beforeDoc; }, redo: () => { b.document = afterDoc; } }); });
    host(b, apply); b.tidy(); expect(apply).toHaveBeenCalledOnce(); expect(b.layout).toEqual(after); expect(b.document).toEqual(afterDoc);
    b.undo(); expect(b.layout).toEqual(before); expect(b.document).toEqual(beforeDoc); expect(b.history.canUndo).toBe(false);
    b.redo(); expect(b.layout).toEqual(after); expect(b.document).toEqual(afterDoc);
  });
  it('routes selected Tidy to the host without optimistically moving boxes on refusal', () => {
    const b = fixture(); b.selectMany(['a', 'b']); const before = b.layout;
    const apply = vi.fn(request => { expect(request.sourceIds).toEqual(['a', 'b']); request.refuse('Keep the routes'); });
    host(b, apply); b.shadowRoot!.querySelector<HTMLButtonElement>('[data-selection-command=space]')!.click();
    expect(apply).toHaveBeenCalledOnce(); expect(b.layout).toEqual(before); expect(b.history.canUndo).toBe(false); expect(b.shadowRoot!.querySelector('[part=urgent-status]')?.textContent).toBe('Keep the routes');
  });
  it('creates host section membership and selects the new section in one transaction even for one root', () => {
    const b = fixture(); b.select('a'); const beforeDoc = b.document; const before = b.layout;
    const afterDoc = structuredClone(graph); afterDoc.boxes[0].node = { section: 'section' }; afterDoc.boxes.push({ id: 'section', kind: 'section', title: 'New group', node: {}, frame: true });
    const after = { ...before, boxes: { ...before.boxes, section: { x: 64, y: 48, width: 256, height: 192 } } };
    const apply = vi.fn(request => { expect(request.type).toBe('make-section'); expect(request.sourceIds).toEqual(['a']); expect(request.title).toBe('New group'); b.document = afterDoc; request.accept({ layout: after, selectionIds: ['section'], undo: () => { b.document = beforeDoc; }, redo: () => { b.document = afterDoc; } }); });
    host(b, apply); b.makeSection('New group'); expect(apply).toHaveBeenCalledOnce(); expect(b.selected?.id).toBe('section'); expect(b.layout).toEqual(after);
    b.undo(); expect(b.selected?.id).toBe('a'); expect(b.document).toEqual(beforeDoc); expect(b.layout).toEqual(before);
    b.redo(); expect(b.selected?.id).toBe('section'); expect(b.document).toEqual(afterDoc); expect(b.layout).toEqual(after);
  });
  it('does not fall back to local sections when the capable host refuses or leaves the request unhandled', () => {
    const b = fixture(); b.selectMany(['a', 'b']); const before = b.layout;
    const apply = vi.fn(request => request.refuse('No eligible roots')); host(b, apply); b.makeSection(); expect(apply).toHaveBeenCalledOnce(); expect(b.layout).toEqual(before); expect(b.history.canUndo).toBe(false);
    host(b, () => {}); b.makeSection(); expect(b.layout).toEqual(before); expect(b.history.canUndo).toBe(false);
  });
  it('detaches request layout and source IDs, settles once, and ignores deferred acceptance', () => {
    const b = fixture(); b.selectMany(['a', 'b']); const before = b.layout; let saved: any;
    host(b, request => { saved = request; request.layout.boxes.a.x = -999; request.refuse(); request.accept({ layout: request.layout, undo() {}, redo() {} }); });
    b.makeSection(); expect(b.layout).toEqual(before); expect(b.history.canUndo).toBe(false);
    saved.accept({ layout: before, undo() {}, redo() {} }); expect(b.history.canUndo).toBe(false);
    host(b, request => { saved = request; }); b.tidy(); saved.accept({ layout: { ...before, boxes: { a: { x: -1, y: -1 }, b: { x: -2, y: -2 } } }, undo() {}, redo() {} }); expect(b.layout).toEqual(before); expect(b.history.canUndo).toBe(false);
  });
  it('invalidates a pending host operation across load and disconnect and rejects missing accepted layout', () => {
    const b = fixture(); let saved: any; host(b, request => { saved = request; b.load(structuredClone(graph), { version: 'fresh' }); request.accept({ layout: request.layout, undo() {}, redo() {} }); });
    b.tidy(); expect(b.history.canUndo).toBe(false);
    host(b, request => { saved = request; b.remove(); request.accept({ layout: request.layout, undo() {}, redo() {} }); }); b.tidy(); expect(b.history.canUndo).toBe(false);
    document.body.append(b); host(b, request => request.accept({ undo() {}, redo() {} } as any)); b.tidy(); expect(b.history.canUndo).toBe(false);
    saved?.accept({ layout: b.layout, undo() {}, redo() {} }); expect(b.history.canUndo).toBe(false);
  });
  function reentrantFixture(observer: (b: ProcessModeler) => void, replaceDocument = false) {
    const b = fixture(), before = b.layout, beforeDoc = structuredClone(b.document as ProcessProjection);
    const after = { ...before, boxes: { ...before.boxes, a: { x: 96, y: 144 } }, lines: {} };
    const applyTidy = () => {
      const doc = b.document as ProcessProjection;
      delete doc.lines[0].points; delete doc.lines[0].fromSide; delete doc.lines[0].toSide;
    };
    host(b, request => {
      applyTidy();
      if (replaceDocument) b.document = structuredClone(b.document);
      request.accept({ layout: after,
        undo: () => { b.document = structuredClone(beforeDoc); },
        redo: () => { const doc = structuredClone(beforeDoc); delete doc.lines[0].points; delete doc.lines[0].fromSide; delete doc.lines[0].toSide; b.document = doc; },
      });
    });
    b.addEventListener('projection-changed', () => observer(b), { once: true });
    b.tidy(); return { b, before, beforeDoc, after };
  }
  it('records accepted Tidy before a synchronous projection observer move', () => {
    const { b, before, beforeDoc, after } = reentrantFixture(b => b.move('a', 160, 144));
    expect(b.layout.boxes.a.x).toBe(160);
    b.undo(); expect(b.layout).toEqual(after); expect((b.document as ProcessProjection).lines[0].points).toBeUndefined();
    b.undo(); expect(b.layout).toEqual(before); expect(b.document).toEqual(beforeDoc); expect(b.history.canUndo).toBe(false);
    b.redo(); expect(b.layout).toEqual(after); expect((b.document as ProcessProjection).lines[0].fromSide).toBeUndefined();
    b.redo(); expect(b.layout.boxes.a.x).toBe(160); expect(b.history.canRedo).toBe(false);
  });
  it('drains accepted layout notifications before observer mutations so persisted state stays current', () => {
    const layouts: number[] = [], positions: number[] = [];
    const { b } = reentrantFixture(b => {
      b.addEventListener('layout-changed', (event: Event) => layouts.push((event as CustomEvent).detail.layout.boxes.a.x));
      b.addEventListener('positions-changed', (event: Event) => positions.push((event as CustomEvent).detail.positions.find((p: any) => p.id === 'a').position.x));
      b.move('a', 160, 144);
    });
    expect(layouts).toEqual([96, 160]);
    expect(positions).toEqual([96, 160]);
    expect(layouts.at(-1)).toBe(b.layout.boxes.a.x);
    expect(positions.at(-1)).toBe(b.layout.boxes.a.x);
  });
  it('also defers a host document assignment before acceptance until history is complete', () => {
    const { b, before, after } = reentrantFixture(b => b.move('a', 160, 144), true);
    expect(b.layout.boxes.a.x).toBe(160);
    b.undo(); expect(b.layout).toEqual(after);
    b.undo(); expect(b.layout).toEqual(before); expect(b.history.canUndo).toBe(false);
  });
  it('does not resume stale accepted history or notifications after an observer loads another document', () => {
    const other: ProcessProjection = { boxes: [{ id: 'fresh', kind: 'custom', title: 'Fresh', node: {} }], lines: [] };
    const staleReadable: string[][] = []; let loaded = false;
    const { b } = reentrantFixture(b => {
      b.addEventListener('readable-projection-changed', (event: Event) => {
        if (loaded) staleReadable.push((event as CustomEvent).detail.projection.boxes.map((box: any) => box.id));
      });
      loaded = true; b.load(other, { version: 'fresh' });
    });
    expect(b.document).toBe(other); expect(b.history.canUndo).toBe(false); expect(b.history.canRedo).toBe(false);
    expect(staleReadable.every(ids => ids.length === 1 && ids[0] === 'fresh')).toBe(true);
    const next = b.layout; b.undo(); expect(b.document).toBe(other); expect(b.layout).toEqual(next);
  });
  it('blocks host layout edits while locked and keeps legacy local fallback for hosts without the capability', () => {
    const b = fixture(); b.selectMany(['a', 'b']); const apply = vi.fn(); host(b, apply); b.locked = true; const before = b.layout; b.tidy(); b.makeSection(); expect(apply).not.toHaveBeenCalled(); expect(b.layout).toEqual(before);
    b.locked = false; b.model = { project: doc => doc as ProcessProjection }; b.makeSection(); expect(b.layout.sections).toHaveLength(1); b.undo(); expect(b.layout).toEqual(before);
  });
});
