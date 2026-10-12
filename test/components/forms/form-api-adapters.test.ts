// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createApp, defineComponent, h, nextTick, ref, type App } from "vue";
import { ElementRef } from "@angular/core";
import { TextField as ReactTextField } from "../../../packages/react/src/text-field.js";
import { TextField as VueTextField } from "../../../packages/vue/src/text-field.js";
import { TextField as AngularTextField } from "../../../packages/angular/src/text-field.js";
import type { TextField } from "../../../src/components/forms/text-field.js";
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
let root:Root|undefined,app:App|undefined;
afterEach(async()=>{if(root)await act(()=>root!.unmount());app?.unmount();root=undefined;app=undefined;document.body.replaceChildren()});
it("React TextField forwards readonly and preserves omitted imperative readonly",async()=>{
 const host=document.createElement("div");document.body.append(host);root=createRoot(host);
 await act(()=>root!.render(createElement(ReactTextField,{readonly:true,value:"Summary"})));
 const e=host.querySelector("box-text-field") as TextField;
 expect(e.readonly).toBe(true);expect(e.shadowRoot!.querySelector("input")!.readOnly).toBe(true);
 await act(()=>root!.render(createElement(ReactTextField,{readonly:false,value:"Summary"})));expect(e.readonly).toBe(false);
 e.readonly=true;await act(()=>root!.render(createElement(ReactTextField,{label:"Updated",value:"Summary"})));expect(e.readonly).toBe(true);
});
it("Vue TextField forwards readonly true/false",async()=>{
 const host=document.createElement("div"),mode=ref(true);document.body.append(host);
 app=createApp(defineComponent({setup:()=>()=>h(VueTextField,{readonly:mode.value,value:"Summary"})}));app.mount(host);await nextTick();
 const e=host.querySelector("box-text-field") as TextField;
 expect(e.readonly).toBe(true);expect(e.shadowRoot!.querySelector("input")!.readOnly).toBe(true);
 mode.value=false;await nextTick();expect(e.readonly).toBe(false);
});
it("Angular TextField readonly input preserves native boolean attribute presence",()=>{
 const e=document.createElement("box-text-field") as TextField;document.body.append(e);
 const directive=new AngularTextField(new ElementRef(e));directive.readonly="";
 expect(e.readonly).toBe(true);expect(e.shadowRoot!.querySelector("input")!.readOnly).toBe(true);
 directive.readonly=false;expect(e.readonly).toBe(false);directive.readonly="false";expect(e.readonly).toBe(true);
 directive.ngOnDestroy();
});
