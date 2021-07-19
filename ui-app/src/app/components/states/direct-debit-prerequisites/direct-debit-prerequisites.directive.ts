import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[zttDirectDebitPrerequisites]',
})
export class DirectDebitPrerequisitesDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
