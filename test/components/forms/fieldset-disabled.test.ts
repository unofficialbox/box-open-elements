// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
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
