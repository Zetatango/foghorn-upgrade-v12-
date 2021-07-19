import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { UtilityService } from 'app/services/utility.service';
import { CookieService } from 'ngx-cookie-service';
import { ApplicationFlowComponent } from './application-flow.component';
import { AppRoutes } from 'app/models/routes';
import { UserSessionService } from 'app/services/user-session.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { OfferService } from 'app/services/offer.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { ErrorService } from 'app/services/error.service';
import { LoadingService } from 'app/services/loading.service';
import { userProfileFactory, userPropertiesFactory, userSessionFactory } from 'app/test-stubs/factories/user-session';

import { DirectPaymentService } from 'app/services/direct-payment.service';
import { AgreementService } from 'app/services/agreement.service';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { dreampaymentsPartner } from 'app/test-stubs/factories/partner';
import { RouterTestingModule } from '@angular/router/testing';
import { offers$, loadOffers$, noOffers$ } from 'app/test-stubs/factories/lending/offer-stubs';
import { BehaviorSubject, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { UiError } from 'app/models/ui-error';
import {
  offerWcaActive,
  offerWcaApproved,
  offerWcaProcessing, offerWcaRejected
} from 'app/test-stubs/factories/lending/offers';
import { expectationFailedFactory } from 'app/test-stubs/factories/response';
import Bugsnag from '@bugsnag/js';
import { ErrorResponse } from 'app/models/error-response';

describe('ApplicationFlowComponent', () => {
  let component: ApplicationFlowComponent;
  let fixture: ComponentFixture<ApplicationFlowComponent>;

  let userSessionService: UserSessionService;
  let merchantService: MerchantService;

  /**
   * Configure: OfferService
   */
  let offerService: OfferService;

  // Spies:
  let loadOffersSpy: jasmine.Spy;
  let offersSpy: jasmine.Spy;

  let stateRoutingService: StateRoutingService;
  let errorService: ErrorService;
  let loadingService: LoadingService;
  let directPaymentService: DirectPaymentService;
  let agreementService: AgreementService;

  let userSessionSpy: jasmine.Spy;
  let hasActiveDirectDebitSetSpy: jasmine.Spy;
  let hasActiveAgreementSetSpy: jasmine.Spy;
  let merchantSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule, RouterTestingModule ],
      declarations: [ ApplicationFlowComponent ],
      providers: [
        CookieService,
        ErrorService,
        LoadingService,
        UserSessionService,
        LoggingService,
        MerchantService,
        OfferService,
        DirectPaymentService,
        AgreementService,
        UtilityService,
        StateRoutingService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationFlowComponent);
    component = fixture.componentInstance;

    /**
     * Setup: OfferService
     */
    // Inject:
    offerService = TestBed.inject(OfferService);

    // Set spies:
    loadOffersSpy = spyOn(offerService, 'loadOffers$').and.returnValue(loadOffers$);
    offersSpy = spyOnProperty(offerService, 'offers$').and.returnValue(offers$);

    agreementService = TestBed.inject(AgreementService);
    directPaymentService = TestBed.inject(DirectPaymentService);
    errorService = TestBed.inject(ErrorService);
    loadingService = TestBed.inject(LoadingService);
    merchantService = TestBed.inject(MerchantService);
    stateRoutingService = TestBed.inject(StateRoutingService);
    userSessionService = TestBed.inject(UserSessionService);

    userSessionSpy = spyOnProperty(userSessionService, 'userSession').and.returnValue(userSessionFactory.build());
    spyOnProperty(userSessionService, 'userProfile').and.returnValue(userProfileFactory.build());
    spyOnProperty(userSessionService, 'userProperties').and.returnValue(userPropertiesFactory.build());
    hasActiveDirectDebitSetSpy = spyOnProperty(directPaymentService, 'hasActiveDirectDebitSet').and.returnValue(false);
    hasActiveAgreementSetSpy = spyOn(agreementService, 'hasActivePafAgreementForMerchant').and.returnValue(false);
    merchantSpy = spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());

    spyOn(stateRoutingService, 'navigate');
    spyOn(errorService, 'show');

    spyOn(Bugsnag, 'notify');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit()', () => {
    it('should call showMainLoader', () => {
      spyOn(loadingService, 'showMainLoader');

      component.ngOnInit();

      expect(loadingService.showMainLoader).toHaveBeenCalledTimes(1);
    });

    it('should save reauth_return to \'application\' in local storage', () => {
      component.ngOnInit();
      expect(localStorage.getItem('reauth_return')).toEqual('application');
    });
  }); // describe - ngOnInit()

  describe('hasValidOffers()', () => {
    const offers = [
      offerWcaApproved,
      offerWcaProcessing,
      offerWcaActive,
      offerWcaRejected
    ];

    it('should return true for each offer state it finds a valid offer for', () => {
      offers.forEach((offer) => {
        offersSpy.and.returnValue(new BehaviorSubject([offer]));
        expect(component.hasValidOffers()).toBeTrue();
      });
    });

    it('should return false when there are no offers found with any valid state', () => {
      offersSpy.and.returnValue(noOffers$);

      offers.forEach(() => {
        expect(component.hasValidOffers()).toBeFalse();
      });
    });
  }); // describe - hasValidOffers()

  describe('redirect()', () => {
    it('should not route or do anything if user session is falsy', () => {
      userSessionSpy.and.returnValue(undefined);
      component.ngOnInit();

      expect(stateRoutingService.navigate).not.toHaveBeenCalled();
    });

    it('should set loaded to true if the user doesn\'t have a merchant', () => {
      spyOn(component, 'hasAMerchant').and.returnValue(false);

      expect(component.loaded).toBeFalsy();

      component.redirect();

      expect(component.loaded).toBeTruthy();
    });

    it('should set loaded to true if onboarding is supported and the merchant is kyc failed', () => {
      spyOn(component, 'hasAMerchant').and.returnValue(true);
      spyOn(component, 'isMerchantOnboardingSupported').and.returnValue(true);
      spyOn(merchantService, 'isKycFailed').and.returnValue(true);

      expect(component.loaded).toBeFalsy();

      component.redirect();

      expect(component.loaded).toBeTruthy();
    });

    describe('when onboarding is supported by the partner', () => {
      it('should route to /onboarding if the user doesn\'t have a merchant ', () => {
        spyOn(component, 'hasAMerchant').and.returnValue(false);
        spyOn(component, 'isMerchantOnboardingSupported').and.returnValue(true);

        component.redirect();

        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.onboarding.root);
      });

      it('should state-route to lending_application_flow if the merchant is kyc failed and has offers', () => {
        spyOn(component, 'hasAMerchant').and.returnValue(true);
        spyOn(component, 'isMerchantOnboardingSupported').and.returnValue(true);
        spyOn(component, 'hasValidOffers').and.returnValue(true);
        spyOn(merchantService, 'isKycFailed').and.returnValue(true);

        component.redirect();

        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.lending_application_flow, true);
      });

      it('should state-route to lending_application_flow if the merchant has valid offers', () => {
        spyOn(component, 'hasAMerchant').and.returnValue(true);
        spyOn(component, 'isMerchantOnboardingSupported').and.returnValue(false);
        spyOn(merchantService, 'isKycFailed').and.returnValue(false);
        spyOn(component, 'hasValidOffers').and.returnValue(true);

        component.redirect();

        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.lending_application_flow, true);
      });
    });

    it('should call loadOffers()', () => {
      component.redirect();

      expect(offerService.loadOffers$).toHaveBeenCalledTimes(1);
    });

    it('should navigate to no_offers if an error response of 417 is returned by loadOffers', () => {
      loadOffersSpy.and.returnValue(throwError(new ErrorResponse(expectationFailedFactory.build())));

      component.redirect();

      expect(component.loaded).toBeTrue();
      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.error.no_offers, true);
    });

    it('should call errorService.show', () => {
      loadOffersSpy.and.returnValue(throwError(new HttpErrorResponse({})));

      component.redirect();

      expect(component.loaded).toBeTrue();
      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.getOffers);
    });

    it('should call notify Bugsnag as a last option', () => {
      spyOn(component, 'hasAMerchant').and.returnValue(true);
      spyOn(component, 'isMerchantOnboardingSupported').and.returnValue(false);
      spyOn(merchantService, 'isKycFailed').and.returnValue(false);
      spyOn(component, 'hasValidOffers').and.returnValue(false);

      component.redirect();

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });
  }); // describe - redirect()

  // ------------------------------------------------------------- inferProperApplicationFlow()
  describe('inferProperApplicationFlow()', () => {
    it('should set loaded to true', () => {
      expect(component.loaded).toBeFalsy();

      component.inferProperApplicationFlow();

      expect(component.loaded).toBeTruthy();
    });

    it('should state-route to lending_application_flow if hasValidOffers', () => {
      spyOn(component, 'hasValidOffers').and.returnValue(true);

      component.inferProperApplicationFlow();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.lending_application_flow, true);
    });

    it('should state-route to direct_debit_prerequisites if has active direct debit', () => {
      hasActiveDirectDebitSetSpy.and.returnValue(true);

      component.inferProperApplicationFlow();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.direct_debit_prerequisites, true);
    });

    it('should state-route to pre_authorized_financing_prerequisites if has active agreement', () => {
      hasActiveAgreementSetSpy.and.returnValue(true);

      component.inferProperApplicationFlow();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.pre_authorized_financing_prerequisites, true);
    });
  }); // describe - inferProperApplicationFlow()

  // --------------------------------------------------------------------------- hasAMerchant()
  describe('hasAMerchant() helper', () => {
    it('should return true if the user-properties contains a merchant', () => {
      expect(component.hasAMerchant()).toBeTrue();
    });

    it('should return false if the user-properties doesn\'t contain a merchant', () => {
      merchantSpy.and.returnValue(null);
      expect(component.hasAMerchant()).toBeFalse();
    });
  }); // describe - hasAMerchant() helper

  // ---------------------------------------------------------- isMerchantOnboardingSupported()
  describe('isMerchantOnboardingSupported() helper', () => {
    it('should return true if partner supports onboarding', () => {
      expect(userSessionService.userSession.partner.conf_onboard_supported).toBeTruthy();
      expect(component.isMerchantOnboardingSupported()).toEqual(true);
    });

    it('should return false if partner doesn\'t support onboarding', () => {
      userSessionSpy.and.returnValue(userSessionFactory.build({
        partner: dreampaymentsPartner
      }));

      expect(userSessionService.userSession.partner.conf_onboard_supported).toBeFalsy();
      expect(component.isMerchantOnboardingSupported()).toEqual(false);
    });
  }); // describe - isMerchantOnboardingSupported() helper
});
