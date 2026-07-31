# @unofficialbox/box-open-elements-angular

Typed standalone Angular 20 directives for `box-open-elements`. Import
`Button`, `TextField`, `Select`, and `Dialog` in a standalone component to get
typed inputs, custom-event outputs, element access, and automatic registration.

```bash
npm install @unofficialbox/box-open-elements @unofficialbox/box-open-elements-angular @angular/core
```

```ts
import { Component } from "@angular/core";
import { Button, Select, TextField } from "@unofficialbox/box-open-elements-angular";

@Component({
  standalone: true,
  imports: [Button, Select, TextField],
  template: `<box-select [options]="options" (value-changed)="setStatus($event)" />`,
})
export class Example {
  options = [{ label: "Draft", value: "draft" }];
  setStatus(event: CustomEvent<{ value: string }>) {}
}
```

`createExplorerSelectionSignal(controller)` exposes the shared selection
controller as a scoped Angular signal. Version `0.1.0` is a release candidate;
Supported status follows the first public lockstep adapter release and clean
registry-install verification.
