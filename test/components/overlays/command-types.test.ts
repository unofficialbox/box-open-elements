import { describe, expect, it } from "vitest";

import {
  groupCommandMatches,
  isCommandDescriptorRecord,
  matchCommands,
  splitCommandLabel,
} from "../../../src/components/overlays/command-types.js";
import type { CommandDescriptor } from "../../../src/components/overlays/command-types.js";

const commands: CommandDescriptor[] = [
  { id: "new-contract", label: "New contract", group: "Create", shortcut: "⌘N" },
  { id: "new-clause", label: "New clause", group: "Create" },
  { id: "compare-versions", label: "Compare versions", group: "Review", keywords: ["diff", "redline"] },
  { id: "approve", label: "Approve request", group: "Review" },
  { id: "cancel-request", label: "Cancel request", group: "Review", disabled: true },
  { id: "settings", label: "Open settings" },
];

const ids = (query: string, options = {}) =>
  matchCommands(commands, query, options).map(match => match.command.id);

describe("matchCommands", () => {
  it("returns everything in input order for an empty query", () => {
    expect(ids("")).toEqual([
      "new-contract",
      "new-clause",
      "compare-versions",
      "approve",
      "cancel-request",
      "settings",
    ]);
  });

  it("puts recent commands first when nothing is typed", () => {
    expect(ids("", { recentIds: ["approve", "settings"] }).slice(0, 2)).toEqual([
      "approve",
      "settings",
    ]);
  });

  it("ranks an exact label above a prefix above a substring", () => {
    const ranked = matchCommands(
      [
        { id: "sub", label: "Bulk approve items" },
        { id: "prefix", label: "Approve request later" },
        { id: "exact", label: "approve" },
      ],
      "approve",
    );
    expect(ranked.map(match => match.command.id)).toEqual(["exact", "prefix", "sub"]);
  });

  it("requires the query characters in order, not merely present", () => {
    // "approve" has no `e` after its `v` in "Reopen approval", so this is a
    // non-match — a bag-of-characters matcher would wrongly accept it.
    expect(matchCommands([{ id: "x", label: "Reopen approval" }], "approve")).toEqual([]);
  });

  it("matches initials through a subsequence", () => {
    // "cv" should reach "Compare versions" by word starts.
    expect(ids("cv")[0]).toBe("compare-versions");
  });

  it("matches hidden keywords without highlighting them", () => {
    const [match] = matchCommands(commands, "redline");
    expect(match?.command.id).toBe("compare-versions");
    // The term is not in the label, so there is nothing to highlight.
    expect(match?.ranges).toEqual([]);
  });

  it("returns no matches when nothing contains the query in order", () => {
    expect(ids("zzz")).toEqual([]);
  });

  it("ranks a disabled command last but still finds it", () => {
    const result = ids("request");
    expect(result).toContain("cancel-request");
    expect(result.at(-1)).toBe("cancel-request");
  });

  it("drops disabled commands entirely when asked", () => {
    expect(ids("request", { hideDisabled: true })).not.toContain("cancel-request");
    expect(ids("", { hideDisabled: true })).not.toContain("cancel-request");
  });

  it("is case-insensitive and ignores surrounding whitespace", () => {
    expect(ids("  NEW CON  ")).toContain("new-contract");
  });

  it("breaks ties by input order rather than by object identity", () => {
    const tied: CommandDescriptor[] = [
      { id: "a", label: "Same label" },
      { id: "b", label: "Same label" },
      { id: "c", label: "Same label" },
    ];
    expect(matchCommands(tied, "same").map(m => m.command.id)).toEqual(["a", "b", "c"]);
  });
});

describe("groupCommandMatches", () => {
  it("keeps rank order between and within groups, trailing the ungrouped", () => {
    const groups = groupCommandMatches(matchCommands(commands, ""));
    expect(groups.map(group => group.key)).toEqual(["Create", "Review", ""]);
    expect(groups.at(-1)?.label).toBe("Other");
    expect(groups[0]?.matches.map(match => match.command.id)).toEqual([
      "new-contract",
      "new-clause",
    ]);
  });

  it("leads with the group holding the best match", () => {
    // "approve" only hits the Review group, so Review must come first.
    const groups = groupCommandMatches(matchCommands(commands, "approve"));
    expect(groups[0]?.key).toBe("Review");
  });

  it("omits the trailing section when everything is grouped", () => {
    const grouped = commands.filter(command => command.group);
    expect(groupCommandMatches(matchCommands(grouped, "")).map(g => g.key)).toEqual([
      "Create",
      "Review",
    ]);
  });
});

describe("splitCommandLabel", () => {
  it("splits a label into matched and unmatched runs", () => {
    expect(splitCommandLabel("New contract", [0, 1, 2])).toEqual([
      { text: "New", match: true },
      { text: " contract", match: false },
    ]);
  });

  it("handles non-contiguous matches", () => {
    expect(splitCommandLabel("Compare versions", [0, 8])).toEqual([
      { text: "C", match: true },
      { text: "ompare ", match: false },
      { text: "v", match: true },
      { text: "ersions", match: false },
    ]);
  });

  it("returns one plain run when nothing matched", () => {
    expect(splitCommandLabel("Open settings", [])).toEqual([
      { text: "Open settings", match: false },
    ]);
  });
});

describe("isCommandDescriptorRecord", () => {
  it("requires a non-empty id and label", () => {
    expect(isCommandDescriptorRecord({ id: "a", label: "A" })).toBe(true);
    expect(isCommandDescriptorRecord({ id: "", label: "A" })).toBe(false);
    expect(isCommandDescriptorRecord({ id: "a", label: "" })).toBe(false);
    expect(isCommandDescriptorRecord({ label: "A" })).toBe(false);
    expect(isCommandDescriptorRecord(null)).toBe(false);
  });

  it("validates the keywords array element by element", () => {
    expect(isCommandDescriptorRecord({ id: "a", label: "A", keywords: ["x"] })).toBe(true);
    expect(isCommandDescriptorRecord({ id: "a", label: "A", keywords: "x" })).toBe(false);
    expect(isCommandDescriptorRecord({ id: "a", label: "A", keywords: [1] })).toBe(false);
  });
});
