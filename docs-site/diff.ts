/**
 * Minimal line-level diff for highlighting a lesson step's delta against the
 * previous step. Pure and DOM-free so it can be unit-tested in node.
 */

/** Line indices in `curr` that are new relative to `prev` (LCS-based). */
export const addedLines = (prev: string, curr: string): Set<number> => {
  const a = prev ? prev.split("\n") : [];
  const b = curr.split("\n");
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const added = new Set<number>();
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      added.add(j);
      j++;
    }
  }
  while (j < n) {
    added.add(j);
    j++;
  }
  return added;
};
