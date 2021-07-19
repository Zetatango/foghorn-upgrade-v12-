import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[zttApprovalPost]',
})
export class ApprovalPostDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
