// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { TileGroup } from "../../../src/components/forms/tile-group.js";
TileGroup.register();
import { Fieldset } from "../../../src/components/forms/fieldset.js";
import { TextField } from "../../../src/components/forms/text-field.js";
import { Select } from "../../../src/components/forms/select.js";
import { getMirroredFormValue } from "../../../src/core/index.js";

const settle = async () => { await new Promise(resolve => setTimeout(resolve, 0)); };
const field = () => { const e = new TextField(); e.name = "synthetic"; e.value = "Alpha"; return e; };
const group = (...children: HTMLElement[]) => { const e = new Fieldset(); e.append(...children); document.body.append(e); return e; };
afterEach(() => document.body.replaceChildren());

describe("fieldset effective disabled ownership", () => {
  it("disables initially enabled custom controls and omits their form values", () => {
    const text = field();
    const select = new Select(); select.options = [{ value: "a", label: "Alpha" }]; select.value = "a";
    const e = group(text, select);
    e.disabled = true;
    expect(text.disabled).toBe(true);
    expect(text.shadowRoot!.querySelector<HTMLInputElement>("input")!.disabled).toBe(true);
    expect(select.disabled).toBe(true);
    expect(select.shadowRoot!.querySelector<HTMLSelectElement>("select")!.disabled).toBe(true);
    expect(getMirroredFormValue(text.internals)).toBe(null);
    e.disabled = false;
    expect(text.disabled).toBe(false);
    expect(text.value).toBe("Alpha");
    expect(getMirroredFormValue(text.internals)).toBe("Alpha");
  });
  it("propagates preconnected disabling to native/custom controls", () => {
    const e = new Fieldset(); e.disabled = true;
    const text = field(); const native = document.createElement("input");
    e.append(text, native); document.body.append(e);
    expect(text.disabled).toBe(true);
    expect(native.disabled).toBe(true);
  });
  it("observes newly added native/custom wrapped descendants and releases removed controls", async () => {
    const e = group(); e.disabled = true;
    const wrapper = document.createElement("div"), text = field(), native = document.createElement("input");
    wrapper.append(text, native); e.append(wrapper); await settle();
    expect(text.disabled).toBe(true); expect(native.disabled).toBe(true);
    wrapper.remove(); await settle();
    expect(text.disabled).toBe(false); expect(native.disabled).toBe(false);
  });
  it("preserves independently disabled native and custom controls", () => {
    const text = field(); text.disabled = true;
    const native = document.createElement("input"); native.disabled = true;
    const e = group(text, native); e.disabled = true; e.disabled = false;
    expect(text.disabled).toBe(true); expect(native.disabled).toBe(true);
  });
  it("preserves consumer attribute ownership acquired while disabled, even before observer delivery", () => {
    const text = field(), e = group(text); e.disabled = true;
    text.setAttribute("disabled", "");
    e.disabled = false;
    expect(text.disabled).toBe(true);
  });
  it("reasserts group disabling after a consumer enables a child, then restores consumer intent", async () => {
    const text = field(), e = group(text); e.disabled = true;
    text.disabled = false; await settle();
    expect(text.disabled).toBe(true);
    e.disabled = false; expect(text.disabled).toBe(false);
  });
  it("moves disabled controls between groups without promoting the prior group's state to consumer ownership", async () => {
    const text = field(), a = group(text), b = group(); a.disabled = true; b.disabled = true;
    b.append(text); await settle();
    a.disabled = false; expect(text.disabled).toBe(true);
    b.disabled = false; expect(text.disabled).toBe(false);
    a.disabled = true; a.append(text); await settle();
    b.append(text); await settle(); expect(text.disabled).toBe(false);
  });
  it("restores nested group state without clearing a separately disabled inner group", async () => {
    const text = field(), inner = new Fieldset(); inner.append(text);
    const outer = group(inner); outer.disabled = true;
    expect(inner.disabled).toBe(true); expect(text.disabled).toBe(true);
    outer.disabled = false; await settle();
    expect(inner.disabled).toBe(false); expect(text.disabled).toBe(false);
    inner.disabled = true; outer.disabled = true; outer.disabled = false; await settle();
    expect(inner.disabled).toBe(true); expect(text.disabled).toBe(true);
    inner.disabled = false; expect(text.disabled).toBe(false);
  });
  it("cleans up and observes new descendants after reconnect", async () => {
    const text = field(), e = group(text); e.disabled = true;
    e.remove(); expect(text.disabled).toBe(false);
    const native = document.createElement("input"); e.append(native); document.body.append(e); await settle();
    expect(text.disabled).toBe(true); expect(native.disabled).toBe(true);
    e.disabled = false; expect(text.disabled).toBe(false); expect(native.disabled).toBe(false);
  });
});

