import { Component, Input } from '@angular/core';
import { BankingFlowService } from 'app/services/banking-flow.service';

@Component({
  selector: 'ztt-connect-bank',
  templateUrl: './connect-bank.component.html'
})
export class ConnectBankComponent {
  @Input() offerCtaState: string;

  constructor(
    private bankingFlowService: BankingFlowService
  ) {}

  connectBank(): void {
    this.bankingFlowService.triggerStartEvent();
  }
}
