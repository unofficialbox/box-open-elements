import {describe,it,expect,vi} from "vitest";
import {InviteCollaboratorsController} from "../../../src/patterns/share/invite-collaborators-controller.js";
import type {InviteResult} from "../../../src/patterns/share/invite-collaborators-contracts.js";
const deferred=()=>{let resolve!:(result:InviteResult)=>void,reject!:(error:Error)=>void;const promise=new Promise<InviteResult>((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const create=(sendInvites:()=>Promise<InviteResult>)=>new InviteCollaboratorsController({itemId:"synthetic",transport:{sendInvites}});
const A="a@example.test",B="b@example.test";
describe("direct InviteController reset ownership",()=>{
 it.each(["resolve","reject"])("ignores old %s after reset and new recipients",async outcome=>{
  const old=deferred();const c=create(()=>old.promise);c.addRecipient(A);const submitted=vi.fn(),error=vi.fn();c.subscribe("submitted",submitted);c.subscribe("error",error);
  const request=c.submit();c.reset();c.addRecipient(B);const before=c.getState();
  if(outcome==="resolve")old.resolve({invited:[A]});else old.reject(new Error("Synthetic old failure"));
  expect(await request).toBe(false);expect(c.getState()).toBe(before);expect(before).toMatchObject({recipients:[B],status:"idle",error:null,result:null});expect(submitted).not.toHaveBeenCalled();expect(error).not.toHaveBeenCalled();
 });
 it.each(["resolve","reject"])("keeps a new submission active while old %s settles",async outcome=>{
  const old=deferred(),fresh=deferred();const send=vi.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(fresh.promise);const c=create(send);c.addRecipient(A);const first=c.submit();c.reset();c.addRecipient(B);const second=c.submit();const submitted=vi.fn();c.subscribe("submitted",submitted);
  if(outcome==="resolve")old.resolve({invited:[A]});else old.reject(new Error("Old"));expect(await first).toBe(false);expect(c.getState()).toMatchObject({recipients:[B],status:"submitting",error:null,result:null});
  fresh.resolve({invited:[B]});expect(await second).toBe(true);expect(submitted).toHaveBeenCalledExactlyOnceWith({result:{invited:[B]}});
 });
 it("does not send an obsolete request after a synchronous submitting listener resets",async()=>{
  const send=vi.fn(async()=>({invited:[A]}));const c=create(send);c.addRecipient(A);let reset=false;c.subscribe("stateChanged",({state})=>{if(state.status==="submitting"&&!reset){reset=true;c.reset();c.addRecipient(B);}});
  expect(await c.submit()).toBe(false);expect(send).not.toHaveBeenCalled();expect(c.getState()).toMatchObject({recipients:[B],status:"idle",result:null});
 });
 it.each(["success","error"])("does not emit obsolete terminal %s after state listener reentry",async outcome=>{
  const old=deferred(),fresh=deferred();const send=vi.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(fresh.promise);const c=create(send);c.addRecipient(A);let next:Promise<boolean>|undefined;
  c.subscribe("stateChanged",({state})=>{if(state.status===outcome){c.reset();c.addRecipient(B);next=c.submit();}});const submitted=vi.fn(),error=vi.fn();c.subscribe("submitted",submitted);c.subscribe("error",error);const first=c.submit();
  if(outcome==="success")old.resolve({invited:[A]});else old.reject(new Error("Old"));expect(await first).toBe(false);expect(submitted).not.toHaveBeenCalled();expect(error).not.toHaveBeenCalled();expect(c.getState()).toMatchObject({recipients:[B],status:"submitting",error:null,result:null});
  // Stop reentry before the legitimate new terminal state.
  c.destroy();fresh.resolve({invited:[B]});expect(await next).toBe(true);
 });
 it("snapshots the submitted input before synchronous state observers edit form data",async()=>{
  const send=vi.fn(async()=>({invited:[A]}));const c=create(send);c.addRecipient(A);c.setMessage("Synthetic A");
  c.subscribe("stateChanged",({state})=>{if(state.status==="submitting"&&state.message==="Synthetic A"){c.addRecipient(B);c.setMessage("Synthetic B");c.setRole("viewer");}});
  expect(await c.submit()).toBe(true);expect(send).toHaveBeenCalledExactlyOnceWith({itemId:"synthetic",recipients:[A],role:"editor",message:"Synthetic A"});
 });
 it.each(["success","error"])("preserves legitimate current %s behavior",async outcome=>{
  const c=create(async()=>{if(outcome==="error")throw new Error("Current failure");return{invited:[A]};});c.addRecipient(A);const submitted=vi.fn(),error=vi.fn();c.subscribe("submitted",submitted);c.subscribe("error",error);
  expect(await c.submit()).toBe(outcome==="success");expect(c.getState().status).toBe(outcome);expect(outcome==="success"?submitted:error).toHaveBeenCalledTimes(1);
 });
 it("preserves destroyed-listener cleanup without inventing permanent disposal",async()=>{
  const old=deferred();const c=create(()=>old.promise);c.addRecipient(A);const changed=vi.fn(),submitted=vi.fn();c.subscribe("stateChanged",changed);c.subscribe("submitted",submitted);const request=c.submit();c.destroy();changed.mockClear();old.resolve({invited:[A]});await request;expect(changed).not.toHaveBeenCalled();expect(submitted).not.toHaveBeenCalled();
 });
});
