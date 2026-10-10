import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProcessModeler, type ProcessProjection } from '../../src/patterns/process-modeler/index.js';
const graph: ProcessProjection = { boxes: [
  { id: 'a', kind: 'custom-source', title: 'Source', node: {} },
  { id: 'b', kind: 'custom-target', title: 'Target', node: {} },
  { id: 'c', kind: 'custom-target', title: 'Other', node: {} },
], lines: [{ id: 'ab', from: 'a', to: 'b', fromSide: 'east', toSide: 'west', points: [{ x: 250, y: 32 }], label: 'Keep', weight: 0.4, dashed: true }] };
function fixture() {
  const builder = new ProcessModeler(); builder.document = structuredClone(graph); document.body.append(builder);
  builder.layout = { boxes: { a: { x: 0, y: 0 }, b: { x: 400, y: 0 }, c: { x: 800, y: 0 } }, lines: { ab: [{ x: 300, y: 32 }, { x: 300, y: 60 }] } };
  builder.setView({ x: 0, y: 0, zoom: 1 });
  return { builder, root: builder.shadowRoot!, canvas: builder.shadowRoot!.querySelector<HTMLElement>('[part=canvas]')! };
}
function pointer(target: Element, type: string, x: number, y: number) {
  const event = new Event(type, { bubbles: true, cancelable: true }); Object.assign(event, { clientX: x, clientY: y, pointerId: 1, button: 0 }); target.dispatchEvent(event);
}
afterEach(() => document.body.replaceChildren());
describe('Process Modeler host connection rules and atomic route reset', () => {
  it('uses host rules for hover and rechecks at drop without edit or history on refusal', () => {
    const { builder, root, canvas } = fixture(); let reason: string | null = 'Host says no';
    const check = vi.fn(() => reason); builder.model = { project: doc => doc as ProcessProjection, connectionProblem: check };
    const requests = vi.fn(); builder.addEventListener('process-edit-request', requests);
    pointer(root.querySelector('[data-owner=a][data-side=east]')!, 'pointerdown', 224, 32); pointer(canvas, 'pointermove', 400, 32);
    expect(root.querySelector('[part=connect-tooltip]')!.textContent).toBe('Host says no');
    expect(root.querySelector<HTMLElement>('[data-box-id=b]')!.dataset.connectInvalid).toBe('true');
    expect(root.querySelector('[part=port][data-hot=true]')).toBeNull();
    reason = null; pointer(canvas, 'pointermove', 400, 32);
    expect(root.querySelector<HTMLElement>('[part=connect-tooltip]')!.dataset.invalid).toBe('false');
    reason = 'Changed at drop'; pointer(canvas, 'pointerup', 400, 32);
    expect(requests).not.toHaveBeenCalled(); expect(root.querySelector('[part=connect-tooltip]')).toBeNull();
    expect(root.querySelector('[part=urgent-status]')!.textContent).toBe('Changed at drop');
    expect(root.querySelector('[data-connect-invalid=true]')).toBeNull();
    expect(check.mock.calls.at(-1)![1]).toEqual({ from: 'a', to: 'b' });
    builder.undo(); expect(builder.document).toEqual(graph);
  });
  it.each(['from', 'to'] as const)('resolves reattached %s with the unchanged endpoint and ignored existing line', end => {
    const { builder, root, canvas } = fixture(); const check = vi.fn(() => 'Rejected replacement');
    builder.model = { project: doc => doc as ProcessProjection, connectionProblem: check };
    const requests = vi.fn(); builder.addEventListener('process-edit-request', requests); builder.selectLine('ab');
    pointer(root.querySelector(`[part=end-grip][data-end=${end}]`)!, 'pointerdown', end === 'from' ? 224 : 400, 32);
    pointer(canvas, 'pointermove', 850, 32);
    expect(root.querySelector('[part=connect-tooltip]')!.textContent).toBe('Rejected replacement');
    pointer(canvas, 'pointerup', 850, 32); expect(requests).not.toHaveBeenCalled();
    expect(check.mock.calls.at(-1)![1]).toEqual({ from: end === 'from' ? 'c' : 'a', to: end === 'to' ? 'c' : 'b', ignoreLineId: 'ab' });
  });
  it('clears rejected reattachment preview on Escape before later pointer events', () => {
    const { builder, root, canvas } = fixture(); builder.model = { project: doc => doc as ProcessProjection, connectionProblem: () => 'Rejected' };
    const requests = vi.fn(); builder.addEventListener('process-edit-request', requests); builder.selectLine('ab');
    pointer(root.querySelector('[part=end-grip][data-end=to]')!, 'pointerdown', 400, 32); pointer(canvas, 'pointermove', 850, 32);
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    pointer(canvas, 'pointermove', 850, 32); pointer(canvas, 'pointerup', 850, 32);
    expect(requests).not.toHaveBeenCalled(); expect(root.querySelector('[part=connection-preview]')).toBeNull(); expect(root.querySelector('[part=connect-tooltip]')).toBeNull();
    expect(root.querySelector('[data-connect-invalid=true]')).toBeNull();
  });
  it('gates public and keyboard connection requests while preserving hosts without a rule', () => {
    const { builder, root, canvas } = fixture(); const requests = vi.fn(); builder.addEventListener('process-edit-request', requests);
    builder.model = { project: doc => doc as ProcessProjection, connectionProblem: () => 'Rule' };
    builder.requestEdit({ type: 'connect', from: 'a', to: 'c' }); builder.requestEdit({ type: 'reattach', lineId: 'ab', to: 'c' });
    builder.select('a'); canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }));
    root.querySelector('[data-box-id=c]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(requests).not.toHaveBeenCalled();
    builder.model = { project: doc => doc as ProcessProjection }; builder.requestEdit({ type: 'connect', from: 'a', to: 'c' }); expect(requests).toHaveBeenCalledOnce();
  });
  it.each([false, true])('resets pins, host points and local bends as one accepted transaction (layout supplied=%s)', suppliedLayout => {
    const { builder, root } = fixture(); const before = builder.document!; const beforeLayout = builder.layout;
    builder.addEventListener('process-edit-request', event => {
      const request = (event as CustomEvent).detail; expect(request).toMatchObject({ type: 'reset-line', lineId: 'ab' });
      const after = { ...before, lines: before.lines.map(({ fromSide, toSide, points, ...line }) => line) }; builder.document = after;
      const command = { ...(suppliedLayout ? { layout: beforeLayout } : {}), undo: () => { builder.document = before; }, redo: () => { builder.document = after; } };
      request.accept(command); request.accept(command);
    });
    builder.selectLine('ab'); root.querySelector<HTMLButtonElement>('[data-selection-command=reset-line]')!.click();
    expect(builder.document!.lines[0]).toEqual({ id: 'ab', from: 'a', to: 'b', label: 'Keep', weight: 0.4, dashed: true });
    expect(builder.layout.lines?.ab).toBeUndefined(); expect(root.querySelector('[part=pinned-end]')).toBeNull();
    builder.undo(); expect(builder.document).toEqual(before); expect(builder.layout).toEqual(beforeLayout);
    builder.undo(); expect(builder.document).toEqual(before);
    builder.redo(); expect(builder.layout.lines?.ab).toBeUndefined(); expect(builder.document!.lines[0].fromSide).toBeUndefined();
  });
  it.each([{ fromSide: 'east' as const }, { toSide: 'west' as const }, { points: [{ x: 250, y: 32 }] }])('updates Reset eligibility after host-only route state changes without reselection %j', authored => {
    const { builder, root } = fixture(); const automatic = { ...graph, lines: [{ id: 'ab', from: 'a', to: 'b' }] };
    builder.document = automatic; builder.layout = { boxes: builder.layout.boxes }; builder.selectLine('ab');
    expect(root.querySelector('[data-selection-command=reset-line]')).toBeNull();
    builder.document = { ...automatic, lines: [{ ...automatic.lines[0], ...authored }] };
    expect(root.querySelector('[data-selection-command=reset-line]')).not.toBeNull();
    builder.document = automatic;
    expect(root.querySelector('[data-selection-command=reset-line]')).toBeNull(); expect(builder.selectedLine!.id).toBe('ab');
  });
  it.each(['connect', 'reattach'] as const)('validates premount public %s proposals without touching absent DOM', type => {
    const builder = new ProcessModeler(); const check = vi.fn(() => 'Refused before mount');
    builder.model = { project: doc => doc as ProcessProjection, connectionProblem: check }; builder.document = structuredClone(graph);
    const requests = vi.fn(); builder.addEventListener('process-edit-request', requests);
    expect(() => builder.requestEdit(type === 'reattach' ? { type, lineId: 'ab', to: 'c' } : { type, from: 'a', to: 'c' })).not.toThrow();
    expect(check.mock.calls.at(-1)![1]).toEqual({ from: 'a', to: 'c', ...(type === 'reattach' ? { ignoreLineId: 'ab' } : {}) });
    expect(requests).not.toHaveBeenCalled();
    expect(check.mock.calls.at(-1)![2]).toEqual(graph);
  });
  it('offers pins-only Reset and preserves refused or locked state without local optimistic edits', () => {
    const { builder, root } = fixture(); builder.layout = { boxes: builder.layout.boxes }; builder.selectLine('ab');
    const requests = vi.fn(); builder.addEventListener('process-edit-request', requests);
    const button = root.querySelector<HTMLButtonElement>('[data-selection-command=reset-line]'); expect(button).not.toBeNull(); button!.click();
    expect(requests).toHaveBeenCalledOnce(); expect(root.querySelectorAll('[part=pinned-end]')).toHaveLength(2);
    const before = builder.layout; builder.locked = true; builder.resetLine('ab'); expect(requests).toHaveBeenCalledOnce(); expect(builder.layout).toEqual(before);
  });
});
