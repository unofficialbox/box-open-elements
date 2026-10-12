import { afterEach, describe, expect, it, vi } from "vitest";
import { ButtonGroup } from "../../src/components/actions/button-group.js";
import { Tabs } from "../../src/components/navigation/tabs.js";
import { GridView } from "../../src/components/collections/grid-view.js";
import { TreeGrid } from "../../src/components/collections/tree-grid.js";
import { Menu } from "../../src/components/actions/menu.js";
import { Toolbar } from "../../src/components/actions/toolbar.js";
import { Chip } from "../../src/components/feedback/chip.js";
import { ThumbnailCard } from "../../src/components/collections/thumbnail-card.js";
import { DonutChart } from "../../src/patterns/insights/donut-chart.js";
import { RunTrace } from "../../src/patterns/run/run-trace.js";
const options = [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }];
const flush = async () => { await Promise.resolve(); await new Promise(resolve => setTimeout(resolve, 0)); };
const key = (element: Element, value: string) => element.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true, composed: true, cancelable: true }));
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

describe.each([ButtonGroup, Tabs])("controlled selection focus: %s", Component => {
  it("keeps a keyboard entry after removing the selected option", () => {
    const element = new Component(); element.options = options; element.value = "b"; document.body.append(element);
    element.options = [options[0]];
    expect(element.value).toBe("b"); expect(element.shadowRoot!.querySelector<HTMLButtonElement>("button")!.tabIndex).toBe(0);
  });
  it("retains a host-controlled value while options are absent or temporarily replaced", () => {
    const element = new Component(); element.value = "b"; document.body.append(element);
    expect(element.value).toBe("b"); element.options = [options[0]];
    expect(element.value).toBe("b"); expect(element.shadowRoot!.querySelector<HTMLButtonElement>("button")!.tabIndex).toBe(0);
    element.options = options; expect(element.value).toBe("b");
    expect(element.shadowRoot!.querySelector<HTMLButtonElement>('[data-value="b"]')!.tabIndex).toBe(0);
  });
  it("honors a host focus handoff after keyboard selection, including replacement/reordering", async () => {
    const element = new Component(); element.options = options; document.body.append(element);
    const outside = document.createElement("input"); outside.value = "Host draft"; document.body.append(outside);
    element.addEventListener("value-changed", () => { element.options = [...options].reverse(); outside.focus(); outside.setSelectionRange(2, 5); });
    const first = element.shadowRoot!.querySelector<HTMLButtonElement>("button")!; first.focus(); key(first, "ArrowRight"); await flush();
    expect(element.value).toBe("b"); expect(document.activeElement).toBe(outside); expect([outside.selectionStart, outside.selectionEnd]).toEqual([2, 5]);
  });
  it("continues ordinary keyboard selection and preserves focused nodes on state-only updates", async () => {
    const element = new Component(); element.options = options; document.body.append(element);
    const first = element.shadowRoot!.querySelector<HTMLButtonElement>("button")!; first.focus(); element.label = "Updated";
    expect(element.shadowRoot!.activeElement).toBe(first); expect(first.isConnected).toBe(true);
    key(first, "ArrowRight"); await flush();
    const second = element.shadowRoot!.querySelector<HTMLButtonElement>('[data-value="b"]')!;
    expect(element.shadowRoot!.activeElement).toBe(second); key(second, "ArrowLeft"); await flush(); expect(element.value).toBe("a");
  });
});

it("GridView retains its roving entry without reclaiming external focus on updates", () => {
  const element = new GridView(); element.items = options; document.body.append(element);
  const first = element.shadowRoot!.querySelector<HTMLButtonElement>("button")!; first.focus(); key(first, "ArrowRight");
  expect(element.shadowRoot!.activeElement?.getAttribute("data-value")).toBe("b");
  const outside = document.createElement("button"); document.body.append(outside); outside.focus(); element.label = "Updated";
  expect(document.activeElement).toBe(outside); expect(element.shadowRoot!.querySelector<HTMLButtonElement>('[data-value="b"]')!.tabIndex).toBe(0);
});

