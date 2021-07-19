import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, waitForAsync } from '@angular/core/testing';
import {
  ALL_APP_STATES,
  APPROVED_APP_STATES,
  BEFORE_APPROVED_APP_STATES,
  COMPLETED_APP_STATES,
  COMPLETING_APP_STATES,
  DISREGARDED_APP_STATES,
  IN_PROGRESS_APP_STATES
} from 'app/models/api-entities/lending-application';
import { ALL_OFFER_STATES, ApplicationSummary } from 'app/models/api-entities/offer';
import { ApplicationState, OfferState } from 'app/models/api-entities/utility';
import { HTTP_ERRORS } from 'app/test-stubs/api-errors-stubs';
import { applicationSummaryFactory } from 'app/test-stubs/factories/application-summary';
import { offerFee } from 'app/test-stubs/factories/lending/offer-fee';
import {
  offer,
  offerAccepted,
  offerActive,
  offerApproved,
  offerApprovedWithNonSignedApp,
  offerApprovedWithSignedApp,
  offerFactory,
  offerPending,
  offerProcessing,
  offerRejected,
  offerUnsupportedOfferTypeApproved,
  offerWca,
  offerWcaFactory
} from 'app/test-stubs/factories/lending/offers';
import { noOffers$, offer$, offerFee$, offers, offers$ } from 'app/test-stubs/factories/lending/offer-stubs';

import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { API_LENDING, SELECTED_OFFER_ID_KEY } from '../constants';
import { OfferService } from 'app/services/offer.service';
import { UtilityService } from './utility.service';
import { LoggingService } from 'app/services/logging.service';
import { LogMessage, LogSeverity } from 'app/models/api-entities/log';

