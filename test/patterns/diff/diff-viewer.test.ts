import { afterEach, describe, expect, it, vi } from "vitest";

import { DiffViewer } from "../../../src/patterns/diff/diff-viewer.js";

DiffViewer.register();

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
};

const BEFORE = [
  "1. Term. This agreement runs for two (2) years.",
  "2. Liability. The cap is $1,000,000 per incident.",
  "3. Notices. Notices go to legal@acme.example.",
].join("\n");

const AFTER = [
  "1. Term. This agreement runs for three (3) years.",
  "2. Liability. The cap is $1,000,000 per incident.",
  "3. Notices. Notices go to legal@acme.example.",
  "4. Renewal. Auto-renews unless cancelled in writing.",
].join("\n");

const mountViewer = async (configure?: (element: DiffViewer) => void): Promise<DiffViewer> => {
  const element = document.createElement("box-diff-viewer") as DiffViewer;
  element.beforeText = BEFORE;
  element.afterText = AFTER;
  configure?.(element);
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("box-diff-viewer", () => {
  it("renders a split table with both documents, stats, and column labels", async () => {
    const element = await mountViewer(el => {
      el.beforeLabel = "Executed v2";
      el.afterLabel = "Redline v3";
    });

    const text = element.shadowRoot?.textContent ?? "";
    expect(text).toContain("Executed v2");
    expect(text).toContain("Redline v3");
    expect(text).toContain("+1 ~1");
    expect(text).toContain("Auto-renews unless cancelled in writing.");

    const changed = element.shadowRoot?.querySelector('[part="row"][data-kind="changed"]');
    expect(changed).not.toBeNull();
    expect(changed?.querySelector("del")?.textContent).toContain("two");
    expect(changed?.querySelector("ins")?.textContent).toContain("three");
  });

  it("marks equal rows and keeps line numbers per document", async () => {
    const element = await mountViewer();

    const rows = element.shadowRoot?.querySelectorAll('[part="row"]') ?? [];
    expect(rows.length).toBe(4);
    const added = element.shadowRoot?.querySelector('[part="row"][data-kind="added"]');
    const numbers = Array.from(added?.querySelectorAll('[part="line-number"]') ?? []).map(
      cell => cell.textContent,
    );
    // Added rows have no before-side line number.
    expect(numbers).toEqual(["", "4"]);
  });

  it("navigates between changes and announces the position", async () => {
    const element = await mountViewer();
    const focused = vi.fn();
    element.addEventListener("change-focused", focused);

    const next = element.shadowRoot?.querySelector('[part="nav-next"]') as HTMLButtonElement;
    const previous = element.shadowRoot?.querySelector('[part="nav-previous"]') as HTMLButtonElement;
    const position = element.shadowRoot?.querySelector('[part="nav-position"]') as HTMLElement;

    expect(position.textContent).toBe("2 changes");
    expect(previous.disabled).toBe(true);

    next.click();
    await flush();
    expect(position.textContent).toBe("Change 1 of 2");
    expect(focused.mock.calls[0]?.[0]?.detail).toEqual({ index: 0, total: 2 });
    expect(
      element.shadowRoot?.querySelector('[part="row"][data-active="true"]')?.getAttribute("data-kind"),
    ).toBe("changed");

    next.click();
    await flush();
    expect(position.textContent).toBe("Change 2 of 2");
    expect(next.disabled).toBe(true);

    previous.click();
    await flush();
    expect(position.textContent).toBe("Change 1 of 2");
  });

  it("renders inline mode with removed-then-added rows", async () => {
    const element = await mountViewer(el => {
      el.mode = "inline";
    });

    const changedRows = element.shadowRoot?.querySelectorAll('[part="row"][data-kind="changed"]') ?? [];
    // Inline mode renders the changed pair as two rows: before then after.
    expect(changedRows.length).toBe(2);
    expect(changedRows[0]?.querySelector('[part="cell"]')?.getAttribute("data-side")).toBe("before");
    expect(changedRows[1]?.querySelector('[part="cell"]')?.getAttribute("data-side")).toBe("after");
  });

  it("shows the empty state without inputs and hides navigation when nothing changed", async () => {
    const empty = document.createElement("box-diff-viewer") as DiffViewer;
    document.body.append(empty);
    await flush();
    expect((empty.shadowRoot?.querySelector('[part="empty"]') as HTMLElement).hidden).toBe(false);

    const same = document.createElement("box-diff-viewer") as DiffViewer;
    same.beforeText = "identical";
    same.afterText = "identical";
    document.body.append(same);
    await flush();
    expect((same.shadowRoot?.querySelector('[part="nav"]') as HTMLElement).hidden).toBe(true);
    expect(same.shadowRoot?.querySelector('[part="stats"]')?.textContent).toBe("No changes");
  });

  it("recomputes when inputs change and keeps the table identity otherwise", async () => {
    const element = await mountViewer();
    const table = element.shadowRoot?.querySelector('[part="table"]');

    element.heading = "Clause comparison";
    await flush();
    expect(element.shadowRoot?.querySelector('[part="table"]')).toBe(table);

    element.afterText = `${AFTER}\n5. Assignment. Not assignable.`;
    await flush();
    expect(element.shadowRoot?.textContent).toContain("Assignment");
    expect(element.diff?.stats.added).toBe(2);
  });

  it("patches column labels and the aria-label in place when labels change", async () => {
    const element = await mountViewer();
    const table = element.shadowRoot?.querySelector('[part="table"]');

    element.beforeLabel = "Executed v2";
    element.afterLabel = "Redline v3";
    element.heading = "Clause comparison";
    await flush();

    const patched = element.shadowRoot?.querySelector('[part="table"]');
    expect(patched).toBe(table);
    expect(patched?.getAttribute("aria-label")).toBe("Clause comparison: Executed v2 vs Redline v3");
    const labels = Array.from(patched?.querySelectorAll('[part="column-label"]') ?? []).map(
      cell => cell.textContent,
    );
    expect(labels).toEqual(["Executed v2", "Redline v3"]);
  });

  it("escapes markup in document content", async () => {
    const element = await mountViewer(el => {
      el.beforeText = "safe";
      el.afterText = `<img src=x onerror="alert(1)">`;
    });

    expect(element.shadowRoot?.querySelector("img")).toBeNull();
    expect(element.shadowRoot?.textContent).toContain('<img src=x onerror="alert(1)">');
  });
});
