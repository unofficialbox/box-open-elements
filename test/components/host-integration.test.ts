import { afterEach, describe, expect, it, vi } from "vitest";
import { TextField } from "../../src/components/forms/text-field.js";
import { Select } from "../../src/components/forms/select.js";
import { NumberInput } from "../../src/components/forms/number-input.js";
import { Checkbox } from "../../src/components/forms/checkbox.js";
import { Button } from "../../src/components/actions/button.js";
import { CodeBlock } from "../../src/components/output/code-block.js";
import { Accordion } from "../../src/components/navigation/accordion.js";
import { Combobox } from "../../src/components/forms/combobox.js";
import { TextArea } from "../../src/components/forms/text-area.js";

afterEach(() => document.body.replaceChildren());
describe("host integration regressions", () => {
  it.each([TextField, Select, NumberInput, Checkbox, Button].map(Control => [Control.tagName, Control] as const))("forwards public focus for %s", (_name, Control) => {
    const control = new Control(); document.body.append(control);
    control.focus({ preventScroll: true });
    expect(control.shadowRoot!.activeElement).toBe(control.shadowRoot!.querySelector("input,select,button"));
    const input = control.shadowRoot!.querySelector<HTMLElement>("input,select,button")!;
    control.setAttribute("disabled", "");
    const focus = vi.spyOn(input, "focus"); control.focus(); expect(focus).not.toHaveBeenCalled();
  });
  it("keeps form labels sentence case and uses an accessible control edge", () => {
    for (const Control of [Combobox, TextArea, TextField, Select, NumberInput]) {
      const control = new Control(); document.body.append(control);
      const css = control.shadowRoot!.querySelector("style")!.textContent!;
      expect(css).not.toContain("text-transform: uppercase");
      expect(css).toContain("--boe-control-edge");
    }
  });
  it("gives code scrolling a named keyboard target and focus ring", () => {
    const code = new CodeBlock(); code.language = "Go"; document.body.append(code);
    const pre = code.shadowRoot!.querySelector<HTMLElement>("pre")!;
    pre.focus(); expect(code.shadowRoot!.activeElement).toBe(pre);
    expect(pre.getAttribute("aria-label")).toBe("Go code");
    expect(code.shadowRoot!.querySelector("style")!.textContent).toContain('[part="pre"]:focus-visible');
  });
  it("uses button semantics for text actions", () => {
    const button = new Button(); button.tone = "text"; document.body.append(button);
    expect(button.shadowRoot!.querySelector("a")).toBeNull();
    expect(button.shadowRoot!.querySelector("button")!.dataset.tone).toBe("text");
  });
  it("supports independent panels, live escaped summaries and rich panel slots", () => {
    const accordion = new Accordion(); accordion.multiple = true;
    accordion.items = [{ value: "a", label: "Options", summary: "api.box.com" }, { value: "b", label: "Other hosts" }];
    document.body.append(accordion);
    const changed = vi.fn(); accordion.addEventListener("values-changed", changed);
    accordion.shadowRoot!.querySelectorAll<HTMLButtonElement>("button").forEach(button => button.click());
    expect(accordion.values).toEqual(["a", "b"]);
    expect(changed).toHaveBeenCalledTimes(2);
    expect(accordion.shadowRoot!.querySelectorAll('[part=panel]:not([hidden])')).toHaveLength(2);
    accordion.items = [{ value: "a", label: "Options", summary: "<script>" }, { value: "b", label: "Other hosts" }];
    expect(accordion.shadowRoot!.querySelector('[part=summary]')!.textContent).toBe("<script>");
    expect(accordion.values).toEqual(["a", "b"]);
    accordion.shadowRoot!.querySelector<HTMLButtonElement>("button")!.click();
    expect(accordion.values).toEqual(["b"]);
    expect(accordion.shadowRoot!.querySelector('slot[name="panel-b"]')).not.toBeNull();
  });
});
