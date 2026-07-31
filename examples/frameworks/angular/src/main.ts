import "zone.js";
import "@angular/compiler";
import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
} from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";

import { Button } from "@unofficialbox/box-open-elements/button";
import { Select } from "@unofficialbox/box-open-elements/select";
import "@unofficialbox/box-open-elements/text-field";
import {
  applyDesignTokens,
  registerBoxDefaultDesignSystem,
} from "@unofficialbox/box-open-elements/foundations/tokens";
import "../../shared.css";

registerBoxDefaultDesignSystem({ setActive: true });
applyDesignTokens(document.documentElement, "box-default");
Button.register();
Button.register();
Select.register();
Select.register();

@Component({
  selector: "adapter-validation",
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <main>
      <h1>Angular direct interop</h1>
      <div class="fields">
        <box-text-field
          data-testid="project-name"
          label="Project name"
          [value]="name"
          (value-changed)="setName($event)"
        ></box-text-field>
        <box-select
          #statusSelect
          data-testid="status"
          label="Status"
          [value]="status"
          [options]="options"
          [disabled]="saving"
          (value-changed)="setStatus($event)"
        ></box-select>
      </div>
      <box-button data-testid="save" label="Save" tone="primary" (click)="save()"></box-button>
      <p data-testid="state">{{ message }}</p>
    </main>
  `,
})
class AdapterValidationComponent implements AfterViewInit {
  @ViewChild("statusSelect", { read: ElementRef })
  private readonly statusSelect?: ElementRef<Select>;

  name = "Apollo";
  status = "draft";
  saving = false;
  message = "Ready";
  readonly options = [
    { label: "Draft", value: "draft" },
    { label: "Published", value: "published" },
  ];

  ngAfterViewInit(): void {
    if (this.statusSelect?.nativeElement.options.length !== this.options.length) {
      throw new Error("Angular did not assign structured options to box-select.");
    }
  }

  setName(event: Event): void {
    this.name = (event as CustomEvent<{ value: string }>).detail.value;
  }

  setStatus(event: Event): void {
    this.status = (event as CustomEvent<{ value: string }>).detail.value;
  }

  save(): void {
    this.message = `Saved ${this.name} as ${this.status}`;
  }
}

void bootstrapApplication(AdapterValidationComponent);
