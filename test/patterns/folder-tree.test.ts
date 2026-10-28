import { afterEach, describe, expect, it, vi } from "vitest";
import { FolderTree, FolderTreeDiff, indexTree, visibleRows } from "../../src/patterns/folder-tree/index.js";
import type { FolderTreeNode, FolderTreeDiffNode } from "../../src/patterns/folder-tree/types.js";
const nodes: FolderTreeNode[] = [
  { id:"root", name:"Root", type:"folder" },
  { id:"branch", parentId:"root", name:"Branch", type:"folder" },
  { id:"leaf", parentId:"branch", name:"Needle", type:"file" },
  { id:"other", name:"Reference", type:"web_link" },
  { id:"lazy", name:"Lazy", type:"folder", hasChildren:true, loadState:"unloaded" },
];
const mount = (items = nodes) => { const tree = new FolderTree(); tree.nodes = items; document.body.append(tree); return tree; };
const rows = (tree: FolderTree) => Array.from(tree.shadowRoot!.querySelectorAll<HTMLElement>('[role="treeitem"]'));
const key = (tree: FolderTree, value: string) => tree.shadowRoot!.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key:value, bubbles:true, cancelable:true }));
afterEach(() => document.body.replaceChildren());
describe("folder hierarchy", () => {
  it("opens only ancestors of included children while filtering", () => {
    const tree = mount();
    const load = vi.fn();
    tree.addEventListener("load-children", load);
    tree.filter = "Lazy";
    expect(rows(tree)[0]!.getAttribute("aria-expanded")).toBe("false");
    tree.focus();
    key(tree, "ArrowRight");
    expect(load).toHaveBeenCalledOnce();
    expect(rows(tree)[0]!.getAttribute("aria-expanded")).toBe("true");
    tree.filter = "Branch";
    expect(rows(tree).map(row => row.dataset.nodeId)).toEqual(["root", "branch"]);
    expect(rows(tree)[0]!.getAttribute("aria-expanded")).toBe("true");
    expect(rows(tree)[1]!.getAttribute("aria-expanded")).not.toBe("true");
    tree.filter = "Needle";
    expect(rows(tree)).toHaveLength(3);
    tree.focus();
    key(tree, "ArrowLeft");
    expect(rows(tree)).toHaveLength(1);
    tree.filter = "";
    expect(rows(tree)[0]!.getAttribute("aria-expanded")).toBe("false");
  });
  it("uses singular child metadata and preserves explicit metadata and missing counts", () => {
    const tree = mount([
      { id:"one", name:"One", type:"folder", childCount:1 },
      { id:"two", name:"Two", type:"folder", childCount:2 },
      { id:"zero", name:"Zero", type:"folder", childCount:0 },
      { id:"unknown", name:"Unknown", type:"folder", childCount:null },
      { id:"custom", name:"Custom", type:"folder", childCount:1, metadata:"Host summary" },
    ]);
    expect(rows(tree).map(row => row.querySelector('[part="metadata"]')?.textContent ?? "")).toEqual(["1 child", "2 children", "0 children", "", "Host summary"]);
  });
  it("announces only distinct notable load states from visible rows", () => {
    const tree = mount([
      { id:"root", name:"Root", type:"folder", loadState:"partial" },
      { id:"hidden", parentId:"root", name:"Hidden", type:"folder", loadState:"error" },
      ...(["loading", "error", "unavailable", "partial", "unloaded", "loaded"] as const).flatMap(loadState => [0, 1].map(i => ({ id:`${loadState}-${i}`, name:loadState, type:"folder" as const, hasChildren:true, loadState }))),
    ]);
    tree.partial = true;
    const live = () => tree.shadowRoot!.querySelector('[part="live"]')!.textContent!;
    expect(live()).toBe("13 visible items. Partial structure — more items may exist Partially loaded — more children may exist. Loading children. Could not load children. Collapse and expand to retry.. Children unavailable");
    expect(rows(tree).find(row => row.dataset.nodeId === "unloaded-0")!.getAttribute("aria-label")).toContain("Children not loaded");
    tree.filter = "Root";
    expect(live()).toBe("1 visible items. Partial structure — more items may exist Partially loaded — more children may exist");
  });
  it("renders only open descendants with position/depth semantics and one tab stop", () => {
    const tree = mount(); expect(rows(tree).map(el => el.dataset.nodeId)).toEqual(["root", "other", "lazy"]);
    tree.expandedIds = ["root", "branch"];
    expect(rows(tree)).toHaveLength(5);
    expect(rows(tree)[2]!.getAttribute("aria-level")).toBe("3");
    expect(rows(tree)[0]!.getAttribute("aria-setsize")).toBe("3");
    expect(rows(tree).filter(el => el.tabIndex === 0)).toHaveLength(1);
  });
  it("implements all keyboard commands and emits stable activation/selection payloads", () => {
    const tree = mount(); const activated = vi.fn(); const selected = vi.fn();
    tree.addEventListener("item-activated", activated); tree.addEventListener("selected-changed", selected);
    tree.focus(); key(tree,"ArrowRight"); expect(tree.expandedIds).toEqual(["root"]);
    key(tree,"ArrowRight"); expect(tree.activeId).toBe("branch");
    key(tree,"ArrowRight"); key(tree,"ArrowDown"); expect(tree.activeId).toBe("leaf");
    key(tree,"Enter"); key(tree," "); expect(tree.selectedIds).toEqual(["leaf"]);
    expect(activated.mock.calls[0]![0].detail.node.name).toBe("Needle"); expect(selected).toHaveBeenCalledOnce();
    key(tree,"ArrowLeft"); expect(tree.activeId).toBe("branch"); key(tree,"ArrowLeft"); expect(tree.expandedIds).toEqual(["root"]);
    key(tree,"End"); expect(tree.activeId).toBe("lazy"); key(tree,"ArrowUp"); expect(tree.activeId).toBe("other"); key(tree,"Home"); expect(tree.activeId).toBe("root");
  });
  it("preserves focused row identity through async loads and recovers to collapsed ancestors", () => {
    const tree = mount(); tree.expandedIds = ["root", "branch"]; tree.activeId = "leaf"; tree.focus();
    const leaf = tree.shadowRoot!.activeElement;
    tree.nodes = [...nodes, { id:"new", parentId:"branch", name:"New", type:"other" }];
    expect(tree.shadowRoot!.activeElement).toBe(leaf);
    tree.expandedIds = ["root"]; expect(tree.activeId).toBe("branch"); expect(tree.shadowRoot!.activeElement).toBe(rows(tree)[1]);
    tree.filter = "Reference"; expect(tree.activeId).toBe("other"); expect(tree.shadowRoot!.activeElement).toBe(rows(tree)[0]);
  });
  it("never steals focus from outside during data changes; empty focus recovers when data returns", () => {
    const button=document.createElement("button"); document.body.append(button); button.focus(); const tree=mount(); tree.expandedIds=["root"]; expect(document.activeElement).toBe(button);
    tree.nodes=[]; tree.shadowRoot!.querySelector<HTMLElement>('[role="tree"]')!.focus(); tree.nodes=nodes;
    expect(tree.shadowRoot!.activeElement).toBe(rows(tree)[0]);
  });
  it("requests lazy loading once, permits retry, preserves partial/error announcements", () => {
    const tree=mount(); const load=vi.fn(); tree.addEventListener("load-children",load); tree.activeId="lazy"; tree.focus(); key(tree,"ArrowRight");
    expect(load).toHaveBeenCalledOnce(); tree.nodes=nodes.map(n=>n.id==="lazy"?{...n,loadState:"loading"}:n);
    expect(tree.shadowRoot!.activeElement?.getAttribute("aria-busy")).toBe("true");
    tree.nodes=nodes.map(n=>n.id==="lazy"?{...n,loadState:"error"}:n); expect(tree.shadowRoot!.textContent).toContain("Could not load children");
    key(tree,"ArrowLeft"); key(tree,"ArrowRight"); expect(load).toHaveBeenCalledTimes(2);
    tree.partial=true; expect(tree.shadowRoot!.querySelector('[role="status"]')!.textContent).toContain("Partial structure");
  });
  it("allows authoritative host veto/echo and disabling selection", () => {
    const tree=mount(); tree.addEventListener("expanded-changed",()=>{tree.expandedIds=[];}); tree.focus(); key(tree,"ArrowRight"); expect(tree.expandedIds).toEqual([]);
    tree.selectionDisabled=true; key(tree," "); expect(tree.selectedIds).toEqual([]); expect(rows(tree)[0]!.hasAttribute("aria-selected")).toBe(false);
    tree.selectedIds=["other"]; tree.selectionDisabled=false; expect(rows(tree)[1]!.getAttribute("aria-selected")).toBe("true");
  });
  it("preserves ancestors for search, escapes untrusted names, exposes optional slots and empty states",()=>{
    const tree=mount(); tree.filter="Needle"; expect(rows(tree).map(el=>el.dataset.nodeId)).toEqual(["root","branch","leaf"]);
    tree.filter="nothing"; expect(rows(tree)).toHaveLength(0); expect(tree.shadowRoot!.textContent).toContain("No matching items");
    tree.filter=""; tree.nodes=[{id:'quote"<>',name:'<img src=x onerror=alert(1)>',type:"file",status:"Ready",metadata:"3 items"}];
    expect(tree.shadowRoot!.querySelector("img")).toBeNull(); expect(tree.shadowRoot!.querySelectorAll("slot")).toHaveLength(3);
    tree.unavailable=true; expect(tree.shadowRoot!.textContent).toContain("Structure unavailable");
  });
  it("rejects duplicate/cyclic snapshots atomically and handles deep/large trees iteratively",()=>{
    const tree=mount(); expect(()=>{tree.nodes=[nodes[0]!,nodes[0]!];}).toThrow("Duplicate"); expect(tree.nodes).toHaveLength(5);
    expect(()=>indexTree([{id:"a",parentId:"b",name:"A",type:"folder"},{id:"b",parentId:"a",name:"B",type:"folder"}])).toThrow("Cyclic");
    const many:FolderTreeNode[]=Array.from({length:10000},(_,i)=>({id:String(i),parentId:i?String(i-1):undefined,name:String(i),type:"folder"}));
    const index=indexTree(many); expect(visibleRows(index,new Set())).toHaveLength(1); expect(visibleRows(index,new Set(many.map(n=>n.id)))).toHaveLength(10000);
  });
});
const diffNodes:FolderTreeDiffNode[]=[
  {id:"root",name:"Root",type:"folder",path:"/",status:"equal"},
  ...(["added","removed","changed","moved","equal"] as const).map(status=>({id:status,parentId:"root",name:status,type:"file" as const,path:`/${status}`,status,before:{path:"/old"},after:{path:"/new"}})),
  {id:"partial",parentId:"root",name:"Partial",type:"folder",path:"/partial",status:"equal",hasChangedDescendants:true,hasChildren:true,loadState:"partial"},
];
describe("structural diff",()=>{
  const mountDiff=()=>{const tree=new FolderTreeDiff();tree.nodes=diffNodes;document.body.append(tree);return tree;};
  it("auto expands changed ancestors, counts statuses, renders all states and moved paths",()=>{
    const tree=mountDiff();expect(tree.expandedIds).toContain("root");expect(rows(tree)).toHaveLength(7);expect(tree.counts).toEqual({equal:3,changed:1,added:1,removed:1,moved:1});
    expect(tree.shadowRoot!.textContent).toContain("/old → /new"); expect(tree.shadowRoot!.textContent).toContain("Partially loaded");
  });
  it("aligns both sides in a coherent tree row with explicit missing-side labels",()=>{
    const tree=mountDiff();tree.mode="side-by-side";tree.leftLabel="Production";tree.rightLabel="Staging";
    expect(tree.shadowRoot!.querySelectorAll('[role="tree"]')).toHaveLength(1);
    for(const row of rows(tree)) expect(row.querySelectorAll('[part="side"]')).toHaveLength(2);
    const added=rows(tree).find(row=>row.dataset.nodeId==="added")!;
    expect(added.querySelector('[data-side="before"]')!.textContent).toContain("Not present");expect(added.getAttribute("aria-label")).toContain("Staging only");
    expect(rows(tree).find(row=>row.dataset.nodeId==="removed")!.getAttribute("aria-label")).toContain("Production only");
  });
  it("filters changes with ancestor context and navigation expands hidden ancestors and wraps",()=>{
    const tree=mountDiff();tree.changesOnly=true;expect(rows(tree).map(r=>r.dataset.nodeId)).not.toContain("equal");
    tree.expandedIds=[];tree.nextDifference();expect(tree.activeId).toBe("added");expect(tree.expandedIds).toContain("root");
    tree.nextDifference(-1);expect(tree.activeId).toBe("moved");tree.nextDifference();expect(tree.activeId).toBe("added");
    tree.filter="changed";tree.nextDifference();expect(tree.activeId).toBe("changed");
  });
  it("respects explicit controlled expansion, preserves removed/added children and selected diff payloads",()=>{
    const tree=new FolderTreeDiff();tree.expandedIds=[];tree.nodes=[...diffNodes,{id:"child",parentId:"added",name:"Child",type:"file",path:"/added/child",status:"added"}];document.body.append(tree);expect(rows(tree)).toHaveLength(1);
    tree.expandedIds=["root","added"];expect(rows(tree).map(r=>r.dataset.nodeId)).toContain("child"); const fn=vi.fn();tree.addEventListener("selected-changed",fn);tree.activeId="child";tree.focus();key(tree," ");expect(fn.mock.calls[0]![0].detail.node.path).toBe("/added/child");
    tree.partial=true;expect(tree.shadowRoot!.textContent).toContain("Loaded items:");
  });
});

