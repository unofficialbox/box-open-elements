import { describe, expect, it } from "vitest";

import {
  formatItemDate,
  formatItemMetaLine,
  formatItemOwner,
  formatItemShared,
  formatItemSize,
} from "../../../../src/patterns/content-explorer/adapters/item-summary.js";
import type { ExplorerItem } from "../../../../src/patterns/content-explorer/types.js";

describe("item-summary helpers", () => {
  it("formats byte sizes", () => {
    expect(formatItemSize(null)).toBe("");
    expect(formatItemSize(512)).toBe("512 B");
    expect(formatItemSize(2_400_000)).toBe("2.3 MB");
    expect(formatItemSize(5_120_000)).toBe("4.9 MB");
  });

  it("formats ISO dates", () => {
    expect(formatItemDate(null)).toBe("");
    expect(formatItemDate("not-a-date")).toBe("");
    expect(formatItemDate("2026-07-10T18:30:00.000Z")).toMatch(/Jul/);
    expect(formatItemDate("2026-07-10T18:30:00.000Z")).toMatch(/2026/);
  });

  it("formats owner and shared labels", () => {
    expect(formatItemOwner({ id: "1", name: "Spec", type: "file" })).toBe("");
    expect(
      formatItemOwner({
        id: "1",
        name: "Spec",
        type: "file",
        owner: { id: "u1", name: "Morgan Lee" },
      }),
    ).toBe("Morgan Lee");

    expect(formatItemShared(null)).toBe("");
    expect(formatItemShared({ isShared: false })).toBe("");
    expect(formatItemShared({ isShared: true })).toBe("Shared");
    expect(formatItemShared({ isShared: true, access: "company" })).toBe("Shared · Company");
  });

  it("builds a secondary meta line from available fields", () => {
    const item: ExplorerItem = {
      id: "123",
      name: "Quarterly Plan.pdf",
      type: "file",
      size: 2_400_000,
      modifiedAt: "2026-07-10T18:30:00.000Z",
      owner: { id: "u1", name: "Morgan Lee" },
      sharedLink: { isShared: true, access: "company" },
    };

    const meta = formatItemMetaLine(item);
    expect(meta).toContain("MB");
    expect(meta).toContain("Morgan Lee");
    expect(meta).toContain("Shared · Company");
    expect(meta).toContain(" · ");
  });
});
