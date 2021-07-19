import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[zttCashFlow]',
})
export class CashFlowDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}

// Note: what is going on here?
