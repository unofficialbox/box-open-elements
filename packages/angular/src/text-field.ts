import { NativeOutput, emitNative } from "./native-output.js";
import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from "@angular/core";
import { TextField as TextFieldElement } from "@unofficialbox/box-open-elements/text-field";

TextFieldElement.register();

export type ValueChangedDetail = { value: string };
export type ValueChangedEvent = CustomEvent<ValueChangedDetail>;

/** Typed standalone Angular directive for `<box-text-field>`. */
@Directive({ selector: "box-text-field", standalone: true })
export class TextField implements OnDestroy {
  readonly element: TextFieldElement;
  private readonly valueChangedNative = new NativeOutput<ValueChangedEvent>(() => this.element, "value-changed");
  private readonly valueChangedListener = (event: Event): void => {
    emitNative(this.valueChanged, event as ValueChangedEvent);
  };

  @Output("value-changed") readonly valueChanged: EventEmitter<ValueChangedEvent> = this.valueChangedNative;

  constructor(host: ElementRef<TextFieldElement>) {
    this.element = host.nativeElement;
    this.element.addEventListener("value-changed", this.valueChangedListener);
  }

  @Input() set label(value: string | undefined) {
    if (value !== undefined) this.element.label = value;
  }

  @Input() set value(value: string | undefined) {
    if (value !== undefined) this.element.value = value;
  }

  @Input() set placeholder(value: string | undefined) {
    if (value !== undefined) this.element.placeholder = value;
  }

  @Input() set name(value: string | undefined) {
    if (value !== undefined) this.element.name = value;
  }

  @Input() set errorMessage(value: string | undefined) {
    if (value !== undefined) this.element.errorMessage = value;
  }

  @Input() set disabled(value: boolean | undefined) {
    this.element.disabled = Boolean(value);
  }

  @Input() set invalid(value: boolean | undefined) {
    this.element.invalid = Boolean(value);
  }

  ngOnDestroy(): void {
    this.element.removeEventListener("value-changed", this.valueChangedListener);
    this.valueChangedNative.releaseHost();
  }
}
