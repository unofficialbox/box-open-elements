import { afterEach, describe, expect, it, vi } from "vitest";
import { BulkActionBar } from "../../src/patterns/item/bulk-action-bar.js";
import { SearchResultsHeader } from "../../src/patterns/search/search-results-header.js";
import { ReviewQueueItem } from "../../src/patterns/task/review-queue-item.js";
import { GovernancePanel } from "../../src/patterns/governance/governance-panel.js";
import { SavedViewPicker } from "../../src/patterns/search/saved-view-picker.js";
import { ProvenanceStrip } from "../../src/patterns/lineage/provenance-strip.js";
afterEach(() => document.body.replaceChildren());
const actions = [{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }];
const button = (e: HTMLElement, selector: string) => e.shadowRoot!.querySelector<HTMLButtonElement>(selector)!;
const key = (e: HTMLElement, value: string) => e.dispatchEvent(new KeyboardEvent("keydown", { key:value, bubbles:true, composed:true, cancelable:true }));
const outside = () => { const input=document.createElement("input");input.value="Host draft";document.body.append(input);return input; };
for(const [name,Constructor] of [["BulkActionBar",BulkActionBar],["SearchResultsHeader",SearchResultsHeader],["ReviewQueueItem",ReviewQueueItem],["GovernancePanel",GovernancePanel]] as const) describe(`${name} refreshed action ownership`,()=>{
 it("retains focused action identity through count/status/label/item refreshes",()=>{const e=new Constructor();e.actions=actions;document.body.append(e);const b=button(e,'[data-action-id="b"]');b.focus();if(e instanceof BulkActionBar){e.count=3;e.items=[{label:"Updated item"}];e.message="Updated message";e.clearLabel="Clear all";}else if(e instanceof SearchResultsHeader){e.resultCount=3;e.filters=["PDF"];e.query="Updated query";}else if(e instanceof ReviewQueueItem){e.status="Ready";e.heading="Updated item";e.metrics=[{label:"Pages",value:"3"}];}else{e.status="Ready";e.policies=[{label:"Access",value:"Current"}];e.signals=[{label:"Current"}];}expect(button(e,'[data-action-id="b"]')).toBe(b);expect(e.shadowRoot!.activeElement).toBe(b);});
 it("reuses same-ID reordered actions while removing obsolete actions and updating names",()=>{const e=new Constructor();e.actions=actions;document.body.append(e);const a=button(e,'[data-action-id="a"]'),b=button(e,'[data-action-id="b"]');b.focus();e.actions=[{id:"b",label:"Beta current",tone:"primary"},{id:"c",label:"Gamma"}];expect(button(e,'[data-action-id="b"]')).toBe(b);expect(e.shadowRoot!.activeElement).toBe(b);expect(b.textContent).toContain("Beta current");expect(b.dataset.tone).toBe("primary");expect(a.isConnected).toBe(false);expect(e.shadowRoot!.querySelector('[data-action-id="a"]')).toBeNull();const events=vi.fn();e.addEventListener("action",events);b.click();expect(events).toHaveBeenCalledTimes(1);expect(events.mock.calls[0][0].detail.action).toBe("b");e.actions=[];expect(b.isConnected).toBe(false);});
 it("preserves host focus and caret when an action callback refreshes the surface",()=>{const e=new Constructor();e.actions=actions;document.body.append(e);const input=outside();e.addEventListener("action",()=>{e.actions=[{id:"b",label:"Beta current"}];input.focus();input.setSelectionRange(2,6);});button(e,'[data-action-id="b"]').click();expect(document.activeElement).toBe(input);expect([input.selectionStart,input.selectionEnd]).toEqual([2,6]);e.actions=[{id:"b",label:"Beta latest"}];expect(document.activeElement).toBe(input);});
 it("does not duplicate listeners across refresh and reconnect",()=>{const e=new Constructor();e.actions=actions;document.body.append(e);const changed=vi.fn();e.addEventListener("action",changed);for(let n=0;n<3;n++){e.actions=actions.map(x=>({...x,label:x.label+n}));e.remove();document.body.append(e);}button(e,'[data-action-id="b"]').click();expect(changed).toHaveBeenCalledTimes(1);});
});
describe("BulkActionBar roving entry",()=>{
 it("retains the current entry while labels/count change, and repairs a removed entry",()=>{const e=new BulkActionBar();e.actions=actions;document.body.append(e);const b=button(e,'[data-action-id="b"]');button(e,'[data-action-id="a"]').focus();key(button(e,'[data-action-id="a"]'),"ArrowRight");expect(e.shadowRoot!.activeElement).toBe(b);e.count=4;expect(b.tabIndex).toBe(0);e.actions=[actions[0]];expect(button(e,'[data-action-id="a"]').tabIndex).toBe(0);expect(e.shadowRoot!.querySelectorAll('button[tabindex="0"]')).toHaveLength(1);});
});
describe("SearchResultsHeader filter ownership",()=>{
 it("retains same filter identity through reorder and removes stale filters",()=>{const e=new SearchResultsHeader();e.filters=["PDF","Owner"];document.body.append(e);const owner=button(e,'[data-filter="Owner"]');owner.focus();e.filters=["Owner","Ready"];expect(button(e,'[data-filter="Owner"]')).toBe(owner);expect(e.shadowRoot!.activeElement).toBe(owner);const event=vi.fn();e.addEventListener("filter-removed",event);owner.click();expect(event.mock.calls[0][0].detail.filter).toBe("Owner");expect(e.shadowRoot!.querySelector('[data-filter="PDF"]')).toBeNull();});
});
describe("ReviewQueueItem select ownership",()=>{
 it("retains its select control and reflects fresh selection metadata",()=>{const e=new ReviewQueueItem();document.body.append(e);const select=button(e,'[part="select"]');select.focus();e.heading="Current heading";e.itemLabel="Current item";e.status="Ready";expect(button(e,'[part="select"]')).toBe(select);expect(e.shadowRoot!.activeElement).toBe(select);expect(select.getAttribute("aria-label")).toBe("Open Current heading review item");const event=vi.fn();e.addEventListener("selected",event);select.click();expect(event.mock.calls[0][0].detail).toEqual({title:"Current heading",itemLabel:"Current item"});});
});
describe("GovernancePanel policy ownership",()=>{
 it("retains an identified policy while values update and emits fresh metadata",()=>{const e=new GovernancePanel();e.policies=[{label:"Access",value:"Old"},{label:"Retention",value:"30 days"}];document.body.append(e);const access=button(e,'[data-policy-label="Access"]');access.focus();e.policies=[{label:"Access",value:"Current",description:"Updated policy",tone:"success"}];expect(button(e,'[data-policy-label="Access"]')).toBe(access);expect(e.shadowRoot!.activeElement).toBe(access);const selected=vi.fn();e.addEventListener("policy-selected",selected);access.click();expect(selected.mock.calls[0][0].detail).toEqual({label:"Access",value:"Current",description:"Updated policy",tone:"success"});expect(e.shadowRoot!.querySelector('[data-policy-label="Retention"]')).toBeNull();});
});
describe("SavedViewPicker view identity and focus handoff",()=>{
 it("retains selected views through text/count refresh, reorder and removal",()=>{const e=new SavedViewPicker();e.views=actions;e.value="b";document.body.append(e);const b=button(e,'[data-view-id="b"]');b.focus();e.views=[{id:"b",label:"Beta current",resultCount:3},{id:"a",label:"Alpha"}];expect(button(e,'[data-view-id="b"]')).toBe(b);expect(e.shadowRoot!.activeElement).toBe(b);expect(b.textContent).toContain("3 results");expect(b.getAttribute("aria-checked")).toBe("true");e.views=[actions[0]];expect(b.isConnected).toBe(false);expect(e.value).toBe("b");expect(button(e,'[data-view-id="a"]').tabIndex).toBe(0);});
 it("completes keyboard focus before dispatch and preserves a host handoff through repeated navigation",async()=>{const e=new SavedViewPicker();e.views=actions;e.value="a";document.body.append(e);const input=outside();const changed=vi.fn();e.addEventListener("value-changed",event=>{changed(event);e.views=e.views.map(x=>({...x,label:x.label+" current"}));input.focus();input.setSelectionRange(1,4);});const a=button(e,'[data-view-id="a"]');a.focus();key(a,"ArrowRight");await Promise.resolve();expect(e.value).toBe("b");expect(changed).toHaveBeenCalledTimes(1);expect(document.activeElement).toBe(input);expect([input.selectionStart,input.selectionEnd]).toEqual([1,4]);const b=button(e,'[data-view-id="b"]');b.focus();key(b,"ArrowLeft");await Promise.resolve();expect(e.value).toBe("a");expect(changed).toHaveBeenCalledTimes(2);expect(document.activeElement).toBe(input);});
 it("does not schedule stale focus on teardown from a keyboard selection callback",async()=>{const e=new SavedViewPicker();e.views=actions;document.body.append(e);const input=outside();e.addEventListener("value-changed",()=>{e.remove();input.focus();});const a=button(e,'[data-view-id="a"]');a.focus();key(a,"ArrowRight");await Promise.resolve();expect(document.activeElement).toBe(input);});
});
describe("ProvenanceStrip chain identity",()=>{
 it("retains same-ID chips through label/kind/parent updates and emits current data",()=>{const e=new ProvenanceStrip();e.nodes=[{id:"a",label:"Alpha"},{id:"b",label:"Beta",parents:[{id:"a"}]}];document.body.append(e);const b=button(e,'[data-id="b"]');b.focus();e.nodes=[{id:"a",label:"Alpha current"},{id:"b",label:"Beta current",kind:"template",parents:[{id:"a"}]}];expect(button(e,'[data-id="b"]')).toBe(b);expect(e.shadowRoot!.activeElement).toBe(b);expect(b.textContent).toContain("Beta current");const selected=vi.fn();e.addEventListener("node-selected",selected);b.click();expect(selected.mock.calls[0][0].detail.node).toMatchObject({id:"b",label:"Beta current",kind:"template"});e.nodes=[{id:"b",label:"Beta root"},{id:"a",label:"Alpha child",parents:[{id:"b"}]}];expect(button(e,'[data-id="b"]')).toBe(b);expect(e.shadowRoot!.activeElement).toBe(b);e.nodes=[{id:"a",label:"Alpha"}];expect(b.isConnected).toBe(false);});
});


