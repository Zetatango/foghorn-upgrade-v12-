import { Component } from '@angular/core';
import { BankingFlowService } from 'app/services/banking-flow.service';

@Component({
  selector: 'ztt-connect-bank-manually',
  templateUrl: './connect-bank-manually.component.html'
})
export class ConnectBankManuallyComponent {

  constructor(private bankingFlowService: BankingFlowService) {}

  connectBankManually(): void {
    this.bankingFlowService.triggerDisplayManualFormEvent();
  }
}
