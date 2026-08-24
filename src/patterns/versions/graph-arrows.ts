/**
 * Which ends of a graph edge carry an arrowhead.
 *
 * Shared by `box-version-graph` and `box-lineage-graph`, which draw the same
 * edge geometry from the same layout and should not disagree about what an
 * arrow means. Lives here rather than in either component because the lineage
 * graph already depends on this directory for `computeVersionGraphLayout`, and
 * the reverse dependency would be a cycle.
 */
export type GraphArrows = "none" | "start" | "end" | "both";

const GRAPH_ARROWS = new Set<GraphArrows>(["none", "start", "end", "both"]);

/**
 * Narrow an author-supplied value, falling back to `end`.
 *
 * `end` is the default because these are directed graphs: the layout builds
 * every edge as parent → child, so a single head on the child is the reading
 * that matches the data. A typo should not silently turn the direction off.
 */
export const resolveGraphArrows = (value: string | null | undefined): GraphArrows =>
  GRAPH_ARROWS.has(value as GraphArrows) ? (value as GraphArrows) : "end";

/** Whether the head at the child end is drawn. */
export const hasEndArrow = (arrows: GraphArrows): boolean =>
  arrows === "end" || arrows === "both";

/** Whether the head at the parent end is drawn. */
export const hasStartArrow = (arrows: GraphArrows): boolean =>
  arrows === "start" || arrows === "both";