it("TreeGrid selection retains the live row control, then permits another keyboard move", async () => {
  const element = new TreeGrid(); element.columns = [{ key: "name", label: "Name" }, { key: "status", label: "Status" }]; element.items = options.map(o => ({ ...o, cells: ["Ready"] })); document.body.append(element);
  const first = element.shadowRoot!.querySelector<HTMLButtonElement>('[part~="item"]')!; first.focus(); first.click(); await flush();
  expect(element.shadowRoot!.activeElement).toBe(first); expect(first.isConnected).toBe(true); expect(element.value).toBe("a");
  key(first, "ArrowDown"); await flush(); expect(element.shadowRoot!.activeElement?.getAttribute("data-value")).toBe("b");
  const style = element.shadowRoot!.querySelector("style")!.textContent!; expect(style).toContain('[part~="row"]');
});

describe("disabled Menu link ownership", () => {
  it("prevents a disabled anchor default action, while enabled siblings still emit", () => {
    const element = new Menu(); element.items = [{ id: "a", label: "First" }, { id: "b", label: "Blocked", href: "#blocked", disabled: true }, { id: "c", label: "Last", href: "#allowed" }]; document.body.append(element);
    const selected = vi.fn(); element.addEventListener("item-selected", selected);
    const blocked = element.shadowRoot!.querySelector<HTMLAnchorElement>('[data-item-id="b"]')!;
    const event = new MouseEvent("click", { bubbles: true, composed: true, cancelable: true }); blocked.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true); expect(selected).not.toHaveBeenCalled();
    const allowed = element.shadowRoot!.querySelector<HTMLAnchorElement>('[data-item-id="c"]')!;
    allowed.addEventListener("click", event => event.preventDefault()); allowed.click(); expect(selected).toHaveBeenCalledTimes(1);
  });
  it("skips disabled anchors during real roving and has one eligible entry", async () => {
    const element = new Menu(); element.items = [{ id: "a", label: "First" }, { id: "b", label: "Blocked", href: "#blocked", disabled: true }, { id: "c", label: "Last" }]; document.body.append(element);
    const first = element.shadowRoot!.querySelector<HTMLButtonElement>('[data-item-id="a"]')!; first.focus(); key(first, "ArrowDown"); await flush();
    expect(element.shadowRoot!.activeElement?.getAttribute("data-item-id")).toBe("c"); expect(element.shadowRoot!.querySelector<HTMLAnchorElement>('[data-item-id="b"]')!.tabIndex).toBe(-1);
  });
});

describe("Toolbar eligibility, lifecycle and editing ownership", () => {
  const mount = () => { const element = new Toolbar(); element.innerHTML = '<button id="first">First</button><input id="editor" value="ABCDE"><button id="hidden" hidden>Hidden</button><button id="last">Last</button>'; document.body.append(element); return element; };
  it("leaves native editing keys untouched, while command buttons still rove", async () => {
    const element = mount(); await flush(); const input = element.querySelector<HTMLInputElement>("input")!; input.focus(); input.setSelectionRange(5, 5);
    const event = new KeyboardEvent("keydown", { key: "Home", bubbles: true, composed: true, cancelable: true }); input.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false); expect(document.activeElement).toBe(input);
    const first = element.querySelector<HTMLButtonElement>("button")!; first.focus(); key(first, "ArrowRight"); await flush(); expect(document.activeElement).toBe(input);
  });
  it("excludes hidden/inert controls and rebinds observation on every reconnect", async () => {
    const element = mount(); await flush(); element.querySelector("input")!.remove(); await flush();
    const first = element.querySelector<HTMLButtonElement>("#first")!; const last = element.querySelector<HTMLButtonElement>("#last")!;
    first.focus(); key(first, "ArrowRight"); await flush(); expect(document.activeElement).toBe(last); expect(element.controls.map(e => e.id)).toEqual(["first", "last"]);
    for (let i = 0; i < 2; i++) {
      element.remove(); document.body.append(element); first.disabled = true; await flush(); expect(last.tabIndex).toBe(0);
      first.disabled = false; last.setAttribute("inert", ""); await flush(); expect(first.tabIndex).toBe(0); last.removeAttribute("inert"); await flush();
    }
  });
});

it("Chip lets Remove own its native keyboard activation while its wrapper remains selectable", () => {
  const element = new Chip(); element.label = "Filter"; element.selectable = true; element.removable = true; document.body.append(element);
  const select = vi.fn(); const remove = vi.fn(); element.addEventListener("select", select); element.addEventListener("remove", remove);
  const button = element.shadowRoot!.querySelector<HTMLButtonElement>('[part="remove"]')!;
  const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, composed: true, cancelable: true }); button.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(false); expect(select).not.toHaveBeenCalled(); button.click(); expect(remove).toHaveBeenCalledTimes(1);
  key(element.shadowRoot!.querySelector('[part="chip"]')!, "Enter"); expect(select).toHaveBeenCalledTimes(1);
});