describe('OfferService', () => {
  let httpMock: HttpTestingController;
  let loggingService: LoggingService;
  let utilityService: UtilityService;

  /**
   * Configure: OfferService
   */
  let offerService: OfferService;

  // Spies:
  let offersPropertySpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OfferService,
        LoggingService,
        // --- inherited
        CookieService,
        UtilityService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    /**
     * Setup: OfferService
     */
    // Inject:
    offerService = TestBed.inject(OfferService);

    // Set spies:
    offersPropertySpy = spyOnProperty(offerService, 'offers$').and.returnValue(offers$);

    /**
     * Setup: LoggingService
     */
    // Inject:
    loggingService = TestBed.inject(LoggingService);
    spyOn(loggingService, 'log');

    /**
     * Setup: HttpTestingController
     */
    // Inject:
    httpMock = TestBed.inject(HttpTestingController);

    /**
     * Setup: UtilitiesService
     */
    // Inject:
    utilityService = TestBed.inject(UtilityService);
  });

  afterEach(() => {
    httpMock.verify();
    offerService.clearOfferFee();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(offerService).toBeTruthy();
  });

  describe('offers', () => {
    it('should initially be set to []', () => {
      offersPropertySpy.and.callThrough();
      expect(offerService.offers$.value).toEqual([]);
    });
  });

  describe('setOffer()', () => {
    beforeEach(() => {
      spyOn(localStorage, 'removeItem');
      spyOn(localStorage, 'setItem');
    });

    describe('with a valid offer', () => {
      it('should set internal offer and adjust local storage', () => {
        offerService.setOffer(offer);

        expect(localStorage.setItem).toHaveBeenCalledWith(SELECTED_OFFER_ID_KEY, offer.id);
        expect(localStorage.removeItem).not.toHaveBeenCalledWith(SELECTED_OFFER_ID_KEY);
        expect(offerService.offer$.value).toEqual(offer);
      });
    }); // describe - with a valid offer

    describe('with an invalid offer', () => {
      it('should not save offer to local storage, and assign the service offer', () => {
        offerService.setOffer(null);

        expect(localStorage.setItem).not.toHaveBeenCalledWith(SELECTED_OFFER_ID_KEY, null);
        expect(localStorage.removeItem).toHaveBeenCalledWith(SELECTED_OFFER_ID_KEY);
        expect(offerService.offer$.value).toEqual(null);
      });
    }); // describe - with a valid offer
  }); // describe - setOffer()

  describe('currentOfferId', () => {
    beforeEach(() => {
      spyOn(localStorage, 'getItem').and.callThrough();
    });

    it('should return offer id if offer id is set in localStorage', () => {
      offerService.setOffer(offer);

      expect(offerService.currentOfferId).toEqual(offer.id);
      expect(localStorage.getItem).toHaveBeenCalledOnceWith(SELECTED_OFFER_ID_KEY);
    });

    it('should return null if offer id is not set in localStorage', () => {
      offerService.setOffer(null);

      expect(offerService.currentOfferId).toBeNull();
      expect(localStorage.getItem).toHaveBeenCalledOnceWith(SELECTED_OFFER_ID_KEY);
    });
  });

  describe('selectedOffer()', () => {
    beforeEach(() => {
      spyOn(offerService, 'findOfferById').and.callThrough();
    });

    it('should return the currently selected Offer', () => {
      spyOnProperty(offerService, 'currentOfferId').and.returnValue(offer.id);

      expect(offerService.selectedOffer).toEqual(offer);
    });

    it('should not return any Offer if there is none already selected', () => {
      spyOnProperty(offerService, 'currentOfferId').and.returnValue(null);

      expect(offerService.selectedOffer).toBeUndefined();
    });
  }); // describe - selectedOffer()

  describe('locOffer', () => {
    it('should return the first LoC Offer it finds', () => {
      expect(offerService.locOffer).toEqual(offer);
    });

    it('should be undefined if there are no LoC offers', () => {
      offersPropertySpy.and.returnValue(new BehaviorSubject([offerWca]));

      expect(offerService.locOffer).toBeUndefined();
    });

    it('should be undefined if there are no offers', () => {
      offersPropertySpy.and.returnValue(undefined);

      expect(offerService.locOffer).toBeUndefined();
    });
  }); // describe - locOffer

  describe('wcaOffer', () => {
    it('should return the first WCA Offer it finds', () => {
      expect(offerService.wcaOffer).toEqual(offerWca);
    });

    it('should be undefined if there are no WCA offers', () => {
      offersPropertySpy.and.returnValue(new BehaviorSubject([offer]));

      expect(offerService.wcaOffer).toBeUndefined();
    });

    it('should be undefined if there are no offers', () => {
      offersPropertySpy.and.returnValue(undefined);

      expect(offerService.wcaOffer).toBeUndefined();
    });
  }); // describe - wcaOffer

  describe('loadOffers()', () => {
    describe('HttpRequest returns status: 200', () => {
      function returnStatusSuccess() {
        const url = API_LENDING.GET_OFFERS_PATH;
        const offerRequest = httpMock.expectOne(url);

        expect(offerRequest.request.method).toEqual('GET');
        offerRequest.flush({ status: 200, statusText: 'OK', data: offers });
      }

      it('should be able to successfully load offers', () => {
        offerService.loadOffers$()
          .pipe(take(1))
          .subscribe(
            (res) => expect(res.data).toEqual(offers),
            (err) => fail('Prevented silent failure of this unit test: ' + err)
          );

        returnStatusSuccess();
      });

      it('should set offers behaviour subject when successfully loading offers', () => {
        offerService.loadOffers$()
          .pipe(take(1))
          .subscribe(
            (res) => expect(res.data).toEqual(offers),
            (err) => fail('Prevented silent failure of this unit test: ' + err)
          );

        returnStatusSuccess();

        expect(offerService.offers$).toEqual(offers$);
      });
    }); // describe - HttpRequest returns status: 200

    describe('HttpRequest returns status: HttpErrorResponse', () => {
      it('should pass down an error to caller if loading offers returns an http error', () => {
        HTTP_ERRORS.forEach(httpError => {
          offerService.loadOffers$()
            .pipe(take(1))
            .subscribe(
              (res) => fail('Prevented silent failure of this unit test: ' + res),
              (err) => expect(err.status).toEqual(httpError.status)
            );

          const url = API_LENDING.GET_OFFERS_PATH;
          const offerRequest = httpMock.expectOne(url);

          expect(offerRequest.request.method).toEqual('GET');
          offerRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
        });
      });
    }); // describe - HttpRequest returns status: HttpErrorResponse
  }); // describe - loadOffers()

  describe('loadOffer()', () => {
    describe('HttpRequest returns status: 200', () => {
      function returnStatusSuccess() {
        const url = API_LENDING.GET_OFFER_PATH.replace(':id', offer.id);
        const offerRequest = httpMock.expectOne(url);

        expect(offerRequest.request.method).toEqual('GET');
        offerRequest.flush({ status: 200, statusText: 'OK', data: offer });
      }

      describe('without supplierId', () => {
        it('should be able to successfully load an offer for a specific Id', () => {
          offerService.loadOffer$(offer.id)
            .pipe(take(1))
            .subscribe(
              (res) => expect(res.data).toEqual(offer),
              (err) => fail('Prevented silent failure of this unit test: ' + err)
            );

          returnStatusSuccess();
        });

        it('should set offer behaviour subject when successfully getting lending offer', () => {
          offerService.loadOffer$(offer.id)
            .pipe(take(1))
            .subscribe(
              (res) => expect(res.data).toEqual(offer),
              (err) => fail('Prevented silent failure of this unit test: ' + err)
            );

          returnStatusSuccess();

          expect(offerService.offer$).toEqual(offer$);
        });
      }); // describe - without supplierId

      describe('with supplierId', () => {
        it('should set offer behaviour subject when successfully getting lending offer with supplier ID', () => {
          offerService.loadOffer$(offer.id, 'su_123')
            .pipe(take(1))
            .subscribe(
              (res) => expect(res.data).toEqual(offer),
              (err) => fail('Prevented silent failure of this unit test: ' + err)
            );

          const url = utilityService.getAugmentedUrl(API_LENDING.GET_OFFER_PATH.replace(':id', offer.id), { supplier_id: 'su_123' });
          const offerRequest = httpMock.expectOne(url);

          expect(offerRequest.request.method).toEqual('GET');
          offerRequest.flush({ status: 200, statusText: 'OK', data: offer });

          expect(offerService.offer$).toEqual(offer$);
        });

        describe('that is an invalid supplierId', () => {
          it('should set offer behaviour subject when successfully getting lending offer with undefined supplier ID', () => {
            offerService.loadOffer$(offer.id, undefined)
              .pipe(take(1))
              .subscribe(
                (res) => expect(res.data).toEqual(offer),
                (err) => fail('Prevented silent failure of this unit test: ' + err)
              );

            returnStatusSuccess();

            expect(offerService.offer$).toEqual(offer$);
          });

          it('should set offer behaviour subject when successfully getting lending offer with null supplier ID', () => {
            offerService.loadOffer$(offer.id, null)
              .pipe(take(1))
              .subscribe(
                (res) => expect(res.data).toEqual(offer),
                (err) => fail('Prevented silent failure of this unit test: ' + err)
              );

            returnStatusSuccess();

            expect(offerService.offer$).toEqual(offer$);
          });
        }); // describe - that is an invalid supplierId
      }); // describe - with supplierId
    }); // describe - HttpRequest returns status: 200

    describe('HttpRequest returns status: HttpErrorResponse', () => {
      it('should pass down an error to caller if getting lending offer returns an http error', () => {
        HTTP_ERRORS.forEach(httpError => {
          offerService.loadOffer$(offer.id)
            .pipe(take(1))
            .subscribe(
              (res) => fail('Prevented silent failure of this unit test: ' + res),
              (err) => expect(err.status).toEqual(httpError.status)
            );

          const url = API_LENDING.GET_OFFER_PATH.replace(':id', offer.id);
          const offerRequest = httpMock.expectOne(url);

          expect(offerRequest.request.method).toEqual('GET');
          offerRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
        });
      });
    }); // describe - HttpRequest returns status: HttpErrorResponse
  }); // describe - loadOffer()

  describe('loadOfferFee()', () => {
    const enteredPrincipalAmount = 500;
    const loanTerm = offer.available_terms[0];

    describe('HttpRequest returns status: 200', () => {
      function returnStatusSuccess() {
        const url = `${API_LENDING.GET_OFFER_FEE_PATH}?id=${offer.id}&principal_amount=${enteredPrincipalAmount}&loan_term_id=${loanTerm.id}`;
        const offerFeeRequest = httpMock.expectOne(url);

        expect(offerFeeRequest.request.method).toEqual('GET');
        offerFeeRequest.flush({ status: 200, statusText: 'OK', data: offerFee });
      }

      it('should be able to successfully get OfferFee', () => {
        offerService.loadOfferFee$(offer.id, enteredPrincipalAmount, loanTerm)
          .pipe(take(1))
          .subscribe(
            (res) => expect(res.data).toEqual(offerFee),
            (err) => fail('Prevented silent failure of this unit test:' + err)
          );

        returnStatusSuccess();
      });

      it('should set OfferFee behaviour subject when successfully getting OfferFee', () => {
        offerService.loadOfferFee$(offer.id, enteredPrincipalAmount, loanTerm)
          .pipe(take(1))
          .subscribe(
            (res) => expect(res.data).toEqual(offerFee),
            (err) => fail('Prevented silent failure of this unit test: ' + err)
          );

        returnStatusSuccess();

        expect(offerService.offerFee$).toEqual(offerFee$);
      });
    });

    describe('HttpRequest returns status: HttpErrorResponse', () => {
      it('should pass down an error to caller if getting an offer fee returns an http error', () => {
        HTTP_ERRORS.forEach(httpError => {
          offerService.loadOfferFee$(offer.id, enteredPrincipalAmount, loanTerm)
            .pipe(take(1))
            .subscribe(
              (res) => fail('Prevented silent failure of this unit test: ' + res),
              (err) => expect(err.status).toEqual(httpError.status)
            );

          const url = `${API_LENDING.GET_OFFER_FEE_PATH}?id=${offer.id}&principal_amount=${enteredPrincipalAmount}&loan_term_id=${loanTerm.id}`;
          const offerFeeRequest = httpMock.expectOne(url);

          expect(offerFeeRequest.request.method).toEqual('GET');
          offerFeeRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
        });
      });
    }); // describe - HttpRequest returns status: HttpErrorResponse
  }); // describe - loadOfferFee()

  describe('offersExist()', () => {
    describe('offers$ is VALID', () => {
      it('should return true if there are offers', () => {
        expect(offerService.offersExist()).toBeTrue();
      });
    }); // describe - offers$ is VALID

    describe('offers$ is an INVALID array', () => {
      beforeEach(() => {
        offersPropertySpy.and.returnValue(new BehaviorSubject([null, undefined]))
      });

      it('should return false if there are no valid offers', () => {
        expect(offerService.offersExist()).toBeFalse();
      });
    }); // describe - offers$ is an INVALID array

    describe('offers$ is EMPTY', () => {
      beforeEach(() => {
        offersPropertySpy.and.returnValue(noOffers$)
      });

      it('should return false if there are no offers', () => {
        expect(offerService.offersExist()).toBeFalse();
      });
    }); // describe - offers$ is EMPTY
  }); // describe - offersExist()

  describe('isAnOffer()', () => {
    it('should return TRUE when the offer is VALID', () => {
      expect(offerService.isAnOffer(offer)).toBeTrue();
    });

    it('should return FALSE when the offer is INVALID', () => {
      const invalidOffer = offerFactory.build({
        application_prerequisites: {
          offer_type: undefined
        }
      });
      expect(offerService.isAnOffer(invalidOffer)).toBeFalse();
    });

    it('should return FALSE when the offer is UNDEFINED', () => {
      expect(offerService.isAnOffer(undefined)).toBeFalse();
    });

    it('should return FALSE when the offer is NULL', () => {
      expect(offerService.isAnOffer(null)).toBeFalse();
    });
  }); // describe - isAnOffer()

  describe('findOfferById()', () => {
    it('should return the Offer associated with the param id', () => {
      expect(offerService.findOfferById(offer.id)).toEqual(offer);
    });

    it('should return undefined if no Offer is associated with a valid offerId', () => {
      expect(offerService.findOfferById(`${offer.id}123`)).toBeUndefined();
    });

    it('should return undefined with an invalid offerId', () => {
      expect(offerService.findOfferById(null)).toBeUndefined();
    });

    it('should return null if can not find an offer matching the id in empty offers', () => {
      offersPropertySpy.and.returnValue(noOffers$);

      expect(offerService.findOfferById(offer.id)).toBeUndefined();
    });
  }); // describe - findOfferById()

  describe('findOffersByState()', () => {
    const mockedStates: OfferState[] = [
      OfferState.pending,
      OfferState.approved,
      OfferState.accepted,
      OfferState.processing,
      OfferState.active,
      OfferState.rejected
    ];

    const mockedOffers = [
      offerPending,
      offerApproved,
      offerAccepted,
      offerProcessing,
      offerActive,
      offerRejected
    ];

    it('should be able to find Offer in any OfferState', () => {
      offersPropertySpy.and.returnValue(new BehaviorSubject(mockedOffers));

      mockedOffers.forEach((offer, index) => {
        expect(offerService.findOffersByState(mockedStates[index])).toEqual([offer]);
      });
    });

    it('should not find any Offer when none exist', () => {
      offersPropertySpy.and.returnValue(noOffers$);

      mockedStates.forEach((state) => {
        expect(offerService.findOffersByState(state)).toEqual([]);
      });
    });

    it('should be undefined if there are no offers', () => {
      offersPropertySpy.and.returnValue(undefined);

      expect(offerService.findOffersByState(OfferState.approved)).toBeUndefined();
    });
  }); // describe - findOffersByState()

  describe('loadSelectedOffer()', () => {
    it('should set the proper Offer when a selected Offer exists', () => {
      spyOnProperty(offerService, 'selectedOffer').and.returnValue(offer);

      offerService.loadSelectedOffer();

      expect(offerService.offer$.value).toEqual(offer);
    });

    it('should not set anything if there is no selected Offer', () => {
      spyOnProperty(offerService, 'selectedOffer').and.returnValue(null);
      spyOn(offerService, 'setOffer');

      offerService.loadSelectedOffer();

      expect(offerService.setOffer).not.toHaveBeenCalled();
    });
  }); // describe - loadSelectedOffer()

  describe('isOfferLoc()', () => {
    it('should only return true for LoC Offer', () => {
      expect(offerService.isOfferLoc(offer)).toEqual(true);
      expect(offerService.isOfferLoc(offerWca)).toEqual(false);
    });

    it('should return false if the offer is invalid', () => {
      expect(offerService.isOfferLoc(undefined)).toEqual(false);
      expect(offerService.isOfferLoc(null)).toEqual(false);
    });
  }); // describe - isOfferLoc()

  describe('isOfferWca()', () => {
    it('should only return true for WCA Offer', () => {
      expect(offerService.isOfferWca(offer)).toEqual(false);
      expect(offerService.isOfferWca(offerWca)).toEqual(true);
    });

    it('should return false if the offer is invalid', () => {
      expect(offerService.isOfferWca(undefined)).toEqual(false);
      expect(offerService.isOfferWca(null)).toEqual(false);
    });
  }); // describe - isOfferWca()

  describe('isOfferRejected()', () => {
    it('should return false if offer is in any state other than rejected', () => {
      const offerStates = ALL_OFFER_STATES.filter((offerState: OfferState) => offerState !== OfferState.rejected);

      offerStates.forEach((offerState) => {
        const offer = offerFactory.build({ state: offerState });

        expect(offerService.isOfferRejected(offer)).toEqual(false);
      });
    });

    it('should return true if offer is in rejected state', () => {
      const offer = offerFactory.build({ state: OfferState.rejected });

      expect(offerService.isOfferRejected(offer)).toEqual(true);
    });

    it('should return false if offer is null or undefined', () => {
      const values = [null, undefined];

      values.forEach((val) => {
        expect(offerService.isOfferRejected(val)).toEqual(false);
      });
    });

    it('should return false if offer state is null or undefined', () => {
      const values = [null, undefined];

      values.forEach((val) => {
        const offer = offerFactory.build({ state: val });

        expect(offerService.isOfferRejected(offer)).toEqual(false);
      });
    });
  }); // describe - isOfferRejected()

  describe('isTemporarilyAvailable()', () => {
    it('should return true if offer is in rejected state and has an application in progress', () => {
      IN_PROGRESS_APP_STATES.forEach((appState) => {
        const appSummary = applicationSummaryFactory.build({ state: appState });
        const offer = offerFactory.build({ state: OfferState.rejected, applications_in_progress: [appSummary] });

        expect(offerService.isOfferTemporarilyAvailable(offer)).toEqual(true);
      });
    });

    it('should return false if offer is not in rejected state,', () => {
      const otherStates = Object.values(OfferState).filter((offerState) => offerState !== OfferState.rejected);

      otherStates.forEach((offerState) => {
        const offer = offerFactory.build({ state: offerState });

        expect(offerService.isOfferTemporarilyAvailable(offer)).toEqual(false);
      });
    });

    it('should return false if offer is in rejected state but does not have an application in progress', () => {
      const nonProgressAppStates = ALL_APP_STATES.filter((offerState) => !IN_PROGRESS_APP_STATES.includes(offerState));

      nonProgressAppStates.forEach((appState) => {
        const appSummary = applicationSummaryFactory.build({ state: appState });
        const offer = offerFactory.build({ applications_in_progress: [appSummary] });

        expect(offerService.isOfferTemporarilyAvailable(offer)).toEqual(false);
      });
    });
  }); // describe - isTemporarilyAvailable()

  describe('isOfferAvailable()', () => {
    it('should return true if Offer is not rejected', () => {
      spyOn(offerService, 'isOfferRejected').and.returnValue(false);

      expect(offerService.isOfferAvailable(offer)).toEqual(true);
    });

    it('should return true if Offer is temporarily available', () => {
      spyOn(offerService, 'isOfferTemporarilyAvailable').and.returnValue(true);

      expect(offerService.isOfferAvailable(offer)).toEqual(true);
    });

    it('should return false if Offer is rejected and not temporarily available', () => {
      spyOn(offerService, 'isOfferRejected').and.returnValue(true);
      spyOn(offerService, 'isOfferTemporarilyAvailable').and.returnValue(false);

      expect(offerService.isOfferAvailable(offer)).toEqual(false);
    });
  }); // describe - isOfferAvailable()

  describe('getExpiryDate()', () => {
    it('should return expires_at', () => {
      const date = new Date();
      const _offer = offerFactory.build({ expires_at: date.toISOString() });
      expect(offerService.getExpiryDate(_offer)).toEqual(date);
    });

    it('should return null if expires_at is not set', () => {
      const _offer = offerFactory.build({ expires_at: undefined });
      expect(offerService.getExpiryDate(_offer)).toBeNull();
    });
  });

  describe('isOfferExpired()', () => {
    it('should return true for expired offers', () => {
      const testOffer = offerFactory.build({ state: OfferState.expired });

      expect(offerService.isOfferExpired(testOffer)).toBeTrue();
    });

    it('should return false for valid offers', () => {
      expect(offerService.isOfferExpired(offer)).toBeFalse();
    });
  });

  describe('checkOfferValid()', () => {
    it('should return true if param Offer exists and is available', () => {
      expect(offerService.checkOfferValid(offer)).toBeTrue();

      expect(loggingService.log).not.toHaveBeenCalled();
    });

    it('should return false and log the error if the Offer is null', () => {
      expect(offerService.checkOfferValid(undefined)).toBeFalse();

      const logMessage: LogMessage = { message: 'Component initialized with undefined Offer.', severity: LogSeverity.warn };

      expect(loggingService.log).toHaveBeenCalledOnceWith(logMessage);
    });
  }); // describe - checkOfferValid()

  describe('checkOfferTypeValid()', () => {
    it('should return true if param LendingOfferType is valid', () => {
      expect(offerService.checkOfferTypeValid(offer.application_prerequisites.offer_type)).toBeTrue();
    });

    it('should return false if param LendingOfferType is invalid', () => {
      expect(offerService.checkOfferTypeValid(null)).toBeFalse();

      const logMessage: LogMessage = { message: 'Component initialized with undefined OfferType.', severity: LogSeverity.warn };
      expect(loggingService.log).toHaveBeenCalledOnceWith(logMessage);
    });
  }); // describe - checkOfferTypeValid()

  describe('getInProgressApplication()', () => {
    it('should return the first application summary for the offer if there is at least 1 application in progress for the offer', () => {
      const appSummary1 = applicationSummaryFactory.build({ id: 'lap_1' });
      const appSummary2 = applicationSummaryFactory.build({ id: 'lap_2' });
      const appsInProgress = [appSummary1, appSummary2];
      const offer = offerFactory.build({ applications_in_progress: appsInProgress });

      expect(offerService.getInProgressApplication(offer)).toEqual(appsInProgress[0]);
    });

    it('should return undefined if there are no applications in progress for the offer', () => {
      const offer = offerFactory.build({ applications_in_progress: [] });

      expect(offerService.getInProgressApplication(offer)).toBeUndefined();
    });

    it('should return undefined if offer is not defined', () => {
      expect(offerService.getInProgressApplication(undefined)).toBeUndefined();
    });
  }); // describe - getInProgressApplication()

  describe('getOfferApplicationState()', () => {
    let getInProgressApplicationSpy: jasmine.Spy;

    function testOfferState(stateEntities: ApplicationState[], returnString: string) {
      stateEntities.forEach((applicationState) => {
        const appSummary = applicationSummaryFactory.build({ state: applicationState });
        getInProgressApplicationSpy.and.returnValue(appSummary);

        expect(offerService.getOfferApplicationState(offer)).toEqual(returnString);
      });
    }

    beforeEach(() => {
      getInProgressApplicationSpy = spyOn(offerService, 'getInProgressApplication');
    });

    it('should return APPROVED when ApplicationState is approved', () => {
      testOfferState(APPROVED_APP_STATES, 'APPROVED');
    });

    it('should return IN_PROGRESS when ApplicationState is in progress', () => {
      testOfferState(BEFORE_APPROVED_APP_STATES.concat(COMPLETING_APP_STATES), 'IN_PROGRESS');
    });

    it('should return INVALID when ApplicationState is in invalid', () => {
      testOfferState(DISREGARDED_APP_STATES, 'INVALID');
    });

    it('should return NEW when ApplicationState is completed', () => {
      testOfferState(COMPLETED_APP_STATES, 'NEW');
    });

    it('should return undefined if param Offer is invalid', () => {
      expect(offerService.getOfferApplicationState(undefined)).toBeUndefined();
    });

    it('should return undefined if the param Offer application state is invalid', () => {
      getInProgressApplicationSpy.and.returnValue(undefined);
      expect(offerService.getOfferApplicationState(undefined)).toBeUndefined();
    });
  }); // describe - getOfferApplicationState()

  describe('getOfferAvailableAmount()', () => {
    it('should return 0 for invalid Offer', () => {
      expect(offerService.getOfferAvailableAmount(offerUnsupportedOfferTypeApproved)).toEqual(0);
      expect(offerService.getOfferAvailableAmount(undefined)).toEqual(0);
      expect(offerService.getOfferAvailableAmount(null)).toEqual(0);
    });

    it('should return the proper amount when the available_amount - in_progress_amount is > 0', () => {
      const testOffer = offerFactory.build({ available_amount: 5000, in_progress_amount: 500 });

      expect(offerService.getOfferAvailableAmount(testOffer)).toEqual(testOffer.available_amount - testOffer.in_progress_amount);
    });

    it('should return 0 when the available_amount - in_progress_amount is < 0', () => {
      const testOffer = offerFactory.build({ available_amount: 400, in_progress_amount: 500 });

      expect(offerService.getOfferAvailableAmount(testOffer)).toEqual(0);
    });

    it('should return 0 when the available_amount - in_progress_amount == 0', () => {
      const testOffer = offerFactory.build({ available_amount: 500, in_progress_amount: 500 });

      expect(offerService.getOfferAvailableAmount(testOffer)).toEqual(0);
    });
  }); // describe - getOfferAvailableAmount()

  describe('getOfferWcaAvailableAmount()', () => {
    const offerMaxAmount = 60000;

    function testOfferAmount(
      stateEntities: ApplicationState[],
      applicationSummary: ApplicationSummary,
      validAmount: number
    ) {
      stateEntities.forEach((applicationState) => {
        applicationSummary.state = applicationState;
        const offerWca = offerWcaFactory.build({ max_principal_amount: offerMaxAmount, applications_in_progress: [applicationSummary] });
        expect(offerService.getOfferWcaAvailableAmount(offerWca)).toEqual(validAmount);
      });
    }

    it('should return max_principal_amount from application if application is in post-approval state', () => {
      const applicationMaxAmount = 35000;
      const applicationSummary = applicationSummaryFactory.build({ max_principal_amount: applicationMaxAmount });

      testOfferAmount(APPROVED_APP_STATES, applicationSummary, applicationMaxAmount);
    });

    it('should return requested_amount if application is in pre-approval state', () => {
      const applicationRequestedAmount = 30000;
      const applicationSummary = applicationSummaryFactory.build({ requested_amount: applicationRequestedAmount });

      testOfferAmount(BEFORE_APPROVED_APP_STATES, applicationSummary, applicationRequestedAmount);
    });

    it('should return max_principal_amount from offer for any other application state', () => {
      const applicationMaxAmount = 35000;
      const applicationSummary = applicationSummaryFactory.build({ max_principal_amount: applicationMaxAmount });
      const REMAINING_STATES = ALL_APP_STATES
        .filter((applicationState) => {
          return !(BEFORE_APPROVED_APP_STATES.concat(COMPLETING_APP_STATES, APPROVED_APP_STATES)).includes(applicationState);
        });

      testOfferAmount(REMAINING_STATES, applicationSummary, offerMaxAmount);
    });

    it('should return max_principal_amount if there is no applictation in progress', () => {
      const offerWca = offerWcaFactory.build({ max_principal_amount: offerMaxAmount, applications_in_progress: [] });
      expect(offerService.getOfferWcaAvailableAmount(offerWca)).toEqual(offerMaxAmount);
    });

    it('should return 0 if offer is undefined', () => {
      expect(offerService.getOfferWcaAvailableAmount(undefined)).toEqual(0);
    });

    it('should return 0 if offer.application_prerequisites are undefined', () => {
      const noPrerequisitesOffer = offerFactory.build({ application_prerequisites: null });
      expect(offerService.getOfferWcaAvailableAmount(noPrerequisitesOffer)).toEqual(0);
    });

    it('should return 0 for invalid Offer', () => {
      expect(offerService.getOfferWcaAvailableAmount(offerUnsupportedOfferTypeApproved)).toEqual(0);
    });
  }); // describe - getOfferWcaAvailableAmount()

  describe('getOfferCapacity()', () => {
    it('should return a percent based on the Offer available_amount, and the max_principal_amount', () => {
      const offerAvailableAmount = 1900;
      spyOn(offerService, 'getOfferAvailableAmount').and.returnValue(offerAvailableAmount);

      const expectedCapacity = (offerAvailableAmount / offer.max_principal_amount) * 100;
      expect(offerService.getOfferCapacity(offer)).toEqual(expectedCapacity);
    });

    it('should return 0 if the offerMaxAmount returns an invalid amount', () => {
      expect(offerService.getOfferCapacity(undefined)).toEqual(0);
    });
  }); // describe - getOfferCapacity()

  describe('getOfferFundsAccessible()', () => {
    it('should return true if getOfferAvailableAmount() is >= min_principal_amount', () => {
      spyOn(offerService, 'getOfferAvailableAmount').and.returnValue(501);

      expect(offerService.getOfferFundsAccessible(offer)).toBeTrue();
    });

    it('should return false if getOfferAvailableAmount() is < min_principal_amount', () => {
      spyOn(offerService, 'getOfferAvailableAmount').and.returnValue(499);

      expect(offerService.getOfferFundsAccessible(offer)).toBeFalse();
    });

    it('should return false if the Offer is invalid', () => {
      expect(offerService.getOfferFundsAccessible(undefined)).toBeFalse();
    });
  }); // describe - getOfferFundsAccessible()

  describe('setOfferToLoc()', () => {
    it('should set the local Offer to the first loc from offers', () => {
      offerService.setOfferToLoc();

      expect(offerService.offer$.value).toEqual(offer);
    });

    it('should not set the local Offer when there is no LoC Offer in offers', () => {
      const noLocLendingOffers$ = new BehaviorSubject([offerWca]);
      offersPropertySpy.and.returnValue(noLocLendingOffers$);

      offerService.setOfferToLoc();

      expect(offerService.offer$.value).toBeUndefined();
    });

    it('should not set the local Offer when there are no offers in offers', () => {
      offersPropertySpy.and.returnValue(noOffers$);

      offerService.setOfferToLoc();

      expect(offerService.offer$.value).toBeUndefined();
    });
  }); // describe - setOfferToLoc()

  describe('blockOnKycFailed()', () => {
    it('should return false if offer is rejected', () => {
      expect(offerService.blockOnKycFailure(offerRejected)).toBeFalsy();
    });

    it('should return false if offer is not set', () => {
      expect(offerService.blockOnKycFailure(undefined)).toBeFalsy();
    });

    it('should return false if offer is failed kyc and no applications', () => {
      expect(offerService.blockOnKycFailure(offer)).toBeFalsy();
    });

    it('should return true if offer is failed kyc and has an application prior to accepted', () => {
      expect(offerService.blockOnKycFailure(offerApprovedWithNonSignedApp)).toBeFalsy();
    });

    it('should return true if offer is failed kyc and has an application accepted or past', () => {
      expect(offerService.blockOnKycFailure(offerApprovedWithSignedApp)).toBeTruthy();
    });
  }); // describe - blockOnKycFailed()


  describe('clearCurrentOffer()', () => {
    it('should clear the current Offer', () => {
      offerService.setOffer(offer);
      expect(offerService.offer$.value).toEqual(offer);

      offerService.clearCurrentOffer();

      expect(offerService.offer$.value).toBeNull();
    });
  }); // describe - clearCurrentOffer()

  describe('clearOfferFee()', () => {
    it('should clear the current OfferFee', () => {
      offerService.loadOfferFee$(offer.id, 500, offer.available_terms[0])
        .pipe(take(1))
        .subscribe(
          (res) => expect(res.data).toEqual(offerFee),
          (err) => fail('Prevented silent failure of this unit test:' + err)
        );

      const url = `${API_LENDING.GET_OFFER_FEE_PATH}?id=${offer.id}&principal_amount=${500}&loan_term_id=${offer.available_terms[0].id}`;
      const offerFeeRequest = httpMock.expectOne(url);

      expect(offerFeeRequest.request.method).toEqual('GET');
      offerFeeRequest.flush({ status: 200, statusText: 'OK', data: offerFee });

      expect(offerService.offerFee$.value).toEqual(offerFee);

      offerService.clearOfferFee();

      expect(offerService.offerFee$.value).toBeNull();
    });
  }); // describe - clearOfferFee()
});
