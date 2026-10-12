// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import "../../../src/components/forms/text-field.js";
import "../../../src/components/forms/text-area.js";
import "../../../src/components/forms/number-input.js";
import "../../../src/components/forms/date-field.js";
import "../../../src/components/forms/search-field.js";
import "../../../src/components/forms/time-field.js";
import "../../../src/components/forms/color-picker.js";
import "../../../src/components/forms/slider.js";
import "../../../src/components/forms/spin-button.js";
import "../../../src/components/forms/rich-text-input.js";
import "../../../src/components/forms/range-slider.js";
import { FormAssociatedElement, getMirroredFormValue } from "../../../src/core/index.js";

type Field = FormAssociatedElement & { value: string | number; disabled: boolean };
const cases = [
  ["text-field", "Alpha", "Beta"], ["text-area", "Alpha", "Beta"],
  ["number-input", 1, 2], ["date-field", "2026-10-01", "2026-10-02"],
  ["search-field", "Alpha", "Beta"], ["time-field", "09:00", "10:00"],
  ["color-picker", "#0061d5", "#ff0066"], ["slider", 20, 80],
  ["spin-button", 1, 2], ["rich-text-input", "Alpha", "Beta"],
] as const;
afterEach(() => document.body.replaceChildren());
const control = (e: Element) => e.shadowRoot!.querySelector<HTMLInputElement>("input,textarea,[part=editor]")!;
const read = (c: HTMLInputElement) => "value" in c ? c.value : c.innerHTML;
describe("authoritative values", () => {
  for (const [tag, a, b] of cases) {
    for (const write of ["property", "attribute"] as const) {
      it(`${tag}: focused ${write} writes reconcile display and submission`, () => {
        const e = document.createElement(`box-${tag}`) as Field;
        e.value = a;
        document.body.append(e);
        const c = control(e);
        c.focus();
        if (write === "property") e.value = b;
        else e.setAttribute("value", String(b));
        expect(read(c)).toBe(String(b));
        expect(getMirroredFormValue(e.internals)).toBe(String(b));
        c.blur();
        expect(read(c)).toBe(String(b));
      });
    }
  }
  it("reconciles both focused range endpoints", () => {
    const e = document.createElement("box-range-slider") as FormAssociatedElement & { start: number; end: number };
    document.body.append(e);
    const c = control(e);
    c.focus();
    e.start = 30;
    e.end = 70;
    expect(c.value).toBe("30");
    expect(e.shadowRoot!.querySelector<HTMLInputElement>("[part=range-end]")!.value).toBe("70");
  });
});

describe("native edit ownership", () => {
  for (const [tag, a, b] of cases) {
    it(`${tag}: preserves echoes and applies reentrant replacements`, () => {
      const e = document.createElement(`box-${tag}`) as Field;
      e.value = a;
      document.body.append(e);
      const c = control(e);
      c.focus();
      if ("value" in c) c.value = String(b);
      else (c as HTMLElement).innerHTML = String(b);
      let count = 0;
      e.addEventListener("value-changed", () => {
        count++;
        e.value = e.value;
        e.value = a;
        e.value = b;
      });
      c.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
      expect(count).toBe(1);
      expect(read(c)).toBe(String(b));
      expect(getMirroredFormValue(e.internals)).toBe(String(b));
    });
    it(`${tag}: same-value writes, reset, disabled and reconnect reconcile`, () => {
      const e = document.createElement(`box-${tag}`) as Field;
      e.value = a;
      document.body.append(e);
      const c = control(e);
      c.focus();
      if ("value" in c) c.value = String(b);
      else (c as HTMLElement).innerHTML = String(b);
      e.value = a;
      expect(read(c)).toBe(String(a));
      e.value = b;
      e.formResetCallback();
      expect(read(c)).toBe(String(a));
      e.disabled = true;
      e.value = b;
      expect(read(c)).toBe(String(b));
      expect(getMirroredFormValue(e.internals)).toBe(null);
      e.disabled = false;
      e.remove();
      e.value = a;
      document.body.append(e);
      expect(read(c)).toBe(String(a));
      expect(getMirroredFormValue(e.internals)).toBe(String(a));
    });
  }
  it("preserves numeric formatting for synchronous property and attribute echoes", () => {
    const e = document.createElement("box-number-input") as Field;
    document.body.append(e);
    const c = control(e);
    c.focus();
    e.addEventListener("value-changed", () => {
      e.value = e.value;
      e.setAttribute("value", "01.00");
    });
    c.value = "1.00";
    c.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
    expect(c.value).toBe("1.00");
    e.value = 1;
    expect(c.value).toBe("1");
  });
  it("preserves text selection for echoes and unrelated updates", () => {
    const e = document.createElement("box-text-field") as Field;
    document.body.append(e);
    const c = control(e);
    c.focus();
    c.value = "Alpha";
    c.setSelectionRange(2, 2);
    e.addEventListener("value-changed", () => { e.value = e.value; });
    c.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
    e.setAttribute("label", "Changed label");
    expect(c.selectionStart).toBe(2);
    expect(c.selectionEnd).toBe(2);
    expect(c.value).toBe("Alpha");
  });
});

