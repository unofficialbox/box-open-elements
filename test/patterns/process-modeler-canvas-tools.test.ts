import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProcessModeler, type ProcessProjection } from '../../src/patterns/process-modeler/index.js';
const graph: ProcessProjection = { boxes: ['a', 'b', 'c'].map(id => ({ id, title: id.toUpperCase(), kind: 'call', node: {} })), lines: [{ id: 'ab', from: 'a', to: 'b' }] };
afterEach(() => document.body.replaceChildren());
function fixture() {
  const element = new ProcessModeler(); element.initialView = '100'; document.body.append(element); element.load(structuredClone(graph));
  const root = element.shadowRoot!, canvas = root.querySelector<HTMLElement>('[part=canvas]')!;
  Object.defineProperties(canvas, { clientWidth: { value: 1000, configurable: true }, clientHeight: { value: 800, configurable: true } });
  element.layout = { boxes: { a: { x: 100, y: 100 }, b: { x: 400, y: 100 }, c: { x: 400, y: 400 } } }; element.setView({ x: 0, y: 0, zoom: 1 });
  const step = (id: string) => root.querySelector<HTMLElement>(`[data-box-id=${id}]`)!;
  const key = (key: string, target: Element = canvas, extra = {}) => { const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra }); target.dispatchEvent(event); return event; };
  const pointer = (type: string, x: number, y: number, extra = {}, target: Element = canvas) => { const event = new Event(type, { bubbles: true, cancelable: true }); Object.assign(event, { pointerId: 1, button: 0, clientX: x, clientY: y, ...extra }); target.dispatchEvent(event); };
  return { element, root, canvas, step, key, pointer };
}
describe('Process Modeler canvas tools', () => {
  it('reflects modes, normalizes unknown tools and emits one typed event per actual change', () => {
    const { element, root } = fixture(), tool = vi.fn(), several = vi.fn();
    element.addEventListener('canvastoolchange', tool); element.addEventListener('selectseveralchange', several);
    expect(element.canvasTool).toBe('hand'); expect(element.selectSeveral).toBe(false);
    element.canvasTool = 'pointer'; element.canvasTool = 'pointer';
    expect(tool).toHaveBeenCalledOnce(); expect(tool.mock.calls[0][0].detail).toEqual({ canvasTool: 'pointer' });
    expect(tool.mock.calls[0][0].composed).toBe(true); expect(tool.mock.calls[0][0].bubbles).toBe(true);
    element.setAttribute('canvas-tool', 'unknown'); expect(element.canvasTool).toBe('hand'); expect(tool).toHaveBeenCalledTimes(2);
    element.removeAttribute('canvas-tool'); expect(tool).toHaveBeenCalledTimes(2);
    element.selectSeveral = true; element.setAttribute('select-several', 'yes');
    expect(several).toHaveBeenCalledOnce(); expect(several.mock.calls[0][0].detail).toEqual({ selectSeveral: true });
    element.selectSeveral = false; expect(several).toHaveBeenCalledTimes(2);
    expect(root.querySelector('[data-command=tool-hand]')?.getAttribute('aria-pressed')).toBe('true');
    expect(root.querySelector('[data-command=select-several]')?.getAttribute('aria-pressed')).toBe('false');
    expect(root.querySelector('[part=port]')).not.toBeNull(); element.selectSeveral = true; expect(root.querySelector('[part=port]')).toBeNull();
  });
  it.each(['pointer', 'several'] as const)('restores %s selection cursor state after a move and refresh', mode => {
    const { element, canvas, pointer, step } = fixture();
    if (mode === 'pointer') element.canvasTool = 'pointer'; else element.selectSeveral = true;
    element.refresh(); expect(canvas.hasAttribute('data-pointer-tool')).toBe(true);
    pointer('pointerdown', 110, 110, {}, step('a'));
    pointer('pointermove', 140, 130);
    expect(canvas.dataset.gesture).toBe('move');
    pointer('pointerup', 140, 130);
    expect(canvas.hasAttribute('data-gesture')).toBe(false);
    expect(canvas.hasAttribute('data-pointer-tool')).toBe(true);
    element.canvasTool = 'hand'; element.selectSeveral = false;
    expect(canvas.hasAttribute('data-pointer-tool')).toBe(false);
  });
  it('honors pre-connected modes and exposes persistent host controls', () => {
    const element = new ProcessModeler(); element.canvasTool = 'pointer'; element.selectSeveral = true;
    const button = document.createElement('button'); button.slot = 'controls-extra'; button.textContent = 'Host action'; element.append(button); document.body.append(element);
    const slot = element.shadowRoot!.querySelector<HTMLSlotElement>('slot[name=controls-extra]')!;
    expect(slot.assignedElements()).toEqual([button]);
    element.refresh(); expect(element.shadowRoot!.querySelector('slot[name=controls-extra]')).toBe(slot);
    expect(element.shadowRoot!.querySelector('[data-command=tool-pointer]')?.getAttribute('aria-pressed')).toBe('true');
    expect(element.shadowRoot!.querySelector('[data-command=select-several]')?.getAttribute('aria-pressed')).toBe('true');
  });
  it('switches tools by controls and V/H without consuming editable fields or modified shortcuts', () => {
    const { element, root, canvas, key } = fixture();
    key('v'); expect(element.canvasTool).toBe('pointer'); key('H'); expect(element.canvasTool).toBe('hand');
    key('v', canvas, { ctrlKey: true }); expect(element.canvasTool).toBe('hand');
    const hand = root.querySelector<HTMLElement>('[data-command=tool-hand]')!; hand.focus(); key('v', hand); expect(element.canvasTool).toBe('pointer'); key('h', hand); expect(element.canvasTool).toBe('hand');
    const prevented = new KeyboardEvent('keydown', { key: 'v', bubbles: true, cancelable: true }); prevented.preventDefault(); hand.dispatchEvent(prevented); expect(element.canvasTool).toBe('hand');
    const input = root.querySelector('input')!; expect(key('v', input).defaultPrevented).toBe(false); expect(element.canvasTool).toBe('hand');
    (root.querySelector('[data-command=tool-pointer]') as HTMLElement).click(); expect(element.canvasTool).toBe('pointer');
    (root.querySelector('[data-command=tool-hand]') as HTMLElement).click(); expect(element.canvasTool).toBe('hand');
    (root.querySelector('[data-command=select-several]') as HTMLElement).click(); expect(element.selectSeveral).toBe(true);
  });
  it('preserves selection across focus and Alt-arrow navigation, and Space toggles once per press', () => {
    const { element, step, key, root } = fixture(); element.select('a'); element.selectSeveral = true;
    step('b').focus(); expect(element.selectedBoxes.map(b => b.id)).toEqual(['a']);
    key(' ', step('b')); expect(element.selectedBoxes.map(b => b.id)).toEqual(['a', 'b']);
    key(' ', step('b'), { repeat: true }); expect(element.selectedBoxes).toHaveLength(2);
    expect(root.querySelector('[part=status]')?.textContent).toBe('Added: 2 steps selected');
    key(' ', step('b')); expect(element.selectedBoxes.map(b => b.id)).toEqual(['a']);
    expect(root.querySelector('[part=status]')?.textContent).toBe('Removed: 1 step selected');
    key('ArrowDown', step('b'), { altKey: true }); expect(root.activeElement).toBe(step('c')); expect(element.selectedBoxes.map(b => b.id)).toEqual(['a']);
    key(' ', step('c')); expect(element.selectedBoxes.map(b => b.id)).toEqual(['a', 'c']);
    element.selectSeveral = false; step('b').focus(); expect(element.selectedBoxes.map(b => b.id)).toEqual(['b']);
  });
  it('toggles steps without dropping mixed selection', () => {
    const { element, step, root } = fixture(); element.selectItems([{ type: 'line', id: 'ab' }]); element.selectSeveral = true;
    step('a').click(); expect(element.selection).toEqual([{ type: 'box', id: 'a' }, { type: 'line', id: 'ab' }]);
    step('a').click(); expect(element.selection).toEqual([{ type: 'line', id: 'ab' }]);
    expect(root.querySelector('[part=status]')?.textContent).toBe('Removed: 0 steps selected');
  });
  it('keeps legacy hand panning and Shift additive selection', () => {
    const { element, pointer, step } = fixture(); pointer('pointerdown', 30, 30); pointer('pointermove', 70, 60); pointer('pointerup', 70, 60);
    expect(element.view).toEqual({ x: 40, y: 30, zoom: 1 });
    step('a').dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
    step('b').dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true })); expect(element.selectedBoxes).toHaveLength(2);
  });
  it.each(['pointer', 'several', 'shift'])('background box selection works through %s', mode => {
    const { element, pointer } = fixture(); element.select('c');
    if (mode === 'pointer') element.canvasTool = 'pointer'; if (mode === 'several') element.selectSeveral = true;
    const extra = { shiftKey: mode === 'shift' };
    pointer('pointerdown', 50, 50, extra); pointer('pointermove', 650, 200, extra); pointer('pointerup', 650, 200, extra);
    expect(element.selectedBoxes.map(b => b.id).sort()).toEqual(mode === 'pointer' ? ['a', 'b'] : ['a', 'b', 'c']);
    expect(element.view).toEqual({ x: 0, y: 0, zoom: 1 });
  });
  it('Space on the canvas temporarily pans in pointer mode and releases on blur/key-up', () => {
    const { element, canvas, key, pointer } = fixture(); element.canvasTool = 'pointer'; key(' ');
    pointer('pointerdown', 20, 20); pointer('pointermove', 80, 70); pointer('pointerup', 80, 70);
    expect(element.view).toEqual({ x: 60, y: 50, zoom: 1 });
    canvas.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true })); expect(canvas.hasAttribute('data-space-pan')).toBe(false);
    key(' '); canvas.dispatchEvent(new FocusEvent('blur')); expect(canvas.hasAttribute('data-space-pan')).toBe(false);
  });
  it.each(['hand', 'pointer'] as const)('steps remain draggable with the %s tool', tool => {
    const { element, pointer, step } = fixture(); element.canvasTool = tool;
    pointer('pointerdown', 120, 120, {}, step('a')); pointer('pointermove', 160, 150); pointer('pointerup', 160, 150);
    expect(element.layout.boxes.a.x).toBe(140); expect(element.layout.boxes.a.y).toBe(130);
  });
  it('allows two-finger pinch to supersede a pointer marquee', () => {
    const { element, pointer } = fixture(); element.canvasTool = 'pointer';
    pointer('pointerdown', 30, 30); pointer('pointerdown', 130, 30, { pointerId: 2 });
    pointer('pointermove', 230, 30, { pointerId: 2 }); expect(element.view.zoom).toBe(2);
    pointer('pointerup', 230, 30, { pointerId: 2 }); pointer('pointerup', 30, 30);
  });
  it.each([[1000, 800, 900, 100], [1000, 800, 100, 900]])('centers a process with spare space and at least 20px margins', (width, height, w, h) => {
    const { element, canvas } = fixture(); Object.defineProperties(canvas, { clientWidth: { value: width }, clientHeight: { value: height } });
    element.load({ boxes: [{ id: 'a', title: 'A', kind: 'call', node: {} }], lines: [] }); element.layout = { boxes: { a: { x: -150, y: 75, width: w, height: h } } }; element.fit();
    const v = element.view, left = v.x - 150 * v.zoom, top = v.y + 75 * v.zoom;
    expect(left + w * v.zoom / 2).toBeCloseTo(width / 2); expect(top + h * v.zoom / 2).toBeCloseTo(height / 2);
    expect(left).toBeGreaterThanOrEqual(19.99); expect(top).toBeGreaterThanOrEqual(19.99);
  });
});

it('keeps a touch target stationary between pointerup, native focus and click', () => {
  const { element, pointer, step } = fixture(); element.selectSeveral = true;
  element.layout = { boxes: { a: { x: 10, y: 10 }, b: { x: 400, y: 100 }, c: { x: 400, y: 400 } } };
  const view = element.view;
  pointer('pointerdown', 30, 30, { pointerType: 'touch' }, step('a'));
  pointer('pointerup', 30, 30, { pointerType: 'touch' }, step('a'));
  step('a').focus(); expect(element.view).toEqual(view);
  step('a').click(); expect(element.selectedBoxes.map(b => b.id)).toEqual(['a']);
});

it('Enter retains explicit edit-focused-step behavior while Space remains additive', () => {
  const { element, step, key } = fixture(); element.select('a'); element.selectSeveral = true;
  step('b').focus(); key('Enter', step('b')); expect(element.selectedBoxes.map(b => b.id)).toEqual(['b']);
});
