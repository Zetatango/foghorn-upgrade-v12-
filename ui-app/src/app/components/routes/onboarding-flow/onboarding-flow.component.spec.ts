import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { throwError, BehaviorSubject, of } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { OnboardingFlowComponent } from './onboarding-flow.component';
import { AppRoutes } from 'app/models/routes';
import { UserSessionService } from 'app/services/user-session.service';
import { MerchantService } from 'app/services/merchant.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { ErrorService } from 'app/services/error.service';
import { OfferService } from 'app/services/offer.service';
import { userPropertiesFactory, userSessionFactory } from 'app/test-stubs/factories/user-session';
import { offer, offerWca } from 'app/test-stubs/factories/lending/offers';
import { UiError } from 'app/models/ui-error';
import { LoggingService } from 'app/services/logging.service';
import { LogSeverity } from 'app/models/api-entities/log';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { UtilityService } from 'app/services/utility.service';
import { BorrowerInvoiceService } from 'app/services/borrower-invoice.service';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { RouterTestingModule } from '@angular/router/testing';
import { offers$, loadOffers$ } from 'app/test-stubs/factories/lending/offer-stubs';
import { expectationFailedFactory, internalServerErrorFactory } from 'app/test-stubs/factories/response';
import Bugsnag from '@bugsnag/js';
import { ErrorResponse } from "app/models/error-response";


