// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { Fieldset } from "../../../src/components/forms/fieldset.js";
import { TextField } from "../../../src/components/forms/text-field.js";
import { TextArea } from "../../../src/components/forms/text-area.js";
Fieldset.register();TextField.register();TextArea.register();
afterEach(() => document.body.replaceChildren());
it("Fieldset reflects opt-in hidden legend and preserves existing uppercase default", () => {
  const e = new Fieldset(); e.label = "box-admin & settings"; document.body.append(e);
  expect(e.hideLabel).toBe(false); expect(e.labelCase).toBe("uppercase");
  const legend = e.shadowRoot!.querySelector("legend")!;
  e.hideLabel = true; e.labelCase = "preserve";
  expect(e.hasAttribute("hide-label")).toBe(true); expect(e.getAttribute("label-case")).toBe("preserve");
  expect(e.shadowRoot!.querySelector("legend")).toBe(legend); expect(legend.textContent).toBe(e.label);
  expect(legend.hidden).toBe(false); expect(legend.getAttribute("aria-hidden")).toBeNull();
  e.hideLabel = false; e.labelCase = "uppercase";
  expect(e.hasAttribute("hide-label")).toBe(false);
});
it("Fieldset attributes remain reflected through label updates and reconnect", () => {
  const e = new Fieldset(); e.setAttribute("hide-label",""); e.setAttribute("label-case","preserve"); e.label="Case & <literal>"; document.body.append(e);
  expect(e.hideLabel).toBe(true); expect(e.labelCase).toBe("preserve");
  e.remove(); document.body.append(e); e.label="new-id";
  expect(e.shadowRoot!.querySelector("legend")!.textContent).toBe("new-id");
  e.setAttribute("label-case","invalid"); expect(e.labelCase).toBe("uppercase");
});
for(const Constructor of [TextField,TextArea]){
  it(`${Constructor.tagName} reflects readonly without disabling or altering value`,()=>{
    const e=new Constructor(); e.value="Copy this text"; document.body.append(e);
    const native=e.shadowRoot!.querySelector<HTMLInputElement|HTMLTextAreaElement>("input,textarea")!;
    expect(e.readonly).toBe(false); e.readonly=true;
    expect(e.hasAttribute("readonly")).toBe(true); expect(native.readOnly).toBe(true); expect(native.disabled).toBe(false); expect(e.value).toBe("Copy this text");
    e.removeAttribute("readonly"); expect(e.readonly).toBe(false); expect(native.readOnly).toBe(false);
  });
  it(`${Constructor.tagName} selects current native text after connection with no queued preconnect action`,()=>{
    const e=new Constructor(); e.value="Synthetic summary"; e.readonly=true;
    expect(()=>e.select()).not.toThrow(); document.body.append(e);
    const native=e.shadowRoot!.querySelector<HTMLInputElement|HTMLTextAreaElement>("input,textarea")!;
    const select=vi.spyOn(native,"select"), changed=vi.fn(); e.addEventListener("value-changed",changed);
    e.select(); expect(e.shadowRoot!.activeElement).toBe(native); expect(native.selectionStart).toBe(0); expect(native.selectionEnd).toBe(native.value.length); expect(changed).not.toHaveBeenCalled();
    e.remove(); e.select(); expect(select).toHaveBeenCalledTimes(1);
    document.body.append(e); e.disabled=true; e.select(); expect(select).toHaveBeenCalledTimes(1);
  });
  it(`${Constructor.tagName} respects host focus handoff during select focus`,()=>{
    const e=new Constructor(),outside=document.createElement("button"); e.value="Summary"; document.body.append(e,outside);
    e.addEventListener("focusin",()=>outside.focus()); e.select(); expect(document.activeElement).toBe(outside);
  });
}

for(const Constructor of [TextField,TextArea]){
  it(`${Constructor.tagName} stops selection if a focus listener disables or detaches it`,()=>{
    const e=new Constructor(); e.value="Summary"; document.body.append(e);
    const native=e.shadowRoot!.querySelector<HTMLInputElement|HTMLTextAreaElement>("input,textarea")!, select=vi.spyOn(native,"select");
    e.addEventListener("focusin",()=>{e.disabled=true;},{once:true}); e.select(); expect(select).not.toHaveBeenCalled();
    e.disabled=false; e.addEventListener("focusin",()=>{e.remove();},{once:true}); native.blur(); e.select(); expect(select).not.toHaveBeenCalled();
  });
}
it("TextField select keeps native unsupported-type behavior without throwing",()=>{
  const e=new TextField(); e.type="number"; e.value="123"; e.readonly=true; document.body.append(e);
  expect(()=>e.select()).not.toThrow(); expect(e.value).toBe("123"); expect(e.shadowRoot!.querySelector("input")!.readOnly).toBe(true);
});
