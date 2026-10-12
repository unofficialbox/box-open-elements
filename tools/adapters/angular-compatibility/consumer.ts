import "@angular/compiler";
import {
  Component, Renderer2, VERSION, ViewChild, enableProdMode, inject,
  provideZonelessChangeDetection,
} from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { Dialog, Select, TextField } from "@unofficialbox/box-open-elements-angular";

declare global { interface Window { compatibilityReady: Promise<unknown>; production: boolean; } }
if (window.production) enableProdMode();

@Component({
  selector: "compatibility-app", standalone: true, imports: [TextField, Select, Dialog],
  template: `<box-text-field (value-changed)="record('field', $event)"></box-text-field>
    <box-select (value-changed)="record('select', $event)"></box-select>
    <box-dialog (open-changed)="record('open', $event)" (confirm)="record('confirm', $event)"
      (cancel)="record('cancel', $event)"></box-dialog>`,
})
class Consumer {
  renderer = inject(Renderer2);
  @ViewChild(TextField) field!: TextField;
  @ViewChild(Select) select!: Select;
  @ViewChild(Dialog) dialog!: Dialog;
  records: Record<string, Event[]> = {};
  record(kind: string, event: Event): void { (this.records[kind] ??= []).push(event); }
}

window.compatibilityReady = bootstrapApplication(Consumer, {
  providers: [provideZonelessChangeDetection()],
}).then(app => {
  const instance = app.components[0]!.instance as Consumer;
  const routes = [
    ["field", instance.field, "valueChanged", "value-changed", { value: "synthetic" }],
    ["select", instance.select, "valueChanged", "value-changed", { value: "synthetic" }],
    ["open", instance.dialog, "openChanged", "open-changed", { open: false }],
    ["confirm", instance.dialog, "confirm", "confirm", null],
    ["cancel", instance.dialog, "cancel", "cancel", null],
  ] as const;
  const reports: unknown[] = [];
  const cleanups: Array<() => void> = [];
  const retained: Array<{ kind: string; host: HTMLElement; output: any; event: CustomEvent;
    program: Event[]; native: Event[]; renderer: Event[]; unsubscribe: () => void }> = [];
  const check = (condition: boolean, message: string): void => { if (!condition) throw new Error(message); };
  for (const [kind, directive, property, name, detail] of routes) {
    const host = directive.element;
    const output = (directive as any)[property];
    const native: Event[] = [], renderer: Event[] = [], program: Event[] = [];
    const observe = (event: Event) => native.push(event);
    host.addEventListener(name, observe);
    cleanups.push(() => host.removeEventListener(name, observe));
    cleanups.push(instance.renderer.listen(host, name, (event: Event) => { renderer.push(event); }));
    const subscription = output.subscribe((event: Event) => program.push(event));
    const event = new CustomEvent(name, { detail, bubbles: true, composed: true });
    // Reusing the identical object must still count as two independent dispatches.
    host.dispatchEvent(event); host.dispatchEvent(event);
    check(instance.records[kind]!.length === 2 && program.length === 2 && native.length === 2 && renderer.length === 2, `${kind}: native delivery`);
    check([...instance.records[kind]!, ...program, ...native, ...renderer].every(value => value === event), `${kind}: original CustomEvent identity`);
    output.emit(event); output.next(event);
    check(instance.records[kind]!.length === 4 && program.length === 4 && native.length === 2 && renderer.length === 2, `${kind}: explicit emit/next`);
    let nested = false;
    const reentry = output.subscribe(() => {
      if (nested) return;
      nested = true;
      output.emit(event); output.next(event);
      // DOM forbids redispatching an event while that same event is dispatching.
      host.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
    });
    host.dispatchEvent(event); reentry.unsubscribe();
    check(instance.records[kind]!.length === 8 && program.length === 8 && native.length === 4 && renderer.length === 4, `${kind}: nested explicit/native delivery`);
    reports.push({ kind, native: native.length, renderer: renderer.length, template: instance.records[kind]!.length, program: program.length });
    retained.push({ kind, host, output, event, native, renderer, program, unsubscribe: () => subscription.unsubscribe() });
  }
  app.destroy();
  for (const route of retained) {
    route.host.dispatchEvent(route.event);
    check(instance.records[route.kind]!.length === 8 && route.program.length === 8 && route.native.length === 5 && route.renderer.length === 5, `${route.kind}: directive/template teardown, caller DOM observers survive`);
    route.output.emit(route.event); route.output.next(route.event);
    check(instance.records[route.kind]!.length === 8 && route.program.length === 10, `${route.kind}: caller stream survives teardown`);
    route.unsubscribe(); route.output.emit(route.event);
    check(route.program.length === 10, `${route.kind}: caller unsubscribe`);
  }
  cleanups.forEach(cleanup => cleanup());
  for (const route of retained) {
    route.host.dispatchEvent(route.event);
    check(route.native.length === 5 && route.renderer.length === 5, `${route.kind}: observer cleanup`);
  }
  return { angularVersion: VERSION.full, production: window.production, routes: reports, teardown: "passed" };
});
