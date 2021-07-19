import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, inject, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { CookieService } from 'ngx-cookie-service';

import { BusinessPartnerLandingComponent } from './business-partner-landing.component';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UtilityService } from 'app/services/utility.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { AppRoutes } from 'app/models/routes';
import { RouterTestingModule } from '@angular/router/testing';
import { ErrorService } from 'app/services/error.service';

describe('BusinessPartnerLandingComponent', () => {
  let component: BusinessPartnerLandingComponent;
  let fixture: ComponentFixture<BusinessPartnerLandingComponent>;

  let stateRoutingService: StateRoutingService;

  let stubMerchantHasSelectedBankAccount;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        BusinessPartnerLandingComponent
      ],
      imports: [
        TranslateModule.forRoot(),
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        LoggingService,
        MerchantService,
        BankingFlowService,
        StateRoutingService,
        CookieService,
        UtilityService,
        TranslateService,
        ErrorService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(inject(
    [ MerchantService ],
    (merchantService: MerchantService) => {
      // Create component
      fixture = TestBed.createComponent(BusinessPartnerLandingComponent);
      component = fixture.componentInstance;

      stateRoutingService = TestBed.inject(StateRoutingService);

      spyOn(stateRoutingService, 'navigate');

      // Set up spies
      stubMerchantHasSelectedBankAccount = (value) => spyOn(merchantService, 'merchantHasSelectedBankAccount').and.returnValue(value);
    }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should scroll to the top after init', () => {
    fixture.detectChanges();
    window.scroll(100, 100);
    let top: number = window.pageYOffset || document.documentElement.scrollTop;
    expect(top).not.toEqual(0);

    spyOn(window, 'scroll').and.callThrough();
    component.ngAfterContentInit();
    expect(window.scroll).toHaveBeenCalledOnceWith(0, 0)

    top = window.pageYOffset || document.documentElement.scrollTop;
    expect(top).toEqual(0);
  });

  // ----------------------------------------------------------------------------------- next()
  describe('next()', () => {
    it('should trigger start event from BankingFlowService if merchantHasSelectedBankAccount is set to false', inject(
      [ BankingFlowService ], (bankingFlowService: BankingFlowService) => {
       stubMerchantHasSelectedBankAccount(false);
        spyOn(bankingFlowService, 'triggerStartEvent');

        component.next();

        expect(bankingFlowService.triggerStartEvent).toHaveBeenCalledTimes(1);
      }));

    it('should navigate to the business partner branding if merchantHasSelectedBankAccount is set to true', () => {
      stubMerchantHasSelectedBankAccount(true);

      component.next();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.partner_onboarding.business_partner_branding, true);
    });
  }); // describe - next()

}); // describe - BusinessPartnerLandingComponent
