import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[zttApprovalPrerequisites]',
})
export class ApprovalPrerequisitesDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
