import { Component, OnInit } from '@angular/core';
import { OfferState } from 'app/models/api-entities/utility';
import { AppRoutes } from 'app/models/routes';
import { UserSessionService } from 'app/services/user-session.service';
import { MerchantService } from 'app/services/merchant.service';
import { OfferService } from 'app/services/offer.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { ErrorService } from 'app/services/error.service';
import { LoadingService } from 'app/services/loading.service';
import { DirectPaymentService } from 'app/services/direct-payment.service';
import { AgreementService } from 'app/services/agreement.service';
import * as storage from 'app/helpers/storage.helper';
import { take } from 'rxjs/operators';
import { UiError } from 'app/models/ui-error';
import Bugsnag from '@bugsnag/js';
import { ErrorMessage, ErrorResponse } from "app/models/error-response";

@Component({
  selector: 'ztt-application-flow',
  templateUrl: './application-flow.component.html'
})
export class ApplicationFlowComponent implements OnInit {

  private _loaded: boolean;

  get loaded(): boolean {
    return this._loaded;
  }

  set loaded(isLoaded: boolean) {
    this._loaded = isLoaded;

    if (this.loaded) {
      this.loadingService.hideMainLoader();
    } else {
      this.loadingService.showMainLoader();
    }
  }

  constructor(
    private userSessionService: UserSessionService,
    private merchantService: MerchantService,
    private offerService: OfferService,
    private stateRouterService: StateRoutingService,
    private errorService: ErrorService,
    private loadingService: LoadingService,
    private directPaymentService: DirectPaymentService,
    private agreementService: AgreementService
  ) {}

  ngOnInit(): void {
    this.loaded = false;
    storage.local.setItem('reauth_return', 'application');
    this.redirect();
  }

  // MAIN NAVIGATION LOGIC

  /** [Generic-Flow]
   * This routing logic is intended to be common to both lending and financing application flows.
   * Assumption: A merchant always have a partner.
   */
  // Note: [Graham] lots of these could be private methods.
  redirect(): void {
    if (!this.userSessionService.userSession) {
      return;
    }
    // 'Is there a merchant ?'
    if (this.isMerchantOnboardingSupported() && !this.hasAMerchant()) {
      this.loaded = true;
      this.stateRouterService.navigate(AppRoutes.onboarding.root);
    } else {
      this.loadOffers();
    }
  }

  inferProperApplicationFlow(): void {
    // Note: [Graham] look into better loading mechanism.
    this.loaded = true;
    // 'Is there an active direct debit in progress'
    if (this.directPaymentService.hasActiveDirectDebitSet) {
      this.stateRouterService.navigate(AppRoutes.application.direct_debit_prerequisites, true);
    } else if (this.agreementService.hasActivePafAgreementForMerchant(this.merchantService.getMerchant().id)) {
      this.stateRouterService.navigate(AppRoutes.application.pre_authorized_financing_prerequisites, true);
    } else {
      // 'Is there approved/processing/active lending offer ?'
      if (this.hasValidOffers()) {
        // Note: Now that we know we have a valid lending offer, we can enable both
        //       Application & Dashboard links.
        this.stateRouterService.navigate(AppRoutes.application.lending_application_flow, true);
        // 'Then there is only MCA left.'
      } else {
        Bugsnag.notify(new ErrorMessage('Could not navigate to correct component due to no valid offers existing.'));
      }
    }
  }

  // HELPERS

  hasAMerchant(): boolean {
    return !!this.merchantService.getMerchant();
  }

  isMerchantOnboardingSupported(): boolean {
    return !!this.userSessionService.userSession.partner.conf_onboard_supported;
  }

  /**
   * An offer is considered valid if it is in either of the following states: { approved, processing, active, rejected }
   * Assumption: We are not expecting the API to return offers in a { pending } state.
   *
   * @return true if there is at least one lending offer in either { approved, processing, active, rejected } states.
   */
  hasValidOffers(): boolean {
    return (this.offerService.findOffersByState(OfferState.approved).length > 0) ||
      (this.offerService.findOffersByState(OfferState.processing).length > 0) ||
      (this.offerService.findOffersByState(OfferState.active).length > 0) ||
      (this.offerService.findOffersByState(OfferState.rejected).length > 0);
  }

  private loadOffers(): void {
    this.offerService.loadOffers$()
      .pipe(take(1))
      .subscribe(
        () => this.inferProperApplicationFlow(),
        (err: ErrorResponse) => {
          this.loaded = true;
          // TODO : May not need this anymore
          if (err.statusCode === 417) { // 'Expectation failed' - Offerination
            this.stateRouterService.navigate(AppRoutes.error.no_offers, true);
          } else {
            this.errorService.show(UiError.getOffers);
          }
        } // - err
      );
  }
}
