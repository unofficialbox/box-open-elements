import { describe, expect, it } from "vitest";
import { arrangeProcess, lineMidpoint, nearProcessLine, routeProcessLine, roundedProcessPath } from "../../src/patterns/process-modeler/geometry.js";
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
  expect(roundedProcessPath([{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 20 }])).toBe('M 0 0 L 14 0 Q 20 0 20 6 L 20 20');
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

  it("pins horizontal endpoints and deterministically detours around obstacles", () => {
    const before = structuredClone(layout);
    const points = routeProcessLine(edge, layout, input);
    orthogonal(points);
    expect(points[0]).toEqual({ x: 100, y: 40 });
    expect(points.at(-1)).toEqual({ x: 500, y: 40 });
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
    expect(points[0]).toEqual({ x: 100, y: 40 });
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

  it("pins vertical endpoints at the closest edge and supplies default sizes", () => {
    const positions = { boxes: { a: { x: 0, y: 0 }, b: { x: 0, y: 300 } } };
    expect(routeProcessLine(edge, positions, projection(["a", "b"], [edge]))).toEqual([{ x: 112, y: 64 }, { x: 112, y: 300 }]);
    const backward = routeProcessLine(line("b", "a"), layout, input);
    expect(backward[0]).toEqual({ x: 500, y: 40 });
    expect(backward.at(-1)).toEqual({ x: 100, y: 40 });
  });

  const sides: ProcessSide[] = ["north", "east", "south", "west"];
  const sourcePorts = { north: { x: 50, y: 0 }, east: { x: 100, y: 40 }, south: { x: 50, y: 80 }, west: { x: 0, y: 40 } };
  const targetPorts = { north: { x: 550, y: 0 }, east: { x: 600, y: 40 }, south: { x: 550, y: 80 }, west: { x: 500, y: 40 } };
  const outward = { north: { x: 0, y: -12 }, east: { x: 12, y: 0 }, south: { x: 0, y: 12 }, west: { x: -12, y: 0 } };

  it.each(sides)("honors an explicit %s source side while the target stays nearest-pinned", side => {
    const points = routeProcessLine({ ...edge, fromSide: side }, layout, input);
    orthogonal(points);
    expect(points[0]).toEqual(sourcePorts[side]);
    expect(points[1]).toEqual({ x: sourcePorts[side].x + outward[side].x, y: sourcePorts[side].y + outward[side].y });
    expect(points.at(-1)).toEqual({ x: 500, y: 40 });
    avoids(points, layout.boxes.obstacle as Required<typeof layout.boxes.obstacle>);
    avoids(points, layout.boxes.a as Required<typeof layout.boxes.a>);
  });

  it.each(sides)("honors an explicit %s target side while the source stays nearest-pinned", side => {
    const points = routeProcessLine({ ...edge, toSide: side }, layout, input);
    orthogonal(points);
    expect(points[0]).toEqual({ x: 100, y: 40 });
    expect(points.at(-1)).toEqual(targetPorts[side]);
    expect(points.at(-2)).toEqual({ x: targetPorts[side].x + outward[side].x, y: targetPorts[side].y + outward[side].y });
    avoids(points, layout.boxes.obstacle as Required<typeof layout.boxes.obstacle>);
    avoids(points, layout.boxes.b as Required<typeof layout.boxes.b>);
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
    expect(points.at(-1)).toEqual({ x: 500, y: 40 });
  });

  it("uses frame defaults for endpoint geometry", () => {
    const framed: ProcessProjection = { boxes: [box("a", undefined, true), box("b")], lines: [edge] };
    expect(routeProcessLine(edge, { boxes: { a: { x: 0, y: 0 }, b: { x: 500, y: 42 } } }, framed)).toEqual([{ x: 320, y: 74 }, { x: 320, y: 90 }, { x: 500, y: 90 }]);
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
