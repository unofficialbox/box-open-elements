// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentList } from "../../../src/components/collections/document-list.js";
import { ResultBlocks, renderResultBlock, type ResultBlock } from "../../../src/components/collections/result-blocks.js";
import { TaskAssignmentPanel } from "../../../src/patterns/task/task-assignment-panel.js";
import { FlowSpine, type FlowCard } from "../../../src/patterns/flow-builder/primitives.js";
import type { FlowNode } from "../../../src/patterns/flow-builder/model.js";

afterEach(() => { document.body.innerHTML = ""; });
const docButton = (el: DocumentList | ResultBlocks, id: string): HTMLElement =>
  [...el.shadowRoot!.querySelectorAll<HTMLElement>("[data-document-id]")].find(button => button.dataset.documentId === id)!;
const documents = (): DocumentList => {
  const el = new DocumentList(); el.selectableDocuments = true;
  el.items = [{ id: 'a"\\id', name: "A", detail: "Draft" }, { id: "b", name: "B" }];
  document.body.append(el); return el;
};
const task = (): TaskAssignmentPanel => {
  const el = new TaskAssignmentPanel();
  el.assignees = [{ id: "a", name: "A" }, { id: "b", name: "B" }];
  el.checklist = [{ id: "one", label: "Old label", checked: false }, { id: "two", label: "Second" }];
  el.actions = [{ id: "complete", label: "Complete", tone: "primary" }];
  document.body.append(el); return el;
};
const part = <T extends HTMLElement>(el: HTMLElement, name: string): T => el.shadowRoot!.querySelector(`[part="${name}"]`)! as T;

describe("ResultBlocks and DocumentList owned refresh", () => {
  it("keeps pure document actions non-submitting in a native host form", () => {
    const form = document.createElement("form");
    form.innerHTML = renderResultBlock({ type: "documents", items: [{ id: "a", name: "A" }] }, { selectableDocuments: true });
    document.body.append(form); const submit = vi.fn((event: Event) => event.preventDefault()); form.addEventListener("submit", submit);
    const button = form.querySelector<HTMLButtonElement>("button")!;
    expect(button.type).toBe("button"); button.click(); expect(submit).not.toHaveBeenCalled();
    expect(button.dataset.documentId).toBe("a");
  });

  it("keeps document controls across same-ID content updates/reorder with current literal names", () => {
    const el = documents(), button = docButton(el, 'a"\\id'); button.focus();
    el.items = [{ id: "b", name: "Current B" }, { id: 'a"\\id', name: 'R&D <img src=x>', detail: "Reviewed" }];
    expect(docButton(el, 'a"\\id')).toBe(button);
    expect(el.shadowRoot!.activeElement).toBe(button);
    expect(button.textContent).toContain('R&D <img src=x>Reviewed');
    expect(button.querySelector("img")).toBeNull();
    expect(el.items.map(item => item.id)).toEqual(["b", 'a"\\id']);
    const selected = vi.fn(); el.addEventListener("document-selected", selected); button.click();
    expect(selected).toHaveBeenCalledTimes(1);
    expect(selected.mock.calls[0][0].detail.id).toBe('a"\\id');
  });

  it("keys explicit blocks across reorder and refreshes other block content", () => {
    const el = new ResultBlocks(); el.selectableDocuments = true;
    const docs: ResultBlock = { id: "docs", type: "documents", title: "Documents", items: [{ id: "a", name: "A" }] };
    el.blocks = [{ id: "facts", type: "facts", rows: [{ label: "Amount", value: "10" }] }, docs];
    document.body.append(el); const section = el.shadowRoot!.querySelectorAll("section")[1]; const button = docButton(el, "a"); button.focus();
    el.blocks = [docs, { id: "facts", type: "facts", rows: [{ label: "Amount", value: "20" }] }];
    expect(el.shadowRoot!.querySelector("section")).toBe(section);
    expect(docButton(el, "a")).toBe(button); expect(el.shadowRoot!.activeElement).toBe(button);
    expect(el.shadowRoot!.querySelector("dd")?.textContent).toBe("20");
  });

  it("refreshes safe link metadata and replaces controls when their action kind changes", () => {
    const el = documents(); el.items = [{ id: "a", name: "A", href: "#old" }];
    const link = docButton(el, "a"); link.focus();
    el.setAttribute("link-suffix", " (current link)"); el.items = [{ id: "a", name: "Current A", href: "#current", detail: "Reviewed" }];
    expect(docButton(el, "a")).toBe(link); expect(link.getAttribute("href")).toBe("#current");
    expect(link.textContent).toContain("current link");
    el.items = [{ id: "a", name: "Inert", href: "javascript:bad()" }];
    const button = docButton(el, "a"); expect(button.tagName).toBe("BUTTON"); expect(button).not.toBe(link);
    expect(link.isConnected).toBe(false); expect(el.shadowRoot!.activeElement).toBeNull();
    button.focus(); el.selectableDocuments = false;
    expect(el.shadowRoot!.querySelector("a,button")).toBeNull(); expect(button.isConnected).toBe(false);
    expect(el.shadowRoot!.activeElement).toBeNull();
  });

  it.each(["remove", "noninteractive"])("rejects a capture-superseded document action (%s)", mode => {
    const el = documents(); const button = docButton(el, "b"); const selected = vi.fn(); el.addEventListener("document-selected", selected);
    el.addEventListener("click", () => { el.items = mode === "remove" ? [] : [{ id: "b", name: "Current B" }]; el.selectableDocuments = false; }, { once: true, capture: true });
    button.click(); expect(selected).not.toHaveBeenCalled();
  });

  it("respects external handoff, removed IDs and reconnect without resurrecting a stale action", () => {
    const el = documents(), old = docButton(el, "b"); old.focus();
    const outside = document.createElement("button"); document.body.append(outside); outside.focus();
    el.items = [...el.items].reverse(); expect(document.activeElement).toBe(outside);
    el.remove(); el.items = [{ id: "current", name: "Current" }]; document.body.append(el);
    expect(document.activeElement).toBe(outside);
    const selected = vi.fn(); el.addEventListener("document-selected", selected); old.click();
    expect(selected).not.toHaveBeenCalled(); expect(old.isConnected).toBe(false);
    docButton(el, "current").click(); expect(selected.mock.calls[0][0].detail.id).toBe("current");
  });

  it("does not reuse ambiguous duplicate document keys", () => {
    const el = documents(); el.items = [{ id: "same", name: "First" }, { id: "same", name: "Second" }];
    const old = docButton(el, "same"); old.focus();
    el.items = [{ id: "same", name: "Current first" }, { id: "same", name: "Current second" }];
    expect(old.isConnected).toBe(false); expect(el.shadowRoot!.activeElement).toBeNull();
    expect(el.shadowRoot!.textContent).toContain("Current first"); expect(el.shadowRoot!.textContent).toContain("Current second");
  });
});

