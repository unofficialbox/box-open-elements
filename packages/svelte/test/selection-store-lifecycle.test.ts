import {describe,it,expect,vi} from "vitest";
import {ExplorerSelectionController,createExplorerSelectionStore} from "../src/explorer-selection.js";
describe("lazy Svelte selection snapshots",()=>{
 it("reads current state at first subscribe and each reconnect, retaining lazy single ownership",()=>{
  const c=new ExplorerSelectionController();c.setItems([{id:"a"},{id:"b"}]);const subscribe=vi.spyOn(c,"subscribe");const store=createExplorerSelectionStore(c);
  expect(subscribe).not.toHaveBeenCalled();c.select(["a"]);const first=vi.fn(),second=vi.fn();const stopA=store.subscribe(first),stopB=store.subscribe(second);
  expect(first.mock.calls[0]![0].selectedItemIds).toEqual(["a"]);expect(second.mock.calls[0]![0].selectedItemIds).toEqual(["a"]);expect(subscribe).toHaveBeenCalledTimes(1);
  c.select(["b"]);expect(first.mock.calls.at(-1)![0].selectedItemIds).toEqual(["b"]);stopA();stopB();const calls=first.mock.calls.length;c.select(["a"]);expect(first).toHaveBeenCalledTimes(calls);
  const next=vi.fn();const stop=store.subscribe(next);expect(next.mock.calls[0]![0].selectedItemIds).toEqual(["a"]);expect(subscribe).toHaveBeenCalledTimes(2);stop();
 });
});
