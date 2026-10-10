/** Automatic flow endpoint policy from the pinned Process Modeler design.
* Candidate ports use heading-aware orthogonal route cost; a shared task side
* spreads incoming and outgoing lines together before the final route is built.
* Authored pins/waypoints keep their existing policy.
*/
import type { ProcessPoint } from './geometry.js';
import { isFlowLine, type ProcessBox, type ProcessLayout, type ProcessLine, type ProcessProjection, type ProcessSide } from './model.js';
type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};
const DIRS: Record<ProcessSide, ProcessPoint> = { north: { x: 0, y: -1 }, east: { x: 1, y: 0 }, south: { x: 0, y: 1 }, west: { x: -1, y: 0 } };
const center = (r: Rect): ProcessPoint => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
const inflate = (r: Rect, m: number): Rect => ({ x: r.x - m, y: r.y - m, w: r.w + 2 * m, h: r.h + 2 * m });
const contains = (r: Rect, p: ProcessPoint) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
const BEND = 36;
function simplify(points: ProcessPoint[]): ProcessPoint[] {
  const out: ProcessPoint[] = [];
  for (const point of points) {
    const last = out.at(-1);
    if (last && Math.abs(last.x - point.x) < .01 && Math.abs(last.y - point.y) < .01)
      continue;
    out.push({ ...point });
    while (out.length >= 3) {
      const [a, b, c] = out.slice(-3);
      if ((a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y))
        out.splice(out.length - 2, 1);
      else
        break;
    }
  }
  return out;
}
function port(box: ProcessBox, r: Rect, side: ProcessSide, offset = 0): ProcessPoint {
  const c = center(r), inset = box.shape === 'event' ? 8 : 0;
  if (side === 'north')
    return { x: c.x + offset, y: r.y + inset };
  if (side === 'south')
    return { x: c.x + offset, y: r.y + r.h - inset };
  if (side === 'west')
    return { x: r.x + inset, y: c.y + offset };
  return { x: r.x + r.w - inset, y: c.y + offset };
}
function routeOrthC(p1: ProcessPoint, sa: ProcessSide, p2: ProcessPoint, sb: ProcessSide, obstacles: (Rect & { endpoint?: 'from' | 'to' })[]) {
  const STUB = 20, M = 12;
  const d1 = DIRS[sa], d2 = DIRS[sb];
  const s = { x: p1.x + d1.x * STUB, y: p1.y + d1.y * STUB };
  const t = { x: p2.x + d2.x * STUB, y: p2.y + d2.y * STUB };
  // A fixed lead may leave its own inset event port, but must never enter
  // the opposite endpoint or another obstacle, even if its stub exits that body.
  const crosses = (a: ProcessPoint, b: ProcessPoint, r: Rect) => a.x === b.x
    ? a.x > r.x && a.x < r.x + r.w && Math.max(a.y, b.y) > r.y && Math.min(a.y, b.y) < r.y + r.h
    : a.y > r.y && a.y < r.y + r.h && Math.max(a.x, b.x) > r.x && Math.min(a.x, b.x) < r.x + r.w;
  if (obstacles.some(o => o.endpoint !== 'from' && crosses(p1, s, o)
    || o.endpoint !== 'to' && crosses(p2, t, o))) return { pts: [], cost: Infinity };
  // Region of interest.
  const pad = 200;
  let rx1 = Math.min(s.x, t.x) - pad, rx2 = Math.max(s.x, t.x) + pad;
  let ry1 = Math.min(s.y, t.y) - pad, ry2 = Math.max(s.y, t.y) + pad;
  const obs: Rect[] = [];
  for (const o of obstacles) {
    const r = inflate(o, M);
    if (r.x + r.w < rx1 || r.x > rx2 || r.y + r.h < ry1 || r.y > ry2)
      continue;
    if (contains({ x: r.x + 0.5, y: r.y + 0.5, w: r.w - 1, h: r.h - 1 }, s)
      || contains({ x: r.x + 0.5, y: r.y + 0.5, w: r.w - 1, h: r.h - 1 }, t)) {
      // Endpoint bodies may surround an inset port; unrelated obstacles cannot be crossed.
      if (o.endpoint) continue;
      return { pts: [], cost: Infinity };
    }
    obs.push(r);
  }
  for (const r of obs) {
    rx1 = Math.min(rx1, r.x - 24);
    rx2 = Math.max(rx2, r.x + r.w + 24);
    ry1 = Math.min(ry1, r.y - 24);
    ry2 = Math.max(ry2, r.y + r.h + 24);
  }
  const xsSet = new Set([s.x, t.x, rx1, rx2]), ysSet = new Set([s.y, t.y, ry1, ry2]);
  for (const r of obs) {
    xsSet.add(r.x);
    xsSet.add(r.x + r.w);
    ysSet.add(r.y);
    ysSet.add(r.y + r.h);
  }
  const addMids = (set: Set<number>) => {
    const a = [...set].sort((p, q) => p - q);
    for (let i = 0; i < a.length - 1; i++)
      if (a[i + 1] - a[i] > 24)
        set.add((a[i] + a[i + 1]) / 2);
    return [...set].sort((p, q) => p - q);
  };
  const xs = addMids(xsSet), ys = addMids(ysSet);
  const nx = xs.length, ny = ys.length;
  const blockedP = new Uint8Array(nx * ny), blockH = new Uint8Array(nx * ny), blockV = new Uint8Array(nx * ny);
  const inside = (v: number, a: number, b: number) => v > a + 0.01 && v < b - 0.01;
  for (const r of obs) {
    const x1 = r.x, x2 = r.x + r.w, y1 = r.y, y2 = r.y + r.h;
    let i0 = 0;
    while (i0 < nx && xs[i0] < x1)
      i0++;
    let j0 = 0;
    while (j0 < ny && ys[j0] < y1)
      j0++;
    for (let i = Math.max(0, i0 - 1); i < nx && xs[i] <= x2; i++) {
      for (let j = Math.max(0, j0 - 1); j < ny && ys[j] <= y2; j++) {
        const k = j * nx + i;
        if (inside(xs[i], x1, x2) && inside(ys[j], y1, y2))
          blockedP[k] = 1;
        if (i < nx - 1 && inside((xs[i] + xs[i + 1]) / 2, x1, x2) && inside(ys[j], y1, y2))
          blockH[k] = 1;
        if (j < ny - 1 && inside(xs[i], x1, x2) && inside((ys[j] + ys[j + 1]) / 2, y1, y2))
          blockV[k] = 1;
      }
    }
  }
  const si = xs.indexOf(s.x), sj = ys.indexOf(s.y), ti = xs.indexOf(t.x), tj = ys.indexOf(t.y);
  const dirIndex = (d: ProcessPoint) => (d.x === 1 ? 0 : d.y === 1 ? 1 : d.x === -1 ? 2 : 3);
  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
  const startDir = dirIndex(d1), needDir = dirIndex({ x: -d2.x, y: -d2.y });
  const total = nx * ny * 4;
  const g = new Float64Array(total).fill(Infinity);
  const prev = new Int32Array(total).fill(-1);
  const heap: number[][] = [];
  const push = (f: number, st: number) => { heap.push([f, st]); let i = heap.length - 1; while (i > 0) {
    const p = (i - 1) >> 1;
    if (heap[p][0] <= heap[i][0])
      break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  } };
  const pop = () => { const top = heap[0], last = heap.pop()!; if (heap.length) {
    heap[0] = last;
    let i = 0;
    for (;;) {
      const l = 2 * i + 1, r = l + 1;
      let m = i;
      if (l < heap.length && heap[l][0] < heap[m][0])
        m = l;
      if (r < heap.length && heap[r][0] < heap[m][0])
        m = r;
      if (m === i)
        break;
      [heap[m], heap[i]] = [heap[i], heap[m]];
      i = m;
    }
  } return top; };
  const h = (i: number, j: number) => Math.abs(xs[i] - t.x) + Math.abs(ys[j] - t.y);
  const s0 = (sj * nx + si) * 4 + startDir;
  g[s0] = 0;
  push(h(si, sj), s0);
  let goal = -1, goalCost = Infinity;
  let guard = 0;
  while (heap.length && guard++ < 60000) {
    const [f, st] = pop();
    if (f >= goalCost)
      break;
    const dir = st & 3, k = st >> 2, i = k % nx, j = (k / nx) | 0;
    const gc = g[st];
    if (i === ti && j === tj) {
      if (dir === needDir && gc < goalCost) {
        goalCost = gc;
        goal = st;
      }
      else if (dir !== ((needDir + 2) & 3) && gc + BEND < goalCost) {
        goalCost = gc + BEND;
        goal = st;
      }
      continue;
    }
    for (let nd = 0; nd < 4; nd++) {
      if (nd === ((dir + 2) & 3))
        continue;
      const ni = i + DX[nd], nj = j + DY[nd];
      if (ni < 0 || nj < 0 || ni >= nx || nj >= ny)
        continue;
      const nk = nj * nx + ni;
      if (blockedP[nk])
        continue;
      if (nd === 0 && blockH[k])
        continue;
      if (nd === 2 && blockH[nk])
        continue;
      if (nd === 1 && blockV[k])
        continue;
      if (nd === 3 && blockV[nk])
        continue;
      const cost = gc + Math.abs(xs[ni] - xs[i]) + Math.abs(ys[nj] - ys[j]) + (nd === dir ? 0 : BEND);
      const ns = nk * 4 + nd;
      if (cost < g[ns]) {
        g[ns] = cost;
        prev[ns] = st;
        push(cost + h(ni, nj), ns);
      }
    }
  }
  let pts: ProcessPoint[], cost: number;
  if (goal < 0) {
    pts = [];
    cost = Infinity;
  }
  else {
    const chain = [];
    for (let st = goal; st >= 0; st = prev[st]) {
      const k = st >> 2;
      chain.push({ x: xs[k % nx], y: ys[(k / nx) | 0] });
    }
    chain.reverse();
    pts = [p1, ...chain, p2];
    cost = goalCost;
  }
  return { pts: simplify(pts), cost };
}
/** Native flow ports. Authored waypoints retain their existing endpoint contract. */
export function automaticEventPorts(line: ProcessLine, layout: ProcessLayout, projection: ProcessProjection) {
  const boxes = new Map(projection.boxes.map(box => [box.id, box]));
  const rects = new Map(projection.boxes.filter(box => layout.boxes[box.id]).map(box => { const p = layout.boxes[box.id], compact = box.shape === 'event' || box.shape === 'gateway'; return [box.id, { x: p.x, y: p.y, w: p.width ?? (box.frame ? 320 : compact ? 56 : box.role === 'note' ? 208 : 224), h: p.height ?? (box.frame ? 180 : compact ? 56 : 64) }] as const; }));
  const candidates = projection.lines.some(edge => edge.id === line.id) ? projection.lines.map(edge => edge.id === line.id ? line : edge) : [...projection.lines, line];
  const flows = candidates.filter(edge => isFlowLine(edge) && rects.has(edge.from) && rects.has(edge.to));
  const obstacles = projection.boxes.filter(box => rects.has(box.id) && box.kind !== 'section').map(box => ({ id: box.id, r: rects.get(box.id)! }));
  const ancestors = (id: string) => { const ids = new Set<string>(); let parent = boxes.get(id)?.parentId; while (parent && !ids.has(parent)) {
    ids.add(parent);
    parent = boxes.get(parent)?.parentId;
  } return ids; };
  const edgeObstacles = (edge: ProcessLine) => { const skip = new Set([...ancestors(edge.from), ...ancestors(edge.to)]); return obstacles.filter(o => !skip.has(o.id)).map(o => ({...o.r, endpoint: o.id === edge.from ? 'from' as const : o.id === edge.to ? 'to' as const : undefined})); };
  const sides = new Map<string, [
    ProcessSide,
    ProcessSide
  ]>();
  for (const edge of flows) {
    const a = boxes.get(edge.from)!, b = boxes.get(edge.to)!, ra = rects.get(a.id)!, rb = rects.get(b.id)!, ca = center(ra), cb = center(rb), dy = cb.y - ca.y;
    const fan = a.shape === 'gateway' && flows.filter(e => e.from === a.id).length > 1, merge = b.shape === 'gateway' && flows.filter(e => e.to === b.id).length > 1;
    const ha: ProcessSide = edge.fromSide ?? (fan && Math.abs(dy) > 8 && cb.x > ca.x ? (dy < 0 ? 'north' : 'south') : rb.x >= ra.x + ra.w + 8 ? 'east' : rb.y >= ra.y + ra.h + 8 ? 'south' : rb.y + rb.h <= ra.y - 8 ? 'north' : rb.x + rb.w <= ra.x - 8 ? 'south' : 'east');
    const hb: ProcessSide = edge.toSide ?? (merge && Math.abs(dy) > 8 && ca.x < cb.x ? (dy > 0 ? 'north' : 'south') : ra.x + ra.w <= rb.x - 8 ? 'west' : ra.y + ra.h <= rb.y - 8 ? 'north' : ra.y >= rb.y + rb.h + 8 ? 'south' : ra.x >= rb.x + rb.w + 8 ? 'south' : 'west');
    const facing = (a: ProcessPoint, b: ProcessPoint): ProcessSide[] => [b.x >= a.x ? 'east' : 'west', b.y >= a.y ? 'south' : 'north'];
    const A = edge.fromSide ? [edge.fromSide] : [...new Set([ha, ...facing(ca, cb)])], B = edge.toSide ? [edge.toSide] : [...new Set([hb, ...facing(cb, ca)])];
    let best = { cost: Infinity, sa: ha, sb: hb };
    for (const sa of A)
      for (const sb of B) {
        const route = routeOrthC(port(a, ra, sa), sa, port(b, rb, sb), sb, edgeObstacles(edge));
        const cost = route.cost - (sa === ha && sb === hb ? 12 : 0);
        if (cost < best.cost)
          best = { cost, sa, sb };
      }
    // Authored waypoints retain their actual endpoint sides. An unpinned end
    // without waypoints remains free to choose the cheapest native route.
    const points = layout.lines?.[edge.id] ?? edge.points;
    if (points?.length) {
      const nearest = (r: Rect, toward: ProcessPoint): ProcessSide => {
        const x = Math.max(r.x, Math.min(toward.x, r.x + r.w)), y = Math.max(r.y, Math.min(toward.y, r.y + r.h));
        const candidates: [ProcessSide, ProcessPoint][] = [['east', {x:r.x+r.w,y}], ['west',{x:r.x,y}], ['south',{x,y:r.y+r.h}], ['north',{x,y:r.y}]];
        return candidates.reduce((a,b) => Math.hypot(b[1].x-toward.x,b[1].y-toward.y) < Math.hypot(a[1].x-toward.x,a[1].y-toward.y) ? b : a)[0];
      };
      best.sa = edge.fromSide ?? nearest(ra, points?.[0] ?? cb);
      best.sb = edge.toSide ?? nearest(rb, points?.at(-1) ?? ca);
    }
    sides.set(edge.id, [best.sa, best.sb]);
  }
  const groups = new Map<string, {
    box: ProcessBox;
    side: ProcessSide;
    ends: {
      key: string;
      other: string;
    }[];
  }>();
  const add = (box: ProcessBox, side: ProcessSide, key: string, other: string) => { const id = box.id + '|' + side; const group = groups.get(id) ?? { box, side, ends: [] }; group.ends.push({ key, other }); groups.set(id, group); };
  for (const edge of flows) {
    const [sa, sb] = sides.get(edge.id)!;
    add(boxes.get(edge.from)!, sa, edge.id + ':a', edge.to);
    add(boxes.get(edge.to)!, sb, edge.id + ':b', edge.from);
  }
  const fixed = new Map<string, number>();
  for (const edge of flows) {
    const points = layout.lines?.[edge.id] ?? edge.points;
    if (!edge.fromSide && !edge.toSide && !points?.length) continue;
    const [sa, sb] = sides.get(edge.id)!;
    for (const [id, side, key, toward] of [
      [edge.from, sa, edge.id + ':a', points?.[0] ?? center(rects.get(edge.to)!)],
      [edge.to, sb, edge.id + ':b', points?.at(-1) ?? center(rects.get(edge.from)!)]
    ] as [string, ProcessSide, string, ProcessPoint][]) {
      const r = rects.get(id)!, c = center(r);
      const authoredSide = key.endsWith(':a') ? edge.fromSide : edge.toSide;
      if (!authoredSide && !points?.length) continue;
      const offset = authoredSide ? 0 : side === 'north' || side === 'south'
        ? Math.max(r.x, Math.min(toward.x, r.x + r.w)) - c.x
        : Math.max(r.y, Math.min(toward.y, r.y + r.h)) - c.y;
      fixed.set(key, offset);
    }
  }
  const offsets = new Map<string, number>();
  for (const { box, side, ends } of groups.values()) {
    if (ends.length === 1 || box.shape === 'gateway' || box.shape === 'event') {
      ends.forEach(end => offsets.set(end.key, 0));
      continue;
    }
    const r = rects.get(box.id)!, c = center(r), horizontal = side === 'north' || side === 'south', half = (horizontal ? r.w : r.h) / 2, max = Math.max(0, Math.floor((half - 12) / 8) * 8), gap = Math.min(16, 2 * max / (ends.length - 1));
    const list = ends.map(end => { const other = center(rects.get(end.other)!); return { ...end, pref: Math.max(-max, Math.min(max, Math.round((horizontal ? other.x - c.x : other.y - c.y) / 8) * 8)) }; }).sort((a, b) => a.pref - b.pref || (a.key < b.key ? -1 : 1));
    if (list.some(end => fixed.has(end.key))) {
      const reserved = list.filter(end => fixed.has(end.key)).map(end => fixed.get(end.key)!);
      const movable = list.filter(end => !fixed.has(end.key));
      let allocated: {key: string; value: number}[] = [];
      // Authored ports remain at their actual positions. Spread automatic siblings
      // around them, relaxing spacing only when a crowded side cannot fit 16px.
      for (const spacing of [16, 8, 4, 2, 1, .5, 0]) {
        const used = [...reserved]; allocated = [];
        for (const end of movable) {
          const slots: number[] = [];
          for (let value = -max; value <= max; value += .5)
            if (used.every(other => Math.abs(value - other) >= spacing)) slots.push(value);
          slots.sort((a, b) => Math.abs(a - end.pref) - Math.abs(b - end.pref) || a - b);
          if (!slots.length) break;
          used.push(slots[0]); allocated.push({key: end.key, value: slots[0]});
        }
        if (allocated.length === movable.length) break;
      }
      for (const end of list) if (fixed.has(end.key)) offsets.set(end.key, fixed.get(end.key)!);
      for (const end of allocated) offsets.set(end.key, end.value);
      continue;
    }
    const positions = list.map(end => end.pref);
    for (let i = 1; i < positions.length; i++)
      positions[i] = Math.max(positions[i], positions[i - 1] + gap);
    let shift = list.reduce((sum, end) => sum + end.pref, 0) / list.length - positions.reduce((sum, n) => sum + n, 0) / positions.length;
    shift = Math.max(Math.min(shift, max - positions.at(-1)!), -max - positions[0]);
    list.forEach((end, i) => offsets.set(end.key, Math.round((positions[i] + shift) * 2) / 2));
  }
  const [sa, sb] = sides.get(line.id)!, a = boxes.get(line.from)!, b = boxes.get(line.to)!;
  return { start: port(a, rects.get(a.id)!, sa, offsets.get(line.id + ':a')), end: port(b, rects.get(b.id)!, sb, offsets.get(line.id + ':b')), fromSide: sa, toSide: sb, obstacles: edgeObstacles(line) };
}

export function automaticEventRoute(line: ProcessLine, layout: ProcessLayout, projection: ProcessProjection): ProcessPoint[] {
  const ports = automaticEventPorts(line, layout, projection);
  return routeOrthC(ports.start, ports.fromSide, ports.end, ports.toSide, ports.obstacles).pts;
}
