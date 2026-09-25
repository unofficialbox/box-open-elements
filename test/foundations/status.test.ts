import { describe, expect, it } from "vitest";
import { StatusIcon } from "../../src/components/feedback/status-icon.js";
import { toStatusKind, statusLabel, boeStatusGlyph, boeStatusDocumentStyles } from "../../src/foundations/status/index.js";

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
  it("supports domain labels and self-contained light-DOM glyph styles", () => {
    expect(statusLabel("pending")).toBe("Not started");
    expect(statusLabel("pending", { pending: "Queued" })).toBe("Queued");
    expect(boeStatusGlyph("warning")).toContain("M8 4.75v3.75M8 11h.01");
    expect(boeStatusGlyph("pending")).toContain('r="6.25"');
    expect(boeStatusDocumentStyles).toContain("@keyframes boe-status-spin");
    expect(boeStatusDocumentStyles).toContain("prefers-reduced-motion");
    const element = new StatusIcon();document.body.append(element);
    element.label = "Queued";
    expect(element.shadowRoot?.querySelector('[part="label"]')?.textContent).toBe("Queued");
    element.remove();
  });
});
