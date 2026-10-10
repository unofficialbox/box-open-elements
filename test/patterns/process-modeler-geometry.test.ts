import { describe, expect, it } from "vitest";
import { arrangeProcess, lineMidpoint, nearProcessLine, routeProcessLine, roundedProcessPath, processPointAlong, processSegmentChain, processArrowPath, processLooseConnection } from "../../src/patterns/process-modeler/geometry.js";
import type { ProcessPoint } from "../../src/patterns/process-modeler/geometry.js";
import type { ProcessBox, ProcessLayout, ProcessLine, ProcessProjection, ProcessSide } from "../../src/patterns/process-modeler/model.js";

const box = (id: string, parentId?: string, frame = false): ProcessBox => ({ id, node: null, kind: frame ? "frame" : "step", title: id, parentId, frame });
const line = (from: string, to: string): ProcessLine => ({ id: `${from}-${to}`, from, to });
const projection = (ids: string[], lines: ProcessLine[] = []): ProcessProjection => ({ boxes: ids.map(id => box(id)), lines });

function orthogonal(points: ProcessPoint[]) {
  expect(points.length).toBeGreaterThan(1);
  for (let i = 1; i < points.length; i++) {
    expect(points[i].x === points[i - 1].x || points[i].y === points[i - 1].y).toBe(true);
  }
}

function avoids(points: ProcessPoint[], rect: { x: number; y: number; width: number; height: number }) {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const intersects = a.x === b.x
      ? a.x > rect.x && a.x < rect.x + rect.width && Math.max(a.y, b.y) > rect.y && Math.min(a.y, b.y) < rect.y + rect.height
      : a.y > rect.y && a.y < rect.y + rect.height && Math.max(a.x, b.x) > rect.x && Math.min(a.x, b.x) < rect.x + rect.width;
    expect(intersects).toBe(false);
  }
}

it("rounds orthogonal route turns without moving their endpoints", () => {
  expect(roundedProcessPath([{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 20 }])).toBe('M 0 0 L 12 0 Q 20 0 20 8 L 20 20');
  expect(roundedProcessPath([{ x: 0, y: 0 }, { x: 20, y: 0 }])).toBe('M 0 0 L 20 0');
});

describe("process arrangement", () => {
  it("layers a branch and merge left-to-right with stable vertical ordering", () => {
    const input = projection(["d", "c", "a", "b"], [line("a", "c"), line("c", "d"), line("a", "b"), line("b", "d")]);
    const before = structuredClone(input);
    const layout = arrangeProcess(input);
    expect(layout.boxes.a.x).toBeLessThan(layout.boxes.b.x);
    expect(layout.boxes.b.x).toBe(layout.boxes.c.x);
    expect(layout.boxes.b.y + layout.boxes.b.height!).toBeLessThan(layout.boxes.c.y);
    expect(layout.boxes.d.x).toBeGreaterThan(layout.boxes.c.x);
    expect(arrangeProcess({ boxes: [...input.boxes].reverse(), lines: [...input.lines].reverse() })).toEqual(layout);
    expect(input).toEqual(before);
  });

  it("sizes nested frames around layered children and collapses descendant edges", () => {
    const input: ProcessProjection = {
      boxes: [box("outer", undefined, true), box("inner", "outer", true), box("a", "inner"), box("b", "inner"), box("c", "outer"), box("z")],
      lines: [line("a", "b"), line("b", "c"), line("c", "z")],
    };
    const { boxes } = arrangeProcess(input);
    for (const child of input.boxes.filter(box => box.parentId)) {
      const position = boxes[child.id], parent = boxes[child.parentId!];
      expect(position.x).toBeGreaterThan(parent.x);
      expect(position.y).toBeGreaterThanOrEqual(parent.y + 64);
      expect(position.x + position.width!).toBeLessThan(parent.x + parent.width!);
      expect(position.y + position.height!).toBeLessThan(parent.y + parent.height!);
    }
    expect(boxes.a.x).toBeLessThan(boxes.b.x);
    expect(boxes.c.x).toBeGreaterThan(boxes.inner.x + boxes.inner.width!);
    expect(boxes.z.x).toBeGreaterThan(boxes.outer.x + boxes.outer.width!);
  });

  it("bounds cyclic and self-connected graphs deterministically", () => {
    const input = projection(["c", "b", "a", "self"], [line("a", "b"), line("b", "c"), line("c", "a"), line("self", "self")]);
    const layout = arrangeProcess(input);
    expect(Object.keys(layout.boxes)).toHaveLength(4);
    for (const position of Object.values(layout.boxes)) {
      expect(Object.values(position).every(Number.isFinite)).toBe(true);
    }
    expect(layout.boxes.a.x).toBeLessThan(layout.boxes.b.x);
    expect(layout.boxes.b.x).toBeLessThan(layout.boxes.c.x);
    expect(arrangeProcess({ boxes: [...input.boxes].reverse(), lines: [...input.lines].reverse() })).toEqual(layout);
  });

  it("handles empty graphs, disconnected boxes, duplicate edges, and empty frames", () => {
    expect(arrangeProcess(projection([]))).toEqual({ boxes: {} });
    const input: ProcessProjection = { boxes: [box("a"), box("b"), box("frame", undefined, true)], lines: [line("a", "b"), { ...line("a", "b"), id: "second" }] };
    const layout = arrangeProcess(input);
    expect(layout.boxes.b.x).toBeGreaterThan(layout.boxes.a.x);
    expect(layout.boxes.frame.width).toBe(320);
    expect(layout.boxes.frame.height).toBe(180);
    expect(layout.boxes.frame.y).toBeGreaterThan(layout.boxes.a.y);
  });
});

