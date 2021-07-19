import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DirectPaymentPost } from 'app/models/api-entities/direct-payment-post';
import { Merchant } from 'app/models/api-entities/merchant';
import { SupplierInformation } from 'app/models/api-entities/supplier';
import { UiError } from 'app/models/ui-error';
import { BankAccountService } from 'app/services/bank-account.service';
import { DirectPaymentService } from 'app/services/direct-payment.service';
import { ErrorService } from 'app/services/error.service';
import { MerchantService } from 'app/services/merchant.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ztt-review-direct-debit',
  templateUrl: './review-direct-debit.component.html'
})
export class ReviewDirectDebitComponent implements OnInit, OnDestroy {
  static className = 'review_direct_debit';

  private merchant: Merchant;
  // Dynamic UI Flags
  loaded = false;

  // Static UI Flags
  delegatedAccess: boolean;
  directDebitPost: DirectPaymentPost;
  supplierInformation: SupplierInformation;
  working = false;

  @Output() nextEvent = new EventEmitter<void>();
  @Output() cancelEvent = new EventEmitter<void>();
  @Input() cancellingDirectDebit: boolean;
  @Input() confirmingDirectDebit: boolean;

  unsubscribe$ = new Subject<void>();

  constructor(private stateRouter: StateRoutingService,
              private directPaymentService: DirectPaymentService,
              private bankAccountService: BankAccountService,
              private errorService: ErrorService,
              public translateService: TranslateService,
              private merchantService: MerchantService) {
  }

  ngOnInit(): void {
    this.directPaymentService.reviewed = false;
    this.setDirectPaymentPostSubscription();
    this.setSupplierInformationSubscription();
    this.getMerchant();
    this.loaded = true;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  // SUBSCRIPTIONS

  private setDirectPaymentPostSubscription(): void {
    this.directPaymentService.directPaymentPost$
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe(
        (directPaymentPost) => {
          this.directDebitPost = directPaymentPost;
        }
      );
  }

  private setSupplierInformationSubscription(): void {
    this.directPaymentService.supplierInformation$
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe(
        (supplierInformation) => {
          this.supplierInformation = supplierInformation;
        }
      );
  }

  // API CALLS

  /**
   * If in delegated access, show error dialog. Else, emit event indicating that user wishes to proceed.
   */

  confirmDirectDebit(): void {
    if (this.delegatedAccess) {
      this.errorService.show(UiError.delegatedMode);
    } else {
      this.working = true;
      this.directPaymentService.reviewed = true;
      this.nextEvent.emit();
    }
  }

  cancel(): void {
    if (this.delegatedAccess) {
      this.errorService.show(UiError.delegatedMode);
    } else {
      this.cancelEvent.emit();
    }
  }

  // TEMPLATE HELPERS

  bankAccountInfo(): string {
    if (this.loaded) {
      const bankAccount = this.bankAccountService.bankAccount;
      return bankAccount ? bankAccount.getValue().account_number : 'N/A';
    } else {
      return 'N/A';
    }
  }

  supplierInfo(): SupplierInformation {
    if (this.loaded) {
      return this.supplierInformation;
    } else {
      return null;
    }
  }

  invoiceNumber(): string {
    if (this.loaded) {
      if (this.directDebitPost.invoice_id !== undefined) {
        return this.supplierInformation.invoice_number;
      } else {
        return this.directDebitPost.invoice_number;
      }
    } else {
      return null;
    }
  }

  get lendingFee(): number {
    return this.directPaymentService.directDebitFee;
  }

  get promoFee(): number {
    return this.directPaymentService.directDebitPromoFee;
  }

  // SERVICE CALLS
  private getMerchant(): void {
    this.merchant = this.merchantService.getMerchant();
    this.delegatedAccess = this.merchantService.isDelegatedAccessMode();
  }
}