describe("TaskAssignmentPanel keyed controls", () => {
  it("keeps checked/focus identity and reads current reordered data without accumulating handlers", () => {
    const el = task(); const input = part<HTMLInputElement>(el, "checkbox"); input.focus(); input.checked = true; input.indeterminate = true;
    el.checklist = [{ id: "two", label: "Second" }, { id: "one", label: "Current label", checked: false }];
    expect([...el.shadowRoot!.querySelectorAll<HTMLInputElement>("input")].find(node => node.dataset.itemId === "one")).toBe(input);
    expect(input.checked).toBe(false); expect(input.indeterminate).toBe(false); expect(el.shadowRoot!.activeElement).toBe(input);
    expect(input.closest("label")?.textContent).toContain("Current label");
    for (let i = 0; i < 3; i++) el.heading = "Heading " + i;
    const changed = vi.fn(); el.addEventListener("checklist-changed", changed); input.click();
    expect(changed).toHaveBeenCalledTimes(1);
    expect(changed.mock.calls[0][0].detail).toEqual({ itemId: "one", checked: true, checklist: el.checklist });
    expect(el.checklist[1].label).toBe("Current label");
  });

  it("keeps assignee/action nodes and removes obsolete metadata while reflecting current names/state", () => {
    const el = task(); const button = [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="assignee"]')][1]; button.focus(); button.disabled = true;
    el.assignees = [{ id: "b", name: 'Current <B>', description: "Reviewed" }, { id: "a", name: "Current A" }];
    el.currentAssigneeId = "b";
    expect(part(el, "assignee")).toBe(button); expect(el.shadowRoot!.activeElement).toBe(button);
    expect(button.disabled).toBe(false); expect(button.textContent).toContain("Current <B>"); expect(button.getAttribute("aria-selected")).toBe("true");
    const changed = vi.fn(); el.addEventListener("assignee-changed", changed); button.click(); expect(changed).toHaveBeenCalledTimes(1);
    const action = part<HTMLButtonElement>(el, "action"); action.focus(); el.actions = [{ id: "complete", label: "Current action" }];
    expect(part(el, "action")).toBe(action); expect(action.dataset.tone).toBe("neutral"); expect(action.textContent?.trim()).toBe("Current action");
    const emitted = vi.fn(); el.addEventListener("action", emitted); action.click();
    expect(emitted.mock.calls[0][0].detail).toEqual({ action: "complete", assigneeId: "b", checklist: el.checklist });
  });

  it.each(["action", "assignee", "checkbox"])("suppresses removed capture targets (%s)", kind => {
    const el = task(); const target = part<HTMLElement>(el, kind); const events = vi.fn();
    for (const name of ["action", "assignee-changed", "checklist-changed"]) el.addEventListener(name, events);
    el.addEventListener("click", () => { el.actions = []; el.assignees = []; el.checklist = []; }, { once: true, capture: true });
    target.click(); expect(events).not.toHaveBeenCalled();
  });

  it("honors caller state/focus handoff and reports the current checklist after capture replacement", () => {
    const el = task(), input = part<HTMLInputElement>(el, "checkbox"); input.focus();
    const outside = document.createElement("button"); document.body.append(outside);
    el.addEventListener("click", () => { outside.focus(); el.checklist = [{ id: "one", label: "Caller current", checked: false }]; }, { once: true, capture: true });
    const changed = vi.fn(); el.addEventListener("checklist-changed", changed); input.click();
    expect(document.activeElement).toBe(outside); expect(input.checked).toBe(false);
    expect(changed.mock.calls[0][0].detail).toEqual({ itemId: "one", checked: false, checklist: [{ id: "one", label: "Caller current", checked: false }] });
  });

  it("removes obsolete controls and keeps teardown/reconnect focus and listener ownership", () => {
    const el = task(), input = part<HTMLInputElement>(el, "checkbox"); input.focus();
    const outside = document.createElement("button"); document.body.append(outside); outside.focus(); el.remove();
    el.checklist = [{ id: "new", label: "New item" }]; el.assignees = []; el.actions = []; document.body.append(el);
    expect(document.activeElement).toBe(outside); expect(input.isConnected).toBe(false);
    const changed = vi.fn(); el.addEventListener("checklist-changed", changed); input.click(); expect(changed).not.toHaveBeenCalled();
    part<HTMLInputElement>(el, "checkbox").click(); expect(changed).toHaveBeenCalledTimes(1);
    expect(changed.mock.calls[0][0].detail.itemId).toBe("new");
  });
});

