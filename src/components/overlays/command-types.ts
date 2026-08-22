/**
 * Command model and the pure match/rank/group engine behind
 * `box-command-palette`. DOM-free and deterministic, so ranking can be
 * tested and reused (a host can drive its own launcher from the same
 * functions).
 */

export interface CommandDescriptor {
  id: string;
  label: string;
  /** Secondary line: what the command does, or where it acts. */
  description?: string;
  /** Section heading. Commands without one land in a trailing group. */
  group?: string;
  /**
   * Extra terms that should match but are not shown — synonyms, the old
   * name for a renamed action, the entity a command acts on.
   */
  keywords?: string[];
  /** Rendered hint such as `⌘K`; purely presentational. */
  shortcut?: string;
  disabled?: boolean;
}

export interface CommandMatch {
  command: CommandDescriptor;
  /** Higher is better. */
  score: number;
  /** Indices into `label` that matched, for highlighting. Empty on an unfiltered list. */
  ranges: number[];
}

export interface CommandGroup {
  /** Empty string for the ungrouped trailing section. */
  key: string;
  label: string;
  matches: CommandMatch[];
}

export const COMMAND_UNGROUPED_KEY = "";
export const COMMAND_UNGROUPED_LABEL = "Other";

/** Scoring weights. Tuned so an exact prefix always beats a scattered subsequence. */
const SCORE_EXACT = 1000;
const SCORE_PREFIX = 500;
const SCORE_WORD_START = 250;
const SCORE_SUBSTRING = 120;
const SCORE_CONSECUTIVE = 8;
const SCORE_KEYWORD = 40;
const PENALTY_DISTANCE = 1;

const isWordBoundary = (text: string, index: number): boolean =>
  index === 0 || /[\s\-_/.]/.test(text[index - 1]!);

/**
 * Subsequence match: every query character must appear in order. Returns the
 * matched indices, preferring word starts and consecutive runs — so "cl" hits
 * "**Cl**ause" ahead of "Can**c**e**l**".
 */
const subsequence = (haystack: string, needle: string): { score: number; ranges: number[] } | null => {
  const ranges: number[] = [];
  let score = 0;
  let cursor = 0;
  let previous = -1;

  for (const character of needle) {
    let index = haystack.indexOf(character, cursor);
    if (index === -1) {
      return null;
    }
    // Prefer a later occurrence if it starts a word — matching initials reads
    // far better than matching the middle of the first word.
    let candidate = index;
    while (candidate !== -1 && !isWordBoundary(haystack, candidate)) {
      const next = haystack.indexOf(character, candidate + 1);
      if (next === -1) {
        break;
      }
      if (isWordBoundary(haystack, next)) {
        candidate = next;
        break;
      }
      candidate = next;
    }
    if (candidate !== -1 && isWordBoundary(haystack, candidate)) {
      index = candidate;
    }

    ranges.push(index);
    if (isWordBoundary(haystack, index)) {
      score += SCORE_WORD_START;
    }
    if (previous !== -1 && index === previous + 1) {
      score += SCORE_CONSECUTIVE;
    }
    score -= Math.min(index - cursor, 20) * PENALTY_DISTANCE;
    previous = index;
    cursor = index + 1;
  }

  return { score, ranges };
};

const scoreCommand = (
  command: CommandDescriptor,
  query: string,
): { score: number; ranges: number[] } | null => {
  const label = command.label.toLowerCase();

  if (label === query) {
    return { score: SCORE_EXACT, ranges: [...label].map((_, index) => index) };
  }

  const substringIndex = label.indexOf(query);
  if (substringIndex === 0) {
    return {
      score: SCORE_PREFIX,
      ranges: Array.from({ length: query.length }, (_, index) => index),
    };
  }
  if (substringIndex > 0) {
    return {
      score: SCORE_SUBSTRING + (isWordBoundary(label, substringIndex) ? SCORE_WORD_START : 0),
      ranges: Array.from({ length: query.length }, (_, index) => substringIndex + index),
    };
  }

  const bySubsequence = subsequence(label, query);
  if (bySubsequence) {
    return bySubsequence;
  }

  // Keywords match but never highlight — they are not on screen.
  for (const keyword of command.keywords ?? []) {
    if (keyword.toLowerCase().includes(query)) {
      return { score: SCORE_KEYWORD, ranges: [] };
    }
  }

  return null;
};

export interface MatchCommandsOptions {
  /** Command ids used most recently, most recent first. Boosts ranking. */
  recentIds?: readonly string[];
  /** Drop disabled commands entirely instead of ranking them last. */
  hideDisabled?: boolean;
}

/**
 * Rank commands against a query.
 *
 * An empty query returns everything in recent-first then input order, which
 * is what a palette should show when it opens. Ties are broken by input order
 * (the sort is stable), never by object identity, so the same catalogue always
 * renders the same way.
 */
