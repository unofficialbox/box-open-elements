/**
 * Pure text-diff engine: line-level alignment with word-level refinement of
 * changed lines. DOM-free and deterministic so the whole pipeline is
 * unit-testable; the viewer element is a thin renderer over `computeTextDiff`.
 */
import type { DiffResult, DiffRow, DiffSegment, DiffStats } from "./types.js";

/**
 * LCS matching cap. Above this many DP cells the middle of the comparison is
 * treated as a whole replacement instead — O(n·m) memory on arbitrary input
 * is not acceptable for an element attribute, and a clause-sized document
 * never gets near the cap.
 */
const MAX_LCS_CELLS = 400_000;

type Op<T> = { kind: "equal" | "removed" | "added"; items: T[] };

/** Generic LCS-based edit script over two arrays. */
const editScript = <T>(a: T[], b: T[]): Array<Op<T>> => {
  // Trim the common prefix/suffix first — it keeps the DP small for the
  // typical "one clause edited in a long document" case.
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) {
    start += 1;
  }
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA -= 1;
    endB -= 1;
  }

  const middleA = a.slice(start, endA);
  const middleB = b.slice(start, endB);

  const ops: Array<Op<T>> = [];
  if (start > 0) {
    ops.push({ kind: "equal", items: a.slice(0, start) });
  }

  if (middleA.length === 0 && middleB.length === 0) {
    // Nothing between prefix and suffix.
  } else if (middleA.length === 0) {
    ops.push({ kind: "added", items: middleB });
  } else if (middleB.length === 0) {
    ops.push({ kind: "removed", items: middleA });
  } else if (middleA.length * middleB.length > MAX_LCS_CELLS) {
    ops.push({ kind: "removed", items: middleA });
    ops.push({ kind: "added", items: middleB });
  } else {
    const m = middleA.length;
    const n = middleB.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i -= 1) {
      for (let j = n - 1; j >= 0; j -= 1) {
        dp[i]![j] =
          middleA[i] === middleB[j]
            ? dp[i + 1]![j + 1]! + 1
            : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
      }
    }

    let i = 0;
    let j = 0;
    const push = (kind: Op<T>["kind"], item: T): void => {
      const last = ops[ops.length - 1];
      if (last && last.kind === kind) {
        last.items.push(item);
      } else {
        ops.push({ kind, items: [item] });
      }
    };
    while (i < m && j < n) {
      if (middleA[i] === middleB[j]) {
        push("equal", middleA[i]!);
        i += 1;
        j += 1;
      } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
        push("removed", middleA[i]!);
        i += 1;
      } else {
        push("added", middleB[j]!);
        j += 1;
      }
    }
    while (i < m) {
      push("removed", middleA[i]!);
      i += 1;
    }
    while (j < n) {
      push("added", middleB[j]!);
      j += 1;
    }
  }

  if (endA < a.length) {
    ops.push({ kind: "equal", items: a.slice(endA) });
  }
  return ops;
};

/** Split into word/whitespace tokens so joins reproduce the exact line. */
const tokenize = (line: string): string[] => line.split(/(\s+)/).filter(token => token.length > 0);

const mergeSegments = (segments: DiffSegment[]): DiffSegment[] => {
  // Whitespace-only equal runs between two same-kind change runs read as
  // noise ("a b c" → three separate marks); absorb them into the change.
  const absorbed: DiffSegment[] = [];
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]!;
    const previous = segments[index - 1];
    const next = segments[index + 1];
    if (
      segment.kind === "equal" &&
      segment.text.trim() === "" &&
      previous &&
      next &&
      previous.kind !== "equal" &&
      previous.kind === next.kind
    ) {
      absorbed.push({ kind: previous.kind, text: segment.text });
    } else {
      absorbed.push(segment);
    }
  }

  const merged: DiffSegment[] = [];
  for (const segment of absorbed) {
    const last = merged[merged.length - 1];
    if (last && last.kind === segment.kind) {
      last.text += segment.text;
    } else {
      merged.push({ ...segment });
    }
  }
  return merged;
};

/**
 * Word-level runs for one changed line pair: the before side carries
 * equal/removed segments, the after side equal/added.
 */
export const computeInlineSegments = (
  before: string,
  after: string,
): { before: DiffSegment[]; after: DiffSegment[] } => {
  const ops = editScript(tokenize(before), tokenize(after));
  const beforeSegments: DiffSegment[] = [];
  const afterSegments: DiffSegment[] = [];
  for (const op of ops) {
    const text = op.items.join("");
    if (op.kind === "equal") {
      beforeSegments.push({ kind: "equal", text });
      afterSegments.push({ kind: "equal", text });
    } else if (op.kind === "removed") {
      beforeSegments.push({ kind: "removed", text });
    } else {
      afterSegments.push({ kind: "added", text });
    }
  }
  return { before: mergeSegments(beforeSegments), after: mergeSegments(afterSegments) };
};

