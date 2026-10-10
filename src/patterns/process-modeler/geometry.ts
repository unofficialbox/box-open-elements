import { automaticEventRoute, automaticEventPorts } from './automatic-routing.js';
import type { BoxPosition, ProcessBox, ProcessLayout, ProcessLine, ProcessProjection, ProcessSide } from "./model.js";
import { validateProjection, isFlowBox, isFlowLine } from "./model.js";

export interface ProcessPoint { x: number; y: number }
interface Rectangle { x: number; y: number; width: number; height: number }
const GAP_X = 80;
const GAP_Y = 48;
const PADDING = 24;
const HEADER = 64;
const CLEARANCE = 12;
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

/** Stable left-to-right layers; cycles break at the smallest remaining ID. */
export function arrangeProcess(projection: ProcessProjection): ProcessLayout {
  validateProjection(projection);
  const flowBoxes = projection.boxes.filter(isFlowBox);
  const flowIds = new Set(flowBoxes.map(box => box.id));
  projection = { boxes: flowBoxes, lines: projection.lines.filter(line => isFlowLine(line) && flowIds.has(line.from) && flowIds.has(line.to)) };
  const boxes = new Map(projection.boxes.map(box => [box.id, box]));
  const children = new Map<string | undefined, ProcessBox[]>();
  for (const box of projection.boxes) {
    const siblings = children.get(box.parentId) ?? [];
    siblings.push(box);
    children.set(box.parentId, siblings);
  }
  for (const siblings of children.values()) siblings.sort((a, b) => compare(a.id, b.id));
  const result: ProcessLayout = { boxes: Object.fromEntries(projection.boxes.map(box => [box.id, { x: 0, y: 0 }])) };
  const measureGroup = (parentId?: string): { width: number; height: number; positions: Map<string, Rectangle> } => {
    const siblings = children.get(parentId) ?? [];
    const ids = new Set(siblings.map(box => box.id));
    // Collapse descendant endpoints to the sibling frame at this level.
    const representative = (id: string): string | undefined => {
      let box = boxes.get(id);
      while (box && !ids.has(box.id)) box = boxes.get(box.parentId ?? "");
      return box?.id;
    };
    const outgoing = new Map(siblings.map(box => [box.id, new Set<string>()]));
    const incoming = new Map(siblings.map(box => [box.id, 0]));
    for (const line of projection.lines) {
      const from = representative(line.from), to = representative(line.to);
      if (!from || !to || from === to || outgoing.get(from)!.has(to)) continue;
      outgoing.get(from)!.add(to);
      incoming.set(to, incoming.get(to)! + 1);
    }
    const remaining = new Set(ids);
    const rank = new Map(siblings.map(box => [box.id, 0]));
    while (remaining.size) {
      const ready = [...remaining].filter(id => incoming.get(id) === 0).sort(compare);
      const id = ready[0] ?? [...remaining].sort(compare)[0];
      remaining.delete(id);
      for (const next of outgoing.get(id)!) {
        if (!remaining.has(next)) continue;
        rank.set(next, Math.max(rank.get(next)!, rank.get(id)! + 1));
        incoming.set(next, incoming.get(next)! - 1);
      }
    }
    const sizes = new Map<string, Rectangle>();
    for (const box of siblings) {
      const group = measureGroup(box.id);
      const compact = box.shape === "gateway" || box.shape === "event";
      const width = box.frame ? Math.max(320, group.width + PADDING * 2) : compact ? 56 : 224;
      const height = box.frame ? Math.max(180, group.height + HEADER + PADDING) : compact ? 56 : 64;
      sizes.set(box.id, { x: 0, y: 0, width, height });
      // Store local child coordinates until the parent's absolute position is known.
      for (const [id, position] of group.positions) result.boxes[id] = position;
    }
    const positions = new Map<string, Rectangle>();
    let x = 0, height = 0;
    const ranks = [...new Set(rank.values())].sort((a, b) => a - b);
    for (const layer of ranks) {
      let y = 0, width = 0;
      for (const box of siblings.filter(box => rank.get(box.id) === layer)) {
        const size = sizes.get(box.id)!;
        positions.set(box.id, { ...size, x, y });
        width = Math.max(width, size.width);
        y += size.height + GAP_Y;
      }
      height = Math.max(height, y - GAP_Y);
      x += width + GAP_X;
    }
    return { width: Math.max(0, x - GAP_X), height, positions };
  };
  const roots = measureGroup();
  const place = (positions: Map<string, Rectangle>, x: number, y: number) => {
    for (const [id, local] of positions) {
      const position = { ...local, x: local.x + x, y: local.y + y };
      result.boxes[id] = position;
      const nested = new Map((children.get(id) ?? []).map(child => [child.id, result.boxes[child.id] as Rectangle]));
      place(nested, position.x + PADDING, position.y + HEADER);
    }
  };
  place(roots.positions, 40, 40);
  return result;
}