it("keeps overlapping group contributions when the destination observer runs first", async () => {
  const text = field(), a = group(text), b = group(); a.disabled = true; b.disabled = true;
  // Queue the destination before the source removal, so both groups briefly
  // contribute to the same control during MutationObserver delivery.
  b.append(document.createElement("span"));
  b.append(text);
  await settle();
  expect(text.disabled).toBe(true);
  a.disabled = false;
  expect(text.disabled).toBe(true);
  b.disabled = false;
  expect(text.disabled).toBe(false);
});

it("retains native consumer disabling written while the group owns disabling", () => {
  const native = document.createElement("input"), e = group(native);
  e.disabled = true;
  native.disabled = true;
  e.disabled = false;
  expect(native.disabled).toBe(true);
});

it("preserves reset state and form omission while disabled", () => {
  const text = field(), e = group(text);
  e.disabled = true;
  text.value = "Beta";
  text.formResetCallback();
  expect(text.value).toBe("Alpha");
  expect(getMirroredFormValue(text.internals)).toBe(null);
  e.disabled = false;
  expect(getMirroredFormValue(text.internals)).toBe("Alpha");
});

it("retains an independently disabled native nested fieldset and observes its re-enable", async () => {
  const text = field(), native = document.createElement("input"), inner = document.createElement("fieldset");
  inner.disabled = true; inner.append(text, native);
  const outer = group(inner); outer.disabled = true; outer.disabled = false;
  expect(inner.disabled).toBe(true);
  expect(text.disabled).toBe(true);
  expect(text.shadowRoot!.querySelector<HTMLInputElement>("input")!.disabled).toBe(true);
  expect(native.matches(":disabled")).toBe(true);
  inner.disabled = false; await settle();
  expect(text.disabled).toBe(false); expect(native.disabled).toBe(false);
});

it("honors a disabled native ancestor while retaining its first-legend exception", async () => {
  const first = field(), second = field(), body = field();
  const inner = document.createElement("fieldset"), firstLegend = document.createElement("legend"), secondLegend = document.createElement("legend");
  inner.disabled = true; firstLegend.append(first); secondLegend.append(second); inner.append(firstLegend, secondLegend, body);
  const outer = group(inner);
  expect(first.disabled).toBe(false);
  expect(second.disabled).toBe(true); expect(body.disabled).toBe(true);
  outer.disabled = true; expect(first.disabled).toBe(true);
  outer.disabled = false; expect(first.disabled).toBe(false);
  expect(second.disabled).toBe(true); expect(body.disabled).toBe(true);
  inner.disabled = false; await settle();
  expect(second.disabled).toBe(false); expect(body.disabled).toBe(false);
});

it("does not retain native ancestor disabling that the custom group itself added", () => {
  const text = field(), inner = document.createElement("fieldset"); inner.append(text);
  const outer = group(inner); outer.disabled = true;
  expect(inner.disabled).toBe(true); expect(text.disabled).toBe(true);
  outer.disabled = false;
  expect(inner.disabled).toBe(false); expect(text.disabled).toBe(false);
});

it("observes a native fieldset outside the custom group and reapplies its state after reconnect", async () => {
  const text = field(), inner = new Fieldset(), native = document.createElement("fieldset");
  inner.append(text); native.disabled = true; native.append(inner); document.body.append(native);
  expect(text.disabled).toBe(true);
  native.disabled = false; await settle(); expect(text.disabled).toBe(false);
  native.disabled = true; await settle(); expect(text.disabled).toBe(true);
  inner.remove(); document.body.append(inner); await settle(); expect(text.disabled).toBe(false);
});

it("disables a dynamically inserted custom control after its definition upgrades it", async () => {
  const e = group(); e.disabled = true;
  const tag = "box-late-disabled-fixture";
  const late = document.createElement(tag); late.setAttribute("name", "late"); late.setAttribute("value", "Alpha");
  e.append(late); await settle();
  customElements.define(tag, class extends TextField {});
  await settle();
  const upgraded = late as TextField;
  expect(upgraded.disabled).toBe(true);
  expect(upgraded.shadowRoot!.querySelector<HTMLInputElement>("input")!.disabled).toBe(true);
  e.disabled = false;
  expect(upgraded.disabled).toBe(false);
  expect(upgraded.value).toBe("Alpha");
});