describe("review regressions",()=>{
  it("collapses searched ancestors and recovers focus on empty results",()=>{
    const tree=mount();tree.filter="Needle";tree.focus();key(tree,"ArrowLeft");expect(rows(tree)).toHaveLength(1);expect(rows(tree)[0]!.getAttribute("aria-expanded")).toBe("false");
    key(tree,"ArrowRight");expect(rows(tree)).toHaveLength(3);tree.filter="missing";expect(tree.shadowRoot!.activeElement?.getAttribute("role")).toBe("tree");
  });
  it("moves in-widget focus on controlled active updates and lets host veto active intent",()=>{
    const tree=mount();tree.focus();tree.activeId="other";expect(tree.shadowRoot!.activeElement?.getAttribute("data-node-id")).toBe("other");
    tree.addEventListener("active-changed",()=>{tree.activeId="root";});key(tree,"ArrowDown");expect(tree.activeId).toBe("root");expect(tree.shadowRoot!.activeElement?.getAttribute("data-node-id")).toBe("root");
  });
  it("renders actual file glyphs and permits collapsing changes-only context",()=>{
    const tree=mount([{id:"file",name:"File",type:"file"}]);expect(tree.shadowRoot!.querySelector('[part="icon"] svg')).not.toBeNull();
    const diff=new FolderTreeDiff();diff.nodes=diffNodes;diff.changesOnly=true;document.body.append(diff);diff.focus();key(diff,"ArrowLeft");expect(rows(diff)).toHaveLength(1);
  });
});

