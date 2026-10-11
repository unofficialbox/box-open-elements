import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProcessModeler, type ProcessProjection } from '../../src/patterns/process-modeler/index.js';
const graph: ProcessProjection = { boxes: Array.from({ length: 15 }, (_, i) => ({ id: String(i), kind: 'call', title: `Step ${i}`, node: {}, path: ['body', i] })), lines: Array.from({ length: 14 }, (_, i) => ({ id: `line${i}`, from: String(i), to: String(i + 1) })) };
afterEach(() => { document.body.replaceChildren(); vi.unstubAllGlobals(); });
function fixture(hostWidth = 1440, width = 1040, height = 750) {
  let resize!: ResizeObserverCallback;
  vi.stubGlobal('ResizeObserver', class { constructor(callback: ResizeObserverCallback) { resize = callback; } observe() {} disconnect() {} });
  const element = new ProcessModeler(); Object.defineProperty(element, 'clientWidth', { configurable: true, value: hostWidth });
  document.body.append(element);
  const canvas = element.shadowRoot!.querySelector<HTMLElement>('[part=canvas]')!;
  const measure = (w = width, h = height) => { Object.defineProperty(canvas, 'clientWidth', { configurable: true, value: w }); Object.defineProperty(canvas, 'clientHeight', { configurable: true, value: h }); };
  measure();
  return { element, canvas, measure, resize: () => resize([{ target: canvas, contentRect: { width, height } } as ResizeObserverEntry], {} as ResizeObserver) };
}
describe('Process Modeler initial view', () => {
  it.each([[1440, 1040, .7], [390, 390, .55]])('fits repeated loads at a readable zoom (%s)', (host, width, zoom) => {
    const { element } = fixture(host, width); element.load(structuredClone(graph)); expect(element.view.zoom).toBe(zoom);
    expect(element.view.x + element.layout.boxes['0'].x * zoom).toBe(width < 600 ? 24 : 64);
    element.setView({ x: -900, y: -300, zoom: 1.8 }); element.load(structuredClone(graph)); expect(element.view.zoom).toBe(zoom);
  });
  it('reveals controlled selection without zoom changes, echoed events, or external focus loss', () => {
    const { element, measure, resize } = fixture(); element.load(graph);
    const events = vi.fn(); element.addEventListener('selection-changed', events);
    const outside = document.createElement('input'); document.body.append(outside); outside.focus();
    const zoom = element.view.zoom; element.selectedPath = ['body', 14];
    expect(element.view.zoom).toBe(zoom); expect(element.view.x).toBeLessThan(-1000); expect(events).not.toHaveBeenCalled(); expect(document.activeElement).toBe(outside);
    const revealed = element.view; element.selectedPath = ['body', 14]; expect(element.view).toEqual(revealed);
    measure(0, 0); element.selectedPath = ['body', 0]; expect(element.view).toEqual(revealed);
    measure(); resize(); expect(element.view.x).toBeGreaterThan(-1000); expect(events).not.toHaveBeenCalled();
  });
  it('reveals a selected load after hidden initial fit and cancels stale reveal on deselection', () => {
    const { element, measure, resize } = fixture(); measure(0, 0); element.load(graph, { selectedPath: ['body', 14] });
    measure(); resize(); expect(element.view.zoom).toBe(.7); expect(element.view.x).toBeLessThan(-1000);
    measure(0, 0); element.selectedPath = ['body', 0]; element.selectedPath = null; const view = element.view;
    measure(); resize(); expect(element.view).toEqual(view);
    measure(0, 0); element.selectedPath = ['body', 14]; element.selectMany(['0', '1']);
    measure(); resize(); expect(element.view).toEqual(view);
  });
  it('centers a small document without enlarging beyond 100%', () => {
    const { element } = fixture(); element.load({ boxes: graph.boxes.slice(0, 1), lines: [] });
    expect(element.view.zoom).toBe(1); expect(element.view.x).toBeGreaterThan(64); expect(element.view.y).toBeGreaterThan(72);
  });
  it('honors 100% and saved views, validates saved values, and preserves host echoes and resizes', () => {
    const { element, resize } = fixture(); element.initialView = '100'; element.load(graph); expect(element.view).toEqual({ x: 0, y: 0, zoom: 1 });
    element.initialView = 'fit'; const view = { x: -500, y: 87, zoom: 1.25 }; element.load(graph, { view }); view.x = 999; resize(); element.document = structuredClone(graph); expect(element.view).toEqual({ x: -500, y: 87, zoom: 1.25 });
    element.load(graph, { view: { x: NaN, y: 0, zoom: 1 } }); expect(element.view.zoom).toBe(.7);
  });
  it('waits for hidden canvas dimensions and lets an explicit view cancel a deferred fit', () => {
    const { element, measure, resize } = fixture(); measure(0, 0); element.load(graph); expect(element.view.zoom).toBe(1);
    measure(); resize(); expect(element.view.zoom).toBe(.7);
    measure(0, 0); element.load(graph); element.setView({ x: 12, y: 34, zoom: .9 }); measure(); resize(); expect(element.view).toEqual({ x: 12, y: 34, zoom: .9 });
  });
  it('retains pending fit across pre-connection load and reconnect, then fits only once', () => {
    const { element, measure, resize } = fixture(); element.remove(); measure(0, 0); element.load(graph); document.body.append(element); expect(element.view.zoom).toBe(1);
    measure(); resize(); const fitted = element.view; measure(500, 500); resize(); expect(element.view).toEqual(fitted);
  });
});
