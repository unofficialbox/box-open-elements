import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from "@angular/core";
import { Select as SelectElement } from "@unofficialbox/box-open-elements/select";
import type { ValueChangedDetail } from "./text-field.js";

SelectElement.register();

export type SelectOption = { label: string; value: string };
export type SelectValueChangedEvent = CustomEvent<ValueChangedDetail>;

/** Typed standalone Angular directive for `<box-select>`. */
@Directive({ selector: "box-select", standalone: true })
export class Select implements OnDestroy {
  readonly element: SelectElement;
  private readonly valueChangedListener = (event: Event): void => {
    this.valueChanged.emit(event as SelectValueChangedEvent);
  };

  @Output("value-changed") readonly valueChanged =
    new EventEmitter<SelectValueChangedEvent>();

  constructor(host: ElementRef<SelectElement>) {
    this.element = host.nativeElement;
    this.element.addEventListener("value-changed", this.valueChangedListener);
  }

  @Input() set label(value: string | undefined) {
    if (value !== undefined) this.element.label = value;
  }

  @Input() set value(value: string | undefined) {
    if (value !== undefined) this.element.value = value;
  }

  @Input() set options(value: SelectOption[] | undefined) {
    if (value !== undefined) this.element.options = value;
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
  }
}
