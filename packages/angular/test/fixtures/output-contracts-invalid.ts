import {Component} from "@angular/core";
import {Dialog,TextField} from "../../src/index.js";
@Component({selector:"audit-invalid-output-types",standalone:true,imports:[Dialog,TextField],template:`
<box-text-field (value-changed)="number($event)"></box-text-field>
<box-dialog (confirm)="text($event)"></box-dialog>`})
export class InvalidOutputContractsConsumer {
 number(event:CustomEvent<{value:number}>):void {void event.detail.value;}
 text(event:CustomEvent<string>):void {void event.detail;}
}
