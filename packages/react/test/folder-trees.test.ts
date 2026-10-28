import { afterEach, describe, expect, it, vi } from "vitest";
import { act, createElement, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import { FolderTree, type FolderTreeRef } from "../src/folder-tree.js";
import { FolderTreeDiff, type FolderTreeDiffRef } from "../src/folder-tree-diff.js";
import { NumberInput, type NumberInputRef } from "../src/number-input.js";
import { getMirroredFormValue } from "../../../src/core/index.js";
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT:boolean }).IS_REACT_ACT_ENVIRONMENT=true;
let root:Root;
afterEach(()=>{if(root)act(()=>root.unmount());document.body.replaceChildren();});
const setup=()=>{const host=document.createElement("div");document.body.append(host);root=createRoot(host);};
describe("React hierarchy wrappers",()=>{
  it.each([null, 6])("preserves the initial optional reset value %s across prop updates", initialValue => {
    setup();
    const ref = createRef<NumberInputRef>();
    const changed = vi.fn();
    act(() => root.render(createElement(NumberInput, { ref, value: initialValue, allowEmpty: true, onValueChanged: changed })));
    act(() => root.render(createElement(NumberInput, { ref, value: 8, allowEmpty: true, onValueChanged: changed })));
    // Omitting props must preserve the current imperative state and reset seed.
    act(() => root.render(createElement(NumberInput, { ref, onValueChanged: changed })));
    expect(ref.current!.allowEmpty).toBe(true);
    expect(ref.current!.value).toBe(8);
    act(() => ref.current!.formResetCallback());
    expect(ref.current!.value).toBe(initialValue);
    expect(ref.current!.shadowRoot!.querySelector("input")!.value).toBe(initialValue == null ? "" : String(initialValue));
    expect(getMirroredFormValue(ref.current!.internals)).toBe(initialValue == null ? null : String(initialValue));
    expect(changed).not.toHaveBeenCalled();
  });
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
