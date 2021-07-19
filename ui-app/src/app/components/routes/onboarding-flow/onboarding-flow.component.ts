import { Component } from '@angular/core';
import { take } from 'rxjs/operators';
import { UserSessionService } from 'app/services/user-session.service';
import { MerchantService } from 'app/services/merchant.service';
import { BorrowerInvoiceService } from 'app/services/borrower-invoice.service';
import { OfferService } from 'app/services/offer.service';
import { LoggingService } from 'app/services/logging.service';
import { LogSeverity } from 'app/models/api-entities/log';
import { BankingFlowService } from 'app/services/banking-flow.service';
import * as storage from 'app/helpers/storage.helper';
import { StateRoutingService } from 'app/services/state-routing.service';
import { AppRoutes } from 'app/models/routes';
import { ErrorService } from 'app/services/error.service';
import { UiError } from 'app/models/ui-error';
import Bugsnag from '@bugsnag/js';
import { ErrorResponse } from "app/models/error-response";
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'ztt-onboarding-flow',
  templateUrl: './onboarding-flow.component.html'
})
export class OnboardingFlowComponent {
  private applicantId: string;
  private isAuthenticationCheckComplete: boolean;
  private hasPartner: boolean;
  private hasMerchant: boolean;
  private hasGuarantor: boolean;
  private isMerchantOnboardingSupported: boolean;

  constructor(
    private bankingFlowService: BankingFlowService,
    private borrowerInvoiceService: BorrowerInvoiceService,
    private errorService: ErrorService,
    private offerService: OfferService,
    private loggingService: LoggingService,
    private merchantService: MerchantService,
    private stateRoutingService: StateRoutingService,
    private userSessionService: UserSessionService
  ) {
    this.listenForRouteEvents();
  }

  private listenForRouteEvents(): void {
    this.stateRoutingService.ignoreRootEvents(AppRoutes.onboarding.root)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.startNavigation();
      });
  }

  private startNavigation(): void {
    if (!this.userSessionService.userSession) {
      return;
    }

    storage.local.setItem('reauth_return', 'dashboard');
    this.getUserSession();
    this.navigate();
  }

  // SUBSCRIPTIONS

  private getUserSession(): void {
    this.applicantId = this.userSessionService.applicantId;
    this.hasPartner = this.userSessionService.hasPartner;
    this.hasGuarantor = this.userSessionService.hasGuarantor;
    this.hasMerchant = this.userSessionService.hasMerchant;
    this.isMerchantOnboardingSupported = this.userSessionService.isMerchantOnboardingSupported;
    this.isAuthenticationCheckComplete = this.merchantService.authenticationCheckComplete(this.applicantId);
  }

  // MAIN NAVIGATION LOGIC
  private navigate(): void {
    if (!this.isMerchantOnboardingSupported) {
      this.stateRoutingService.navigate(AppRoutes.application.root);
    } else if (!this.hasPartner || !this.hasMerchant) {
      this.stateRoutingService.navigate(AppRoutes.onboarding.about_business, true);
    } else if (this.hasGuarantor) {
      this.stateRoutingService.navigate(AppRoutes.agreement.root);
    } else if (!this.applicantId) {
      this.stateRoutingService.navigate(AppRoutes.onboarding.about_you, true);
    } else if (!this.isAuthenticationCheckComplete) {
      this.stateRoutingService.navigate(AppRoutes.onboarding.authenticate_applicant, true);
    } else if (this.bankingFlowService.flinksRequestId) {
      this.goToFlinksFlow();
    } else {
      this.loadOffers();
    }
  }

  // HELPERS
  private goToFlinksFlow(): void {
    const flinksRoute = this.bankingFlowService.flinksRoute;
    switch (flinksRoute) {
      case AppRoutes.partner_onboarding.root:
        this.goToPartnerOnboarding();
        break;
      case AppRoutes.insights.root:
        this.goToInsights();
        break;
      case AppRoutes.application.root:
        this.goToApplication();
        break;
      case AppRoutes.dashboard.root:
        this.goToDashboard();
        break;
      default:
        const msg = `Flinks route (${flinksRoute}) is not recognized so could not infer proper routing`;
        this.loggingService.log({ message: msg, severity: LogSeverity.warn });
        this.goToDashboard();
    }
  }

  private loadOffers(): void {
    this.offerService.loadOffers$()
      .pipe(take(1))
      .subscribe(
        () => {
          if (!this.offerService.offersExist()) {
            this.goToWaitingOffers();
          } else if (this.borrowerInvoiceService.hasActiveInvoiceSet()) {
            this.offerService.setOfferToLoc();
            this.goToApplication();
          } else {
            this.goToDashboard();
          }
        },
        (e: ErrorResponse) => {
          Bugsnag.notify(e);

          if (e.statusCode === 417) {
            this.goToNoLendingOffers();
          } else {
            this.errorService.show(UiError.getOffers);
          }
        });
  }

  // NAVIGATION HELPERS

  private goToWaitingOffers(): void {
    this.stateRoutingService.navigate(AppRoutes.onboarding.waiting_lending_offers, true);
  }

  private goToNoLendingOffers(): void {
    this.stateRoutingService.navigate(AppRoutes.error.no_offers, true);
  }

  private goToApplication(): void {
    this.stateRoutingService.navigate(AppRoutes.application.root);
  }

  private goToDashboard(): void {
    this.stateRoutingService.navigate(AppRoutes.dashboard.root);
  }

  private goToPartnerOnboarding(): void {
    this.stateRoutingService.navigate(AppRoutes.partner_onboarding.root);
  }

  private goToInsights(): void {
    this.stateRoutingService.navigate(AppRoutes.insights.root);
  }
}
