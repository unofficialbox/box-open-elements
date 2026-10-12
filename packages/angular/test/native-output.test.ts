// @vitest-environment jsdom
import {ElementRef,EventEmitter} from "@angular/core";
import {describe,it,expect,vi} from "vitest";
import {NativeOutput} from "../src/native-output.js";
import {TextField,type ValueChangedEvent} from "../src/text-field.js";
describe("native relay compatibility",()=>{
 it("retains observer-object binding, manual emit/next and subscriptions after releasing the host",()=>{
  const host=vi.fn(()=>document.createElement("div"));const output=new NativeOutput<number>(host,"synthetic");
  const observer={values:[] as number[],next(value:number){this.values.push(value);}};output.subscribe(observer);
  output.emitNative(1);output.emit(2);output.next(3);expect(observer.values).toEqual([1,2,3]);
  output.releaseHost();host.mockClear();const later=vi.fn();output.subscribe(later);output.emit(4);expect(later).toHaveBeenCalledExactlyOnceWith(4);expect(host).not.toHaveBeenCalled();
 });
 it("preserves a subclass replacement emitter and its explicit emissions after directive teardown",()=>{
  class CustomField extends TextField {override readonly valueChanged=new EventEmitter<ValueChangedEvent>();}
  const host=document.createElement("box-text-field");const field=new CustomField(new ElementRef(host as never));const events=vi.fn();field.valueChanged.subscribe(events);
  const event=new CustomEvent("value-changed",{detail:{value:"synthetic"}});host.dispatchEvent(event);expect(events).toHaveBeenCalledExactlyOnceWith(event);
  field.ngOnDestroy();host.dispatchEvent(event);expect(events).toHaveBeenCalledTimes(1);field.valueChanged.emit(event);expect(events).toHaveBeenCalledTimes(2);
 });
});
