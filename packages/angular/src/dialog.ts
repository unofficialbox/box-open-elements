import { NativeOutput, emitNative } from "./native-output.js";
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

export type DialogConfirmTone = "primary" | "danger";
export type DialogSize = "small" | "medium" | "large" | "fullscreen";
export type OpenChangedEvent = CustomEvent<{ open: boolean }>;

/** Typed standalone Angular directive for the controlled `<box-dialog>`. */
@Directive({ selector: "box-dialog", standalone: true })
export class Dialog implements OnDestroy {
  readonly element: DialogElement;
  private readonly cancelNative = new NativeOutput<CustomEvent<null>>(() => this.element, "cancel");
  private readonly confirmNative = new NativeOutput<CustomEvent<null>>(() => this.element, "confirm");
  private readonly openChangedNative = new NativeOutput<OpenChangedEvent>(() => this.element, "open-changed");
  private readonly openChangedListener = (event: Event): void => {
    emitNative(this.openChanged, event as OpenChangedEvent);
  };
  private readonly confirmListener = (event: Event): void => {
    emitNative(this.confirm, event as CustomEvent<null>);
  };
  private readonly cancelListener = (event: Event): void => {
    emitNative(this.cancel, event as CustomEvent<null>);
  };

  @Output("open-changed") readonly openChanged: EventEmitter<OpenChangedEvent> = this.openChangedNative;
  @Output() readonly confirm: EventEmitter<CustomEvent<null>> = this.confirmNative;
  @Output() readonly cancel: EventEmitter<CustomEvent<null>> = this.cancelNative;

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

  @Input() set confirmTone(value: DialogConfirmTone | undefined) {
    if (value !== undefined) this.element.confirmTone = value;
  }

  @Input() set size(value: DialogSize | undefined) {
    if (value !== undefined) this.element.size = value;
  }

  ngOnDestroy(): void {
    this.element.removeEventListener("open-changed", this.openChangedListener);
    this.element.removeEventListener("confirm", this.confirmListener);
    this.element.removeEventListener("cancel", this.cancelListener);
    this.openChangedNative.releaseHost();
    this.confirmNative.releaseHost();
    this.cancelNative.releaseHost();
  }
}
