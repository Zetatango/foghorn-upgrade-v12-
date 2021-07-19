import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { ConfigurationService } from 'app/services/configuration.service';
import { UserSessionService } from 'app/services/user-session.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { AppRoutes } from 'app/models/routes';
import { BankAccountService } from 'app/services/bank-account.service';

@Injectable({
  providedIn: 'any'
})
export class CfaRouteGuard implements CanActivate {

  constructor(
    private bankAccountService: BankAccountService,
    private configurationService: ConfigurationService,
    private stateRoutingService: StateRoutingService,
    private userSessionService: UserSessionService
  ) {}

  canActivate(): boolean {
    const isEnabled = this.configurationService.insightsEnabled && this.userSessionService.insightsPreference !== null;
    if (!isEnabled) {
      this.stateRoutingService.navigate(AppRoutes.insights.preferences, true);
      return false;
    }

    const isCfaOnBoarding = this.userSessionService.isCfaCustomer && (!this.bankAccountService.selectedInsightsBankAccountsIds.length);
    if (isCfaOnBoarding) {
      this.stateRoutingService.navigate(AppRoutes.insights.cfa_landing, true);
      return false;
    }

    const isSupported = !this.bankAccountService.owner.isCfaUnsupported();
    if (!isSupported) {
      this.stateRoutingService.navigate(AppRoutes.insights.about_cfa, true);
      return false;
    }

    return true;
  }
}
