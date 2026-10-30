import { chartScale } from "./chart-scale.js";

/** IDs identify observations across refreshes; x is a coordinate, never an array index. */
export interface CartesianPoint {
  id: string;
  x: number;
  y: number | null;
  label?: string;
  size?: number;
}
export interface CartesianSeries {
  id: string;
  label: string;
  points: CartesianPoint[];
  tone?: string;
  kind?: "bar" | "line" | "area";
  stack?: string;
  axis?: string;
}
export interface CartesianAxis {
  id: string;
  label: string;
  scale?: "linear" | "log";
  domain?: [number, number];
}
export type ChartInterpolation = "linear" | "monotone" | "step-before" | "step-after" | "step-middle";
export interface ChartScale {
  ticks: number[];
  position(value: number): number;
}
export interface BarGeometry {
  series: CartesianSeries;
  point: CartesianPoint;
  group: number;
  groups: number;
  low: number;
  high: number;
}

export function validateCartesian(series: CartesianSeries[], axes: CartesianAxis[], ordered: boolean): string | null {
  if (!Array.isArray(series) || !Array.isArray(axes) || axes.length < 1 || axes.length > 2) return "Supply one or two named y axes.";
  if (new Set(axes.map(a => a?.id)).size !== axes.length || axes.some(a => !a || !a.id || typeof a.label !== "string" || !a.label.trim() || a.scale && !["linear", "log"].includes(a.scale) || a.domain && (!Array.isArray(a.domain) || a.domain.length !== 2 || !a.domain.every(Number.isFinite) || a.domain[0] >= a.domain[1] || a.scale === "log" && a.domain[0] <= 0))) return "Axes require unique IDs and finite increasing domains.";
  const ids = new Set<string>();
  const seriesIds = new Set<string>();
  for (const s of series) {
    if (!s || typeof s.id !== "string" || !s.id || seriesIds.has(s.id) || typeof s.label !== "string" || !s.label.trim() || !Array.isArray(s.points) || s.kind && !["bar", "line", "area"].includes(s.kind) || s.axis && !axes.some(a => a.id === s.axis)) return "Series require unique IDs, labels, points and a known axis.";
    seriesIds.add(s.id);
    for (let i = 0; i < s.points.length; i++) {
      const p = s.points[i];
      if (!p || typeof p.id !== "string" || !p.id || ids.has(p.id) || !Number.isFinite(p.x) || p.y !== null && !Number.isFinite(p.y) || p.size !== undefined && (!Number.isFinite(p.size) || p.size < 0) || p.label !== undefined && typeof p.label !== "string") return "Observations require unique IDs, finite coordinates and nonnegative sizes; missing y is null.";
      if (ordered && i && p.x <= s.points[i - 1].x) return "Line and area x coordinates must be strictly increasing within each series.";
      ids.add(p.id);
    }
  }
  return null;
}

/** Groups share one category slot; signed stacks accumulate on either side of zero. */
export function groupedBars(series: CartesianSeries[], stacked: boolean): BarGeometry[] {
  const groupKey = (s: CartesianSeries) => JSON.stringify([s.axis ?? "primary", stacked ? s.stack ?? "default" : s.id]);
  const groups = [...new Set(series.map(groupKey))];
  const totals = new Map<string, { positive: number; negative: number }>();
  const result: BarGeometry[] = [];
  for (const s of series) {
    const group = groups.indexOf(groupKey(s));
    for (const point of s.points) {
      if (point.y === null) continue;
      // Axis identity is part of the stack identity: unlike units never accumulate.
      const key = JSON.stringify([s.axis ?? "primary", group, point.x]);
      const total = totals.get(key) ?? { positive: 0, negative: 0 };
      const start = stacked ? point.y >= 0 ? total.positive : total.negative : 0;
      const end = start + point.y;
      if (!Number.isFinite(end)) throw new Error("Stack totals exceed the finite numeric range.");
      if (point.y >= 0) total.positive = end; else total.negative = end;
      totals.set(key, total);
      result.push({ series: s, point, group, groups: groups.length, low: Math.min(start, end), high: Math.max(start, end) });
    }
  }
  return result;
}

