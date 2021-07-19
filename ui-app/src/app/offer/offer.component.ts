import { Component, Injector, OnDestroy, OnInit } from '@angular/core';

// Services
import { TranslateService } from '@ngx-translate/core';

// Entities
import { ApplicationSummary, Offer } from 'app/models/api-entities/offer';
import { ApplicationState, OfferState, OfferType } from 'app/models/api-entities/utility';
import { AppRoutes } from 'app/models/routes';
import { BankAccountService } from 'app/services/bank-account.service';
import { BankingFlowService, BankingStatus } from 'app/services/banking-flow.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { OfferService } from 'app/services/offer.service';
import { UblService } from 'app/services/ubl.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export enum OfferCtaState {
  connect = 'CONNECT',
  not_needed = 'NOT_NEEDED',
  processing = 'PROCESSING',
  refresh = 'REFRESH',
  reconnect = 'RECONNECT'
}

@Component({
  selector: 'ztt-offer',
  templateUrl: './offer.component.html'
})
export class OfferComponent implements OnInit, OnDestroy {
  // subscriptions
  unsubscribe$ = new Subject<void>();

  // injector imports
  public translateService: TranslateService;
  // offer metrics
  balanceOutstanding: number;
  offerAvailableAmount: number;
  offerCapacity: number;
  offerMaxAmount: number;
  offerMetrics = true;
  offerMinAmount: number;

  // component variables
  offerPendingAmount: number;
  offerExpiryDate: Date;
  // offer states
  offerCtaState: OfferCtaState;
  // offer flags
  applicationRouterLink = AppRoutes.application.root_link;
  onboardingRouterLink = AppRoutes.onboarding.root_link;
  blockOnKycFailure: boolean;
  covidFinancingDisabled: boolean;
  hasActionableInProgressApplication: boolean;
  hasInProgressApplication: boolean;
  hasPaymentPlan: boolean;
  isDelinquent: boolean;
  isOfferAvailable: boolean;
  isOfferDisabled: boolean;
  offerExpired: boolean;
  offerFundsAccessible: boolean;
  showOffer: boolean;
  showOfferExpiry: boolean;
  // offer
  offerType: OfferType;
  public offerService: OfferService;
  protected loggingService: LoggingService;
  public offer: Offer;
  private bankingFlowService: BankingFlowService;
  private configurationService: ConfigurationService;
  private ublService: UblService;
  private merchantService: MerchantService;
  private bankAccountService: BankAccountService;

  constructor(injector: Injector) {
    this.bankAccountService = injector.get(BankAccountService);
    this.bankingFlowService = injector.get(BankingFlowService);
    this.configurationService = injector.get(ConfigurationService);
    this.offerService = injector.get(OfferService);
    this.ublService = injector.get(UblService);
    this.loggingService = injector.get(LoggingService);
    this.merchantService = injector.get(MerchantService);
    this.translateService = injector.get(TranslateService);

    this.offerType = OfferType.LineOfCredit;
  }

  get enumOfferCtaState(): typeof OfferCtaState {
    return OfferCtaState;
  }

