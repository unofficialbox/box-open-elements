// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { Button } from "../../../src/components/actions/button.js";
Button.register();
afterEach(() => document.body.replaceChildren());
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
