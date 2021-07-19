import { Component, OnInit, OnDestroy } from '@angular/core';
import { StateRoutingService } from 'app/services/state-routing.service';
import { BankingContext, BankingFlowService } from 'app/services/banking-flow.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BankAccountService } from 'app/services/bank-account.service';
import { MerchantService } from 'app/services/merchant.service';
import { AppRoutes } from 'app/models/routes';

@Component({
  selector: 'ztt-partner-onboarding',
  templateUrl: './partner-onboarding.component.html'
})

export class PartnerOnboardingComponent implements OnInit, OnDestroy {
  readonly flinksFlowRoute: BankingContext = BankingContext.business_partner_registration;

  unsubscribe$ = new Subject<void>();

  constructor(private bankingFlowService: BankingFlowService,
              private bankService: BankAccountService,
              private merchantService: MerchantService,
              private stateRouter: StateRoutingService) {
  }

  ngOnInit(): void {
    this.setBankingFlowParameters();
    this.redirect();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.bankingFlowService.clearAttributes();
  }

  private setBankingFlowParameters() {
    this.bankingFlowService.setAttributes(false);

    this.bankingFlowService.cancelEvent
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.stateRouter.navigate(AppRoutes.partner_onboarding.business_partner_landing, true);
      });

    this.bankingFlowService.completeEvent
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.stateRouter.navigate(AppRoutes.partner_onboarding.business_partner_branding, true);
      });

    this.bankingFlowService.startEvent
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.stateRouter.navigate(AppRoutes.partner_onboarding.set_up_bank, true);
      });

    this.bankingFlowService.skipEvent
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.stateRouter.navigate(AppRoutes.partner_onboarding.business_partner_branding, true);
      });
  }

  // NAVIGATION

  /**
   * State routes to set_up_bank if flinks_route is set in cookies, else routes to business_partner_landing.
   */
  private redirect(): void {
    if (this.bankingFlowService.isBankFlowInProgress(BankingContext.business_partner_registration)) {
      this.stateRouter.navigate(AppRoutes.partner_onboarding.set_up_bank, true);
    } else {
      this.stateRouter.navigate(AppRoutes.partner_onboarding.business_partner_landing, true);
    }
  }
}
