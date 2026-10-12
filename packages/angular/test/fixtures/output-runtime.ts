import "@angular/compiler";
import {Component,ViewChild,provideZonelessChangeDetection} from "@angular/core";
import {bootstrapApplication} from "@angular/platform-browser";
import {TextField} from "../../src/index.js";
@Component({selector:"audit-output-runtime",standalone:true,imports:[TextField],template:`<box-text-field (value-changed)="record($event)"></box-text-field>`})
class OutputRuntimeConsumer {
 @ViewChild(TextField) field!:TextField;
 records:CustomEvent<{value:string}>[]=[];
 record(event:CustomEvent<{value:string}>):void {this.records.push(event);}
}
(window as any).templateReady=bootstrapApplication(OutputRuntimeConsumer,{providers:[provideZonelessChangeDetection()]}).then(app=>{
 const instance=app.components[0]!.instance as OutputRuntimeConsumer;const host=instance.field.element;
 const native:Event[]=[],program:Event[]=[];host.addEventListener("value-changed",e=>native.push(e));instance.field.valueChanged.subscribe(e=>program.push(e));
 return {instance,host,native,program,unmount:()=>app.destroy()};
});
