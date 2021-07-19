import { Component, OnDestroy, OnInit } from '@angular/core';
import { OfferService } from 'app/services/offer.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { ErrorService } from 'app/services/error.service';
import { MerchantService } from 'app/services/merchant.service';
import { BorrowerInvoiceService } from 'app/services/borrower-invoice.service';
import { RetryConfig } from 'app/models/api-entities/utility';
import { UiError } from 'app/models/ui-error';
import { LENDING_OFFERS_POLLING } from 'app/constants';
import { AppRoutes } from 'app/models/routes';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ErrorResponse } from "app/models/error-response";

@Component({
  selector: 'ztt-waiting-lending-offers',
  templateUrl: './waiting-lending-offers.component.html'
})
export class WaitingLendingOffersComponent implements OnInit, OnDestroy {
  unsubscribe$ = new Subject<void>();

  readonly step = 3;
  readonly backoffConfig: RetryConfig = {
    initialInterval: LENDING_OFFERS_POLLING.INITIAL_INTERVAL,
    maxAttempts: LENDING_OFFERS_POLLING.MAX_ATTEMPTS,
    retryCounter: 0
  };

  constructor(
    private offerService: OfferService,
    private errorService: ErrorService,
    private stateRoutingService: StateRoutingService,
    private merchantService: MerchantService,
    private borrowerInvoiceService: BorrowerInvoiceService
  ) {}

  ngOnInit(): void {
    this.loadOffers();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  // POLLING HELPERS
  private loadOffers(): void {
    this.offerService.loadOffers$()
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe(
        () => this.determineRoute(),
        (err: ErrorResponse) => { // Note: [Graham] should this be moved to loadOffers pipe?
          if (err.statusCode === 417) {
            this.stateRoutingService.navigate(AppRoutes.error.no_offers, true); // Note: [Graham] goToNoOffers()
          } else {
            this.errorService.show(UiError.getOffers); // Note: [Graham] implement into other components that have similar subscriptions.
          }
        }
      );
  }

  private determineRoute(): void {
    if (this.offerService.offersExist()) {
      clearTimeout(this.backoffConfig.timeoutId);

      // If this is an invoice flow, go directly to dashboard
      if (this.borrowerInvoiceService.hasActiveInvoiceSet()) {
        this.stateRoutingService.navigate(AppRoutes.application.select_lending_offer, true); // Note: [Graham] goToSelectOffer()
      } else {
        this.stateRoutingService.navigate(AppRoutes.dashboard.root); // Note: [Graham] goToDashboard()
      }
    } else {
      this.registerNextPollForLendingOffer();
    }
  }

  private registerNextPollForLendingOffer(): void {
    if (this.backoffConfig.retryCounter < this.backoffConfig.maxAttempts) {
      this.backoffConfig.timeoutId = setTimeout(
        () => this.loadOffers(),
        this.calculateNextInterval()
      );
      this.backoffConfig.retryCounter++;
    } else {
      clearTimeout(this.backoffConfig.timeoutId);
    }
  }

  private calculateNextInterval(): number {
    // Calculate next backed-off interval using an exponential basis.
    const exponentialBasis = LENDING_OFFERS_POLLING.EXPONENTIAL_BASIS;
    const delayFactor = Math.pow(exponentialBasis, this.backoffConfig.retryCounter);

    return delayFactor * this.backoffConfig.initialInterval;
  }
}
