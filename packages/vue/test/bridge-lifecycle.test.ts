// @vitest-environment jsdom
import {createApp,h,nextTick,ref} from "vue";
import {describe,it,expect,vi} from "vitest";
import {useWebComponent} from "../src/adapter.js";
describe("generic Vue host event ownership",()=>{
 it("moves listeners to ref replacements and removes old/current listeners at unmount",async()=>{
  const container=document.createElement("div");document.body.append(container);const phase=ref(0);const handler=vi.fn();let host!:ReturnType<typeof useWebComponent<HTMLElement>>;
  const app=createApp({setup(){host=useWebComponent<HTMLElement>(e=>e.dataset.phase=String(phase.value),[{eventName:"click",listener:handler}]);return()=>h("div",{key:phase.value,ref:host},"Synthetic");}});app.mount(container);await nextTick();
  const old=host.value!;old.click();expect(handler).toHaveBeenCalledTimes(1);phase.value=1;await nextTick();const current=host.value!;
  current.click();old.click();expect(handler).toHaveBeenCalledTimes(2);expect(current.dataset.phase).toBe("1");
  phase.value=2;await nextTick();const final=host.value!;current.click();final.click();expect(handler).toHaveBeenCalledTimes(3);
  app.unmount();old.click();current.click();final.click();expect(handler).toHaveBeenCalledTimes(3);container.remove();
 });
 it("keeps one event listener when reactive property sync updates the same ref",async()=>{
  const container=document.createElement("div");document.body.append(container);const label=ref("A");const handler=vi.fn();let host!:ReturnType<typeof useWebComponent<HTMLElement>>;
  const app=createApp({setup(){host=useWebComponent<HTMLElement>(e=>e.title=label.value,[{eventName:"click",listener:handler}]);return()=>h("div",{ref:host});}});app.mount(container);await nextTick();const original=host.value!;
  label.value="B";await nextTick();expect(host.value).toBe(original);original.click();expect(handler).toHaveBeenCalledTimes(1);expect(original.title).toBe("B");app.unmount();container.remove();
 });
});
