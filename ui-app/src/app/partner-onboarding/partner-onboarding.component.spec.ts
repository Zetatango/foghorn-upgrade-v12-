import { ComponentFixture, TestBed, inject, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { APP_BASE_HREF } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PartnerOnboardingComponent } from './partner-onboarding.component';

import { CookieService } from 'ngx-cookie-service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UtilityService } from 'app/services/utility.service';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { BankAccountService } from 'app/services/bank-account.service';
import { MerchantService } from 'app/services/merchant.service';
import { LoggingService } from 'app/services/logging.service';
import { AppRoutes } from 'app/models/routes';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ErrorService } from 'app/services/error.service';

describe('PartnerOnboardingComponent', () => {
  let component: PartnerOnboardingComponent;
  let fixture: ComponentFixture<PartnerOnboardingComponent>;
  let stateRoutingService: StateRoutingService;

  let isBankFlowInProgressSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        PartnerOnboardingComponent
      ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        StateRoutingService,
        CookieService,
        UtilityService,
        BankingFlowService,
        BankAccountService,
        MerchantService,
        LoggingService,
        TranslateService,
        ErrorService,
        { provide: APP_BASE_HREF, useValue: '/' }
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(inject(
    [ MerchantService, BankingFlowService ],
    (merchantService: MerchantService, bankingFlowService: BankingFlowService) => {
      // Create component
      fixture = TestBed.createComponent(PartnerOnboardingComponent);
      component = fixture.componentInstance;

      stateRoutingService = TestBed.inject(StateRoutingService);

      // Set up spies
      isBankFlowInProgressSpy = spyOn(bankingFlowService, 'isBankFlowInProgress');
      spyOn(stateRoutingService, 'navigate');
  }));

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ----------------------------------------------------------------------------- redirect()
  describe('ngOnInit()', () => {
    it('should redirect to set up bank when isBankFlowInProgress returns true', () => {
      isBankFlowInProgressSpy.and.returnValue(true);

      fixture.detectChanges();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.partner_onboarding.set_up_bank, true);
    });

    it('should navigate to the business partner landing when isBankFlowInProgress returns false', () => {
      isBankFlowInProgressSpy.and.returnValue(false);

      fixture.detectChanges();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.partner_onboarding.business_partner_landing, true);
    });

    describe('Banking flow parameters', () => {
      it('should set attributes in BankingFlowService', inject(
        [ BankingFlowService ], (bankingFlowService: BankingFlowService) => {
          fixture.detectChanges();

          expect(bankingFlowService.skippable).toEqual(false);
        }));

      describe('BankingFlowService events handling', () => {
        it('should go to business_partner_landing when cancel event is trigger', inject(
          [ BankingFlowService ], (bankingFlowService: BankingFlowService) => {
            fixture.detectChanges();
            bankingFlowService.triggerCancelEvent();
            expect(stateRoutingService.navigate).toHaveBeenCalledTimes(2);
            expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.partner_onboarding.business_partner_landing, true);
          }));

        it('should go to business_partner_branding when complete event is trigger', inject(
          [ BankingFlowService ], (bankingFlowService: BankingFlowService)  => {
            fixture.detectChanges();
            bankingFlowService.triggerCompleteEvent();
            expect(stateRoutingService.navigate).toHaveBeenCalledTimes(2);
            expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.partner_onboarding.business_partner_branding, true);
          }));

        it('should go to set_up_bank when start event is trigger', inject(
          [ BankingFlowService ], (bankingFlowService: BankingFlowService)  => {
            fixture.detectChanges();
            bankingFlowService.triggerStartEvent();
            expect(stateRoutingService.navigate).toHaveBeenCalledTimes(2);
            expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.partner_onboarding.set_up_bank, true);
          }));

        it('should go to business_partner_branding when skip event is trigger', inject(
          [ BankingFlowService ], (bankingFlowService: BankingFlowService)  => {
            fixture.detectChanges();
            bankingFlowService.triggerSkipEvent();
            expect(stateRoutingService.navigate).toHaveBeenCalledTimes(2);
            expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.partner_onboarding.business_partner_branding, true);
          }));
      });
    });
  });

  describe('ngOnDestroy()', () => {
    it('should clear BankingFlowService attributes', inject(
      [ BankingFlowService ], (bankingFlowService: BankingFlowService) => {
        spyOn(bankingFlowService, 'clearAttributes');
        fixture.destroy();

        expect(bankingFlowService.clearAttributes).toHaveBeenCalledTimes(1);
      }));
  });
}); // describe - PartnerOnboardingComponent
