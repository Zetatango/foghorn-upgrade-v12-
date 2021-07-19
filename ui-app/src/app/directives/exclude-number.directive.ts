import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[zttExcludeNumber]'
})
export class ExcludeNumberDirective {
  constructor(private el: ElementRef) {}

  @HostListener('keydown', ['$event']) onKeyDown(event: Event): void {
    const e = <KeyboardEvent>event;
    // Ensure that it is a number and stop the keypress
    if ([ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' ].includes(e.key)) {
      e.preventDefault();
    }
  }
}