describe("process routing", () => {
  const edge = line("a", "b");
  const input = projection(["a", "b", "obstacle"], [edge]);
  const layout: ProcessLayout = { boxes: {
    a: { x: 0, y: 0, width: 100, height: 80 },
    b: { x: 500, y: 0, width: 100, height: 80 },
    obstacle: { x: 240, y: -20, width: 120, height: 120 },
  } };

  it('keeps a clear same-height connection straight between centered ports', () => {
    const clear = projection(['a', 'b'], [edge]);
    const positions = { boxes: { a: { x: 0, y: 0, width: 224, height: 64 }, b: { x: 320, y: 0, width: 224, height: 64 } } };
    expect(routeProcessLine(edge, positions, clear)).toEqual([{ x: 224, y: 32 }, { x: 320, y: 32 }]);
  });

  it.each([0, 1, 2, 3])('rejects close opposite pinned leads through quarter-turn %s', turns => {
    const sides: ProcessSide[] = ['east', 'south', 'west', 'north'];
    const rotate = (p: ProcessPoint) => {
      for (let i = 0; i < turns; i++) p = { x: -p.y, y: p.x };
      return p;
    };
    const rotateBox = (x: number) => {
      const points = [rotate({x,y:0}), rotate({x:x+100,y:0}), rotate({x,y:80}), rotate({x:x+100,y:80})];
      const xs=points.map(p=>p.x), ys=points.map(p=>p.y);
      return {x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
    };
    const positions = { boxes: { a: rotateBox(0), b: rotateBox(110) } };
    for (const pins of [
      {fromSide:sides[turns]}, {toSide:sides[(turns+2)%4]},
      {fromSide:sides[turns],toSide:sides[(turns+2)%4]}
    ]) {
      const pinned = {...edge,...pins};
      expect(routeProcessLine(pinned,positions,projection(['a','b'],[pinned]))).toEqual([]);
    }
    const automatic = routeProcessLine(edge,positions,projection(['a','b'],[edge]));
    orthogonal(automatic);avoids(automatic,positions.boxes.a);avoids(automatic,positions.boxes.b);
  });

  it.each([0, 1, 2, 3])('keeps endpoint bodies when the opposite stub enters their padding through quarter-turn %s', turns => {
    const sides: ProcessSide[] = ['north', 'east', 'south', 'west'];
    const rotate = (point: ProcessPoint) => {
      for (let i = 0; i < turns; i++) point = { x: -point.y, y: point.x };
      return point;
    };
    const rect = (x: number, y: number) => {
      const points = [rotate({x,y}), rotate({x:x+100,y}), rotate({x,y:y+80}), rotate({x:x+100,y:y+80})];
      const xs=points.map(p=>p.x), ys=points.map(p=>p.y);
      return {x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
    };
    const positions = {boxes:{a:rect(0,0),b:rect(105,45)}};
    for (const reverse of [false,true]) {
      const pinned: ProcessLine = reverse
        ? {id:'b-a',from:'b',to:'a',fromSide:sides[(turns+3)%4],toSide:sides[turns]}
        : {...edge,fromSide:sides[turns],toSide:sides[(turns+3)%4]};
      const points=routeProcessLine(pinned,positions,projection(['a','b'],[pinned]));
      orthogonal(points);avoids(points,positions.boxes.a);avoids(points,positions.boxes.b);
      expect(routeProcessLine(pinned,positions,projection(['b','a'],[pinned]))).toEqual(points);
    }
  });

  it("chooses native heading-aware endpoints and deterministically detours around obstacles", () => {
    const before = structuredClone(layout);
    const points = routeProcessLine(edge, layout, input);
    orthogonal(points);
    expect(points[0]).toEqual({ x: 50, y: 80 });
    expect(points.at(-1)).toEqual({ x: 550, y: 80 });
    avoids(points, { x: 228, y: -32, width: 144, height: 144 });
    avoids(points, { x: 0, y: 0, width: 100, height: 80 });
    avoids(points, { x: 500, y: 0, width: 100, height: 80 });
    expect(routeProcessLine(edge, layout, { ...input, boxes: [...input.boxes].reverse() })).toEqual(points);
    expect(layout).toEqual(before);
  });

  it("routes around multiple staggered obstacles", () => {
    const extra = { x: 380, y: -140, width: 60, height: 190 };
    const points = routeProcessLine(edge, { boxes: { ...layout.boxes, extra } }, { boxes: [...input.boxes, box("extra")], lines: [edge] });
    orthogonal(points);
    avoids(points, layout.boxes.obstacle as Required<typeof layout.boxes.obstacle>);
    avoids(points, extra);
  });

  it("routes when an endpoint or authored waypoint is within obstacle clearance", () => {
    const close = { x: 105, y: -20, width: 120, height: 120 };
    const crowded = { boxes: { ...layout.boxes, obstacle: close } };
    const points = routeProcessLine(edge, crowded, input);
    orthogonal(points);
    expect(points[0]).toEqual({ x: 50, y: 80 });
    avoids(points, close);
    const waypoint = { x: 230, y: -10 };
    const authored = routeProcessLine({ ...edge, points: [waypoint] }, crowded, input);
    orthogonal(authored);
    expect(authored).toContainEqual(waypoint);
    avoids(authored, close);
  });

  it("preserves interior waypoints and prefers layout overrides without mutating them", () => {
    const authored = [{ x: 140, y: -100 }, { x: 400, y: -100 }];
    const custom = { ...edge, points: [{ x: 200, y: 300 }] };
    const override = { ...layout, lines: { [edge.id]: authored } };
    const points = routeProcessLine(custom, override, input);
    orthogonal(points);
    for (const waypoint of authored) expect(points).toContainEqual(waypoint);
    expect(points).not.toContainEqual(custom.points[0]);
    expect(points[0]).toEqual({ x: 100, y: 0 });
    expect(points.at(-1)).toEqual({ x: 500, y: 0 });
    expect(authored).toEqual([{ x: 140, y: -100 }, { x: 400, y: -100 }]);
    const projected = routeProcessLine(custom, layout, input);
    expect(projected).toContainEqual(custom.points[0]);
    expect(routeProcessLine(custom, { ...layout, lines: { [edge.id]: [] } }, input)).not.toContainEqual(custom.points[0]);
  });

  it("uses native vertical defaults and spreads the additional backward connection", () => {
    const positions = { boxes: { a: { x: 0, y: 0 }, b: { x: 0, y: 300 } } };
    expect(routeProcessLine(edge, positions, projection(["a", "b"], [edge]))).toEqual([{ x: 112, y: 64 }, { x: 112, y: 300 }]);
    const backward = routeProcessLine(line("b", "a"), layout, input);
    expect(backward[0]).toEqual({ x: 534, y: 80 });
    expect(backward.at(-1)).toEqual({ x: 82, y: 80 });
  });

  const sides: ProcessSide[] = ["north", "east", "south", "west"];
  const sourcePorts = { north: { x: 50, y: 0 }, east: { x: 100, y: 40 }, south: { x: 50, y: 80 }, west: { x: 0, y: 40 } };
  const targetPorts = { north: { x: 550, y: 0 }, east: { x: 600, y: 40 }, south: { x: 550, y: 80 }, west: { x: 500, y: 40 } };
  // Exact pinned-engine routes, measured with these same rectangles and obstacle.
  const nativePinned = {"from pinned north":[{"x":50,"y":0},{"x":50,"y":-32},{"x":480,"y":-32},{"x":480,"y":40},{"x":500,"y":40}],"to pinned north":[{"x":100,"y":40},{"x":228,"y":40},{"x":228,"y":-32},{"x":550,"y":-32},{"x":550,"y":0}],"from pinned east":[{"x":100,"y":40},{"x":228,"y":40},{"x":228,"y":112},{"x":550,"y":112},{"x":550,"y":80}],"to pinned east":[{"x":50,"y":80},{"x":50,"y":112},{"x":620,"y":112},{"x":620,"y":40},{"x":600,"y":40}],"from pinned south":[{"x":50,"y":80},{"x":50,"y":112},{"x":550,"y":112},{"x":550,"y":80}],"to pinned south":[{"x":50,"y":80},{"x":50,"y":112},{"x":550,"y":112},{"x":550,"y":80}],"from pinned west":[{"x":0,"y":40},{"x":-20,"y":40},{"x":-20,"y":112},{"x":550,"y":112},{"x":550,"y":80}],"to pinned west":[{"x":50,"y":80},{"x":50,"y":112},{"x":480,"y":112},{"x":480,"y":40},{"x":500,"y":40}]} as Record<string, ProcessPoint[]>;
  it.each(sides)('preserves an explicit %s source port and uses native route choice for the target', side => {
    const points = routeProcessLine({ ...edge, fromSide: side }, layout, input);
    expect(points).toEqual(nativePinned['from pinned ' + side]);
    expect(points[0]).toEqual(sourcePorts[side]); orthogonal(points);
    avoids(points, layout.boxes.obstacle as Required<typeof layout.boxes.obstacle>); avoids(points, layout.boxes.a as Required<typeof layout.boxes.a>);
  });
  it.each(sides)('preserves an explicit %s target port and uses native route choice for the source', side => {
    const points = routeProcessLine({ ...edge, toSide: side }, layout, input);
    expect(points).toEqual(nativePinned['to pinned ' + side]);
    expect(points.at(-1)).toEqual(targetPorts[side]); orthogonal(points);
    avoids(points, layout.boxes.obstacle as Required<typeof layout.boxes.obstacle>); avoids(points, layout.boxes.b as Required<typeof layout.boxes.b>);
  });

  it("honors every source/target side combination alongside authored waypoints", () => {
    const waypoint = { x: 400, y: -100 };
    for (const fromSide of sides) for (const toSide of sides) {
      const custom = { ...edge, fromSide, toSide, points: [waypoint] };
      const points = routeProcessLine(custom, layout, input);
      orthogonal(points);
      expect(points[0]).toEqual(sourcePorts[fromSide]);
      expect(points.at(-1)).toEqual(targetPorts[toSide]);
      expect(points).toContainEqual(waypoint);
      avoids(points, layout.boxes.a as Required<typeof layout.boxes.a>);
      avoids(points, layout.boxes.b as Required<typeof layout.boxes.b>);
      avoids(points, layout.boxes.obstacle as Required<typeof layout.boxes.obstacle>);
    }
  });

  it("returns an empty route for blocked explicit ports rather than changing sides", () => {
    const sourceBlocked = { boxes: { ...layout.boxes, obstacle: { x: 20, y: -20, width: 60, height: 18 } } };
    expect(routeProcessLine({ ...edge, fromSide: "north" }, sourceBlocked, input)).toEqual([]);
    const targetBlocked = { boxes: { ...layout.boxes, obstacle: { x: 520, y: 82, width: 60, height: 18 } } };
    expect(routeProcessLine({ ...edge, toSide: "south" }, targetBlocked, input)).toEqual([]);
  });

  it("excludes all endpoint ancestor frames but still avoids unrelated frames", () => {
    const nested: ProcessProjection = { boxes: [box("outer", undefined, true), box("inner", "outer", true), box("a", "inner"), box("b"), box("obstacle", undefined, true)], lines: [edge] };
    const framed = { boxes: { ...layout.boxes, inner: { x: -20, y: -64, width: 170, height: 180 }, outer: { x: -40, y: -128, width: 220, height: 280 } } };
    const points = routeProcessLine(edge, framed, nested);
    orthogonal(points);
    avoids(points, layout.boxes.obstacle as Required<typeof layout.boxes.obstacle>);
    expect(points.at(-1)).toEqual({ x: 550, y: 80 });
  });

  it("uses frame defaults for endpoint geometry", () => {
    const framed: ProcessProjection = { boxes: [box("a", undefined, true), box("b")], lines: [edge] };
    expect(routeProcessLine(edge, { boxes: { a: { x: 0, y: 0 }, b: { x: 500, y: 42 } } }, framed)).toEqual([{ x: 320, y: 90 }, { x: 480, y: 90 }, { x: 480, y: 74 }, { x: 500, y: 74 }]);
  });

  it("handles self loops, duplicate waypoints, and degenerate endpoints", () => {
    const self = routeProcessLine(line("a", "a"), layout, input);
    orthogonal(self);
    expect(self[0]).not.toEqual(self.at(-1));
    avoids(self, { x: 0, y: 0, width: 100, height: 80 });
    const custom = { ...edge, points: [{ x: 160, y: 40 }, { x: 160, y: 40 }] };
    orthogonal(routeProcessLine(custom, layout, input));
    expect(routeProcessLine(edge, { boxes: { a: { x: 0, y: 0, width: 0, height: 0 }, b: { x: 0, y: 0, width: 0, height: 0 } } }, projection(["a", "b"]))).toEqual([{ x: 0, y: 0 }]);
  });

  it("fails closed for missing endpoints, blocked or nonfinite waypoints", () => {
    expect(routeProcessLine(edge, { boxes: {} }, input)).toEqual([]);
    expect(routeProcessLine({ ...edge, points: [{ x: 260, y: 40 }] }, layout, input)).toEqual([]);
    expect(routeProcessLine({ ...edge, points: [{ x: NaN, y: 40 }] }, layout, input)).toEqual([]);
    // A nonendpoint frame enclosing the source leaves no collision-free route.
    expect(routeProcessLine(edge, { boxes: { ...layout.boxes, obstacle: { x: -50, y: -50, width: 200, height: 200 } } }, input)).toEqual([]);
  });

  it("terminates when obstacles enclose an endpoint without covering its anchor", () => {
    const walls = {
      left: { x: -40, y: -40, width: 20, height: 160 },
      right: { x: 120, y: -40, width: 20, height: 160 },
      top: { x: -40, y: -40, width: 180, height: 20 },
      bottom: { x: -40, y: 100, width: 180, height: 20 },
    };
    const enclosed: ProcessProjection = { boxes: [box("a"), box("b"), ...Object.keys(walls).map(id => box(id))], lines: [edge] };
    expect(routeProcessLine(edge, { boxes: { a: layout.boxes.a, b: layout.boxes.b, ...walls } }, enclosed)).toEqual([]);
  });
});

describe("line geometry", () => {
  it("finds the arc-length midpoint of unequal segments", () => {
    expect(lineMidpoint([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 300 }])).toEqual({ x: 100, y: 100 });
    expect(lineMidpoint([{ x: 0, y: 0 }, { x: 30, y: 40 }])).toEqual({ x: 15, y: 20 });
  });

  it("handles empty, single, and zero-length midpoint paths", () => {
    expect(lineMidpoint([])).toEqual({ x: 0, y: 0 });
    const point = { x: 3, y: 4 };
    expect(lineMidpoint([point])).toEqual(point);
    expect(lineMidpoint([point])).not.toBe(point);
    expect(lineMidpoint([point, point])).toEqual(point);
    expect(lineMidpoint([point, point, { x: 3, y: 24 }])).toEqual({ x: 3, y: 14 });
  });

  it("hits segments at the inclusive tolerance, not an infinite extension", () => {
    const points = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 200 }];
    expect(nearProcessLine({ x: 50, y: 16 }, points)).toBe(true);
    expect(nearProcessLine({ x: 50, y: 17 }, points)).toBe(false);
    expect(nearProcessLine({ x: 110, y: 120 }, points)).toBe(true);
    expect(nearProcessLine({ x: -17, y: 0 }, points)).toBe(false);
    expect(nearProcessLine({ x: 50, y: 1 }, points, 0)).toBe(false);
    expect(nearProcessLine({ x: 50, y: 0 }, points, 0)).toBe(true);
  });

  it("handles diagonal, empty, single, repeated points and negative tolerance", () => {
    expect(nearProcessLine({ x: 50, y: 50 }, [{ x: 0, y: 0 }, { x: 100, y: 100 }], 0)).toBe(true);
    expect(nearProcessLine({ x: 0, y: 0 }, [])).toBe(false);
    expect(nearProcessLine({ x: 3, y: 4 }, [{ x: 0, y: 0 }], 5)).toBe(true);
    expect(nearProcessLine({ x: 3, y: 4 }, [{ x: 0, y: 0 }, { x: 0, y: 0 }], 4)).toBe(false);
    expect(nearProcessLine({ x: 0, y: 0 }, [{ x: 0, y: 0 }], -1)).toBe(false);
  });
});