describe("SavedViewPicker synchronous focusin ownership",()=>{
 it("preserves newer membership/value and outside caret during navigation focus",()=>{
  const e=new SavedViewPicker();e.views=actions;e.value="a";document.body.append(e);const input=outside();const changed=vi.fn();e.addEventListener("value-changed",changed);
  button(e,'[data-view-id="b"]').addEventListener("focusin",()=>{e.views=[actions[0],{id:"c",label:"Gamma"}];e.value="c";input.focus();input.setSelectionRange(2,5);},{once:true});
  const a=button(e,'[data-view-id="a"]');a.focus();key(a,"ArrowRight");
  expect(e.value).toBe("c");expect(changed).not.toHaveBeenCalled();expect(document.activeElement).toBe(input);expect([input.selectionStart,input.selectionEnd]).toEqual([2,5]);expect(e.shadowRoot!.querySelector('[data-view-id="b"]')).toBeNull();
 });
 it("does not overwrite an authoritative value write even if the focused view survives",()=>{
  const e=new SavedViewPicker();e.views=actions;e.value="a";document.body.append(e);const changed=vi.fn();e.addEventListener("value-changed",changed);
  button(e,'[data-view-id="b"]').addEventListener("focusin",()=>{e.value="b";e.value="a";},{once:true});const a=button(e,'[data-view-id="a"]');a.focus();key(a,"ArrowRight");expect(e.value).toBe("a");expect(changed).not.toHaveBeenCalled();
 });
 it.each([false,true])("ignores the resumed navigation after detach/reconnect=%s",reconnect=>{
  const e=new SavedViewPicker();e.views=actions;e.value="a";document.body.append(e);const input=outside();const changed=vi.fn();e.addEventListener("value-changed",changed);
  button(e,'[data-view-id="b"]').addEventListener("focusin",()=>{e.remove();if(reconnect)document.body.append(e);input.focus();},{once:true});const a=button(e,'[data-view-id="a"]');a.focus();key(a,"ArrowRight");expect(e.value).toBe("a");expect(changed).not.toHaveBeenCalled();expect(document.activeElement).toBe(input);
 });
 it("continues a legitimate same-ID label refresh from focusin",()=>{
  const e=new SavedViewPicker();e.views=actions;e.value="a";document.body.append(e);const changed=vi.fn();e.addEventListener("value-changed",changed);
  button(e,'[data-view-id="b"]').addEventListener("focusin",()=>{e.views=actions.map(view=>({...view,label:view.label+" current"}));},{once:true});const a=button(e,'[data-view-id="a"]');a.focus();key(a,"ArrowRight");expect(e.value).toBe("b");expect(changed).toHaveBeenCalledTimes(1);expect(e.shadowRoot!.activeElement).toBe(button(e,'[data-view-id="b"]'));
 });
});
