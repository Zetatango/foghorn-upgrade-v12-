import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { UtilityService } from 'app/services/utility.service';
import { CookieService } from 'ngx-cookie-service';
import { throwError } from 'rxjs';
import { WaitingLendingOffersComponent } from './waiting-lending-offers.component';
import { OfferService } from 'app/services/offer.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { ErrorService } from 'app/services/error.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { BorrowerInvoiceService } from 'app/services/borrower-invoice.service';
import { LENDING_OFFERS_POLLING } from 'app/constants';
import { UiError } from 'app/models/ui-error';
import { borrowerInvoice } from 'app/test-stubs/factories/invoice';
import { RouterTestingModule } from '@angular/router/testing';
import { AppRoutes } from 'app/models/routes';
import { UblService } from 'app/services/ubl.service';
import {
  offers$,
  loadOffers$,
  noOffers$,
  noloadOffers$
} from 'app/test-stubs/factories/lending/offer-stubs';
import { expectationFailedFactory, internalServerErrorFactory } from 'app/test-stubs/factories/response';
import { ErrorResponse } from 'app/models/error-response';

describe('WaitingLendingOffersComponentComponent', () => {
  let component: WaitingLendingOffersComponent;
  let fixture: ComponentFixture<WaitingLendingOffersComponent>;

  /**
   * Configure: OfferService
   */
  let offerService: OfferService;

  // Spies:
  let loadOffersSpy: jasmine.Spy;
  let offersSpy: jasmine.Spy;

  let stateRoutingService: StateRoutingService;
  let errorService: ErrorService;
  let borrowerInvoiceService: BorrowerInvoiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        RouterTestingModule.withRoutes([]),
        HttpClientTestingModule
      ],
      declarations: [ WaitingLendingOffersComponent ],
      providers: [
        CookieService,
        OfferService,
        UblService,
        ErrorService,
        LoggingService,
        MerchantService,
        BorrowerInvoiceService,
        StateRoutingService,
        UtilityService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    });

    fixture = TestBed.createComponent(WaitingLendingOffersComponent);
    component = fixture.componentInstance;

    borrowerInvoiceService = TestBed.inject(BorrowerInvoiceService);

    /**
     * Setup: OfferService
     */
    // Inject:
    offerService = TestBed.inject(OfferService);

    // Set spies:
    loadOffersSpy = spyOn(offerService, 'loadOffers$').and.returnValue(loadOffers$);
    offersSpy = spyOnProperty(offerService, 'offers$').and.returnValue(offers$);

    stateRoutingService = TestBed.inject(StateRoutingService);
    spyOn(stateRoutingService, 'navigate');

    errorService = TestBed.inject(ErrorService);
    spyOn(errorService, 'show');
  });

  afterEach(() => {
    clearTimeout(component.backoffConfig.timeoutId);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit()', () => {
    it('should call loadOffers()', () => {
      component.ngOnInit();

      expect(offerService.loadOffers$).toHaveBeenCalledTimes(1);
    });
  });

  describe('ngOnDestroy()', () => {
    it('should trigger the completion of observables', () => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
    });
  });

  describe('loadOffers()', () => {
    it('should poll for offers data only once if there is no lending offer(s)', () => {
      component.ngOnInit();

      expect(offerService.loadOffers$).toHaveBeenCalledTimes(1);
    });

    it('should redirect to no_offers if there are no lending offer(s)', () => {
      loadOffersSpy.and.returnValue(throwError(new ErrorResponse(expectationFailedFactory.build())));

      component.ngOnInit();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.error.no_offers, true);
      expect(errorService.show).not.toHaveBeenCalled();
    });

    it('should redirect to show proper error modal if API call failed for other reasons', () => {
      loadOffersSpy.and.returnValue(throwError(new ErrorResponse(internalServerErrorFactory.build())));

      component.ngOnInit();

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.getOffers);
      expect(stateRoutingService.navigate).not.toHaveBeenCalled();
    });
  }); // describe - loadOffers()

  describe('determineRoute()', () => {
    it('should navigate to dashboard if there are offers', () => {
      fixture.detectChanges();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root);
    });

    it('should navigate to dashboard even if there are only rejected offers', () => {
      spyOn(offerService, 'isOfferRejected').and.returnValue(true);

      fixture.detectChanges();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root);
    });

    it('should navigate to select_lending_offer when invoice is present', () => {
      spyOn(borrowerInvoiceService, 'hasActiveInvoiceSet').and.returnValue(true);
      spyOn(borrowerInvoiceService, 'getActiveInvoice').and.returnValue(borrowerInvoice);

      fixture.detectChanges();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.select_lending_offer, true);
    });
  }); // describe - determineRoute()

  describe('registerNextPollForLendingOffer()', () => {
    let initialRetryCounter: number;
    let originalTimeout: number;

    function calculateNextInterval(): number {
      // Calculate next backed-off interval using an exponential basis.
      const exponentialBasis = LENDING_OFFERS_POLLING.EXPONENTIAL_BASIS;
      const delayFactor = Math.pow(exponentialBasis, component.backoffConfig.retryCounter);
      return delayFactor * component.backoffConfig.initialInterval;
    }

    beforeEach(() => {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

      spyOn(offerService, 'offersExist').and.callThrough();

      initialRetryCounter = component.backoffConfig.retryCounter;
      expect(component.backoffConfig.maxAttempts).toEqual(LENDING_OFFERS_POLLING.MAX_ATTEMPTS);
    });

    afterEach(() => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
      clearTimeout(component.backoffConfig.timeoutId);
    });

    it('should only poll once if there are offers', () => {
      component.ngOnInit();

      expect(component.backoffConfig.retryCounter).toEqual(initialRetryCounter);
      expect(loadOffersSpy).toHaveBeenCalledTimes(1);
      expect(offerService.offersExist).toHaveBeenCalledTimes(1);
    });

    it('should register next polling if there are no offers', fakeAsync(() => {
      spyOn(window, 'clearTimeout').and.callThrough();
      loadOffersSpy.and.returnValue(noloadOffers$);
      offersSpy.and.returnValue(noOffers$);

      component.ngOnInit();

      tick(calculateNextInterval());

      loadOffersSpy.and.returnValue(loadOffers$);
      offersSpy.and.returnValue(offers$);

      fixture.detectChanges();

      expect(component.backoffConfig.retryCounter).toBeGreaterThan(initialRetryCounter);
      expect(loadOffersSpy).toHaveBeenCalledTimes(3);
      expect(offerService.offersExist).toHaveBeenCalledTimes(3);
      expect(window.clearTimeout).toHaveBeenCalledTimes(1);
    }));

    it('should not exceed the maxAttempts to register next polling if there are no offers', fakeAsync(() => {
      spyOn(window, 'clearTimeout').and.callThrough();
      loadOffersSpy.and.returnValue(noloadOffers$);
      offersSpy.and.returnValue(noOffers$);

      component.ngOnInit();

      while (component.backoffConfig.retryCounter < component.backoffConfig.maxAttempts) {
        tick(calculateNextInterval());

        fixture.detectChanges();
      }

      expect(component.backoffConfig.retryCounter).toBeGreaterThan(initialRetryCounter);
      expect(loadOffersSpy).toHaveBeenCalledTimes(component.backoffConfig.maxAttempts + 1);
      expect(offerService.offersExist).toHaveBeenCalledTimes(component.backoffConfig.maxAttempts + 1);
      expect(window.clearTimeout).toHaveBeenCalledTimes(1);
    }));
  }); // describe - registerNextPollForLendingOffer()
});