it("ThumbnailCard leaves slotted secondary pointer/keyboard actions independent of the primary card", () => {
  const element = new ThumbnailCard(); element.interactive = true; element.title = "Report"; element.innerHTML = '<button slot="action">More</button>'; document.body.append(element);
  const activate = vi.fn(); const secondary = vi.fn(); element.addEventListener("activate", activate); const button = element.querySelector("button")!; button.addEventListener("click", secondary);
  button.click(); const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, composed: true, cancelable: true }); button.dispatchEvent(event);
  expect(activate).not.toHaveBeenCalled(); expect(secondary).toHaveBeenCalledTimes(1); expect(event.defaultPrevented).toBe(false);
  (element.shadowRoot!.querySelector('[part="title"]') as HTMLElement).click(); expect(activate).toHaveBeenCalledTimes(1);
});

describe.each(["donut", "trace"] as const)("state-only activation retains %s controls", kind => {
  it("keeps the same focused button and projected host DOM for repeated activation", () => {
    const element = kind === "donut" ? new DonutChart() : new RunTrace();
    if (element instanceof DonutChart) element.segments = [{ id: "a", label: "Alpha", value: 4 }, { id: "b", label: "Beta", value: 6 }];
    else { element.steps = [{ id: "a", title: "Read", description: "Reads a file", status: "succeeded" }]; const input = document.createElement("input"); input.slot = "detail-a"; input.value = "Host draft"; element.append(input); }
    document.body.append(element); const selector = kind === "donut" ? '[part="legend-item"]' : '[part="toggle"]'; const button = element.shadowRoot!.querySelector<HTMLButtonElement>(selector)!; button.focus(); button.click();
    expect(element.shadowRoot!.querySelector(selector)).toBe(button); expect(element.shadowRoot!.activeElement).toBe(button); button.click();
    expect(button.getAttribute(kind === "donut" ? "aria-pressed" : "aria-expanded")).toBe("false");
    if (element instanceof RunTrace) expect(element.querySelector<HTMLInputElement>("input")!.value).toBe("Host draft");
  });
});

describe("Toolbar review regressions: native commands and inherited eligibility", () => {
  it.each(["button", "submit", "reset", "image"].flatMap(type => ["ArrowRight", "End"].map(key => ({ type, key }))))("roves from input command $type with $key", async ({ type, key: value }) => {
    const element = new Toolbar(); element.innerHTML = `<input type="${type}" value="One"><button>Two</button>`; document.body.append(element); await flush();
    const first = element.querySelector<HTMLInputElement>("input")!; const last = element.querySelector<HTMLButtonElement>("button")!; first.focus(); key(first, value); await flush();
    expect(document.activeElement).toBe(last); expect(last.tabIndex).toBe(0);
  });

  it.each(["text", "search", "number", "range"].flatMap(type => ["Home", "End", "ArrowRight"].map(key => ({ type, key }))))("leaves editing input $type key $key to the native control", async ({ type, key: value }) => {
    const element = new Toolbar(); element.innerHTML = `<input type="${type}" value="5"><button>Next</button>`; document.body.append(element); await flush();
    const input = element.querySelector<HTMLInputElement>("input")!; input.focus();
    const event = new KeyboardEvent("keydown", { key: value, bubbles: true, composed: true, cancelable: true }); input.dispatchEvent(event); await flush();
    expect(event.defaultPrevented).toBe(false); expect(document.activeElement).toBe(input);
  });

  it.each(["textarea", "select", "contenteditable"])("leaves %s editing/navigation keys native", async type => {
    const element = new Toolbar(); element.innerHTML = type === "contenteditable" ? '<div contenteditable="true" tabindex="0">Draft</div><button>Next</button>' : `<${type}>${type === "select" ? '<option>First</option><option>Second</option>' : 'Draft'}</${type}><button>Next</button>`; document.body.append(element); await flush();
    const editor = element.firstElementChild as HTMLElement; editor.focus();
    for (const value of ["Home", "End", "ArrowRight"]) {
      const event = new KeyboardEvent("keydown", { key: value, bubbles: true, composed: true, cancelable: true }); editor.dispatchEvent(event); await flush();
      expect(event.defaultPrevented).toBe(false); expect(document.activeElement).toBe(editor);
    }
  });

  it("excludes CSS-hidden ancestors without requiring layout measurements and observes their changes", async () => {
    const element = new Toolbar(); element.innerHTML = '<div style="display:none"><button id="hidden-descendant">Hidden</button></div><button id="visible-command">Visible</button>'; document.body.append(element); await flush();
    const hidden = element.querySelector<HTMLButtonElement>("#hidden-descendant")!; const visible = element.querySelector<HTMLButtonElement>("#visible-command")!;
    expect(element.controls).toEqual([visible]); expect(hidden.tabIndex).toBe(-1); expect(visible.tabIndex).toBe(0);
    (element.firstElementChild as HTMLElement).style.display = "block"; await flush(); expect(element.controls).toEqual([hidden, visible]);
    visible.focus(); key(visible, "Home"); await flush(); expect(document.activeElement).toBe(hidden);
  });

  it("honors inherited native fieldset disabledness, including its first legend exception", async () => {
    const element = new Toolbar(); element.innerHTML = '<fieldset disabled><legend><button id="legend-command">Legend</button></legend><button id="fieldset-command">Blocked</button></fieldset><button id="visible-command">Visible</button>'; document.body.append(element); await flush();
    const legend = element.querySelector<HTMLButtonElement>("#legend-command")!; const blocked = element.querySelector<HTMLButtonElement>("#fieldset-command")!; const visible = element.querySelector<HTMLButtonElement>("#visible-command")!;
    expect(element.controls).toEqual([legend, visible]); expect(blocked.tabIndex).toBe(-1);
    legend.remove(); await flush(); expect(element.controls).toEqual([visible]); expect(visible.tabIndex).toBe(0);
    element.querySelector("fieldset")!.disabled = false; await flush(); expect(element.controls).toEqual([blocked, visible]);
  });

  it("allows a visible descendant to override inherited CSS visibility", async () => {
    const element = new Toolbar(); element.innerHTML = '<div style="visibility:hidden"><button style="visibility:visible">Visible override</button></div><button>Last</button>'; document.body.append(element); await flush();
    expect(element.controls).toHaveLength(2);
  });
});

