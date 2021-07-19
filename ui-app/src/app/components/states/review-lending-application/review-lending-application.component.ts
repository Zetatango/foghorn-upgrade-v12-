import { Component, OnInit, OnDestroy, Output, Input, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Subject } from 'rxjs';
import { tap, takeUntil } from 'rxjs/operators';
import { StateRoutingService } from 'app/services/state-routing.service';
import { SupplierService } from 'app/services/supplier.service';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { MerchantService } from 'app/services/merchant.service';
import { ErrorService } from 'app/services/error.service';
import { OfferService } from 'app/services/offer.service';
import { UiAssetService } from 'app/services/ui-asset.service';
import { UiError } from 'app/models/ui-error';
import { Merchant } from 'app/models/api-entities/merchant';
import { Offer } from 'app/models/api-entities/offer';
import { LendingApplication } from 'app/models/api-entities/lending-application';
import { LendingOfflinePayout } from 'app/models/api-entities/lending-offline-payout';
import { RepaymentSchedule, TermUnit } from 'app/models/api-entities/utility';
import { AppRoutes } from 'app/models/routes';

@Component({
  selector: 'ztt-review-lending-application',
  templateUrl: './review-lending-application.component.html'
})
export class ReviewLendingApplicationComponent implements OnInit, OnDestroy {
  static className = 'review_lending_application';

  offer: Offer;
  lendingApplication: LendingApplication;
  payouts: LendingOfflinePayout[];
  totalPayouts: number;
  merchant: Merchant;
  // Dynamic UI Flags
  loaded = false;
  isCollapsed = true;

  // Static UI Flags
  delegatedAccess: boolean;
  isWcaOffer: boolean;
  hasPayouts: boolean;
  displayRequested: boolean;
  approvedLower: boolean;

  @Output() nextEvent = new EventEmitter<void>();
  @Output() cancelEvent = new EventEmitter<void>();
  @Input() processingApplication: boolean;
  @Input() cancellingApplication: boolean;

  private lendingApplicationSubscription$: Subscription;
  unsubscribe$ = new Subject<void>();

  constructor(private stateRouter: StateRoutingService,
              private supplierService: SupplierService,
              private lendingApplicationsService: LendingApplicationsService,
              private errorService: ErrorService,
              private merchantService: MerchantService,
              public translateService: TranslateService,
              private offerService: OfferService,
              private uiAssetService: UiAssetService) {
  }

  ngOnInit(): void {
    this.supplierService.clearCurrentSupplier();
    this.setLendingApplicationSubscription();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  // SUBSCRIPTIONS

  private setLendingApplicationSubscription(): void {
    this.lendingApplicationSubscription$ = this.lendingApplicationsService.lendingApplication$
      .pipe(
        tap(() => this.loaded = true),
        takeUntil(this.unsubscribe$)
      )
      .subscribe((lendingApplication: LendingApplication) => { // Note: [Graham] no error check.
        if (!lendingApplication) return;

        this.lendingApplication = lendingApplication;
        this.offer = this.offerService.findOfferById(this.lendingApplication.offer_id);
        this.assignUiFlags();
        this.assignAttributes();
      });
  }

  // NAVIGATION

  modify(): void {
    this.stateRouter.navigate(AppRoutes.application.select_lending_offer, true);
  }

  /**
   * If in delegated access, show error dialog. Else, emit event indicating that user wishes to proceed.
   */
  next(): void {
    this.delegatedAccess ? this.errorService.show(UiError.delegatedMode) : this.nextEvent.emit();
  }

  cancel(): void {
    this.cancelEvent.emit();
  }

  // TEMPLATE HELPERS

  /**
   * Returns the localisation label corresponding to the payout if it is defined.
   * Returns null if passed payout is not defined.
   *
   * @param payout
   */
  getPayoutLabel(payout: LendingOfflinePayout): string {
    return payout ? this.uiAssetService.getPayoutPayeeLabel(payout) : null;
  }

  get localizedLoanTermUnit(): string {
    if (!this.lendingApplication) { return '~'; }

    const unit: TermUnit = this.lendingApplication.term_unit;

    return this.uiAssetService.getLocalizedLoanTermUnit(unit);
  }

  get repaymentScheduleLocalizationKey(): string {
    if (!this.lendingApplication || !this.lendingApplication.repayment_schedule) return '';

    const repSched: RepaymentSchedule = this.lendingApplication.repayment_schedule;
    return this.uiAssetService.getRepaymentScheduleLocalizationKey(repSched);
  }

  get payReviewFormulaLocalizationKey(): string {
    if (!this.lendingApplication || !this.lendingApplication.repayment_schedule) return '';

    const repSched: RepaymentSchedule = this.lendingApplication.repayment_schedule;
    return this.uiAssetService.getPayReviewFormulaLocalizationKey(repSched);
  }


  // PRIVATE HELPERS

  /**
   * Returns true only if requested_amount exists (and is non 0) in application and offer is a wca offer, false otherwise.
   */
  private displayRequestedAmount(): boolean {
    return this.lendingApplication.requested_amount ? this.isWcaOffer : false;
  }

  /**
   * Returns true if max_principal_amount in application is strictly less than requested_amount in application, false otherwise.
   */
  private approvedAmountLessThanRequested(): boolean {
    return this.lendingApplication.max_principal_amount < this.lendingApplication.requested_amount;
  }
  // Note: [Graham] this can be refactored.
  /**
   * Sets all the flags needed for conditional displays.
   */
  private assignUiFlags(): void {
    this.isWcaOffer = this.offerService.isOfferWca(this.offer);
    this.hasPayouts = this.lendingApplicationsService.hasPayouts(this.lendingApplication);
    this.displayRequested = this.displayRequestedAmount();
    this.approvedLower = this.approvedAmountLessThanRequested();
    this.delegatedAccess = this.merchantService.isDelegatedAccessMode();
  }

  /**
   * Set the extra values used in the template.
   */
  private assignAttributes(): void {
    this.payouts = this.hasPayouts ? this.lendingApplication.offline_payouts : [];
    this.totalPayouts = this.lendingApplicationsService.getPayoutsSum(this.payouts);
  }
}
