import { Component } from '@angular/core';
import { BankAccountLoadingState, BankAccountService } from 'app/services/bank-account.service';

@Component({
  selector: 'ztt-bank-accounts-error',
  templateUrl: './bank-accounts-error.component.html'
})
export class BankAccountsErrorComponent {

  constructor(private bankService: BankAccountService) {}

  restart(): void {
    this.bankService.setBankAccountLoadingState(BankAccountLoadingState.READY);
  }
}
