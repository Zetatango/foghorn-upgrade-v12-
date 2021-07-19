import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[zttPreAuthorizedFinancingPrerequisites]'
})
export class PreAuthorizedFinancingDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