describe('Native automatic event insertion ports', () => {
  const event = {...box('start'), kind: 'timer', shape: 'event' as const};
  const incoming = {id: 'start-task', from: 'start', to: 'task'};
  const outgoing = {id: 'task-next', from: 'task', to: 'next'};
  const layout: ProcessLayout = {boxes: {start: {x:404,y:52,width:56,height:56},task:{x:140,y:144,width:224,height:64},next:{x:460,y:144,width:224,height:64}}};
  const graph: ProcessProjection = {boxes:[event,box('task'),box('next')],lines:[incoming,outgoing]};
  it('uses native event inset and shared task-side allocation for actual Insert midpoint', () => {
    const points=routeProcessLine(incoming,layout,graph);
    expect(points).toEqual([{x:432,y:100},{x:432,y:160},{x:364,y:160}]);
    expect(lineMidpoint(points)).toEqual({x:428,y:160});
    expect(routeProcessLine({...outgoing},layout,graph)).toEqual([{x:364,y:176},{x:460,y:176}]);
  });
  it('excludes associations from side allocation and supports a detached queried line', () => {
    const projected={...graph,lines:[...graph.lines,{id:'attachment',from:'start',to:'task',role:'association' as const}]};
    expect(routeProcessLine(incoming,layout,projected)).toEqual(routeProcessLine(incoming,layout,graph));
    expect(routeProcessLine(incoming,layout,{...graph,lines:[outgoing]})).toEqual(routeProcessLine(incoming,layout,graph));
  });
  it('retains authored event waypoints and centered side pins', () => {
    const authored={...incoming,fromSide:'south' as const,toSide:'east' as const,points:[{x:700,y:120},{x:700,y:240}]};
    const points=routeProcessLine(authored,layout,{...graph,lines:[authored,outgoing]});
    expect(points[0]).toEqual({x:432,y:108});expect(points.at(-1)).toEqual({x:364,y:176});
    expect(points).toContainEqual({x:700,y:120});expect(points).toContainEqual({x:700,y:240});
  });
});


