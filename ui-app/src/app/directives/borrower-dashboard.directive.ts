import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[zttBorrowerDashboard]'
})
export class BorrowerDashboardDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