  ngOnInit(): void {
    this.initOffers$();
    this.initLendingUbls$();
    this.initMerchant$();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /**
   * This function can be overridden in its child classes to configure other offer specific mechanics.
   * @example:
   * super.updateOffer();
   * someExtraLogic();
   * @note: if this.offerMetrics is false, you will not get basic offer data.
   */
  protected updateOffer(): void {
    if (!this.offerService.checkOfferTypeValid(this.offerType)) return;

    this.offer = this.getOffer(this.offerType);

    if (!this.offerService.checkOfferValid(this.offer)) return;

    if (this.offerMetrics) this.setOfferMetrics();

    this.setOfferStates();
    this.setOfferFlags();
    this.setIsOfferDisabled();
  }

  // Note: [Graham] metrics should be moved to their own service subscribers.
  /**
   * Sets the metrics for the local Offer, so they can be used publicly.
   */
  protected setOfferMetrics(): void {
    this.balanceOutstanding = this.merchantService.getMerchantOutstandingBalance();
    this.offerAvailableAmount = this.offerService.getOfferAvailableAmount(this.offer);
    this.offerCapacity = this.offerService.getOfferCapacity(this.offer);
    this.offerExpiryDate = this.offerService.getExpiryDate(this.offer);
    // TODO: [Graham] remove these as component vars:
    this.offerMaxAmount = this.offer.max_principal_amount;
    this.offerMinAmount = this.offer.min_principal_amount;
    this.offerPendingAmount = this.offer.in_progress_amount;
  }

  protected setOfferStates(): void {
    this.offerCtaState = this.getOfferCtaState(this.offer.state);
  }

  // Note: [Graham] flags should be moved to their own service subscribers.
  /**
   * Sets the flags for the local Offer, so they can be used publicly.
   */
  protected setOfferFlags(): void {
    this.covidFinancingDisabled = this.configurationService.covidFinancingDisabled;
    this.hasActionableInProgressApplication = this.offer.applications_in_progress?.filter((app: ApplicationSummary) => app.state === ApplicationState.approved)?.length > 0;
    this.hasInProgressApplication = this.offer.applications_in_progress?.length > 0;
    this.isOfferAvailable = this.offerService.isOfferAvailable(this.offer);
    this.offerFundsAccessible = this.offerService.getOfferFundsAccessible(this.offer);
    this.offerExpired = this.offerService.isOfferExpired(this.offer); // TODO: [Graham] we aren't using this anymore. Remove it.
    this.blockOnKycFailure = this.offerService.blockOnKycFailure(this.offer);
    this.showOffer = this.getShowOffer(this.offer.state);
    this.showOfferExpiry = !!this.offerExpiryDate && this.showOffer;
  }

  // Note: [Graham] we may need to work the expired state into this logic, or if funds are still accessible, use it instead.
  protected setIsOfferDisabled(): void {
    this.isOfferDisabled = !this.showOffer || !this.isOfferAvailable || !this.offerFundsAccessible
      || this.hasPaymentPlan || this.hasInProgressApplication || this.covidFinancingDisabled || this.isDelinquent;

    this.populateReasons();
  }

  // Implemented in inherited components
  protected populateReasons(): void {
    return;
  }

  private initLendingUbls$(): void {
    this.ublService.hasPaymentPlan$
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe(
        (hasPaymentPlan) => {
          this.hasPaymentPlan = hasPaymentPlan;
          this.setIsOfferDisabled();
        }
      );
  }

  /**
   * Sets up subscription to set local data when offers have been updated.
   */
  private initOffers$(): void {
    this.offerService.offers$
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe(
        () => this.updateOffer()
      );
  }

  /**
   * Sets up subscription to set local data when offers have been updated.
   */
  // Note: [Graham] look into forking these subscriptions and then running setIsOfferDisabled.
  private initMerchant$(): void {
    this.merchantService.isDelinquent$
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe(
        (isDelinquent) => {
          this.isDelinquent = isDelinquent;
          this.setIsOfferDisabled();
        }
      );
  }

  /**
   * Determines which offer to load based on offerType
   * @return Offer, locOffer or wcaOffer from Offer[]
   */
  private getOffer(offerType: OfferType): Offer {
    switch (offerType) {
      case OfferType.LineOfCredit:
        return this.offerService.locOffer;
      case OfferType.WorkingCapitalAdvance:
        return this.offerService.wcaOffer;
    }
  }

  /**
   * Determine what to display based on banking status and offer states.
   * @return OfferCtaState
   */
  private getOfferCtaState(offerState: OfferState): OfferCtaState {
    if (this.getShowOffer(offerState)) {
      return OfferCtaState.not_needed;
    }

    if ([OfferState.pending, OfferState.processing, undefined].includes(offerState)) {
      return OfferCtaState.processing;
    }

    // Executed only when Offer state is rejected or expired
    const bankingStatus = this.bankAccountService.getBankingStatus();
    switch (bankingStatus) {
      case BankingStatus.need_bank_account:
      case BankingStatus.need_sales_volume:
        return OfferCtaState.connect;
      case BankingStatus.need_connection_refresh:
        return OfferCtaState.reconnect;
      case BankingStatus.bank_status_optimal:
      default:
        if (offerState === OfferState.expired) {
          return OfferCtaState.refresh;
        }
        return OfferCtaState.not_needed; // When banking status is bank_status_optimal & Offer state is rejected.
    } // switch - bankingStatus
  }

  // Note: [Graham] should this be OfferCtaState?
  private getShowOffer(offerState: OfferState): boolean {
    switch (offerState) {
      case OfferState.accepted:
      case OfferState.active:
      case OfferState.approved:
        return true;
      default:
        return false;
    }
  }
}