it("ThumbnailCard reserves its action slot for summary, role-link and closed-shadow secondary controls", () => {
  const element = new ThumbnailCard(); element.interactive = true; element.title = "Report"; element.innerHTML = '<details slot="action"><summary>More</summary><p>Details</p></details><span slot="action" role="link" tabindex="0">Secondary link</span>'; document.body.append(element);
  const primary = vi.fn(); element.addEventListener("activate", primary);
  const summary = element.querySelector("summary")!; summary.click(); expect(element.querySelector("details")!.open).toBe(true);
  const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, composed: true, cancelable: true }); summary.dispatchEvent(event); expect(event.defaultPrevented).toBe(false);
  (element.querySelector('[role="link"]') as HTMLElement).click();
  let internal!: HTMLButtonElement;
  const tag = `test-secondary-${Math.random().toString(36).slice(2)}`;
  customElements.define(tag, class extends HTMLElement { constructor() { super(); internal = document.createElement("button"); internal.textContent = "Closed action"; this.attachShadow({ mode: "closed" }).append(internal); } });
  const host = document.createElement(tag); host.slot = "action"; element.append(host); internal.click();
  expect(primary).not.toHaveBeenCalled();
  (element.shadowRoot!.querySelector('[part="title"]') as HTMLElement).click(); expect(primary).toHaveBeenCalledTimes(1);
});

it.each(["ArrowLeft", "ArrowRight", "pointer"])("TreeGrid honors an expansion listener's external focus handoff for %s", async action => {
  const element = new TreeGrid(); element.items = [{ value: "root", label: "Root", children: [{ value: "leaf", label: "Leaf" }] }]; document.body.append(element);
  if (action === "ArrowRight") (element.shadowRoot!.querySelector('[part~="toggle"]') as HTMLButtonElement).click();
  const outside = document.createElement("input"); outside.value = "Host draft"; document.body.append(outside);
  element.addEventListener("expand-changed", () => { outside.focus(); outside.setSelectionRange(1, 4); });
  const item = element.shadowRoot!.querySelector<HTMLButtonElement>('[part~="item"][data-value="root"]')!; item.focus();
  if (action === "pointer") (element.shadowRoot!.querySelector('[part~="toggle"]') as HTMLButtonElement).click(); else key(item, action);
  await flush(); expect(document.activeElement).toBe(outside); expect([outside.selectionStart, outside.selectionEnd]).toEqual([1, 4]);
});