describe('OnboardingFlowComponent', () => {
  let component: OnboardingFlowComponent;
  let fixture: ComponentFixture<OnboardingFlowComponent>;

  let bankingFlowService: BankingFlowService;
  let borrowerInvoiceService: BorrowerInvoiceService;
  let errorService: ErrorService;
  let loggingService: LoggingService;

  /**
   * Configure: OfferService
   */
  let offerService: OfferService;

  // Spies:
  let loadOffersSpy: jasmine.Spy;
  let offersSpy: jasmine.Spy;

  let merchantService: MerchantService;
  let stateRoutingService: StateRoutingService;
  let userSessionService: UserSessionService;


  let msAuthenticationCheckCompleteSpy: jasmine.Spy;
  let ussApplicantSpy: jasmine.Spy;
  let ussHasGuarantorSpy: jasmine.Spy;
  let ussHasMerchantSpy: jasmine.Spy;
  let ussHasPartnerSpy: jasmine.Spy;
  let ussIsMerchantOnboardingSupportedSpy: jasmine.Spy;
  let ussUserSessionSpy: jasmine.Spy;

  function routeToOnboarding(): void {
    fixture = TestBed.createComponent(OnboardingFlowComponent);
    component = fixture.componentInstance;
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OnboardingFlowComponent ],
      imports: [
        TranslateModule.forRoot(),
        RouterTestingModule.withRoutes([]),
        HttpClientTestingModule
      ],
      providers: [
        BorrowerInvoiceService,
        CookieService,
        ErrorService,
        OfferService,
        LoggingService,
        MerchantService,
        StateRoutingService,
        UserSessionService,
        UtilityService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    stateRoutingService = TestBed.inject(StateRoutingService);
    spyOn(stateRoutingService, 'navigate');
    spyOn(stateRoutingService, 'ignoreRootEvents').and.returnValue(of(null));
    
    fixture = TestBed.createComponent(OnboardingFlowComponent);
    component = fixture.componentInstance;

    bankingFlowService = TestBed.inject(BankingFlowService);
    borrowerInvoiceService = TestBed.inject(BorrowerInvoiceService);
    errorService = TestBed.inject(ErrorService);

    /**
     * Setup: OfferService
     */
    // Inject:
    offerService = TestBed.inject(OfferService);

    // Set spies:
    loadOffersSpy = spyOn(offerService, 'loadOffers$').and.returnValue(loadOffers$);
    offersSpy = spyOnProperty(offerService, 'offers$').and.returnValue(offers$);

    loggingService = TestBed.inject(LoggingService);
    merchantService = TestBed.inject(MerchantService);
    userSessionService = TestBed.inject(UserSessionService);

    msAuthenticationCheckCompleteSpy = spyOn(merchantService, 'authenticationCheckComplete').and.returnValue(true);
    ussApplicantSpy = spyOnProperty(userSessionService, 'applicantId').and.returnValue(userPropertiesFactory.build().applicant);
    ussHasGuarantorSpy = spyOnProperty(userSessionService, 'hasGuarantor').and.returnValue(false);
    ussHasMerchantSpy = spyOnProperty(userSessionService, 'hasMerchant').and.returnValue(true);
    ussHasPartnerSpy = spyOnProperty(userSessionService, 'hasPartner').and.returnValue(true);
    ussIsMerchantOnboardingSupportedSpy = spyOnProperty(userSessionService, 'isMerchantOnboardingSupported').and.returnValue(true);
    ussUserSessionSpy = spyOnProperty(userSessionService, 'userSession').and.returnValue(userSessionFactory.build());

    spyOn(errorService, 'show');
    spyOn(loggingService, 'log');
    spyOn(Bugsnag, 'notify');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('listenForRouteEvents()', () => {
    it('should listen to ignoreRootEvents from StateRoutingService', () => {
      expect(stateRoutingService.ignoreRootEvents).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------- startNavigation()
  describe('startNavigation()', () => {
    it('should set reauth_return to dashboard in local storage', () => {
      routeToOnboarding();

      expect(localStorage.getItem('reauth_return')).toEqual('dashboard');
    });

    it('should get offers via subscription', () => {
      routeToOnboarding();

      expect(offersSpy).toHaveBeenCalledTimes(1);
    });

    it('should not route or do anything if user session is falsy', () => {
      ussUserSessionSpy.and.returnValue(undefined);
      routeToOnboarding();

      expect(stateRoutingService.navigate).not.toHaveBeenCalled();
    });
  }); // describe - startNavigation()

  // // -------------------------------------------------------------------------- navigate()
  describe('navigate()', () => {
    it('should navigate to application if merchant onboarding is not enabled', () => {
      ussIsMerchantOnboardingSupportedSpy.and.returnValue(false);
      routeToOnboarding();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.root);
    });

    it('should navigate to about_business when session has no partner', () => {
      ussHasPartnerSpy.and.returnValue(false);
      routeToOnboarding();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.onboarding.about_business, true);
    });

    it('should navigate to agreement if the session has a guarantor', () => {
      ussHasGuarantorSpy.and.returnValue(true);
      routeToOnboarding();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.agreement.root);
    });

    it('should navigate to about_business when session has no merchant', () => {
      ussHasMerchantSpy.and.returnValue(false);
      routeToOnboarding();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.onboarding.about_business, true);
    });

    it('should navigate to about_you when when session has no applicant', () => {
      ussApplicantSpy.and.returnValue(null);

      routeToOnboarding();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.onboarding.about_you, true);
    });

    it('should navigate to authenticate_applicant if the merchant has not completed authentication', () => {
      msAuthenticationCheckCompleteSpy.and.returnValue(false);
      routeToOnboarding();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.onboarding.authenticate_applicant, true);
    });
  }); // describe - navigate()

  describe('navigate() -> goToFlinksFlow()', () => {
    beforeEach(() => {
      spyOnProperty(bankingFlowService, 'flinksRequestId').and.returnValue('1');
    });

    it('should route to /application if flinksRoute is application', () => {
      spyOnProperty(bankingFlowService, 'flinksRoute').and.returnValue(AppRoutes.application.root);
      routeToOnboarding();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.root);
    });

    it('should trigger log, show error, and route to /dashboard as back-up if flinksRoute is unrecognized', () => {
      spyOnProperty(bankingFlowService, 'flinksRoute').and.returnValue(null);
      const expectedMessage = `Flinks route (${null}) is not recognized so could not infer proper routing`;
      routeToOnboarding();

      expect(loggingService.log).toHaveBeenCalledTimes(1);

      expect(loggingService.log).toHaveBeenCalledOnceWith({ message: expectedMessage, severity: LogSeverity.warn });
      expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.dashboard.root);
    });

    it('should route to partner onboarding if flinksRoute is business partner registration', () => {
      spyOnProperty(bankingFlowService, 'flinksRoute').and.returnValue(AppRoutes.partner_onboarding.root);
      routeToOnboarding();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.partner_onboarding.root);
    });

    it('should route to insights if flinksRoute is insights', () => {
      spyOnProperty(bankingFlowService, 'flinksRoute').and.returnValue(AppRoutes.insights.root);
      routeToOnboarding();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.insights.root);
    });

    it('should route to dashboard if flinksRoute is dashboard', () => {
      spyOnProperty(bankingFlowService, 'flinksRoute').and.returnValue(AppRoutes.dashboard.root);
      routeToOnboarding();
      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root);
    });
  });

  describe('navigate() -> loadOffers()', () => {
    describe('on successful response', () => {
      it('should navigate to waiting_lending_offers when no offers are found', () => {
        offersSpy.and.returnValue(new BehaviorSubject([]));
        routeToOnboarding();

        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.onboarding.waiting_lending_offers, true);
      });

      it('should navigate to application if invoice has been set', () => {
        offersSpy.and.returnValue(new BehaviorSubject([offerWca, offer]));
        spyOn(offerService, 'setOffer');
        spyOn(borrowerInvoiceService, 'hasActiveInvoiceSet').and.returnValue(true);
        routeToOnboarding();

        expect(offerService.setOffer).toHaveBeenCalledOnceWith(offer);
        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.root);
      });

      // This test will definitely change soon when we allow not certified merchants to go through Pay a supplier with direct debit (Part 2)
      it('should navigate to dashboard otherwise', () => {
        routeToOnboarding();

        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root);
      });
    });

    describe('on error', () => {
      it('should navigate to no_offers if 417 response is returned', () => {
        loadOffersSpy.and.returnValue(throwError(new ErrorResponse(expectationFailedFactory.build())));
        routeToOnboarding();

        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.error.no_offers, true);
      });

      describe('non-417 errors', () => {
        it('should show error modal if non-417 response is returned', () => {
          loadOffersSpy.and.returnValue(throwError(internalServerErrorFactory.build()));
          routeToOnboarding();

          expect(errorService.show).toHaveBeenCalledOnceWith(UiError.getOffers);
        });
      });
    });
  });
});
