import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, inject, TestBed, waitForAsync } from '@angular/core/testing';

import { CookieService } from 'ngx-cookie-service';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { BusinessPartnerAgreementComponent } from './business-partner-agreement.component';
import { BusinessPartnerApplication } from 'app/models/api-entities/business-partner-application';
import { UiError } from 'app/models/ui-error';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { ErrorService } from 'app/services/error.service';
import { LoggingService, GTMEvent } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { ReauthService } from 'app/services/reauth.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UtilityService } from 'app/services/utility.service';
import { businessPartnerApplication } from 'app/test-stubs/factories/business-partner';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { AppRoutes } from 'app/models/routes';
import { RouterTestingModule } from '@angular/router/testing';

describe('BusinessPartnerAgreement', () => {
  let component: BusinessPartnerAgreementComponent;
  let fixture: ComponentFixture<BusinessPartnerAgreementComponent>;

  let stateRoutingService: StateRoutingService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        BusinessPartnerAgreementComponent
      ],
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        RouterTestingModule
      ],
      providers: [
        BusinessPartnerService,
        CookieService,
        ErrorService,
        LoggingService,
        MerchantService,
        StateRoutingService,
        ReauthService,
        UtilityService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BusinessPartnerAgreementComponent);
    component = fixture.componentInstance;

    stateRoutingService = TestBed.inject(StateRoutingService);

    spyOn(stateRoutingService, 'navigate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    beforeEach(inject([MerchantService], (merchantService: MerchantService) => {
      spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
    }));

    it('should set the business partner application on init', inject([BusinessPartnerService], (businessPartnerService: BusinessPartnerService) => {
      spyOn(businessPartnerService, 'fetchBusinessPartnerApplication').and.returnValue(of(null));
      spyOn(businessPartnerService, 'getBusinessPartnerApplication').and.returnValue(
          new BehaviorSubject<BusinessPartnerApplication>(businessPartnerApplication));

      component.ngOnInit();

      expect(component.businessPartnerApplication).toEqual(businessPartnerApplication);
    }));

    it('should set loaded flag on init if business partner application is successfully retrieved',
      inject([BusinessPartnerService], (businessPartnerService: BusinessPartnerService) => {
      spyOn(businessPartnerService, 'fetchBusinessPartnerApplication').and.returnValue(of(null));
      spyOn(businessPartnerService, 'getBusinessPartnerApplication').and.returnValue(
        new BehaviorSubject<BusinessPartnerApplication>(businessPartnerApplication));

      component.ngOnInit();

      expect(component.loaded).toBeTruthy();
    }));

    it('should display an error dialog if attempt to get business partner application fails on init',
      inject([BusinessPartnerService, ErrorService], (businessPartnerService: BusinessPartnerService, errorService: ErrorService) => {
      spyOn(businessPartnerService, 'fetchBusinessPartnerApplication').and.returnValue(throwError(null));
      spyOn(errorService, 'show');

      component.ngOnInit();

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.getBusinessPartnerApplicationError);
    }));
  });

  describe('ngOnDestroy', () => {
    it('should trigger the completion of observables', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
    });
  });

  describe('signBusinessPartnerAgreement', () => {
    it('should call loggingService.GTMUpdate with correct button label', inject(
      [ LoggingService ], (loggingService: LoggingService) => {
        spyOn(loggingService, 'GTMUpdate');

        component.signBusinessPartnerAgreement();

        expect(loggingService.GTMUpdate).toHaveBeenCalledOnceWith(GTMEvent.BUTTON_CLICKED, 'Sign Business Partner Agreement');
    }));

    it('should route to dashboard on success', inject([MerchantService, ReauthService], (merchantService: MerchantService,
                                                                 reauthService: ReauthService) => {
      spyOn(reauthService, 'open').and.returnValue(of({ status: reauthService.SUCCESS }));
      spyOn(merchantService, 'becomeBusinessPartner').and.returnValue(of(null));
      spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());

      component.signBusinessPartnerAgreement();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root, true);
    }));

    it('should set signingAgreement to false on failed re-auth', inject([ReauthService], (reauthService: ReauthService) => {
      spyOn(reauthService, 'open').and.returnValue(of({ status: reauthService.FAIL }));

      component.signBusinessPartnerAgreement();

      expect(component.signingAgreement).toBeFalsy();
      expect(stateRoutingService.navigate).not.toHaveBeenCalled();
    }));

    it('should set signingAgreement to false and display error dialog on re-auth error', inject([ErrorService, ReauthService],
      (errorService: ErrorService, reauthService: ReauthService) => {
      spyOn(reauthService, 'open').and.returnValue(throwError({}));
      spyOn(errorService, 'show');

      component.signBusinessPartnerAgreement();

      expect(component.signingAgreement).toBeFalsy();
      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.signByReauth);
      expect(stateRoutingService.navigate).not.toHaveBeenCalled();
    }));

    it('should display error dialog if becomeBusinessPartner returns an error', inject([ErrorService, MerchantService, ReauthService],
      (errorService: ErrorService, merchantService: MerchantService, reauthService: ReauthService) => {
      spyOn(reauthService, 'open').and.returnValue(of({ status: reauthService.SUCCESS }));
      spyOn(merchantService, 'becomeBusinessPartner').and.returnValue(throwError(null));
      spyOn(errorService, 'show');

      component.signBusinessPartnerAgreement();

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.newBusinessPartnerError);
      expect(stateRoutingService.navigate).not.toHaveBeenCalled();
      expect(component.becomeBusinessPartnerFailed).toBeTruthy();
    }));

    it('should not open reauth window if already signing agreement', inject([ReauthService], (reauthService: ReauthService) => {
      spyOn(reauthService, 'open');
      spyOnProperty(component, 'signingAgreement').and.returnValue(true);

      component.signBusinessPartnerAgreement();

      expect(reauthService.open).not.toHaveBeenCalled();
    }));

    it('should not call become business partner if already accepting agreement', inject([MerchantService, ReauthService],
      (merchantService: MerchantService, reauthService: ReauthService) => {
      spyOn(reauthService, 'open').and.returnValue(of({ status: reauthService.SUCCESS }));
      spyOn(merchantService, 'becomeBusinessPartner');
      spyOnProperty(component, 'acceptingAgreement').and.returnValue(true);

      component.signBusinessPartnerAgreement();

      expect(merchantService.becomeBusinessPartner).not.toHaveBeenCalled();
    }));
  });

  describe('back()', () => {
    it('should route to dashboard on back', () => {
      component.back();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.partner_onboarding.business_partner_branding, true);
    });
  });

  describe('merchantName', () => {
    it('should return the name of the current merchant', inject([MerchantService], (merchantService: MerchantService) => {
      spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());

      expect(component.merchantName()).toEqual(merchantDataFactory.build().name);
    }));
  });
});