it("honors filtered host expansion veto and echo",()=>{
  const tree=mount();tree.filter="Needle";tree.focus();const veto=()=>{tree.expandedIds=["root"];};tree.addEventListener("expanded-changed",veto);key(tree,"ArrowLeft");expect(rows(tree)[0]!.getAttribute("aria-expanded")).toBe("true");
  tree.removeEventListener("expanded-changed",veto);tree.addEventListener("expanded-changed",()=>{tree.expandedIds=[];});key(tree,"ArrowLeft");expect(rows(tree)).toHaveLength(1);expect(rows(tree)[0]!.getAttribute("aria-expanded")).toBe("false");
});
it("navigates hierarchy order, announces expansion intent, and expands new changed snapshots",()=>{
  const tree=new FolderTreeDiff();const initial:FolderTreeDiffNode[]=[{id:"r",name:"Root",path:"/",type:"folder",status:"equal"},{id:"f",parentId:"r",name:"Folder",path:"/f",type:"folder",status:"equal"},{id:"s",parentId:"r",name:"Sibling",path:"/s",type:"file",status:"equal"},{id:"d",parentId:"f",name:"Deep",path:"/f/d",type:"file",status:"equal"}];
  tree.nodes=initial;document.body.append(tree);tree.nodes=initial.map(n=>n.id==="s"||n.id==="d"?{...n,status:"changed"}:n);expect(tree.expandedIds).toContain("f");
  tree.expandedIds=[];const expanded=vi.fn();tree.addEventListener("expanded-changed",expanded);tree.nextDifference();expect(tree.activeId).toBe("d");expect(expanded).toHaveBeenCalledOnce();
  tree.expandedIds=[];tree.addEventListener("expanded-changed",()=>{tree.expandedIds=[];});const navigated=vi.fn();tree.addEventListener("difference-navigated",navigated);tree.nextDifference();expect(navigated).not.toHaveBeenCalled();
});