export const matchCommands = (
  commands: readonly CommandDescriptor[],
  query: string,
  options: MatchCommandsOptions = {},
): CommandMatch[] => {
  const recent = options.recentIds ?? [];
  const recentRank = new Map(recent.map((id, index) => [id, recent.length - index]));
  const normalized = query.trim().toLowerCase();
  const pool = options.hideDisabled ? commands.filter(command => !command.disabled) : commands;

  if (!normalized) {
    return [...pool]
      .map(command => ({
        command,
        score: (recentRank.get(command.id) ?? 0) * 10,
        ranges: [] as number[],
      }))
      .sort((left, right) => right.score - left.score);
  }

  const matches: CommandMatch[] = [];
  for (const command of pool) {
    const scored = scoreCommand(command, normalized);
    if (!scored) {
      continue;
    }
    matches.push({
      command,
      // A disabled command still matches, but never outranks a usable one.
      score: scored.score + (recentRank.get(command.id) ?? 0) - (command.disabled ? SCORE_EXACT : 0),
      ranges: scored.ranges,
    });
  }

  return matches.sort((left, right) => right.score - left.score);
};

/**
 * Bucket ranked matches into sections, preserving rank order both between
 * groups (a group leads where its best match ranks) and within them.
 * Ungrouped commands trail.
 */
export const groupCommandMatches = (matches: readonly CommandMatch[]): CommandGroup[] => {
  const groups = new Map<string, CommandGroup>();

  for (const match of matches) {
    const key = match.command.group ?? COMMAND_UNGROUPED_KEY;
    let group = groups.get(key);
    if (!group) {
      group = { key, label: key || COMMAND_UNGROUPED_LABEL, matches: [] };
      groups.set(key, group);
    }
    group.matches.push(match);
  }

  const ordered = [...groups.values()];
  const trailing = groups.get(COMMAND_UNGROUPED_KEY);
  if (!trailing) {
    return ordered;
  }
  return [...ordered.filter(group => group.key !== COMMAND_UNGROUPED_KEY), trailing];
};

export interface ShortcutGroup {
  key: string;
  label: string;
  commands: CommandDescriptor[];
}

/**
 * The commands that declare a keyboard shortcut, grouped for a shortcuts
 * sheet. Takes the same catalogue the palette does, so one list drives both
 * surfaces and a shortcut can never be documented but unreachable — or
 * reachable but undocumented.
 *
 * Groups keep catalogue order, with the ungrouped section trailing, matching
 * how the palette sections its results.
 */
export const groupShortcutCommands = (
  commands: readonly CommandDescriptor[],
): ShortcutGroup[] => {
  const groups = new Map<string, ShortcutGroup>();

  for (const command of commands) {
    if (!command.shortcut) {
      continue;
    }
    const key = command.group ?? COMMAND_UNGROUPED_KEY;
    let group = groups.get(key);
    if (!group) {
      group = { key, label: key || COMMAND_UNGROUPED_LABEL, commands: [] };
      groups.set(key, group);
    }
    group.commands.push(command);
  }

  const ordered = [...groups.values()];
  const trailing = groups.get(COMMAND_UNGROUPED_KEY);
  if (!trailing) {
    return ordered;
  }
  return [...ordered.filter(group => group.key !== COMMAND_UNGROUPED_KEY), trailing];
};

/**
 * Split a shortcut string into its keys: `mod+shift+k` → `["mod","shift","k"]`.
 * Rendering each key separately is what lets a sheet show them as `<kbd>`
 * elements rather than one opaque run of text.
 *
 * `+` is both the separator and a real key — `mod++` is how you write the zoom
 * shortcut. A `+` with no key pending in front of it is the key itself, so
 * `mod++` and `ctrl + +` both give `["mod", "+"]` rather than dropping it.
 */
export const splitShortcutKeys = (shortcut: string): string[] => {
  const keys: string[] = [];
  let buffer = "";

  const flush = (): void => {
    const key = buffer.trim();
    if (key) {
      keys.push(key);
    }
    buffer = "";
  };

  for (const character of shortcut) {
    if (character !== "+") {
      buffer += character;
      continue;
    }
    if (!buffer.trim()) {
      buffer = "+";
    }
    flush();
  }
  flush();

  return keys;
};

/** Split a label into highlighted and plain runs for rendering. */
export const splitCommandLabel = (
  label: string,
  ranges: readonly number[],
): Array<{ text: string; match: boolean }> => {
  if (ranges.length === 0) {
    return [{ text: label, match: false }];
  }
  const flags = new Set(ranges);
  const parts: Array<{ text: string; match: boolean }> = [];
  let buffer = "";
  let bufferMatch = flags.has(0);

  for (let index = 0; index < label.length; index += 1) {
    const isMatch = flags.has(index);
    if (isMatch !== bufferMatch && buffer) {
      parts.push({ text: buffer, match: bufferMatch });
      buffer = "";
    }
    bufferMatch = isMatch;
    buffer += label[index]!;
  }
  if (buffer) {
    parts.push({ text: buffer, match: bufferMatch });
  }
  return parts;
};

/** Attribute payloads are author input — validate every record. */
export const isCommandDescriptorRecord = (value: unknown): value is CommandDescriptor => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const command = value as Record<string, unknown>;
  if (typeof command.id !== "string" || command.id.length === 0) {
    return false;
  }
  if (typeof command.label !== "string" || command.label.length === 0) {
    return false;
  }
  if (command.keywords !== undefined) {
    if (!Array.isArray(command.keywords)) {
      return false;
    }
    if (command.keywords.some(keyword => typeof keyword !== "string")) {
      return false;
    }
  }
  return true;
};
