import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from "@angular/core";
import { Dialog as DialogElement } from "@unofficialbox/box-open-elements/dialog";

DialogElement.register();

export type DialogSize = "small" | "medium" | "large" | "fullscreen";
export type OpenChangedEvent = CustomEvent<{ open: boolean }>;

/** Typed standalone Angular directive for the controlled `<box-dialog>`. */
@Directive({ selector: "box-dialog", standalone: true })
export class Dialog implements OnDestroy {
  readonly element: DialogElement;
  private readonly openChangedListener = (event: Event): void => {
    this.openChanged.emit(event as OpenChangedEvent);
  };
  private readonly confirmListener = (event: Event): void => {
    this.confirm.emit(event as CustomEvent<null>);
  };
  private readonly cancelListener = (event: Event): void => {
    this.cancel.emit(event as CustomEvent<null>);
  };

  @Output("open-changed") readonly openChanged =
    new EventEmitter<OpenChangedEvent>();
  @Output() readonly confirm = new EventEmitter<CustomEvent<null>>();
  @Output() readonly cancel = new EventEmitter<CustomEvent<null>>();

  constructor(host: ElementRef<DialogElement>) {
    this.element = host.nativeElement;
    this.element.addEventListener("open-changed", this.openChangedListener);
    this.element.addEventListener("confirm", this.confirmListener);
    this.element.addEventListener("cancel", this.cancelListener);
  }

  @Input() set open(value: boolean | undefined) {
    this.element.open = Boolean(value);
  }

  @Input() set heading(value: string | undefined) {
    if (value !== undefined) this.element.heading = value;
  }

  @Input() set description(value: string | undefined) {
    if (value !== undefined) this.element.description = value;
  }

  @Input() set confirmLabel(value: string | undefined) {
    if (value !== undefined) this.element.confirmLabel = value;
  }

  @Input() set size(value: DialogSize | undefined) {
    if (value !== undefined) this.element.size = value;
  }

  ngOnDestroy(): void {
    this.element.removeEventListener("open-changed", this.openChangedListener);
    this.element.removeEventListener("confirm", this.confirmListener);
    this.element.removeEventListener("cancel", this.cancelListener);
  }
}
