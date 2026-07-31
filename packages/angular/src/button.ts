import { Directive, ElementRef, Input } from "@angular/core";
import { Button as ButtonElement } from "@unofficialbox/box-open-elements/button";

ButtonElement.register();

/** Typed standalone Angular directive for `<box-button>`. */
@Directive({ selector: "box-button", standalone: true })
export class Button {
  readonly element: ButtonElement;

  constructor(host: ElementRef<ButtonElement>) {
    this.element = host.nativeElement;
  }

  @Input() set label(value: string | undefined) {
    if (value !== undefined) this.element.label = value;
  }

  @Input() set tone(value: string | undefined) {
    if (value !== undefined) this.element.tone = value;
  }

  @Input() set size(value: string | undefined) {
    if (value !== undefined) this.element.size = value;
  }

  @Input() set disabled(value: boolean | undefined) {
    this.element.disabled = Boolean(value);
  }
}
