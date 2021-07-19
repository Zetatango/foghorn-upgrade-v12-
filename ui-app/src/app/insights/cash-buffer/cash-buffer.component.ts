import { Component, HostBinding, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { CURRENCY_CLEAVE_CONFIG } from 'app/constants/formatting.constants';
import { BankAccountService } from 'app/services/bank-account.service';
import { MerchantService } from 'app/services/merchant.service';
import { UtilityService } from 'app/services/utility.service';
import { CASH_RESERVE_LIMIT } from 'app/constants';

@UntilDestroy()
@Component({
  selector: 'ztt-cash-buffer',
  templateUrl: './cash-buffer.component.html'
})
export class CashBufferComponent implements OnInit {
  @HostBinding('attr.id')
  componentID = 'ztt-cash-buffer';
  error = false;
  success = false;

  readonly currencyCleaveConfig = {
    ...CURRENCY_CLEAVE_CONFIG,
    numeralPositiveOnly: false
  };
  cashBufferForm = this.fb.group({
    amount: ['', [Validators.required, Validators.max(CASH_RESERVE_LIMIT.MAX_ALLOWED), Validators.min(CASH_RESERVE_LIMIT.MIN_ALLOWED)]]
  });
  amount: AbstractControl = this.cashBufferForm.get('amount');
  saving = false;

  constructor(
    private bankAccountService: BankAccountService,
    private merchantService: MerchantService,
    private translateService: TranslateService,
    private utilityService: UtilityService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.amount.setValue(this.bankAccountService.owner.desired_bank_account_balance || 0);
  }

  saveThreshold(): void {
    this.saving = true;
    this.error = false;
    this.success = false;

    this.bankAccountService.updateDesiredBankBalance(this.amount.value)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (): void => {
          this.saving = false;
          this.success = true;
        },
        error: (): void => {
          this.saving = false;
          this.error = true;
        }
      });
  }

  get accountInfoUrlString(): string {
    return this.utilityService.localizeUrl(this.merchantService.accountInfoUrl, this.translateService.currentLang);
  }
}