it("reconciles a pending custom upgrade when a disabled group reconnects", async () => {
  const e = group(); e.disabled = true;
  const tag = "box-late-reconnected-fixture", late = document.createElement(tag);
  late.setAttribute("value", "Alpha"); e.append(late); await settle(); e.remove();
  customElements.define(tag, class extends TextField {}); await settle();
  document.body.append(e); await settle();
  expect((late as TextField).disabled).toBe(true);
  expect(late.shadowRoot!.querySelector<HTMLInputElement>("input")!.disabled).toBe(true);
  e.disabled = false; expect((late as TextField).disabled).toBe(false);
});

it("reconciles external native first-legend insertion/removal without losing consumer intent", async () => {
  const text = field(), owned = field(); owned.disabled = true;
  const inner = new Fieldset(), native = document.createElement("fieldset"), legend = document.createElement("legend");
  const positive = document.createElement("input");
  inner.append(text, owned); legend.append(positive, inner); native.disabled = true; native.append(legend); document.body.append(native);
  await settle(); expect(positive.matches(":disabled")).toBe(false); expect(text.disabled).toBe(false);
  const earlier = document.createElement("legend"); native.prepend(earlier); await settle();
  expect(positive.matches(":disabled")).toBe(true); expect(text.disabled).toBe(true);
  earlier.remove(); await settle();
  expect(positive.matches(":disabled")).toBe(false); expect(text.disabled).toBe(false); expect(owned.disabled).toBe(true);
  inner.remove(); document.body.append(inner); native.prepend(earlier); await settle();
  expect(text.disabled).toBe(false);
  legend.append(inner); await settle(); expect(text.disabled).toBe(true);
  earlier.remove(); await settle(); expect(text.disabled).toBe(false); expect(owned.disabled).toBe(true);
});

it("requires an observable consumer write when an already-owned custom disabled setter is a no-op", () => {
  const text = field(), inner = new Fieldset(); inner.append(text);
  const outer = group(inner); outer.disabled = true;
  const observer = new MutationObserver(() => {});
  observer.observe(text, {attributes:true,attributeFilter:["disabled"]});
  observer.observe(inner, {attributes:true,attributeFilter:["disabled"]});
  // These setters toggle an already-present attribute; the DOM reports no
  // consumer write, so ownership cannot distinguish them from doing nothing.
  text.disabled = true; inner.disabled = true;
  expect(observer.takeRecords()).toHaveLength(0);
  // Explicit attribute writes are observable even when the value is unchanged.
  text.setAttribute("disabled", ""); inner.setAttribute("disabled", "");
  expect(observer.takeRecords()).toHaveLength(2);
  observer.disconnect(); outer.disabled = false;
  expect(text.disabled).toBe(true); expect(inner.disabled).toBe(true);
  inner.disabled = false; expect(text.disabled).toBe(true);
});

it("discovers form-associated TileGroup without an invented disabled property", () => {
  const tiles = document.createElement("box-tile-group") as TileGroup;
  tiles.name = "plan"; tiles.options = [{id:"a",label:"Alpha"}]; tiles.value = "a";
  const e = group(tiles);
  expect("disabled" in tiles).toBe(false);
  e.disabled = true;
  expect(tiles.hasAttribute("disabled")).toBe(true);
  expect(tiles.shadowRoot!.querySelector("fieldset")!.disabled).toBe(true);
  tiles.formResetCallback(); expect(tiles.value).toBe("a");
  e.disabled = false; expect(tiles.hasAttribute("disabled")).toBe(false);
});

it("retains TileGroup consumer ownership and releases transferred group disabling", async () => {
  const tiles = new TileGroup(); tiles.options = [{id:"a",label:"Alpha"}]; tiles.value = "a";
  const a = group(tiles), b = group(); a.disabled = true; b.disabled = true;
  b.append(tiles); await settle(); a.disabled = false; expect(tiles.hasAttribute("disabled")).toBe(true);
  b.disabled = false; expect(tiles.hasAttribute("disabled")).toBe(false);
  b.disabled = true; tiles.setAttribute("disabled", ""); b.disabled = false;
  expect(tiles.hasAttribute("disabled")).toBe(true);
});

it("discovers dynamically added form-associated TileGroup after reconnect", async () => {
  const e = group(); e.disabled = true; e.remove(); document.body.append(e);
  const tiles = new TileGroup(); tiles.options = [{id:"a",label:"Alpha"}]; e.append(tiles); await settle();
  expect(tiles.hasAttribute("disabled")).toBe(true);
  e.disabled = false; expect(tiles.hasAttribute("disabled")).toBe(false);
});
