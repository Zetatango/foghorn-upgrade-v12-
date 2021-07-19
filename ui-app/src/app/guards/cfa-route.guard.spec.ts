import { TestBed } from '@angular/core/testing';
import { LoggingService } from 'app/services/logging.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UtilityService } from 'app/services/utility.service';
import { RouterTestingModule } from '@angular/router/testing';
import { ConfigurationService } from 'app/services/configuration.service';
import { UserSessionService } from 'app/services/user-session.service';
import { AppRoutes } from 'app/models/routes';
import { StateRoutingService } from 'app/services/state-routing.service';
import { CfaRouteGuard } from './cfa-route.guard';
import { MerchantService } from 'app/services/merchant.service';
import { BankAccountService } from 'app/services/bank-account.service';
import { leadFactory } from 'app/test-stubs/factories/lead';

describe('CfaRouteGuard', () => {
  let guard: CfaRouteGuard;

  let bankAccountService: BankAccountService;
  let configurationService: ConfigurationService;
  let stateRoutingService: StateRoutingService;
  let userSessionService: UserSessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        BankAccountService,
        ConfigurationService,
        MerchantService,
        StateRoutingService,
        UserSessionService,
        LoggingService,
        UtilityService
      ]
    });

    bankAccountService = TestBed.inject(BankAccountService);
    configurationService = TestBed.inject(ConfigurationService);
    stateRoutingService = TestBed.inject(StateRoutingService);
    userSessionService = TestBed.inject(UserSessionService);

    spyOn(stateRoutingService, 'navigate');
    guard = TestBed.inject(CfaRouteGuard);
    bankAccountService.setBankAccountOwner(null);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should return false + route to preferences when insights disabled via config', () => {
    spyOnProperty(configurationService, 'insightsEnabled').and.returnValue(false);
    spyOnProperty(userSessionService, 'insightsPreference').and.returnValue(true);

    expect(guard.canActivate()).toBeFalse();
    expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.insights.preferences, true);
  });

  it('should return false + route to preferences when insights disabled via user preferences', () => {
    spyOnProperty(configurationService, 'insightsEnabled').and.returnValue(true);
    spyOnProperty(userSessionService, 'insightsPreference').and.returnValue(false);

    expect(guard.canActivate()).toBeFalse();
    expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.insights.about_cfa, true);
  });

  it('should return false + route to preferences when insights not set via user preferences', () => {
    spyOnProperty(configurationService, 'insightsEnabled').and.returnValue(true);
    spyOnProperty(userSessionService, 'insightsPreference').and.returnValue(null);

    expect(guard.canActivate()).toBeFalse();
    expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.insights.preferences, true);
  });

  describe('skip first guard group', () => {
    beforeEach(() => {
      spyOnProperty(configurationService, 'insightsEnabled').and.returnValue(true);
      spyOnProperty(userSessionService, 'insightsPreference').and.returnValue(true);
    });

    describe('second guard group', () => {
      beforeEach(() => {
        const lead = leadFactory.build({ selected_insights_bank_accounts: [] });
        bankAccountService.setBankAccountOwner(lead);
      });

      it('should return false + re-route when customer is cfa onboarding', () => {
        const lead = leadFactory.build({ selected_insights_bank_accounts: [] });
        bankAccountService.setBankAccountOwner(lead);
        spyOnProperty(userSessionService, 'isCfaCustomer').and.returnValue(true);

        expect(guard.canActivate()).toBeFalse();
        expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.insights.cfa_landing, true);
      });

      it('should return false + re-route to about_cfa when customer is not cfa onboarding', () => {
        const lead = leadFactory.build({ selected_insights_bank_accounts: [] });
        bankAccountService.setBankAccountOwner(lead);
        spyOnProperty(userSessionService, 'isCfaCustomer').and.returnValue(false);

        expect(guard.canActivate()).toBeFalse();
        expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.insights.about_cfa, true);
      });
    });

    describe('third guard group', () => {
      it('should return false + route to about CFA page when customer is not supported', () => {
        spyOn(bankAccountService.owner, 'isCfaUnsupported').and.returnValue(true);

        expect(guard.canActivate()).toBeFalse();
        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.insights.about_cfa, true);
      });

      it('should return true + not re-route when customer is supported', () => {
        spyOn(bankAccountService.owner, 'isCfaUnsupported').and.returnValue(false);

        expect(guard.canActivate()).toBeTrue();
        expect(stateRoutingService.navigate).not.toHaveBeenCalled();
      });
    });
  });
});