it('refuses automatic event routes enclosed by an unrelated frame', () => {
  const source={...box('event'),shape:'event' as const};
  const edge={id:'event-target',from:'event',to:'target'};
  const graph={boxes:[source,box('target'),box('unrelated',undefined,true)],lines:[edge]};
  const layout={boxes:{event:{x:0,y:0,width:56,height:56},target:{x:500,y:0,width:224,height:64},unrelated:{x:-50,y:-50,width:200,height:200}}};
  expect(routeProcessLine(edge,layout,graph)).toEqual([]);
  const contained={...graph,boxes:[{...source,parentId:'unrelated'},box('target'),box('unrelated',undefined,true)]};
  expect(routeProcessLine(edge,layout,contained).length).toBeGreaterThan(1);
});


it('consumes allocated task ports for legacy outputs shared with two automatic event inputs', () => {
  const boxes=[{...box('event1'),shape:'event' as const},{...box('event2'),shape:'event' as const},box('task'),box('next')];
  const lines=[{id:'e1',from:'event1',to:'task'},{id:'e2',from:'event2',to:'task'},{id:'out',from:'task',to:'next'}];
  const graph={boxes,lines};const layout={boxes:{task:{x:140,y:144,width:224,height:64},next:{x:760,y:144,width:224,height:64},event1:{x:404,y:52,width:56,height:56},event2:{x:484,y:52,width:56,height:56}}};
  const points=lines.map(edge=>routeProcessLine(edge,layout,graph));
  expect(points[0].at(-1)).toEqual({x:364,y:160});
  expect(points[1].at(-1)).toEqual({x:364,y:176});
  expect(points[2][0]).toEqual({x:364,y:192});
  expect(new Set([points[0].at(-1)!.y,points[1].at(-1)!.y,points[2][0].y]).size).toBe(3);
});


