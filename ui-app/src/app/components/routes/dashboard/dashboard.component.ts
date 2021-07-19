import { Component, OnDestroy, OnInit } from '@angular/core';
import { UiError } from 'app/models/ui-error';
import { BankingContext, BankingFlowService } from 'app/services/banking-flow.service';
import { ErrorService } from 'app/services/error.service';
import { DirectPaymentService } from 'app/services/direct-payment.service';
import { OfferService } from 'app/services/offer.service';
import { LoadingService } from 'app/services/loading.service';
import { MerchantService } from 'app/services/merchant.service';
import { take} from 'rxjs/operators';
import { StateRoutingService } from 'app/services/state-routing.service';
import { AppRoutes } from 'app/models/routes';
import Bugsnag from '@bugsnag/js';
import { ErrorResponse } from "app/models/error-response";
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BankAccountService } from 'app/services/bank-account.service';

@UntilDestroy()
@Component({
  selector: 'ztt-borrower-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  constructor(
    private bankAccountService: BankAccountService,
    public merchantService: MerchantService,
    private offerService: OfferService,
    private errorService: ErrorService,
    private loadingService: LoadingService,
    private bankingFlowService: BankingFlowService,
    private directPaymentService: DirectPaymentService,
    private stateRoutingService: StateRoutingService
  ) {
    this.listenForRouteEvents();
  }

  ngOnInit(): void {
    this.setBankingFlowParameters();
  }

  ngOnDestroy(): void {
    this.bankingFlowService.clearAttributes();
  }

  private listenForRouteEvents(): void {
    this.stateRoutingService.ignoreRootEvents(AppRoutes.dashboard.root)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.startNavigation();
      });
  }

  private startNavigation(): void {
    this.directPaymentService.clearActiveId();
    this.cleanOffers();
    this.loadOffers();
  }

  private cleanOffers(): void {
    this.offerService.clearCurrentOffer();
    this.offerService.clearOfferFee();
  }

  private loadOffers(): void {
    this.offerService.loadOffers$()
      .pipe(take(1))
      .subscribe(
        () => this.redirect(),
        (e: ErrorResponse) => {
          Bugsnag.notify(e);

          this.errorService.show(UiError.getOffers);
        }
      );
  }

  private redirect(): void {
    this.loadingService.hideMainLoader();

    this.bankingFlowService.setAttributes(false, this.bankAccountService.getBankingStatus());

    if (this.bankingFlowService.isBankFlowInProgress(BankingContext.dashboard)) {
      this.goToBankingFlow();
    } else if (this.offerService.offersExist()) {
      this.goToLendingDashboard();
    } else {
      this.errorService.show(UiError.routing);
    }
  }

  // NAVIGATION HELPERS
  // Note: [Graham] we need a helper for this.
  private goToBankingFlow(): void {
    this.stateRoutingService.navigate(AppRoutes.dashboard.set_up_bank, true);
  }

  private goToDashboardRoot(): void {
    this.stateRoutingService.navigate(AppRoutes.dashboard.root);
  }

  private goToLendingDashboard(): void {
    this.stateRoutingService.navigate(AppRoutes.dashboard.active_ubls, true);
  }

  private setBankingFlowParameters(): void {
    // when start event gets triggered, call goToBankingFlow
    this.bankingFlowService.startEvent
      .pipe(untilDestroyed(this))
      .subscribe(() => this.goToBankingFlow());
    // when cancel event gets triggered, navigate to AppRoutes.dashboard.root
    this.bankingFlowService.cancelEvent
      .pipe(untilDestroyed(this))
      .subscribe(() => this.goToDashboardRoot());
    // when complete event gets triggered, navigate to AppRoutes.dashboard.root
    this.bankingFlowService.completeEvent
      .pipe(untilDestroyed(this))
      .subscribe(() => this.goToDashboardRoot());
  }
}
