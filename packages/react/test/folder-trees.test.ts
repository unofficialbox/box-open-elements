import { afterEach, describe, expect, it, vi } from "vitest";
import { act, createElement, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { FolderTree, type FolderTreeRef } from "../src/folder-tree.js";
import { FolderTreeDiff, type FolderTreeDiffRef } from "../src/folder-tree-diff.js";
import { NumberInput, type NumberInputRef } from "../src/number-input.js";
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT:boolean }).IS_REACT_ACT_ENVIRONMENT=true;
let root:Root;
afterEach(()=>{if(root)act(()=>root.unmount());document.body.replaceChildren();});
const setup=()=>{const host=document.createElement("div");document.body.append(host);root=createRoot(host);};
describe("React hierarchy wrappers",()=>{
  it("synchronizes nullable optional values in the correct order and forwards clear events",()=>{
    setup();const ref=createRef<NumberInputRef>();const changed=vi.fn();
    act(()=>root.render(createElement(NumberInput,{ref,allowEmpty:true,value:null,placeholder:"No minimum",onValueChanged:changed})));
    expect(ref.current!.value).toBeNull();expect(ref.current!.allowEmpty).toBe(true);
    const input=ref.current!.shadowRoot!.querySelector("input")!;
    act(()=>{input.value="2";input.dispatchEvent(new Event("input",{bubbles:true}));input.value="";input.dispatchEvent(new Event("input",{bubbles:true}));});expect(changed.mock.calls.at(-1)![0].detail.value).toBeNull();
    act(()=>root.render(createElement(NumberInput,{ref,allowEmpty:true,value:8})));expect(input.value).toBe("8");
  });
  it("forwards real tree selection and activation, ref, controlled state, and latest handlers",()=>{
    setup();const ref=createRef<FolderTreeRef>();const selected=vi.fn();const activated=vi.fn();const nodes=[{id:"root",name:"Root",type:"folder" as const},{id:"file",parentId:"root",name:"File",type:"file" as const}];
    act(()=>root.render(createElement(FolderTree,{ref,nodes,expandedIds:["root"],selectedIds:["file"],activeId:"file",onSelectedChanged:selected,onItemActivated:activated})));
    expect(ref.current!.nodes).toHaveLength(2);ref.current!.focus();
    act(()=>{ref.current!.shadowRoot!.activeElement!.dispatchEvent(new KeyboardEvent("keydown",{key:" ",bubbles:true}));ref.current!.shadowRoot!.activeElement!.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));});
    expect(selected.mock.calls[0]![0].detail.node.id).toBe("file");expect(activated).toHaveBeenCalledOnce();
    const next=vi.fn();act(()=>root.render(createElement(FolderTree,{ref,onItemActivated:next})));expect(ref.current!.nodes).toHaveLength(2);
    act(()=>ref.current!.shadowRoot!.activeElement!.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true})));expect(next).toHaveBeenCalledOnce();expect(activated).toHaveBeenCalledOnce();
  });
  it("retains diff node payloads and synchronizes labels, filtering and modes",()=>{
    setup();const ref=createRef<FolderTreeDiffRef>();const fn=vi.fn();
    act(()=>root.render(createElement(FolderTreeDiff,{ref,nodes:[{id:"added",name:"Added",path:"/new",type:"folder",status:"added"}],mode:"side-by-side",leftLabel:"Old",rightLabel:"New",changesOnly:true,onDifferenceNavigated:fn})));
    act(()=>ref.current!.nextDifference());expect(fn.mock.calls[0]![0].detail.node.path).toBe("/new");expect(ref.current!.shadowRoot!.textContent).toContain("Not present");
  });
});

it.each([null, NaN, Infinity, -Infinity])("resets initially empty React value %s back to null after edits and rerenders",initial=>{
  setup();const ref=createRef<NumberInputRef>();
  act(()=>root.render(createElement("form",{},createElement(NumberInput,{ref,allowEmpty:true,value:initial,name:"minimum"}))));
  expect(ref.current!.value).toBeNull();
  act(()=>root.render(createElement("form",{},createElement(NumberInput,{ref,allowEmpty:true,value:7,name:"minimum"}))));
  act(()=>ref.current!.formResetCallback());
  expect(ref.current!.value).toBeNull();expect(ref.current!.shadowRoot!.querySelector("input")!.value).toBe("");
});
