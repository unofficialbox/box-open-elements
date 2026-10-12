// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { Button } from "../../../src/components/actions/button.js";
Button.register();
afterEach(() => { vi.useRealTimers(); document.body.replaceChildren(); });
const setup = (type: "submit" | "reset") => {
 const form=document.createElement("form"), button=new Button(), input=document.createElement("input");
 input.name="q";input.defaultValue="Initial";input.value="Edited";button.type=type;form.append(input,button);document.body.append(form);
 const actions=vi.fn((e:Event)=>e.preventDefault());form.addEventListener(type,actions);
 return {form,button,input,native:button.shadowRoot!.querySelector("button")!,actions};
};
for(const type of ["submit","reset"] as const){
 it(`${type} honors host and outer ancestor click veto before form action`,async()=>{
  const {form,button,native,actions}=setup(type), veto=(e:Event)=>e.preventDefault();
  button.addEventListener("click",veto);native.click();await new Promise(resolve => setTimeout(resolve, 0));expect(actions).not.toHaveBeenCalled();
  button.removeEventListener("click",veto);form.addEventListener("click",veto);native.click();await new Promise(resolve => setTimeout(resolve, 0));expect(actions).not.toHaveBeenCalled();
  form.removeEventListener("click",veto);native.click();await new Promise(resolve => setTimeout(resolve, 0));expect(actions).toHaveBeenCalledTimes(1);
 });
 it(`${type} honors native-target cancellation without duplicate host clicks`,async()=>{
  const {button,native,actions}=setup(type), hostClick=vi.fn();button.addEventListener("click",hostClick);
  native.addEventListener("click",e=>e.preventDefault(),{once:true});native.click();await new Promise(resolve => setTimeout(resolve, 0));expect(actions).not.toHaveBeenCalled();expect(hostClick).toHaveBeenCalledTimes(1);
 });
 it(`${type} checks disabled/loading/removal changed by host handlers`,async()=>{
  const {button,native,actions}=setup(type);
  button.addEventListener("click",()=>button.disabled=true,{once:true});native.click();await new Promise(resolve => setTimeout(resolve, 0));expect(actions).not.toHaveBeenCalled();
  button.disabled=false;button.addEventListener("click",()=>button.isLoading=true,{once:true});native.click();await new Promise(resolve => setTimeout(resolve, 0));expect(actions).not.toHaveBeenCalled();
  button.isLoading=false;button.addEventListener("click",()=>button.remove(),{once:true});native.click();await new Promise(resolve => setTimeout(resolve, 0));expect(actions).not.toHaveBeenCalled();
 });
 it(`${type} keeps nested dispatch cancellation separate`,async()=>{
  const {button,native,actions}=setup(type);button.addEventListener("click",e=>{
   e.preventDefault();native.dispatchEvent(new MouseEvent("click",{bubbles:true,composed:true,cancelable:true}));
  },{once:true});native.click();await new Promise(resolve => setTimeout(resolve, 0));expect(actions).toHaveBeenCalledTimes(1);
 });
}
it("ordinary button remains action-free and stopPropagation alone does not cancel a form action",async()=>{
 const {button,native,actions}=setup("submit");button.type="button";native.click();await new Promise(resolve => setTimeout(resolve, 0));expect(actions).not.toHaveBeenCalled();
 button.type="submit";button.addEventListener("click",e=>e.stopPropagation());native.click();await new Promise(resolve => setTimeout(resolve, 0));expect(actions).toHaveBeenCalledTimes(1);
});
it("reset default cancellation preserves form data while an allowed reset restores it",async()=>{
 const {form,button,input,native,actions}=setup("reset");form.removeEventListener("reset",actions);
 const veto=(e:Event)=>e.preventDefault();button.addEventListener("click",veto);native.click();await new Promise(resolve => setTimeout(resolve, 0));expect(input.value).toBe("Edited");
 button.removeEventListener("click",veto);form.addEventListener("reset",veto,{once:true});native.click();await new Promise(resolve => setTimeout(resolve, 0));expect(input.value).toBe("Edited");
 native.click();await new Promise(resolve => setTimeout(resolve, 0));expect(input.value).toBe("Initial");
});

