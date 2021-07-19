import { Component } from '@angular/core';
import { BankingFlowService } from 'app/services/banking-flow.service';

@Component({
  selector: 'ztt-cash-flow-start',
  templateUrl: './cash-flow-start.component.html'
})
export class CashFlowStartComponent {
  static className = 'cash_flow_start';

  readonly bank_src = '/assets/cash-flow-bank.svg';
  documentList: string[];

  constructor(private bankingFlowService: BankingFlowService) {}

  cancel(): void {
    this.bankingFlowService.triggerCancelEvent();
  }

  next(): void {
    this.bankingFlowService.triggerStartEvent();
  }

}