function rectangle(position: BoxPosition, box?: ProcessBox): Rectangle {
  const compact = box?.shape === "gateway" || box?.shape === "event";
  return { ...position, width: position.width ?? (box?.frame ? 320 : compact ? 56 : box?.role === "note" ? 208 : 224), height: position.height ?? (box?.frame ? 180 : compact ? 56 : 64) };
}
const center = (box: Rectangle): ProcessPoint => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
const distance = (a: ProcessPoint, b: ProcessPoint) => Math.hypot(a.x - b.x, a.y - b.y);
const same = (a: ProcessPoint, b: ProcessPoint) => a.x === b.x && a.y === b.y;
const inside = (p: ProcessPoint, box: Rectangle) => p.x > box.x && p.x < box.x + box.width && p.y > box.y && p.y < box.y + box.height;

function pin(box: Rectangle, toward: ProcessPoint, side?: ProcessSide): ProcessPoint {
  if (side) {
    const middle = center(box);
    switch (side) {
      case "north": return { x: middle.x, y: box.y };
      case "east": return { x: box.x + box.width, y: middle.y };
      case "south": return { x: middle.x, y: box.y + box.height };
      case "west": return { x: box.x, y: middle.y };
    }
  }
  const x = Math.max(box.x, Math.min(toward.x, box.x + box.width));
  const y = Math.max(box.y, Math.min(toward.y, box.y + box.height));
  const candidates = [
    { x: box.x + box.width, y }, { x: box.x, y },
    { x, y: box.y + box.height }, { x, y: box.y },
  ];
  return candidates.reduce((best, point) => distance(point, toward) < distance(best, toward) ? point : best);
}

function portLead(point: ProcessPoint, side?: ProcessSide): ProcessPoint {
  switch (side) {
    case "north": return { x: point.x, y: point.y - CLEARANCE };
    case "east": return { x: point.x + CLEARANCE, y: point.y };
    case "south": return { x: point.x, y: point.y + CLEARANCE };
    case "west": return { x: point.x - CLEARANCE, y: point.y };
    default: return point;
  }
}

function blocked(a: ProcessPoint, b: ProcessPoint, obstacles: Rectangle[]): boolean {
  return obstacles.some(box => a.x === b.x
    ? a.x > box.x && a.x < box.x + box.width && Math.max(a.y, b.y) > box.y && Math.min(a.y, b.y) < box.y + box.height
    : a.y > box.y && a.y < box.y + box.height && Math.max(a.x, b.x) > box.x && Math.min(a.x, b.x) < box.x + box.width);
}

function simplify(points: ProcessPoint[]): ProcessPoint[] {
  const result: ProcessPoint[] = [];
  for (const point of points) {
    if (result.length && same(result[result.length - 1], point)) continue;
    while (result.length > 1) {
      const a = result[result.length - 2], b = result[result.length - 1];
      if (!((a.x === b.x && b.x === point.x) || (a.y === b.y && b.y === point.y))) break;
      result.pop();
    }
    result.push(point);
  }
  return result;
}