it('keeps two automatic event siblings apart from a pinned task output', () => {
  const boxes=[{...box('event1'),shape:'event' as const},{...box('event2'),shape:'event' as const},box('task'),box('next')];
  const lines=[{id:'e1',from:'event1',to:'task'},{id:'e2',from:'event2',to:'task'},{id:'out',from:'task',to:'next',fromSide:'east' as const,toSide:'west' as const}];
  const layout={boxes:{task:{x:140,y:144,width:224,height:64},next:{x:760,y:144,width:224,height:64},event1:{x:404,y:52,width:56,height:56},event2:{x:484,y:52,width:56,height:56}}};
  const points=lines.map(edge=>routeProcessLine(edge,layout,{boxes,lines}));
  expect(points[0].at(-1)).toEqual({x:364,y:160});expect(points[1].at(-1)).toEqual({x:364,y:192});expect(points[2][0]).toEqual({x:364,y:176});
});

it.each([0, 1, 2, 3])('reserves pinned ports through quarter-turn %s', turns => {
  const rotate=(p:ProcessPoint):ProcessPoint=>turns===0?p:turns===1?{x:-p.y,y:p.x}:turns===2?{x:-p.x,y:-p.y}:{x:p.y,y:-p.x};
  const base={task:{x:140,y:144,width:224,height:64},next:{x:760,y:144,width:224,height:64},event1:{x:404,y:52,width:56,height:56},event2:{x:484,y:52,width:56,height:56}};
  const positions=Object.fromEntries(Object.entries(base).map(([id,r])=>{const corners=[rotate({x:r.x,y:r.y}),rotate({x:r.x+r.width,y:r.y+r.height})];return[id,{x:Math.min(...corners.map(p=>p.x)),y:Math.min(...corners.map(p=>p.y)),width:Math.abs(corners[0].x-corners[1].x),height:Math.abs(corners[0].y-corners[1].y)}]}));
  const sides:ProcessSide[]=['east','south','west','north'];
  const boxes=[{...box('event1'),shape:'event' as const},{...box('event2'),shape:'event' as const},box('task'),box('next')];
  const lines:ProcessLine[]=[{id:'e1',from:'event1',to:'task'},{id:'e2',from:'event2',to:'task'},{id:'out',from:'task',to:'next',fromSide:sides[turns],toSide:sides[(turns+2)%4]}];
  const routes=lines.map(edge=>routeProcessLine(edge,{boxes:positions},{boxes,lines}));
  routes.forEach(orthogonal);const fixed=rotate({x:364,y:176});expect(routes[2][0]).toEqual(fixed);
  expect(routes[0].at(-1)).not.toEqual(fixed);expect(routes[1].at(-1)).not.toEqual(fixed);expect(routes[0].at(-1)).not.toEqual(routes[1].at(-1));
});


