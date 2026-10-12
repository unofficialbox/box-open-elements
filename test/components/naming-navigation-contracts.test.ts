// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { NavSidebar } from "../../src/components/layout/nav-sidebar.js";
import { ContactDatalistItem } from "../../src/components/identity/contact-datalist-item.js";
import { Breadcrumb } from "../../src/components/navigation/breadcrumb.js";
import { Accordion } from "../../src/components/navigation/accordion.js";
afterEach(() => document.body.replaceChildren());
function sidebar() { const e = new NavSidebar(), row = document.createElement("button"), label = document.createElement("span"); label.dataset.navLabel = ""; label.textContent = "Reports"; row.append(label); e.append(row); document.body.append(e); return { e, row }; }
describe("NavSidebar attribute ownership", () => {
 it("preserves both newer host name and title overrides on expansion and later cycles", () => {
  const { e, row } = sidebar(); e.collapsed = true; expect(row.getAttribute("aria-label")).toBe("Reports"); row.setAttribute("aria-label", "Host name"); row.title = "Host title";
  for (let i = 0; i < 3; i++) { e.collapsed = false; e.collapsed = true; } e.collapsed = false;
  expect(row.getAttribute("aria-label")).toBe("Host name"); expect(row.title).toBe("Host title");
 });
 it.each(["aria-label", "title"])("releases only its unchanged counterpart when the host overrides %s", attribute => {
  const { e, row } = sidebar(); e.collapsed = true; row.setAttribute(attribute, "Host override"); e.collapsed = false;
  expect(row.getAttribute(attribute)).toBe("Host override"); expect(row.hasAttribute(attribute === "title" ? "aria-label" : "title")).toBe(false);
 });
 it("removes unchanged generated attributes while retaining preexisting author attributes", () => {
  const { e, row } = sidebar(); const named = row.cloneNode(true) as HTMLButtonElement; named.setAttribute("aria-label", "Author name"); named.title = "Author title"; e.append(named);
  e.collapsed = true; e.collapsed = false; expect(row.hasAttribute("aria-label")).toBe(false); expect(row.hasAttribute("title")).toBe(false); expect(named.getAttribute("aria-label")).toBe("Author name"); expect(named.title).toBe("Author title");
 });
 it("retains newer host values through row replacement and sidebar reconnect", () => {
  const { e, row } = sidebar(); e.collapsed = true; row.setAttribute("aria-label", "Host current"); row.title = "Host current title"; row.remove(); e.append(row); e.remove(); document.body.append(e); e.collapsed = false;
  expect(row.getAttribute("aria-label")).toBe("Host current"); expect(row.title).toBe("Host current title");
 });
});
describe("ContactDatalistItem identity", () => {
 it("uses the current name when email and explicit value are absent", () => {
  const e = new ContactDatalistItem(); e.name = "Audit Person"; document.body.append(e); const selected = vi.fn(); e.addEventListener("select", selected);
  expect(e.value).toBe("Audit Person"); e.shadowRoot!.querySelector<HTMLElement>('[part="item"]')!.click(); expect(selected.mock.calls[0][0].detail.value).toBe("Audit Person");
  e.name = "Current Person"; e.shadowRoot!.querySelector<HTMLElement>('[part="item"]')!.click(); expect(selected.mock.calls[1][0].detail.value).toBe("Current Person");
 });
 it("retains explicit value and explicit empty value authority ahead of email/name", () => {
  const e = new ContactDatalistItem(); e.name = "Person"; e.email = "synthetic@example.invalid"; expect(e.value).toBe(e.email); e.value = "id-1"; expect(e.value).toBe("id-1"); e.value = ""; expect(e.value).toBe(""); e.removeAttribute("value"); e.removeAttribute("email"); expect(e.value).toBe("Person");
 });
 it("emits activation-time identity before a controlled rename and reconnect", () => {
  const e = new ContactDatalistItem(); e.name = "Alpha"; document.body.append(e); const values: string[] = []; e.addEventListener("select", event => { values.push((event as CustomEvent).detail.value); e.remove(); e.name = "Beta"; document.body.append(e); });
  e.shadowRoot!.querySelector<HTMLElement>('[part="item"]')!.click(); expect(values).toEqual(["Alpha"]); expect(e.value).toBe("Beta"); e.disabled = true; e.shadowRoot!.querySelector<HTMLElement>('[part="item"]')!.click(); expect(values).toHaveLength(1);
 });
});
const crumbs = Array.from({ length: 6 }, (_, i) => ({ label: `Folder ${i}`, value: `f${i}` }));
describe("Breadcrumb documented zero limit", () => {
 it("disables collapse for an explicit zero without changing the default", () => {
  const e = new Breadcrumb(); e.items = crumbs; document.body.append(e); expect(e.maxItems).toBe(4); expect(e.shadowRoot!.querySelectorAll("li")).toHaveLength(4);
  e.maxItems = 0; expect(e.maxItems).toBe(0); expect(e.shadowRoot!.querySelectorAll("li")).toHaveLength(6); expect(e.shadowRoot!.querySelector('[part="ellipsis"]')).toBeNull();
 });
 it.each(["", " ", "-1", "NaN", "Infinity"])("keeps the default for invalid limit %s", value => {
  const e = new Breadcrumb(); e.setAttribute("max-items", value); expect(e.maxItems).toBe(4);
 });
 it("retains literal current navigation data and reconnect behavior with zero", () => {
  const e = new Breadcrumb(); e.items = crumbs; e.maxItems = 0; document.body.append(e); const values: string[] = [];
  e.addEventListener("navigate", event => { values.push((event as CustomEvent).detail.value); e.items = [{ label: "Host current", value: "current" }, ...crumbs]; });
  e.shadowRoot!.querySelector<HTMLElement>('[part="link"]')!.click(); expect(values).toEqual(["f0"]); e.remove(); document.body.append(e); expect(e.shadowRoot!.querySelectorAll("li")).toHaveLength(7);
 });
});
describe("Accordion safe generated relationships", () => {
 it("creates unique single-token IDREFs for whitespace, punctuation and duplicate values", () => {
  const e = new Accordion(); e.items = ["item one", "tab\titem", "line\nitem", "A&B's <item>", "duplicate", "duplicate"].map((value, i) => ({ value, label: `Section ${i}`, content: `Content ${i}` })); e.value = "item one"; document.body.append(e);
  const ids = Array.from(e.shadowRoot!.querySelectorAll<HTMLElement>("[id]"), node => node.id); expect(new Set(ids).size).toBe(ids.length);
  for (const trigger of e.shadowRoot!.querySelectorAll<HTMLElement>('[part="trigger"]')) {
   const id = trigger.getAttribute("aria-controls")!; expect(id.split(/\s+/)).toHaveLength(1); const panel = e.shadowRoot!.getElementById(id)!; expect(panel).not.toBeNull(); expect(panel.getAttribute("aria-labelledby")).toBe(trigger.id);
  }
 });
 it("keeps raw values and existing value-based slot names after updates and reconnect", () => {
  const e = new Accordion(); e.items = [{ value: "item one", label: "First" }, { value: "safe", label: "Second" }]; const input = document.createElement("input"); input.slot = "panel-item one"; input.value = "Host draft"; e.append(input); e.value = ""; document.body.append(e);
  const changed = vi.fn(); e.addEventListener("value-changed", changed); e.shadowRoot!.querySelector<HTMLButtonElement>('[part="trigger"]')!.click(); expect(changed.mock.calls[0][0].detail.value).toBe("item one"); expect(e.value).toBe("item one");
  e.items = e.items.slice().reverse(); e.remove(); document.body.append(e); const slot = Array.from(e.shadowRoot!.querySelectorAll<HTMLSlotElement>("slot")).find(slot => slot.name === input.slot)!; expect(slot.assignedElements()).toEqual([input]); expect(input.value).toBe("Host draft");
  for (const trigger of e.shadowRoot!.querySelectorAll<HTMLElement>('[part="trigger"]')) expect(e.shadowRoot!.getElementById(trigger.getAttribute("aria-controls")!)).not.toBeNull();
 });
});
