import {Component} from "@angular/core";
import {Button,Dialog,Select,TextField} from "../../src/index.js";
@Component({selector:"audit-output-types",standalone:true,imports:[Button,Dialog,Select,TextField],template:`
<box-text-field (value-changed)="value($event)"></box-text-field>
<box-select [options]="options" (value-changed)="value($event)"></box-select>
<box-dialog (open-changed)="open($event)" (confirm)="action($event)" (cancel)="action($event)"></box-dialog>
<box-button (click)="click($event)"></box-button>`})
export class OutputContractsConsumer {
 options=[{label:"Synthetic",value:"a"}];
 value(event:CustomEvent<{value:string}>):void {void event.detail.value;}
 open(event:CustomEvent<{open:boolean}>):void {void event.detail.open;}
 action(event:CustomEvent<null>):void {void event.detail;}
 click(event:MouseEvent):void {void event.button;}
}