it.each([false, true])("keeps visual sections transparent to ordinary routing, authored=%s", authored => {
  const edge: ProcessLine = { id: "a-b", from: "a", to: "b", ...(authored ? { fromSide: "east" as const, toSide: "west" as const, points: [{ x: 350, y: 32 }] } : {}) };
  const layout: ProcessLayout = { boxes: { a: { x: 0, y: 0, width: 224, height: 64 }, b: { x: 500, y: 0, width: 224, height: 64 }, overlay: { x: -50, y: -50, width: 300, height: 200 } } };
  const base: ProcessProjection = { boxes: [box("a"), box("b")], lines: [edge] };
  const baseline = routeProcessLine(edge, layout, base);
  orthogonal(baseline);
  const overlay = { ...box("overlay", undefined, true), kind: "section" };
  expect(routeProcessLine(edge, layout, { ...base, boxes: [...base.boxes, overlay] })).toEqual(baseline);
  // An unrelated execution frame still blocks a line enclosed by its body.
  expect(routeProcessLine(edge, layout, { ...base, boxes: [...base.boxes, { ...overlay, kind: "frame" }] })).toEqual([]);
  if (authored) expect(baseline).toContainEqual({ x: 350, y: 32 });
});


describe('native line controls', () => {
  it('keeps end stubs and a draggable middle on a straight route', () => {
    expect(processSegmentChain([{x:0,y:32},{x:224,y:32}])).toEqual([{x:0,y:32},{x:20,y:32},{x:204,y:32},{x:224,y:32}]);
  });
  it('keeps authored corners while avoiding duplicate stubs', () => {
    const points=[{x:0,y:0},{x:20,y:0},{x:20,y:80},{x:100,y:80}];
    expect(processSegmentChain(points)).toEqual([{x:0,y:0},{x:20,y:0},{x:20,y:80},{x:80,y:80},{x:100,y:80}]);
    expect(points).toEqual([{x:0,y:0},{x:20,y:0},{x:20,y:80},{x:100,y:80}]);
  });
  it('places gateway labels and target pins by arc distance', () => {
    const points=[{x:56,y:28},{x:76,y:28},{x:76,y:108},{x:224,y:108}];
    expect(processPointAlong(points,34)).toEqual({x:76,y:42,horizontal:false});
    expect(processPointAlong([...points].reverse(),14)).toEqual({x:210,y:108,horizontal:true});
  });
  it.each([
    [[{x:0,y:0},{x:100,y:0}], 'M100,0L91,4.5L91,-4.5Z'],
    [[{x:0,y:0},{x:0,y:100}], 'M0,100L-4.5,91L4.5,91Z'],
    [[{x:100,y:0},{x:0,y:0}], 'M0,0L9,-4.5L9,4.5Z'],
    [[{x:0,y:100},{x:0,y:0}], 'M0,0L4.5,9L-4.5,9Z'],
  ] as const)('draws the native nine-pixel arrow for %j', (points, expected) => expect(processArrowPath(points)).toBe(expected));
});

