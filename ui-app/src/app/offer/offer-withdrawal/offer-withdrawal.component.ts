import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { CURRENCY_CLEAVE_CONFIG } from 'app/constants/formatting.constants';
import { OfferApplyButtonComponent } from 'app/offer/offer-apply-button/offer-apply-button.component';
import { OfferComponent } from 'app/offer/offer.component';
import { principalValidator } from 'app/offer/validators/offer.validator';

@Component({
  selector: 'ztt-offer-withdrawal',
  templateUrl: './offer-withdrawal.component.html'
})
export class OfferWithdrawalComponent extends OfferComponent implements OnInit {
  @ViewChild(OfferApplyButtonComponent)
  offerApplyButton: OfferApplyButtonComponent;

  readonly currencyCleaveConfig = CURRENCY_CLEAVE_CONFIG;

  withdrawalForm = this.fb.group({
    amount: ['', [Validators.required, principalValidator.bind(this)]]
  });

  amount: AbstractControl = this.withdrawalForm.get('amount');

  constructor(
    injector: Injector,
    private fb: FormBuilder
  ) {
    super(injector);
  }

  get requestedAmount(): number | null {
    return !this.amount.invalid ? this.amount.value : null;
  }

  protected setIsOfferDisabled(): void {
    super.setIsOfferDisabled();

    if (this.isOfferDisabled) {
      this.amount.disable();
    }
  }
}
