// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { MetadataInspector } from "../../../src/patterns/metadata/metadata-inspector.js";
afterEach(() => document.body.replaceChildren());
const fields = (value = "Alpha") => [{ title: "Properties", fields: [{ label: "Owner", value }, { label: "State", value: "Ready" }] }];
function setup() { const element = new MetadataInspector(); element.sections = fields(); document.body.append(element); return element; }
function owner(e: MetadataInspector) { return e.shadowRoot!.querySelector<HTMLButtonElement>('[data-field-label="Owner"]')!; }
describe("MetadataInspector owned fields", () => {
  it("retains the current focused field and activation data across same-label refresh", () => {
    const e = setup(), button = owner(e), selected = vi.fn(); e.addEventListener("field-selected", selected);
    button.focus(); e.sections = fields("Beta");
    expect(owner(e)).toBe(button); expect(e.shadowRoot!.activeElement).toBe(button); button.click();
    expect(selected).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ detail: { section: "Properties", label: "Owner", value: "Beta" } }));
  });
  it("uses valid definition-list groups with native selectable definitions", () => {
    const e = setup(), dl = e.shadowRoot!.querySelector("dl")!;
    for (const group of dl.children) {
      expect(group.tagName).toBe("DIV"); expect(Array.from(group.children).map(n => n.tagName)).toEqual(["DT", "DD"]);
      expect(group.querySelector("dd button")?.getAttribute("type")).toBe("button");
    }
  });
  it("keeps focus on header-only updates and repeated controlled echoes", () => {
    const e = setup(), button = owner(e); button.focus();
    for (let i = 0; i < 4; i++) { e.heading = "Current " + i; e.message = "Message " + i; e.sections = fields("Current " + i); }
    expect(owner(e)).toBe(button); expect(e.shadowRoot!.activeElement).toBe(button);
  });
  it("preserves a synchronous host value and focus handoff after an action", () => {
    const e = setup(), input = document.createElement("input"); document.body.append(input); input.value = "Host draft";
    const events: unknown[] = []; e.addEventListener("field-selected", event => { events.push((event as CustomEvent).detail); e.sections = fields("Host current"); input.focus(); input.setSelectionRange(2, 6); });
    owner(e).click(); expect(events).toEqual([{ label: "Owner", section: "Properties", value: "Alpha" }]);
    expect(owner(e).dataset.fieldValue).toBe("Host current"); expect(document.activeElement).toBe(input); expect(input.selectionStart).toBe(2);
  });
  it("retains controls when fields and sections reorder", () => {
    const e = setup(), button = owner(e); button.focus(); const extra = { title: "Extra", fields: [{ label: "Other", value: "Value" }] };
    e.sections = [extra, { title: "Properties", fields: [...fields("Beta")[0].fields].reverse() }];
    expect(owner(e)).toBe(button); expect(e.shadowRoot!.activeElement).toBe(button);
  });
  it("discards removed actions and does not reclaim host focus", () => {
    const e = setup(), button = owner(e), selected = vi.fn(), input = document.createElement("input"); document.body.append(input);
    e.addEventListener("field-selected", selected); input.focus(); e.sections = []; button.click();
    expect(selected).not.toHaveBeenCalled(); expect(document.activeElement).toBe(input);
  });
  it("does not activate detached controls and resumes current data on reconnect", () => {
    const e = setup(), button = owner(e), selected = vi.fn(); e.addEventListener("field-selected", selected);
    e.remove(); e.sections = fields("Detached current"); button.click(); expect(selected).not.toHaveBeenCalled();
    document.body.append(e); owner(e).click(); expect(selected).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ detail: expect.objectContaining({ value: "Detached current" }) }));
  });
  it("updates optional descriptions, tones and literal text without HTML parsing", () => {
    const e = setup(); e.sections = [{ title: "R&D", fields: [{ label: "<Owner>", value: "<img src=x>", description: "<script>literal</script>", tone: "accent" }] }];
    expect(e.shadowRoot!.querySelector("img,script")).toBeNull(); expect(e.shadowRoot!.querySelector('[part="field-value"]')?.textContent).toBe("<img src=x>");
    e.sections = [{ title: "R&D", fields: [{ label: "<Owner>", value: "New" }] }]; expect(e.shadowRoot!.querySelector('[part="field-description"]')?.textContent ?? "").toBe("");
  });
  it("keeps duplicate labels as separate actions and stable controls", () => {
    const e = setup(); const duplicated = (value: string) => [{ title: "Same", fields: [{ label: "Owner", value }, { label: "Owner", value: "Second" }] }];
    e.sections = duplicated("First"); const controls = Array.from(e.shadowRoot!.querySelectorAll('[part="field"]')); e.sections = duplicated("New first");
    expect(Array.from(e.shadowRoot!.querySelectorAll('[part="field"]'))).toEqual(controls);
  });
  it("keeps the newest render when legacy move focus loss synchronously refreshes sections", () => {
    const e = setup(), state = e.shadowRoot!.querySelector<HTMLButtonElement>('[data-field-label="State"]')!;
    state.focus(); const dl = state.closest("dl")!, insert = dl.insertBefore.bind(dl);
    Object.defineProperty(dl, "moveBefore", { value: undefined });
    vi.spyOn(dl, "insertBefore").mockImplementation((node, before) => {
      const result = insert(node, before);
      if ((node as Element).contains(state)) state.blur();
      return result;
    });
    state.addEventListener("blur", () => { e.sections = [{ title: "Properties", fields: [{ label: "Fresh", value: "Newest" }] }]; }, { once: true });
    e.sections = [{ title: "Properties", fields: fields("Outer stale")[0].fields.slice().reverse() }];
    expect(e.sections[0].fields[0].label).toBe("Fresh");
    expect(Array.from(e.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="field"]')).map(n => n.dataset.fieldLabel)).toEqual(["Fresh"]);
  });
  it("allows a fallback focus restoration listener to refresh and hand focus to the host", () => {
    const e = setup(), state = e.shadowRoot!.querySelector<HTMLButtonElement>('[data-field-label="State"]')!, input = document.createElement("input"); document.body.append(input);
    state.focus(); const dl = state.closest("dl")!, insert = dl.insertBefore.bind(dl);
    Object.defineProperty(dl, "moveBefore", { value: undefined });
    vi.spyOn(dl, "insertBefore").mockImplementation((node, before) => { const result = insert(node, before); if ((node as Element).contains(state)) state.blur(); return result; });
    state.addEventListener("focus", () => { e.sections = fields("Newest"); input.focus(); }, { once: true });
    e.sections = [{ title: "Properties", fields: fields("Outer stale")[0].fields.slice().reverse() }];
    expect(owner(e).dataset.fieldValue).toBe("Newest"); expect(document.activeElement).toBe(input);
  });

  it("stops a legacy section move before a focusout callback invalidates its DOM references", () => {
    const e = setup(); e.sections = [{ title: "Extra", fields: [{ label: "Other", value: "Keep" }] }, ...fields()];
    const button = owner(e), container = e.shadowRoot!.querySelector('[part="sections"]')!;
    Object.defineProperty(container, "moveBefore", { value: undefined }); button.focus();
    button.addEventListener("focusout", () => { e.sections = fields("Newest"); }, { once: true });
    e.sections = [...fields("Outer stale"), { title: "Extra", fields: [{ label: "Other", value: "Old" }] }];
    expect(e.shadowRoot!.querySelectorAll('[part="section"]')).toHaveLength(1);
    expect(owner(e).dataset.fieldValue).toBe("Newest");
  });

});