/** Rectilinear visibility grid, with deterministic shortest-path tie breaking. */
function orthogonal(start: ProcessPoint, end: ProcessPoint, obstacles: Rectangle[]): ProcessPoint[] {
  if (obstacles.some(box => inside(start, box) || inside(end, box))) return [];
  if (same(start, end)) return [{ ...start }];
  if ((start.x === end.x || start.y === end.y) && !blocked(start, end, obstacles)) return [{ ...start }, { ...end }];
  const xs = [...new Set([start.x, end.x, ...obstacles.flatMap(box => [box.x, box.x + box.width])])].sort((a, b) => a - b);
  const ys = [...new Set([start.y, end.y, ...obstacles.flatMap(box => [box.y, box.y + box.height])])].sort((a, b) => a - b);
  const count = xs.length * ys.length;
  const point = (id: number): ProcessPoint => ({ x: xs[id % xs.length], y: ys[Math.floor(id / xs.length)] });
  const index = (p: ProcessPoint) => ys.indexOf(p.y) * xs.length + xs.indexOf(p.x);
  const first = index(start), last = index(end);
  const costs = new Float64Array(count).fill(Infinity);
  const previous = new Int32Array(count).fill(-1);
  const visited = new Uint8Array(count);
  const heap: { id: number; cost: number }[] = [];
  const less = (a: typeof heap[number], b: typeof heap[number]) => a.cost < b.cost || (a.cost === b.cost && a.id < b.id);
  const push = (entry: typeof heap[number]) => {
    heap.push(entry);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (!less(heap[i], heap[parent])) break;
      [heap[i], heap[parent]] = [heap[parent], heap[i]];
      i = parent;
    }
  };
  const pop = () => {
    const first = heap[0], tail = heap.pop()!;
    if (heap.length) {
      heap[0] = tail;
      let i = 0;
      while (i * 2 + 1 < heap.length) {
        let child = i * 2 + 1;
        if (child + 1 < heap.length && less(heap[child + 1], heap[child])) child++;
        if (!less(heap[child], heap[i])) break;
        [heap[i], heap[child]] = [heap[child], heap[i]];
        i = child;
      }
    }
    return first;
  };
  costs[first] = 0;
  push({ id: first, cost: 0 });
  while (heap.length) {
    const { id } = pop();
    if (visited[id]) continue;
    visited[id] = 1;
    if (id === last) {
      const path: ProcessPoint[] = [];
      for (let cursor = last; cursor !== -1; cursor = previous[cursor]) path.push(point(cursor));
      return simplify(path.reverse());
    }
    const a = point(id), column = id % xs.length, row = Math.floor(id / xs.length);
    const neighbors = [column > 0 ? id - 1 : -1, column + 1 < xs.length ? id + 1 : -1,
      row > 0 ? id - xs.length : -1, row + 1 < ys.length ? id + xs.length : -1];
    for (const next of neighbors) {
      if (next < 0 || visited[next]) continue;
      const b = point(next);
      if (blocked(a, b, obstacles)) continue;
      const cost = costs[id] + distance(a, b);
      if (cost >= costs[next]) continue;
      costs[next] = cost;
      previous[next] = id;
      push({ id: next, cost });
    }
  }
  return [];
}

/**
 * Authored points are interior waypoints; layout points override projection points.
 * Explicit sides use centered ports with outward leads; unset sides snap to the
 * nearest edge. Returns [] for missing endpoints, blocked ports or impossible
 * waypoints (inside an obstacle), never an obstacle-crossing fallback.
 */