it("reconnecting during a click does not replay its old action",async()=>{
 const {form,button,native,actions}=setup("submit");button.addEventListener("click",()=>{button.remove();form.append(button);},{once:true});
 native.click();await new Promise(resolve=>setTimeout(resolve,0));expect(actions).not.toHaveBeenCalled();
 native.click();await new Promise(resolve=>setTimeout(resolve,0));expect(actions).toHaveBeenCalledTimes(1);
});

it("host type changes are applied after dispatch without duplicate clicks",async()=>{
 const {form,button,native,actions}=setup("submit");const reset=vi.fn((e:Event)=>e.preventDefault());form.addEventListener("reset",reset);
 button.addEventListener("click",()=>button.type="reset",{once:true});native.click();await new Promise(resolve=>setTimeout(resolve,0));
 expect(actions).not.toHaveBeenCalled();expect(reset).toHaveBeenCalledTimes(1);
});

for (const type of ["submit", "reset"] as const) {
 for (const sameButton of [true, false]) {
  it(`${type} suppresses bounded form-action reentry through ${sameButton ? "the same" : "another"} button`, () => {
   vi.useFakeTimers();const {form,button,native}=setup(type);const other=new Button();other.type=type;form.append(other);
   const repeated=sameButton?native:other.shadowRoot!.querySelector("button")!;let count=0;
   form.addEventListener(type,event=>{event.preventDefault();count++;if(count<3)repeated.click();});
   native.click();vi.runAllTimers();expect(count).toBe(1);
   native.click();vi.runAllTimers();expect(count).toBe(2);
  });
 }
 it(`${type} permits a separate form activation raised by a form listener`,()=>{
  vi.useFakeTimers();const first=setup(type),second=setup(type);let firstCount=0,secondCount=0;
  second.form.addEventListener(type,event=>{event.preventDefault();secondCount++;});
  first.form.addEventListener(type,event=>{event.preventDefault();firstCount++;second.native.click();});
  first.native.click();vi.runAllTimers();expect(firstCount).toBe(1);expect(secondCount).toBe(1);
 });
}

for (const type of ["submit", "reset"] as const) {
 it(`${type} does not fall back to an ancestor for an explicit missing form`,()=>{
  vi.useFakeTimers();const {button,native,actions}=setup(type);button.setAttribute("form","missing");
  native.click();vi.runAllTimers();expect(actions).not.toHaveBeenCalled();
  button.removeAttribute("form");native.click();vi.runAllTimers();expect(actions).toHaveBeenCalledTimes(1);
 });
 it(`${type} treats native internals null ownership as authoritative`,()=>{
  vi.useFakeTimers();const {form,button,native,actions}=setup(type);let owner:HTMLFormElement|null=null;
  Object.defineProperty((button as unknown as {internals:ElementInternals}).internals,"form",{get:()=>owner});
  native.click();vi.runAllTimers();expect(actions).not.toHaveBeenCalled();
  owner=form;native.click();vi.runAllTimers();expect(actions).toHaveBeenCalledTimes(1);
 });
 it(`${type} does not redirect to an ancestor when a click removes the external owner`,()=>{
  vi.useFakeTimers();const {button,native,actions}=setup(type),external=document.createElement("form"),owned=vi.fn((e:Event)=>e.preventDefault());
  external.id="external";external.addEventListener(type,owned);document.body.append(external);button.setAttribute("form","external");
  button.addEventListener("click",()=>external.remove(),{once:true});native.click();vi.runAllTimers();expect(actions).not.toHaveBeenCalled();expect(owned).not.toHaveBeenCalled();
  document.body.append(external);native.click();vi.runAllTimers();expect(actions).not.toHaveBeenCalled();expect(owned).toHaveBeenCalledTimes(1);
 });
}

for (const type of ["submit", "reset"] as const) {
 it(`${type} retains the reentry boundary when a nested click handler changes button type`,()=>{
  vi.useFakeTimers();const {form,native}=setup(type),other=new Button();other.type="button";form.append(other);let count=0;
  other.addEventListener("click",()=>other.type=type);
  form.addEventListener(type,event=>{event.preventDefault();count++;if(count<3){other.type="button";other.shadowRoot!.querySelector<HTMLButtonElement>("button")!.click();}});
  native.click();vi.runAllTimers();expect(count).toBe(1);
 });
}