it('draws five-pixel crossing hops in traversal order and keeps endpoint crossings flat', () => {
 const verticals = [{ x: 50, y1: -20, y2: 20 }, { x: 25, y1: -20, y2: 20 }, { x: 8, y1: -20, y2: 20 }, { x: 75, y1: 0, y2: 20 }];
 expect(roundedProcessPath([{x:0,y:0},{x:100,y:0}],8,verticals)).toBe('M 0 0 L 20 0 A 5 5 0 0 1 30 0 L 45 0 A 5 5 0 0 1 55 0 L 100 0');
 expect(roundedProcessPath([{x:100,y:0},{x:0,y:0}],8,verticals)).toBe('M 100 0 L 55 0 A 5 5 0 0 0 45 0 L 30 0 A 5 5 0 0 0 20 0 L 0 0');
});
it('faces loose connection previews toward the pointer and reverses reconnect-from previews', () => {
 const event = {...box('event'),shape:'event' as const}, position={x:0,y:0,width:56,height:56}, target={x:150,y:80};
 const expected=[{x:48,y:28},{x:109,y:28},{x:109,y:80},{x:150,y:80}];
 expect(processLooseConnection(event,position,target)).toEqual(expected);
 expect(processLooseConnection(event,position,target,true)).toEqual([...expected].reverse());
 expect(processLooseConnection(box('task'),{x:0,y:0,width:100,height:80},{x:50,y:-100})).toEqual([{x:50,y:0},{x:50,y:-100}]);
});


