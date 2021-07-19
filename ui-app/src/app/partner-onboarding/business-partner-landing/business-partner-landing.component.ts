import { Component, AfterContentInit } from '@angular/core';

import { StateRoutingService } from 'app/services/state-routing.service';
import { MerchantService } from 'app/services/merchant.service';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { AppRoutes } from 'app/models/routes';

@Component({
  selector: 'ztt-business-partner-landing',
  templateUrl: './business-partner-landing.component.html'
})
export class BusinessPartnerLandingComponent implements AfterContentInit {

  constructor(private bankingFlowService: BankingFlowService,
              private merchantService: MerchantService,
              private stateRouter: StateRoutingService) {}

  ngAfterContentInit(): void {
    window.scroll(0, 0);
  }

  // NAVIGATION

  next(): void {
    if (!this.merchantService.merchantHasSelectedBankAccount()) {
      this.bankingFlowService.triggerStartEvent();
    } else {
      this.stateRouter.navigate(AppRoutes.partner_onboarding.business_partner_branding, true);
    }
  }
}