export function routeProcessLine(line: ProcessLine, layout: ProcessLayout, projection: ProcessProjection): ProcessPoint[] {
  const boxes = new Map(projection.boxes.map(box => [box.id, box]));
  const fromPosition = layout.boxes[line.from], toPosition = layout.boxes[line.to];
  if (!fromPosition || !toPosition) return [];
  const from = rectangle(fromPosition, boxes.get(line.from));
  const to = rectangle(toPosition, boxes.get(line.to));
  if (!isFlowLine(line)) {
    const a = center(from), b = center(to);
    const horizontal = Math.abs(b.x - a.x) > Math.abs(b.y - a.y);
    const side: ProcessSide = horizontal ? b.x > a.x ? "east" : "west" : b.y > a.y ? "south" : "north";
    const opposite: Record<ProcessSide, ProcessSide> = { north: "south", east: "west", south: "north", west: "east" };
    const endpoint = (rect: Rectangle, box: ProcessBox | undefined, side: ProcessSide) => {
      const point = pin(rect, center(rect), side);
      const inset = box?.shape === "event" ? 8 : 0;
      if (side === "east") point.x -= inset;
      else if (side === "west") point.x += inset;
      else if (side === "north") point.y += inset;
      else point.y -= inset;
      return point;
    };
    return [endpoint(from, boxes.get(line.from), side), endpoint(to, boxes.get(line.to), opposite[side])];
  }
  // Native heading-aware side choice and shared ports apply to every automatic flow.
  if (from.width > 0 && from.height > 0 && to.width > 0 && to.height > 0 && line.from !== line.to
    && !(layout.lines?.[line.id] ?? line.points)?.length) {
    return automaticEventRoute(line, layout, projection);
  }
  const excluded = new Set<string>();
  for (const id of [line.from, line.to]) {
    let parent = boxes.get(id)?.parentId;
    while (parent && !excluded.has(parent)) {
      excluded.add(parent);
      parent = boxes.get(parent)?.parentId;
    }
  }
  const obstacleBoxes = projection.boxes.filter(box => box.kind !== "section" && !excluded.has(box.id) && layout.boxes[box.id]);
  const obstacles = obstacleBoxes.map(box => rectangle(layout.boxes[box.id], box));
  const waypoints = (layout.lines?.[line.id] ?? line.points ?? []).map(point => ({ ...point }));
  if (waypoints.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))) return [];
  if (line.from === line.to && !waypoints.length) {
    waypoints.push({ x: from.x + from.width + CLEARANCE * 2, y: from.y + from.height / 2 },
      { x: from.x + from.width / 2, y: from.y - CLEARANCE * 2 });
  }
  // Ordinary automatic lines sharing an event-connected task must consume the
  // same allocated endpoints; their existing obstacle/waypoint router remains.
  const sharedEvent = !line.fromSide && !line.toSide && !waypoints.length && projection.lines.some(edge =>
    isFlowLine(edge) && !edge.fromSide && !edge.toSide
    && !(layout.lines?.[edge.id] ?? edge.points)?.length
    && (boxes.get(edge.from)?.shape === 'event' || boxes.get(edge.to)?.shape === 'event')
    && [edge.from, edge.to].some(id => id === line.from || id === line.to));
  const ports = sharedEvent ? automaticEventPorts(line, layout, projection) : undefined;
  const fromSide = ports?.fromSide ?? line.fromSide, toSide = ports?.toSide ?? line.toSide;
  const start = ports?.start ?? pin(from, waypoints[0] ?? center(to), fromSide);
  const end = ports?.end ?? pin(to, waypoints.at(-1) ?? center(from), toSide);
  const startLead = portLead(start, fromSide), endLead = portLead(end, toSide);
  // Fixed leads preserve port direction rather than detouring along a box edge.
  if (fromSide && blocked(start, startLead, obstacles)
    || toSide && blocked(endLead, end, obstacles)) return [];
  const anchors = [startLead, ...waypoints, endLead];
  const padded = obstacles.map((rect, index) => {
    if (obstacleBoxes[index].id === line.from || obstacleBoxes[index].id === line.to) return rect;
    return { x: rect.x - CLEARANCE, y: rect.y - CLEARANCE, width: rect.width + CLEARANCE * 2, height: rect.height + CLEARANCE * 2 };
  });
  const result: ProcessPoint[] = fromSide ? [start, startLead] : [];
  for (let i = 1; i < anchors.length; i++) {
    // Prefer clearance, but never reject a valid narrow corridor or waypoint.
    let segment = orthogonal(anchors[i - 1], anchors[i], padded);
    if (!segment.length) segment = orthogonal(anchors[i - 1], anchors[i], obstacles);
    if (!segment.length) return [];
    result.push(...(result.length ? segment.slice(1) : segment));
  }
  if (toSide) result.push(end);
  return ports ? simplify(result) : result;
}