describe("normalized writes and compound controls", () => {
  it("applies numeric normalized host attributes while focused", () => {
    const e = document.createElement("box-number-input") as Field;
    e.value = 1;
    document.body.append(e);
    const c = control(e);
    c.focus();
    e.setAttribute("value", "02.00");
    expect(e.value).toBe(2);
    expect(c.value).toBe("2");
    expect(getMirroredFormValue(e.internals)).toBe("2");
  });
  it("applies sanitized rich text but preserves editor nodes for native echoes", () => {
    const e = document.createElement("box-rich-text-input") as Field;
    document.body.append(e);
    const c = control(e) as HTMLElement;
    c.focus();
    c.innerHTML = "<strong>Alpha</strong>";
    const child = c.firstChild;
    e.addEventListener("value-changed", () => { e.value = e.value; });
    c.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
    expect(c.firstChild).toBe(child);
    e.value = '<strong>Beta</strong><script>alert("synthetic")</script>';
    expect(c.innerHTML).toBe(e.value);
    expect(c.textContent).toBe("Beta");
    expect(getMirroredFormValue(e.internals)).toBe(e.value);
  });
  it("preserves native composition text through echoes and label updates", () => {
    const e = document.createElement("box-text-field") as Field;
    document.body.append(e);
    const c = control(e);
    c.focus();
    c.dispatchEvent(new CompositionEvent("compositionstart"));
    c.value = "synthetic composition";
    c.setSelectionRange(4, 4);
    e.addEventListener("value-changed", () => { e.value = e.value; });
    c.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true, isComposing: true }));
    e.setAttribute("label", "During composition");
    expect(c.value).toBe("synthetic composition");
    expect(c.selectionStart).toBe(4);
    c.dispatchEvent(new CompositionEvent("compositionend"));
  });
  it("reconciles range echoes, reentrant writes, same-value attributes and focused reset", () => {
    const e = document.createElement("box-range-slider") as FormAssociatedElement & { start: number; end: number };
    e.name = "budget";
    document.body.append(e);
    const c = control(e);
    c.focus();
    e.addEventListener("value-changed", () => {
      e.start = e.start;
      e.end = e.end;
      e.start = 40;
      e.end = 60;
    });
    c.value = "30";
    c.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
    expect(c.value).toBe("40");
    expect(e.shadowRoot!.querySelector<HTMLInputElement>("[part=range-end]")!.value).toBe("60");
    c.value = "10";
    e.setAttribute("start", "40");
    expect(c.value).toBe("40");
    e.formResetCallback();
    expect(c.value).toBe("20");
    expect((getMirroredFormValue(e.internals) as FormData).get("budget-start")).toBe("20");
  });
});

describe("original composed native input echoes", () => {
  for (const source of ["input", "value-changed"]) {
    for (const raw of ["1.00", ""]) {
      it(`preserves numeric draft ${JSON.stringify(raw)} echoed from host ${source}`, () => {
        const e = document.createElement("box-number-input") as Field;
        e.value = 2;
        document.body.append(e);
        const c = control(e);
        c.focus();
        let events = 0;
        e.addEventListener(source, () => {
          events++;
          e.value = e.value;
          e.setAttribute("value", String(e.value));
        });
        c.value = raw;
        c.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
        expect(events).toBe(1);
        expect(c.value).toBe(raw);
        expect(e.value).toBe(Number(raw));
        expect(getMirroredFormValue(e.internals)).toBe(String(Number(raw)));
      });
    }
  }
});

