import { describe, expect, it } from "vitest";
import { StatusIcon } from "../../src/components/feedback/status-icon.js";
import { toStatusKind, statusLabel, boeStatusGlyph } from "../../src/foundations/status/index.js";

describe("decision versus execution status", () => {
  it.each(["approved", "rejected"] as const)("preserves %s as a decision, not an execution outcome", decision => {
    expect(toStatusKind(decision)).toBe(decision);
    expect(statusLabel(toStatusKind(decision))).toBe(decision === "approved" ? "Approved" : "Rejected");
    expect(boeStatusGlyph(toStatusKind(decision))).toContain(`data-kind="${decision}"`);
    const element = new StatusIcon();
    document.body.append(element);
    element.kind = decision;
    expect(element.shadowRoot?.querySelector('[part="label"]')?.textContent).toBe(statusLabel(decision));
    element.remove();
  });
  it("retains independent execution outcomes", () => {
    expect(toStatusKind("succeeded")).toBe("done");
    expect(toStatusKind("failed")).toBe("failed");
    expect(toStatusKind("skipped")).toBe("skipped");
  });
});