/** Halfway along the polyline's length, not halfway between its endpoints. */
/** Position along the rendered route, including its direction for label placement. */
export function processPointAlong(points: readonly ProcessPoint[], distance: number): ProcessPoint & { horizontal: boolean } {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length && distance <= length) return { x: a.x + (b.x - a.x) * distance / length, y: a.y + (b.y - a.y) * distance / length, horizontal: Math.abs(a.y - b.y) < .01 };
    distance -= length;
  }
  return { ...(points.at(-1) ?? { x: 0, y: 0 }), horizontal: true };
}
export function lineMidpoint(points: readonly ProcessPoint[]): ProcessPoint {
  const distance = points.slice(1).reduce((sum, point, i) => sum + Math.hypot(point.x - points[i].x, point.y - points[i].y), 0) / 2;
  const { x, y } = processPointAlong(points, distance); return { x, y };
}
/** Keep the two 20px end stubs so a straight route also has a middle drag handle. */
export function processSegmentChain(points: readonly ProcessPoint[]): ProcessPoint[] {
  if (points.length < 2) return points.map(point => ({ ...point }));
  const first = points[0], second = points[1], last = points.at(-1)!, previous = points.at(-2)!;
  const chain = [{ ...first }, { x: first.x + Math.sign(second.x - first.x) * 20, y: first.y + Math.sign(second.y - first.y) * 20 }];
  for (const point of [...points.slice(1, -1), { x: last.x + Math.sign(previous.x - last.x) * 20, y: last.y + Math.sign(previous.y - last.y) * 20 }, last]) {
    const before = chain.at(-1)!; if (Math.abs(before.x - point.x) >= .01 || Math.abs(before.y - point.y) >= .01) chain.push({ ...point });
  }
  return chain;
}
export function processArrowPath(points: readonly ProcessPoint[]): string {
  if (points.length < 2) return '';
  const end = points.at(-1)!, previous = points.at(-2)!, length = Math.hypot(end.x - previous.x, end.y - previous.y) || 1;
  const x = (end.x - previous.x) / length, y = (end.y - previous.y) / length, base = { x: end.x - x * 9, y: end.y - y * 9 };
  return `M${end.x},${end.y}L${base.x - y * 4.5},${base.y + x * 4.5}L${base.x + y * 4.5},${base.y - x * 4.5}Z`;
}

/** Shape-aware side midpoint shared by connection targeting and loose previews. */
export function processPortPoint(box: ProcessBox, position: BoxPosition, side: ProcessSide): ProcessPoint {
  const r = rectangle(position, box), result = pin(r, center(r), side), inset = box.shape === 'event' ? 8 : 0;
  if (side === 'north') result.y += inset; else if (side === 'south') result.y -= inset;
  else if (side === 'west') result.x += inset; else result.x -= inset;
  return result;
}