describe("constraint reconciliation ownership", () => {
  for (const constraint of ["min", "max"]) {
    it(`does not retain authority after a no-op ${constraint} write`, () => {
      const e = document.createElement("box-number-input") as Field & { min: number; max: number };
      e[constraint] = constraint === "min" ? 0 : 10;
      document.body.append(e);
      const c = control(e);
      c.focus();
      e[constraint] = e[constraint];
      c.value = "1.00";
      e.setAttribute("label", "Unrelated update");
      expect(c.value).toBe("1.00");
      c.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
      expect(c.value).toBe("1.00");
      expect(e.value).toBe(1);
    });
  }
  it("still applies real changed-constraint clamping while focused", () => {
    const e = document.createElement("box-number-input") as Field & { max: number };
    e.max = 10;
    e.value = 7;
    document.body.append(e);
    const c = control(e);
    c.focus();
    c.value = "7.00";
    e.max = 3;
    expect(e.value).toBe(3);
    expect(c.value).toBe("3");
    expect(getMirroredFormValue(e.internals)).toBe("3");
  });
});

it("keeps original input scope through nested native inputs and ends it synchronously", () => {
  const e = document.createElement("box-number-input") as Field;
  document.body.append(e);
  const c = control(e);
  c.focus();
  let nested = false;
  e.addEventListener("value-changed", () => {
    if (nested) return;
    nested = true;
    c.value = "2.00";
    c.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
  });
  e.addEventListener("input", () => { e.value = e.value; });
  c.value = "1.00";
  c.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
  expect(c.value).toBe("2.00");
  expect(e.value).toBe(2);
  // Same-value host writes after dispatch are authoritative in the same task.
  e.value = e.value;
  expect(c.value).toBe("2");
});

it("applies genuinely different writes from the original composed input callback", () => {
  const e = document.createElement("box-number-input") as Field;
  document.body.append(e);
  const c = control(e);
  c.focus();
  e.addEventListener("input", () => {
    e.value = e.value;
    e.value = 7;
    e.value = e.value;
  });
  c.value = "1.00";
  c.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
  expect(c.value).toBe("7");
  expect(e.value).toBe(7);
  expect(getMirroredFormValue(e.internals)).toBe("7");
});

describe("native capture-phase host policy", () => {
  for (const write of ["property", "attribute"]) {
    it(`treats same pre-edit public ${write} writes in capture as authoritative`, () => {
      const e = document.createElement("box-number-input") as Field;
      e.value = 1;
      document.body.append(e);
      const c = control(e);
      c.focus();
      const before: Array<[string | number, string]> = [];
      e.addEventListener("input", () => {
        before.push([e.value, c.value]);
        if (write === "property") e.value = e.value;
        else e.setAttribute("value", String(e.value));
      }, { capture: true });
      c.value = "2.00";
      c.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
      expect(before).toEqual([[1, "2.00"]]);
      expect(c.value).toBe("1");
      expect(e.value).toBe(1);
      expect(getMirroredFormValue(e.internals)).toBe("1");
    });
  }
  it("preserves genuinely different authoritative capture-phase writes", () => {
    const e = document.createElement("box-number-input") as Field;
    e.value = 1;
    document.body.append(e);
    const c = control(e);
    c.focus();
    e.addEventListener("input", () => { e.value = 7; }, { capture: true });
    c.value = "2.00";
    c.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
    expect(c.value).toBe("7");
    expect(e.value).toBe(7);
    expect(getMirroredFormValue(e.internals)).toBe("7");
  });
  it("preserves post-handler echoes while capture only observes pre-edit state", () => {
    const e = document.createElement("box-number-input") as Field;
    e.value = 1;
    document.body.append(e);
    const c = control(e);
    c.focus();
    const seen: Array<[string, string | number]> = [];
    e.addEventListener("input", () => { seen.push(["capture", e.value]); }, { capture: true });
    e.addEventListener("value-changed", () => { seen.push(["custom", e.value]); e.value = e.value; });
    e.addEventListener("input", () => { seen.push(["bubble", e.value]); e.value = e.value; });
    c.value = "2.00";
    c.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
    expect(seen).toEqual([["capture", 1], ["custom", 2], ["bubble", 2]]);
    expect(c.value).toBe("2.00");
    expect(e.value).toBe(2);
    expect(getMirroredFormValue(e.internals)).toBe("2");
  });
});