describe("FlowSpine model-node focus continuity", () => {
  it("keeps the card/button identities through controlled refresh and reorder with current node data", () => {
    const a: FlowNode = { kind: "audit", title: "A" }, b: FlowNode = { kind: "audit", title: "B" };
    const el = new FlowSpine(); el.nodes = [a, b]; document.body.append(el);
    const card = el.shadowRoot!.querySelector<FlowCard>("box-flow-card")!, button = card.shadowRoot!.querySelector("button"); card.focus();
    a.title = "Current A"; el.nodes.reverse(); el.refresh();
    expect([...el.shadowRoot!.querySelectorAll<FlowCard>("box-flow-card")].find(node => node.node === a)).toBe(card);
    expect(card.shadowRoot!.querySelector("button")).toBe(button); expect(card.shadowRoot!.activeElement).toBe(button);
    expect(button?.getAttribute("aria-label")).toContain("Current A");
    const selected = vi.fn(); el.addEventListener("node-select", selected); button!.click();
    expect(selected).toHaveBeenCalledTimes(1); expect(selected.mock.calls[0][0].detail.node).toBe(a);
    expect(selected.mock.calls[0][0].detail.node.title).toBe("Current A");
  });

  it("respects removed nodes, caller handoff and disconnected graph replacement", () => {
    const a: FlowNode = { kind: "audit", title: "A" }, b: FlowNode = { kind: "audit", title: "B" };
    const el = new FlowSpine(); el.nodes = [a]; document.body.append(el);
    const card = el.shadowRoot!.querySelector<FlowCard>("box-flow-card")!; card.focus(); el.setNodeFigure(a, { text: "1 item" });
    const outside = document.createElement("button"); document.body.append(outside); outside.focus();
    el.refresh(); expect(document.activeElement).toBe(outside); el.remove(); el.nodes = [b]; el.refresh(); document.body.append(el);
    expect(document.activeElement).toBe(outside); expect(card.isConnected).toBe(false); expect(el.figures.has(a)).toBe(false);
    const selected = vi.fn(); el.addEventListener("node-select", selected); card.shadowRoot!.querySelector("button")!.click(); expect(selected).not.toHaveBeenCalled();
    el.focusNode(b); expect(el.shadowRoot!.querySelector<FlowCard>("box-flow-card")!.shadowRoot!.activeElement).not.toBeNull();
  });
});

