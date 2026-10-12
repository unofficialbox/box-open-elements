// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { Switch } from "../../../src/components/forms/switch.js";
import { LinkButton } from "../../../src/components/actions/link-button.js";
import { TextArea } from "../../../src/components/forms/text-area.js";
import { RangeSlider } from "../../../src/components/forms/range-slider.js";
Switch.register(); LinkButton.register(); TextArea.register(); RangeSlider.register();
afterEach(() => document.body.replaceChildren());
for (const label of ["R&D and Bob's alerts", '<img src=x onerror="bad">', 'Literal &amp; entity']) {
  it(`Switch retains its literal accessible name ${label}`, () => {
    const e = new Switch(); e.label = label; document.body.append(e);
    expect(e.shadowRoot!.querySelector('[role="switch"]')!.getAttribute("aria-label")).toBe(label);
    expect(e.shadowRoot!.querySelector('[part="label"]')!.textContent).toBe(label);
    expect(e.shadowRoot!.querySelector("img")).toBeNull();
  });
}
for (const href of ["/audit?a=one&b=two", "/audit?q=Bob's&literal=&amp;", '/audit?q="<tag>"']) {
  it(`LinkButton keeps validated DOM href literal ${href}`, () => {
    const e = new LinkButton(); e.href = href; e.label = '<b>Literal link</b>'; document.body.append(e);
    expect(e.shadowRoot!.querySelector("a")!.getAttribute("href")).toBe(href);
    expect(e.shadowRoot!.querySelector("b")).toBeNull();
  });
}
it("LinkButton still rejects unsafe schemes after normalization", () => {
  const e = new LinkButton(); document.body.append(e);
  for (const href of ["javascript:bad()", "java\nscript:bad()", "data:text/html,unsafe", "vbscript:bad()"]){
    e.href = href; expect(e.shadowRoot!.querySelector("a")!.getAttribute("href")).toBe("#");
  }
});
it("TextArea reflects required, description and hidden label without interpreting text", () => {
  const e = new TextArea(); e.label = "Summary & details"; e.description = '<b>Required help</b>'; e.required = true; e.hideLabel = true; document.body.append(e);
  const native = e.shadowRoot!.querySelector("textarea")!;
  expect(native.required).toBe(true); expect(native.getAttribute("aria-required")).toBe("true");
  const id = native.getAttribute("aria-describedby")!;
  expect(e.shadowRoot!.getElementById(id)!.textContent).toBe(e.description);
  expect(e.shadowRoot!.querySelector("b")).toBeNull();
  expect(e.shadowRoot!.getElementById(native.getAttribute("aria-labelledby")!)!.textContent).toContain(e.label);
  e.required = false; e.description = ""; e.hideLabel = false;
  expect(native.required).toBe(false); expect(native.hasAttribute("aria-describedby")).toBe(false);
});
it("RangeSlider gives both native thumbs distinct literal names through label changes", () => {
  const e = new RangeSlider(); e.label = "Budget & savings"; document.body.append(e);
  const inputs = Array.from(e.shadowRoot!.querySelectorAll("input"));
  expect(inputs.map(input => input.getAttribute("aria-label"))).toEqual(["Budget & savings start", "Budget & savings end"]);
  e.label = '<b>New range</b>';
  expect(inputs.map(input => input.getAttribute("aria-label"))).toEqual(['<b>New range</b> start','<b>New range</b> end']);
  expect(e.shadowRoot!.querySelector("b")).toBeNull();
});

it("TextArea attribute updates and reconnect retain literal descriptions and current editing caret", () => {
  const e = new TextArea(); document.body.append(e);
  const native = e.shadowRoot!.querySelector("textarea")!; native.focus(); native.value = "Editing draft"; native.setSelectionRange(3,3);
  e.setAttribute("description", "R&D &amp; <safe>"); e.setAttribute("required", ""); e.setAttribute("hide-label", "");
  expect(native.value).toBe("Editing draft"); expect(native.selectionStart).toBe(3);
  expect(e.shadowRoot!.getElementById(native.getAttribute("aria-describedby")!)!.textContent).toBe("R&D &amp; <safe>");
  e.remove(); document.body.append(e); expect(native.required).toBe(true);
  e.removeAttribute("description"); e.removeAttribute("required"); e.removeAttribute("hide-label");
  expect(native.hasAttribute("aria-describedby")).toBe(false); expect(native.required).toBe(false);
});