/** Dashed connection preview follows the side facing the pointer, with a 20px lead. */
export function processLooseConnection(box: ProcessBox, position: BoxPosition, point: ProcessPoint, reverse = false): ProcessPoint[] {
  const r = rectangle(position, box), c = center(r), dx = point.x - c.x, dy = point.y - c.y;
  const side: ProcessSide = Math.abs(dx) / (r.width || 1) > Math.abs(dy) / (r.height || 1) ? dx > 0 ? 'east' : 'west' : dy > 0 ? 'south' : 'north';
  const start = processPortPoint(box, position, side);
  const direction = { north: { x: 0, y: -1 }, east: { x: 1, y: 0 }, south: { x: 0, y: 1 }, west: { x: -1, y: 0 } }[side];
  const lead = { x: start.x + direction.x * 20, y: start.y + direction.y * 20 };
  const points = simplify(direction.x ? [start, lead, { x: (lead.x + point.x) / 2, y: lead.y }, { x: (lead.x + point.x) / 2, y: point.y }, point] : [start, lead, { x: lead.x, y: (lead.y + point.y) / 2 }, { x: point.x, y: (lead.y + point.y) / 2 }, point]);
  return reverse ? points.reverse() : points;
}

export function roundedProcessPath(points: readonly ProcessPoint[], radius = 8, verticals: readonly { x: number; y1: number; y2: number }[] = []): string {
  if (!points.length) return "";
  const commands = [`M ${points[0].x} ${points[0].y}`];
  const hops = (previous: ProcessPoint, end: ProcessPoint, index: number, corner = end) => {
    if (Math.abs(previous.y - end.y) >= .01) return;
    const direction = Math.sign(end.x - previous.x);
    const startX = index === 1 ? previous.x : previous.x + direction * Math.min(radius, Math.abs(corner.x - previous.x) / 2);
    const hits = verticals.filter(v => v.x > Math.min(startX, end.x) + 10 && v.x < Math.max(startX, end.x) - 10 && previous.y > v.y1 + 6 && previous.y < v.y2 - 6).map(v => v.x).sort((a, b) => (a - b) * direction);
    for (const x of hits) commands.push(`L ${x - direction * 5} ${previous.y}`, `A 5 5 0 0 ${direction > 0 ? 1 : 0} ${x + direction * 5} ${previous.y}`);
  };
  for (let index = 1; index < points.length - 1; index++) {
    const previous = points[index - 1], corner = points[index], next = points[index + 1];
    const beforeLength = Math.hypot(corner.x - previous.x, corner.y - previous.y);
    const afterLength = Math.hypot(next.x - corner.x, next.y - corner.y);
    if (!beforeLength || !afterLength || (corner.x - previous.x) * (next.y - corner.y) === (corner.y - previous.y) * (next.x - corner.x)) {
      hops(previous, corner, index); commands.push(`L ${corner.x} ${corner.y}`); continue;
    }
    const turn = Math.min(radius, beforeLength / 2, afterLength / 2);
    const enter = { x: corner.x - (corner.x - previous.x) / beforeLength * turn, y: corner.y - (corner.y - previous.y) / beforeLength * turn };
    const leave = { x: corner.x + (next.x - corner.x) / afterLength * turn, y: corner.y + (next.y - corner.y) / afterLength * turn };
    hops(previous, enter, index, corner);
    commands.push(`L ${enter.x} ${enter.y}`, `Q ${corner.x} ${corner.y} ${leave.x} ${leave.y}`);
  }
  if (points.length > 1) hops(points.at(-2)!, points.at(-1)!, points.length - 1);
  commands.push(`L ${points.at(-1)!.x} ${points.at(-1)!.y}`);
  return commands.join(" ");
}

/** Segment-distance hit testing, including zero-length and diagonal segments. */
export function nearProcessLine(point: ProcessPoint, points: readonly ProcessPoint[], tolerance = 16): boolean {
  if (tolerance < 0 || !points.length) return false;
  if (points.length === 1) return distance(point, points[0]) <= tolerance;
  return points.slice(1).some((b, i) => {
    const a = points[i], dx = b.x - a.x, dy = b.y - a.y;
    const squared = dx * dx + dy * dy;
    const t = squared ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / squared)) : 0;
    return distance(point, { x: a.x + dx * t, y: a.y + dy * t }) <= tolerance;
  });
}