it.each(['from', 'to'] as const)('allocates the free end of a half-pinned %s edge with its automatic sibling', end => {
  const pinned: ProcessLine = {id:'ab',from:'a',to:'b',...(end==='from'?{fromSide:'east' as const}:{toSide:'west' as const})};
  const sibling: ProcessLine = end==='from' ? {id:'db',from:'d',to:'b'} : {id:'ad',from:'a',to:'d'};
  const layout: ProcessLayout = {boxes:{a:{x:0,y:0,width:100,height:80},b:{x:200,y:50,width:100,height:80},d:{x:end==='from'?0:200,y:100,width:100,height:80}}};
  const input=projection(['a','b','d'],[pinned,sibling]);
  const alone=routeProcessLine(pinned,layout,{...input,lines:[pinned]});
  const points=routeProcessLine(pinned,layout,input), other=routeProcessLine(sibling,layout,input);
  orthogonal(points);orthogonal(other);
  const free=end==='from'?points.at(-1)!:points[0], otherFree=end==='from'?other.at(-1)!:other[0];
  const position=end==='from'?layout.boxes.b:layout.boxes.a;
  expect(free.y).toBeGreaterThanOrEqual(position.y+16);expect(free.y).toBeLessThanOrEqual(position.y+64);
  expect(free).not.toEqual(otherFree);
  expect(end==='from'?points[0]:points.at(-1)).toEqual(end==='from'?alone[0]:alone.at(-1));
});