/** True when a removed/added line pair is similar enough to render as one changed row. */
const isChangedPair = (before: string, after: string): boolean => {
  if (before === after) {
    return true;
  }
  const segments = computeInlineSegments(before, after);
  const equalLength = segments.after
    .filter(segment => segment.kind === "equal")
    .reduce((total, segment) => total + segment.text.length, 0);
  const maxLength = Math.max(before.length, after.length);
  return maxLength > 0 && equalLength / maxLength >= 0.3;
};

/**
 * Line-level diff of two documents. Adjacent removed/added runs are paired
 * into `changed` rows (with word-level segments) when the lines are similar
 * enough; otherwise they stay as distinct removals and additions.
 */
export const computeTextDiff = (before: string, after: string): DiffResult => {
  // Normalize EOL styles first — two documents differing only in CRLF vs LF
  // must not read as a full-document replacement.
  const toLines = (text: string): string[] =>
    text.length ? text.replaceAll("\r\n", "\n").replaceAll("\r", "\n").split("\n") : [];
  const beforeLines = toLines(before);
  const afterLines = toLines(after);
  const ops = editScript(beforeLines, afterLines);

  const rows: DiffRow[] = [];
  const stats: DiffStats = { added: 0, removed: 0, changed: 0 };
  let beforeNumber = 1;
  let afterNumber = 1;

  let index = 0;
  while (index < ops.length) {
    const op = ops[index]!;

    if (op.kind === "equal") {
      for (const text of op.items) {
        rows.push({
          kind: "equal",
          before: { number: beforeNumber, text },
          after: { number: afterNumber, text },
        });
        beforeNumber += 1;
        afterNumber += 1;
      }
      index += 1;
      continue;
    }

    // A removed run directly followed by an added run pairs line-by-line.
    const next = ops[index + 1];
    if (op.kind === "removed" && next?.kind === "added") {
      const removed = op.items;
      const added = next.items;
      const paired = Math.min(removed.length, added.length);
      for (let pair = 0; pair < paired; pair += 1) {
        const beforeText = removed[pair]!;
        const afterText = added[pair]!;
        if (isChangedPair(beforeText, afterText)) {
          const segments = computeInlineSegments(beforeText, afterText);
          rows.push({
            kind: "changed",
            before: { number: beforeNumber, text: beforeText, segments: segments.before },
            after: { number: afterNumber, text: afterText, segments: segments.after },
          });
          stats.changed += 1;
        } else {
          rows.push({ kind: "removed", before: { number: beforeNumber, text: beforeText } });
          rows.push({ kind: "added", after: { number: afterNumber, text: afterText } });
          stats.removed += 1;
          stats.added += 1;
        }
        beforeNumber += 1;
        afterNumber += 1;
      }
      for (let rest = paired; rest < removed.length; rest += 1) {
        rows.push({ kind: "removed", before: { number: beforeNumber, text: removed[rest]! } });
        stats.removed += 1;
        beforeNumber += 1;
      }
      for (let rest = paired; rest < added.length; rest += 1) {
        rows.push({ kind: "added", after: { number: afterNumber, text: added[rest]! } });
        stats.added += 1;
        afterNumber += 1;
      }
      index += 2;
      continue;
    }

    if (op.kind === "removed") {
      for (const text of op.items) {
        rows.push({ kind: "removed", before: { number: beforeNumber, text } });
        stats.removed += 1;
        beforeNumber += 1;
      }
    } else {
      for (const text of op.items) {
        rows.push({ kind: "added", after: { number: afterNumber, text } });
        stats.added += 1;
        afterNumber += 1;
      }
    }
    index += 1;
  }

  const changeRanges: DiffResult["changeRanges"] = [];
  for (let row = 0; row < rows.length; row += 1) {
    if (rows[row]!.kind === "equal") {
      continue;
    }
    const start = row;
    while (row + 1 < rows.length && rows[row + 1]!.kind !== "equal") {
      row += 1;
    }
    changeRanges.push({ start, end: row });
  }

  return { rows, stats, changeRanges };
};

/** Compact "+A −R ~C" summary for headers and chips. */
export const formatDiffStats = (stats: DiffStats): string => {
  const parts: string[] = [];
  if (stats.added) {
    parts.push(`+${String(stats.added)}`);
  }
  if (stats.removed) {
    parts.push(`−${String(stats.removed)}`);
  }
  if (stats.changed) {
    parts.push(`~${String(stats.changed)}`);
  }
  return parts.length ? parts.join(" ") : "No changes";
};
