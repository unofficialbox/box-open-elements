// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { DueBadge } from "../../src/components/feedback/due-badge.js";
import { ProgressRing } from "../../src/components/feedback/progress-ring.js";
import { ProgressBar } from "../../src/components/feedback/progress-bar.js";
import { Pagination } from "../../src/components/collections/pagination.js";
import { Path, isPathStageRecord } from "../../src/components/feedback/path.js";
[DueBadge, ProgressRing, ProgressBar, Pagination, Path].forEach(Element => Element.register());
const mount = <T extends HTMLElement>(tag: string): T => {
  const element = document.createElement(tag) as T;
  document.body.append(element);
  return element;
};
afterEach(() => document.body.replaceChildren());

describe("output validation and native names", () => {
  it.each([true, false])("uses literal DueBadge labels with due date=%s", withDate => {
    const element = mount<DueBadge>("box-due-badge");
    if (withDate) { element.dueAt = "2026-10-11T12:00:00Z"; element.referenceTime = "2026-10-12T12:00:00Z"; }
    element.label = `R&D and Bob's <deadline> "today"`;
    expect(element.shadowRoot!.querySelector('[part="badge"]')!.getAttribute("aria-label")).toBe(element.label);
    expect(element.shadowRoot!.querySelector('[part="text"]')!.textContent).toBe(element.label);
    expect(element.shadowRoot!.querySelector("deadline")).toBeNull();
  });
  it.each(["Progress", "Upload progress", "R&D"])('names the ProgressRing once with "%s"', label => {
    const element = mount<ProgressRing>("box-progress-ring");
    if (label !== "Progress") element.label = label;
    const named = [...element.shadowRoot!.querySelectorAll("[aria-label]")];
    expect(named).toHaveLength(1);
    expect(named[0]!.getAttribute("role")).toBe("progressbar");
    expect(named[0]!.getAttribute("aria-label")).toBe(label);
    expect(element.shadowRoot!.querySelector('[role="group"]')).toBeNull();
  });
  for (const tag of ["box-progress-ring", "box-progress-bar"]) {
    for (const field of ["value", "max"]) {
      it.each(["NaN", "Infinity", "-Infinity", "bad"])(`${tag} normalizes invalid ${field}=%s`, raw => {
        const element = mount<ProgressRing | ProgressBar>(tag);
        element.value = 25; element.max = 100;
        element.setAttribute(field, raw);
        const role = element.shadowRoot!.querySelector('[role="progressbar"]')!;
        expect(Number.isFinite(element[field as "value" | "max"])).toBe(true);
        expect(role.getAttribute("aria-valuenow")).toBe(field === "value" ? "0" : "25");
        expect(role.getAttribute("aria-valuemax")).toBe("100");
        expect(role.getAttribute("aria-valuetext")).toBe(field === "value" ? "0%" : "25%");
        expect(element.shadowRoot!.innerHTML).not.toMatch(/NaN|Infinity/);
        element.value = 50;
        expect(role.getAttribute("aria-valuetext")).toBe("50%");
      });
    }
    it.each([[-10, 40, "0%"], [50, 40, "100%"], [0, 0, "0%"], [Number.MAX_VALUE, Number.MAX_VALUE, "100%"]])(`${tag} retains finite boundary behavior %s/%s`, (value, max, expected) => {
      const element = mount<ProgressRing | ProgressBar>(tag);
      element.value = value as number; element.max = max as number;
      expect(element.shadowRoot!.querySelector('[role="progressbar"]')!.getAttribute("aria-valuetext")).toBe(expected);
      expect(element.shadowRoot!.innerHTML).not.toMatch(/NaN|Infinity/);
    });
  }
  it.each(["NaN", "Infinity", "-Infinity", "bad", String(Number.MAX_VALUE)])("keeps ring geometry finite for size=%s", raw => {
    const element = mount<ProgressRing>("box-progress-ring"); element.setAttribute("size", raw);
    expect(element.size).toBe(88);
    expect(element.shadowRoot!.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 88 88");
    expect(element.shadowRoot!.innerHTML).not.toMatch(/NaN|Infinity/);
  });
  it.each([-1, -Number.MAX_VALUE])("retains the finite minimum ring size for %s", size => {
    const element = mount<ProgressRing>("box-progress-ring"); element.size = size;
    expect(element.shadowRoot!.querySelector("svg")!.getAttribute("viewBox")).toBe("0 0 48 48");
  });
  for (const field of ["page", "page-size", "total-items"]) {
    it.each(["NaN", "Infinity", "-Infinity", "bad"])(`Pagination normalizes ${field}=%s`, raw => {
      const element = mount<Pagination>("box-pagination"); element.totalItems = 20; element.pageSize = 10; element.page = 2;
      element.setAttribute(field, raw);
      expect([element.page, element.pageSize, element.totalItems].every(Number.isFinite)).toBe(true);
      expect(element.shadowRoot!.querySelector('[part="summary"]')!.textContent).toBe(field === "page" ? "Showing 1-10 of 20" : field === "page-size" ? "Showing 11-20 of 20" : "Showing 0-0 of 0");
    });
  }
  it("aligns effective page, navigation and events as totals and sizes change", () => {
    const element = mount<Pagination>("box-pagination"); const changed = vi.fn(); element.addEventListener("page-changed", changed);
    element.totalItems = 20; element.pageSize = 10; element.page = 9;
    expect(element.page).toBe(2); expect(element.getAttribute("page")).toBe("9");
    expect(element.shadowRoot!.querySelector<HTMLButtonElement>('[part="next"]')!.disabled).toBe(true);
    element.totalItems = 100; expect(element.page).toBe(9);
    element.pageSize = 100; expect(element.page).toBe(1); expect(changed).not.toHaveBeenCalled();
    element.pageSize = 10;
    element.shadowRoot!.querySelector<HTMLButtonElement>('[part="previous"]')!.click();
    expect(element.page).toBe(8); expect(changed.mock.calls[0]![0].detail).toEqual({ page: 8 });
  });
  it.each([[0, 0, -2, 1, 1, 0], [2.9, 3.9, 10.9, 2, 3, 10], [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, 1, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]])("normalizes Pagination finite count boundaries", (page, size, total, expectedPage, expectedSize, expectedTotal) => {
    const element = mount<Pagination>("box-pagination"); element.page = page; element.pageSize = size; element.totalItems = total;
    expect([element.page, element.pageSize, element.totalItems]).toEqual([expectedPage, expectedSize, expectedTotal]);
    expect(element.shadowRoot!.innerHTML).not.toMatch(/NaN|Infinity/);
  });
  it.each([17, null, false, {}, []])("rejects Path description %j before rendering", description => {
    const bad = { id: "draft", label: "Draft", description };
    expect(isPathStageRecord(bad)).toBe(false);
    const element = mount<Path>("box-path"); element.current = "draft";
    element.setAttribute("stages", JSON.stringify([bad])); expect(element.stages).toEqual([]);
    expect(element.shadowRoot!.querySelectorAll("li")).toHaveLength(0);
    element.stages = [{ id: "draft", label: "Draft", description: "R&D <ready>" }];
    expect(element.shadowRoot!.querySelector('[part="stage-description"]')!.textContent).toBe("R&D <ready>");
  });
  it.each([undefined, "", "Valid detail"])("accepts valid optional Path description %s", description => {
    expect(isPathStageRecord({ id: "draft", label: "Draft", description })).toBe(true);
  });
});
