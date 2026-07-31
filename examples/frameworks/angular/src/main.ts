import "zone.js";
import "@angular/compiler";
import { Component } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";

import {
  Button,
  Dialog,
  Select,
  TextField,
  createExplorerSelectionSignal,
} from "@unofficialbox/box-open-elements-angular";
import {
  applyDesignTokens,
  registerBoxDefaultDesignSystem,
} from "@unofficialbox/box-open-elements/foundations/tokens";
import { ExplorerSelectionController } from "@unofficialbox/box-open-elements/patterns/content-explorer/selection";
import "../../shared.css";

registerBoxDefaultDesignSystem({ setActive: true });
applyDesignTokens(document.documentElement, "box-default");

const createSelectionController = (): ExplorerSelectionController => {
  const controller = new ExplorerSelectionController();
  controller.setItems([{ id: "alpha" }, { id: "beta" }]);
  return controller;
};

@Component({
  selector: "adapter-validation",
  standalone: true,
  imports: [Button, Dialog, Select, TextField],
  template: `
    <main>
      <h1>Angular adapter interop</h1>
      <p data-testid="selection">
        Selected: {{ selection().selectedItemIds.join(", ") || "None" }}
      </p>
      <div class="fields">
        <box-text-field
          data-testid="project-name"
          label="Project name"
          [value]="name"
          (value-changed)="setName($event)"
        ></box-text-field>
        <box-select
          data-testid="status"
          label="Status"
          [value]="status"
          [options]="options"
          [disabled]="saving"
          (value-changed)="setStatus($event)"
        ></box-select>
      </div>
      <div class="actions">
        <box-button
          data-testid="toggle-alpha"
          label="Toggle Alpha"
          tone="neutral"
          (click)="toggleAlpha()"
        ></box-button>
        <box-button
          data-testid="open-dialog"
          label="Open dialog"
          tone="primary"
          (click)="dialogOpen = true"
        ></box-button>
        <box-button data-testid="save" label="Save" tone="primary" (click)="save()"></box-button>
      </div>
      <p data-testid="state">{{ message }}</p>
      <box-dialog
        data-testid="dialog"
        [open]="dialogOpen"
        heading="Angular controlled dialog"
        description="The custom element owns focus; Angular owns open state."
        (open-changed)="setDialogOpen($event)"
      >Escape closes this overlay and restores focus.</box-dialog>
    </main>
  `,
})
class AdapterValidation {
  private readonly selectionController = createSelectionController();
  readonly selection = createExplorerSelectionSignal(this.selectionController);
  name = "Apollo";
  status = "draft";
  saving = false;
  dialogOpen = false;
  message = "Ready";
  readonly options = [
    { label: "Draft", value: "draft" },
    { label: "Published", value: "published" },
  ];

  setName(event: CustomEvent<{ value: string }>): void {
    this.name = event.detail.value;
  }

  setStatus(event: CustomEvent<{ value: string }>): void {
    this.status = event.detail.value;
  }

  setDialogOpen(event: CustomEvent<{ open: boolean }>): void {
    this.dialogOpen = event.detail.open;
  }

  toggleAlpha(): void {
    this.selectionController.toggleSelection("alpha");
  }

  save(): void {
    this.message = `Saved ${this.name} as ${this.status}`;
  }
}

void bootstrapApplication(AdapterValidation);
