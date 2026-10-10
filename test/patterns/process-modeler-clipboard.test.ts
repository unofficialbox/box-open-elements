import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProcessModeler, type ProcessProjection } from '../../src/patterns/process-modeler/index.js';
const original: ProcessProjection = { boxes: [
  { id: 'a', kind: 'call', title: 'Copy-time A', node: { action: 'original' } },
  { id: 'b', kind: 'call', title: 'Copy-time B', node: {} },
  { id: 'c', kind: 'call', title: 'External', node: {} },
], lines: [{ id: 'ab', from: 'a', to: 'b', label: 'Yes', weight: 0.4, dashed: true, fromSide: 'east' }, { id: 'bc', from: 'b', to: 'c' }] };
function fixture() {
  const builder = new ProcessModeler(); builder.document = structuredClone(original); document.body.append(builder);
  builder.layout = { boxes: { a: { x: 0, y: 0 }, b: { x: 320, y: 0 }, c: { x: 640, y: 0 } } };
  builder.selectMany(['a', 'b']);
  const canvas = builder.shadowRoot!.querySelector<HTMLElement>('[part=canvas]')!;
  const key = (key: string, metaKey = false) => { const event = new KeyboardEvent('keydown', { key, ctrlKey: !metaKey, metaKey, bubbles: true, cancelable: true }); canvas.dispatchEvent(event); return event; };
  return { builder, key };
}
afterEach(() => document.body.replaceChildren());
describe('Process Modeler host-owned immutable clipboard', () => {
  it.each(['edit', 'delete'])('pastes copy-time graph after source %s, then undoes from paste-time state', change => {
    const { builder, key } = fixture(); let sequence = 0; const captured = vi.fn();
    builder.addEventListener('process-copy-request', event => {
      const request = (event as CustomEvent).detail; captured(request.sourceIds);
      const source = structuredClone(builder.document!); const positions = builder.layout;
      const ids = new Set(request.sourceIds); const boxes = source.boxes.filter(box => ids.has(box.id)); const lines = source.lines.filter(line => ids.has(line.from) && ids.has(line.to));
      request.capture({ itemCount: boxes.length, paste: (paste: any) => {
        sequence++; const before = builder.document!; const beforeLayout = builder.layout;
        const id = (id: string) => `${id}-copy-${sequence}`;
        const added = structuredClone(boxes).map(box => ({ ...box, id: id(box.id) }));
        const after = { boxes: [...before.boxes, ...added], lines: [...before.lines, ...structuredClone(lines).map(line => ({ ...line, id: id(line.id), from: id(line.from), to: id(line.to) }))] };
        const layout = structuredClone(beforeLayout);
        for (const box of boxes) layout.boxes[id(box.id)] = { ...positions.boxes[box.id], x: positions.boxes[box.id].x + paste.offset.x, y: positions.boxes[box.id].y + paste.offset.y };
        builder.document = after; paste.accept({ layout, selectionIds: added.map(box => box.id), undo: () => { builder.document = before; }, redo: () => { builder.document = after; } });
        paste.accept({ undo: () => { throw Error('duplicate acceptance'); }, redo() {} });
      } });
    });
    expect(key('c').defaultPrevented).toBe(true); expect(captured).toHaveBeenCalledWith(['a', 'b']);
    if (change === 'edit') {
      builder.document = { ...original, boxes: original.boxes.map(box => box.id === 'a' ? { ...box, title: 'Edited A', node: { action: 'changed' } } : box) };
      builder.layout = { boxes: { ...builder.layout.boxes, a: { x: 900, y: 900 } } };
    } else builder.document = { boxes: [original.boxes[2]], lines: [] };
    const beforePaste = builder.document; const beforeLayout = builder.layout;
    expect(key('v').defaultPrevented).toBe(true);
    expect(builder.document!.boxes.find(box => box.id === 'a-copy-1')).toMatchObject({ title: 'Copy-time A', node: { action: 'original' } });
    expect(builder.layout.boxes['a-copy-1']).toMatchObject({ x: 32, y: 32 });
    expect(builder.layout.boxes['b-copy-1']).toMatchObject({ x: 352, y: 32 });
    expect(builder.document!.lines.at(-1)).toMatchObject({ id: 'ab-copy-1', from: 'a-copy-1', to: 'b-copy-1', label: 'Yes', weight: 0.4, dashed: true, fromSide: 'east' });
    builder.undo(); expect(builder.document).toEqual(beforePaste); expect(builder.layout).toEqual(beforeLayout);
    expect(key('z').defaultPrevented).toBe(false); // Copy itself recorded no history.
    builder.redo(); expect(builder.selectedBoxes.map(box => box.id)).toEqual(['a-copy-1', 'b-copy-1']);
    key('v'); expect(builder.document!.boxes.filter(box => box.id.includes('-copy-'))).toHaveLength(4);
    expect(builder.document!.boxes.find(box => box.id === 'a-copy-2')!.title).toBe('Copy-time A');
    builder.undo(); expect(builder.document!.boxes.filter(box => box.id.includes('-copy-'))).toHaveLength(2);
  });
  it('passes only IDs and stores an opaque host capability without serializing host capture', () => {
    const { builder, key } = fixture(); const opaque: any = { action: () => 42 }; opaque.self = opaque;
    const paste = vi.fn(() => { expect(opaque.action()).toBe(42); expect(opaque.self).toBe(opaque); });
    builder.addEventListener('process-copy-request', event => (event as CustomEvent).detail.capture({ itemCount: 2, paste }));
    key('c', true); key('d'); key('v', true); expect(paste).toHaveBeenCalledOnce();
  });
  it('leaves unsupported Copy unhandled and never falls back to current-ID paste', () => {
    const { builder, key } = fixture(); const edits = vi.fn(); builder.addEventListener('process-edit-request', edits);
    expect(key('c').defaultPrevented).toBe(false); key('v'); expect(edits).not.toHaveBeenCalled();
    expect(builder.shadowRoot!.querySelector('[part=status]')!.textContent).toContain('not supported');
  });
  it.each([0, -1, 1.5, Infinity, NaN])('refuses malformed clipboard itemCount %s without a paste', itemCount => {
    const { builder, key } = fixture(); const paste = vi.fn();
    builder.addEventListener('process-copy-request', event => (event as CustomEvent).detail.capture({ itemCount, paste }));
    const before = builder.layout; key('c'); key('v'); expect(paste).not.toHaveBeenCalled(); expect(builder.layout).toEqual(before);
    expect(builder.shadowRoot!.querySelector('[part=status]')!.textContent).toContain('valid clipboard');
  });
  it('handles explicit refusals without falsely reporting copy or recording paste history', () => {
    const { builder, key } = fixture();
    builder.addEventListener('process-copy-request', event => (event as CustomEvent).detail.refuse('No graph capture available'));
    expect(key('c').defaultPrevented).toBe(true); expect(builder.shadowRoot!.querySelector('[part=status]')!.textContent).toBe('No graph capture available');
    expect(key('z').defaultPrevented).toBe(false);
  });
  it('ignores late capture and guards locked or reset-session pastes', () => {
    const { builder, key } = fixture(); let request: any;
    const delayed = (event: Event) => { request = (event as CustomEvent).detail; };
    builder.addEventListener('process-copy-request', delayed); expect(key('c').defaultPrevented).toBe(false);
    const latePaste = vi.fn(); request.capture({ itemCount: 2, paste: latePaste }); key('v'); expect(latePaste).not.toHaveBeenCalled();
    builder.removeEventListener('process-copy-request', delayed);
    const paste = vi.fn((paste: any) => { builder.load(structuredClone(original)); paste.accept({ layout: { boxes: {} }, undo() {}, redo() {} }); });
    builder.addEventListener('process-copy-request', event => (event as CustomEvent).detail.capture({ itemCount: 2, paste }));
    key('c'); builder.locked = true; key('v'); expect(paste).not.toHaveBeenCalled();
    builder.locked = false; key('v'); expect(paste).toHaveBeenCalledOnce(); expect(Object.keys(builder.layout.boxes)).toEqual(['a', 'b', 'c']);
    expect(key('z').defaultPrevented).toBe(false);
  });
  it.each(['load', 'disconnect'])('rejects capture and refusal after synchronous %s during Copy', reset => {
    const { builder, key } = fixture(); const paste = vi.fn();
    builder.addEventListener('process-copy-request', event => {
      const request = (event as CustomEvent).detail;
      if (reset === 'load') builder.load(structuredClone(original)); else builder.remove();
      request.capture({ itemCount: 2, paste });
      request.refuse('Stale refusal');
    });
    expect(key('c').defaultPrevented).toBe(false);
    if (reset === 'disconnect') document.body.append(builder);
    key('v'); expect(paste).not.toHaveBeenCalled();
    expect(builder.shadowRoot!.querySelector('[part=status]')!.textContent).not.toBe('Stale refusal');
    expect(key('z').defaultPrevented).toBe(false);
  });
  it.each(['load', 'disconnect'])('ignores stale paste refusal after synchronous %s', reset => {
    const { builder, key } = fixture();
    builder.addEventListener('process-copy-request', event => (event as CustomEvent).detail.capture({ itemCount: 2, paste: (request: any) => {
      if (reset === 'load') builder.load(structuredClone(original)); else builder.remove();
      request.refuse('Stale paste refusal');
    } }));
    key('c'); key('v');
    expect(builder.shadowRoot!.querySelector('[part=status]')!.textContent).not.toBe('Stale paste refusal');
    expect(key('z').defaultPrevented).toBe(false);
  });
  it('disposes a capture on disconnect and leaves typing shortcuts with the editor', () => {
    const { builder, key } = fixture(); const capture = vi.fn(); const dispose = vi.fn();
    builder.addEventListener('process-copy-request', event => { capture(); (event as CustomEvent).detail.capture({ itemCount: 2, paste: vi.fn(), dispose }); });
    const input = document.createElement('input'); builder.shadowRoot!.append(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true, cancelable: true })); expect(capture).not.toHaveBeenCalled();
    key('c'); builder.remove(); expect(dispose).toHaveBeenCalledOnce();
  });
  it('disposes replaced/reset capabilities and ignores deferred capture and acceptance', () => {
    const { builder, key } = fixture(); const dispose = vi.fn(); let copyRequest: any; let pasteRequest: any;
    builder.addEventListener('process-copy-request', event => { copyRequest = (event as CustomEvent).detail; copyRequest.capture({ itemCount: 2, dispose, paste: (request: any) => { pasteRequest = request; } }); });
    key('c'); key('c'); expect(dispose).toHaveBeenCalledOnce(); key('v');
    const before = builder.layout; pasteRequest.accept({ layout: { boxes: {} }, undo() {}, redo() {} }); expect(builder.layout).toEqual(before);
    builder.load(structuredClone(original)); expect(dispose).toHaveBeenCalledTimes(2);
    copyRequest.capture({ itemCount: 1, paste: vi.fn() }); key('v'); expect(dispose).toHaveBeenCalledTimes(2);
  });
});