export function numericScale(values: number[], logarithmic = false, domain?: [number, number], includeZero = true): ChartScale {
  if (logarithmic) {
    if (values.some(v => v <= 0)) throw new Error("Logarithmic coordinates must be positive.");
    const logs = domain ? domain.map(Math.log10) : values.map(Math.log10);
    let low = domain ? logs[0] : Infinity;
    let high = domain ? logs[1] : -Infinity;
    if (!domain) for (const value of logs) { low = Math.min(low, Math.floor(value)); high = Math.max(high, Math.ceil(value)); }
    if (!Number.isFinite(low)) low = 0;
    if (!Number.isFinite(high)) high = 1;
    const minimumLog = Math.log10(Number.MIN_VALUE), maximumLog = Math.log10(Number.MAX_VALUE);
    low = Math.max(minimumLog, low); high = Math.min(maximumLog, high);
    if (low === high) { if (high < maximumLog) high = Math.min(maximumLog, low + 1); else low = high - 1; }
    const powerValue = (p: number) => p <= minimumLog ? Number.MIN_VALUE : p >= maximumLog ? Number.MAX_VALUE : 10 ** p;
    const ticks = [powerValue(low)];
    const step = Math.max(1, Math.ceil((high - low) / 5));
    for (let p = Math.ceil(low); p < high; p += step) if (p > low) ticks.push(powerValue(p));
    ticks.push(powerValue(high));
    return { ticks: [...new Set(ticks.filter(v => Number.isFinite(v) && v > 0))], position: v => (Math.log10(v) - low) / (high - low) };
  }
  if (!domain) return chartScale(values, { includeZero });
  const magnitude = Math.max(Math.abs(domain[0]), Math.abs(domain[1]), 1);
  const low = domain[0] / magnitude, span = domain[1] / magnitude - low;
  return { ticks: Array.from({ length: 5 }, (_, i) => (low + span * i / 4) * magnitude), position: v => (v / magnitude - low) / span };
}

/** Values map to area: doubling a quantity doubles area, not radius. */
export function bubbleRadius(value: number, maximum: number, radius = 22): number {
  return maximum > 0 ? Math.sqrt(value / maximum) * radius : 0;
}

type Coordinate = { x: number; y: number | null };
/** Independent implementation of monotone Hermite interpolation, split at every null. */
export function linePath(points: Coordinate[], mode: ChartInterpolation = "linear"): string {
  const segments: Coordinate[][] = [];
  let current: Coordinate[] = [];
  for (const p of points) {
    if (p.y === null) { if (current.length) segments.push(current); current = []; }
    else current.push(p);
  }
  if (current.length) segments.push(current);
  return segments.map(segment => {
    const slopes = segment.slice(1).map((p, i) => (p.y! - segment[i].y!) / (p.x - segment[i].x));
    const tangents = segment.map((_, i) => !i ? slopes[0] ?? 0 : i === segment.length - 1 ? slopes[i - 1] : slopes[i - 1] * slopes[i] <= 0 ? 0 : 2 / (1 / slopes[i - 1] + 1 / slopes[i]));
    let path = `M ${segment[0].x} ${segment[0].y}`;
    for (let i = 1; i < segment.length; i++) {
      const a = segment[i - 1], b = segment[i];
      if (mode === "step-before") path += ` V ${b.y} H ${b.x}`;
      else if (mode === "step-after") path += ` H ${b.x} V ${b.y}`;
      else if (mode === "step-middle") path += ` H ${(a.x + b.x) / 2} V ${b.y} H ${b.x}`;
      else if (mode === "monotone") {
        const dx = (b.x - a.x) / 3;
        const low = Math.min(a.y!, b.y!), high = Math.max(a.y!, b.y!);
        const clamp = (v: number) => Math.min(high, Math.max(low, v));
        path += ` C ${a.x + dx} ${clamp(a.y! + dx * tangents[i - 1])} ${b.x - dx} ${clamp(b.y! - dx * tangents[i])} ${b.x} ${b.y}`;
      } else path += ` L ${b.x} ${b.y}`;
    }
    return path;
  }).join(" ");
}

/** Min/max per pixel bucket. A bucket containing missingness is a gap, never a bridge. */
export function renderingPoints(points: CartesianPoint[], budget: number): CartesianPoint[] {
  if (points.length <= budget) return points;
  const size = Math.max(1, Math.ceil(points.length / Math.max(1, Math.floor(budget / 4))));
  const result: CartesianPoint[] = [];
  for (let offset = 0; offset < points.length; offset += size) {
    const bucket = points.slice(offset, offset + size);
    const missing = bucket.find(p => p.y === null);
    if (missing) { result.push({ ...missing }); continue; }
    let min = 0, max = 0;
    for (let i = 1; i < bucket.length; i++) {
      if (bucket[i].y! < bucket[min].y!) min = i;
      if (bucket[i].y! > bucket[max].y!) max = i;
    }
    for (const i of [...new Set([0, min, max, bucket.length - 1])].sort((a, b) => a - b)) result.push(bucket[i]);
  }
  return result;
}
