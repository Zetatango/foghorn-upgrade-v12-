import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[zttTrimWhitespace]'
})
export class TrimWhitespaceDirective {

  constructor(private _el: ElementRef) {}

  @HostListener('focusout') onFocusOut(): void {
    /* istanbul ignore next */
    const currentValue = this._el?.nativeElement?.value;
    if (!currentValue) {
      return;
    }

    const trimmedValue = currentValue.trim();
    const input = (this._el.nativeElement as HTMLInputElement);

    input.value = trimmedValue;
  }
}