describe("capture-refreshed descendant event ownership", () => {
  it.each(["refresh", "remove"])("resolves document labels through the original path (%s)", mode => {
    const el = documents(); const selected = vi.fn(); el.addEventListener("document-selected", selected);
    const label = docButton(el, "b").querySelector<HTMLElement>("strong")!;
    el.addEventListener("click", () => { el.items = mode === "refresh" ? [{ id: "b", name: "Current B" }] : []; }, { capture: true, once: true });
    label.click(); expect(selected).toHaveBeenCalledTimes(mode === "refresh" ? 1 : 0);
    if (mode === "refresh") expect(selected.mock.calls[0][0].detail.id).toBe("b");
  });

  it.each(["refresh", "remove"])("resolves assignee labels through the original path (%s)", mode => {
    const el = task(); const assigned = vi.fn(); el.addEventListener("assignee-changed", assigned);
    const label = el.shadowRoot!.querySelector<HTMLElement>('[data-assignee-id="b"] [part="assignee-name"]')!;
    el.addEventListener("click", () => { el.assignees = mode === "refresh" ? [{ id: "b", name: "Current B" }] : []; }, { capture: true, once: true });
    label.click(); expect(assigned).toHaveBeenCalledTimes(mode === "refresh" ? 1 : 0);
    if (mode === "refresh") expect(el.currentAssigneeId).toBe("b");
  });

  it.each(["refresh", "remove"])("resolves action descendants through the original path (%s)", mode => {
    const el = task(); const action = vi.fn(); el.addEventListener("action", action);
    const label = document.createElement("span"); label.textContent = "Complete"; part(el, "action").append(label);
    el.addEventListener("click", () => { el.actions = mode === "refresh" ? [{ id: "complete", label: "Current complete" }] : []; }, { capture: true, once: true });
    label.click(); expect(action).toHaveBeenCalledTimes(mode === "refresh" ? 1 : 0);
  });

  it.each(["direct", "refresh-reorder", "remove-origin"])("scopes duplicate document IDs to their originating block (%s)", mode => {
    const el = new ResultBlocks();
    const staticBlock: ResultBlock = { id: "static", type: "documents", items: [{ id: "same", name: "Static" }] };
    const linkedBlock: ResultBlock = { id: "linked", type: "documents", items: [{ id: "same", name: "Linked", href: "#safe" }] };
    el.blocks = [staticBlock, linkedBlock]; document.body.append(el);
    const label = el.shadowRoot!.querySelector<HTMLElement>("a strong")!;
    const selected = vi.fn(); el.addEventListener("document-selected", selected);
    if (mode !== "direct") el.addEventListener("click", () => {
      el.blocks = mode === "remove-origin"
        ? [{ ...staticBlock, items: [{ id: "same", name: "Other link", href: "#other" }] }]
        : [{ ...linkedBlock, items: [{ id: "same", name: "Current link", href: "#current" }] }, staticBlock];
    }, { capture: true, once: true });
    let veto: boolean | undefined;
    el.addEventListener("click", event => { veto = event.defaultPrevented; event.preventDefault(); }, { once: true });
    label.click(); expect(veto).toBe(mode === "remove-origin");
    expect(selected).toHaveBeenCalledTimes(mode === "remove-origin" ? 0 : 1);
  });
});
