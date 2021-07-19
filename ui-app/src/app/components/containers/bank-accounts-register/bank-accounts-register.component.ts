import { Component } from '@angular/core';

import { MerchantService } from 'app/services/merchant.service';
import { BankingFlowService } from 'app/services/banking-flow.service';

@Component({
  selector: 'ztt-bank-accounts-register',
  templateUrl: './bank-accounts-register.component.html'
})
export class BankAccountsRegisterComponent {

  get skippable(): boolean {
    return this.bankingFlowService.skippable;
  }

  get description(): string {
    return this.bankingFlowService.registerDescription;
  }

  get delegatedAccess(): boolean {
    return this.merchantService.isDelegatedAccessMode();
  }

  get allowManualInput(): boolean {
    return this.bankingFlowService.allowManualInput;
  }

  constructor(private merchantService: MerchantService,
              public bankingFlowService: BankingFlowService) {}

  cancel(): void {
    this.bankingFlowService.triggerCancelEvent();
  }

  skip(): void {
    this.bankingFlowService.triggerSkipEvent();
  }

  get institutionName(): string {
    try {
      return this.merchantService.getMerchant().selected_sales_volume_account_details.institution_name;
    } catch {
      return 'SET_BANK_INSTRUCTIONS.UNKNOWN';
    }
  }

  get maskedAccountNumber(): string {
    try {
      return this.merchantService.getMerchant().selected_sales_volume_account_details.masked_account_number;
    } catch {
      return 'SET_BANK_INSTRUCTIONS.UNKNOWN';
    }
  }

  isUserLangFr(): boolean {
    return /fr/i.test(navigator.language);
  }

  isSafariDesktop(): boolean {
    return /Safari/i.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor) && !/Mobi|Android/i.test(navigator.userAgent);
  }
}