it("difference navigation reopens ancestors collapsed under search",()=>{
  const tree=new FolderTreeDiff();tree.nodes=diffNodes;document.body.append(tree);tree.filter="changed";tree.focus();key(tree,"ArrowLeft");expect(rows(tree)).toHaveLength(1);tree.nextDifference();expect(tree.activeId).toBe("changed");expect(rows(tree)).toHaveLength(2);
});

it("does not announce filtered-out descendants as an expanded folder",()=>{
  const tree=mount();tree.filter="Branch";
  const branch=rows(tree).find(row=>row.dataset.nodeId==="branch")!;
  expect(branch.hasAttribute("aria-expanded")).toBe(false);
  tree.expandedIds=["root","branch"];
  expect(branch.hasAttribute("aria-expanded")).toBe(false);
  tree.activeId="branch";tree.focus();key(tree,"ArrowRight");expect(rows(tree)).toHaveLength(2);
});
it("keeps aggregate load announcements bounded and avoids repeating unloaded state",()=>{
  const items:FolderTreeNode[]=Array.from({length:30},(_,i)=>({id:String(i),name:`Folder ${i}`,type:"folder",hasChildren:true,loadState:"unloaded"}));
  const tree=mount(items);const live=()=>tree.shadowRoot!.querySelector('[role="status"]')!.textContent!;
  expect(live()).not.toContain("Children not loaded");
  tree.nodes=items.map((n,i)=>({...n,loadState:i<15?"loading":"error"}));
  expect(live().match(/Loading children/g)).toHaveLength(1);expect(live().match(/Could not load children/g)).toHaveLength(1);
});
it("shares singular child metadata between visible text and the row announcement",()=>{
  const tree=mount([{id:"one",name:"One",type:"folder",childCount:1}]);
  expect(rows(tree)[0]!.querySelector('[part="metadata"]')!.textContent).toBe("1 child");expect(rows(tree)[0]!.getAttribute("aria-label")).toContain("1 child");
});
it("preserves glyph DOM on state updates and replaces it when file type changes",()=>{
  const tree=mount([{id:"a",name:"A",type:"file"}]);const glyph=tree.shadowRoot!.querySelector('[part="icon"] svg');
  tree.selectedIds=["a"];expect(tree.shadowRoot!.querySelector('[part="icon"] svg')).toBe(glyph);
  tree.nodes=[{id:"a",name:"A",type:"folder"}];expect(tree.shadowRoot!.querySelector('[part="icon"] svg')).not.toBe(glyph);
});
