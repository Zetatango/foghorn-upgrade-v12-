import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

import { LendingAgreement } from 'app/models/api-entities/lending-agreement';

import { ApplicationProgress, LendingApplicationsService } from 'app/services/lending-applications.service';
import { UtilityService } from 'app/services/utility.service';

import { post_goodLendingApplication,
         get_goodLendingApplicationPadAgreementResponse,
         goodLendingApplicationPadAgreement,
         get_goodLendingApplicationTermsResponse,
         goodLendingApplicationTerms,
         put_goodLendingApplicationAcceptResponse,
         goodLendingApplicationAcceptResponse
       } from 'app/test-stubs/api-entities-stubs';
import { COMPLETED_APP_STATES,
         FAILED_APP_STATES,
         IN_PROGRESS_APP_STATES
       } from 'app/models/api-entities/lending-application';
import {
  lendingApplicationPending,
  lendingApplicationApproved,
  lendingApplicationAccepted,
  lendingApplicationMultiDocsRequired,
  lendingApplicationNoDocsRequired,
  lendingApplicationWcaPending,
  ALL_lendingApplications,
  IN_PROGRESS_lendingApplications,
  COMPLETED_lendingApplications,
  FAILED_lendingApplications,
  lendingApplicationApproving,
  BEFORE_APPROVED_lendingApplications,
  COMPLETING_lendingApplications,
  NON_COMPLETING_lendingApplications, lendingApplicationFactory, APPROVED_lendingApplications
} from 'app/test-stubs/factories/lending-application';

import { API_LENDING_APPLICATIONS } from '../constants';
import { lendingTerm60Days } from 'app/test-stubs/factories/lending-term';
import { lendingApplicationFee } from 'app/test-stubs/factories/lending-application-fee';
import { CookieService } from 'ngx-cookie-service';
import { lendingPayoutCra, lendingPayoutLandlord, lendingPayoutOther } from 'app/test-stubs/factories/lending-offline-payout';
import { HTTP_ERRORS } from 'app/test-stubs/api-errors-stubs';

describe('LendingApplicationsService', () => {
  let lendingApplicationsService: LendingApplicationsService;
  let httpMock: HttpTestingController;

  const sampleApplicationId = 'lap_Wvni1YRaT6Mr8pyT';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [ CookieService, UtilityService, LendingApplicationsService ]
    });
  });

  beforeEach(() => {
    lendingApplicationsService = TestBed.inject(LendingApplicationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });


  it('should be created', () => {
    expect(lendingApplicationsService).toBeTruthy();
  });

  // API CALLS

  // ----------------------------------------------------------------------- postApplication()
  describe('postApplication()', () => {
    it('should be able to post a lending application data', () => {
      lendingApplicationsService.postApplication(post_goodLendingApplication)
        .pipe(take(1))
        .subscribe((res) => expect(res.data).toEqual(lendingApplicationApproved));

      const lendingApplicationRequest = httpMock.expectOne(API_LENDING_APPLICATIONS.POST_NEW_PATH);
      expect(lendingApplicationRequest.request.method).toEqual('POST');
      lendingApplicationRequest.flush({ status: 200, statusText: 'OK', data: lendingApplicationApproved });
    });

    it('lendingApplication behaviour subject should initially be empty', () => {
      expect(lendingApplicationsService.lendingApplication$)
        .toEqual(new BehaviorSubject(null));
    });

    it('should set lendingApplication behaviour subject when successfully posting a lending application', () => {
      lendingApplicationsService.postApplication(post_goodLendingApplication)
        .pipe(take(1))
        .subscribe(() => {
          lendingApplicationsService.lendingApplication$
            .pipe(take(1))
            .subscribe((value) => expect(value).toEqual(lendingApplicationApproved));
        });

      const lendingApplicationRequest = httpMock.expectOne(API_LENDING_APPLICATIONS.POST_NEW_PATH);
      expect(lendingApplicationRequest.request.method).toEqual('POST');
      lendingApplicationRequest.flush({ status: 200, statusText: 'OK', data: lendingApplicationApproved });
    });

    it('should pass down an error to caller if posting a lending application return an http error',
      () => {
        HTTP_ERRORS.forEach(httpError => {
          lendingApplicationsService.postApplication(post_goodLendingApplication)
            .pipe(take(1))
            .subscribe(() => fail('Prevented silent failure of this unit test.'), // Nothing to check here, shouldn't be reached
                       (err) => expect(err.status).toEqual(httpError.status));

          const lendingApplicationRequest = httpMock.expectOne(API_LENDING_APPLICATIONS.POST_NEW_PATH);
          expect(lendingApplicationRequest.request.method).toEqual('POST');
          lendingApplicationRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
        });
      });
  }); // decribe - postApplication()

  // ----------------------------------------------------------------------- loadApplications()
  describe('loadApplications()', () => {
    it('should be able to get lending applications', () => {
      lendingApplicationsService.loadApplications()
        .pipe(take(1))
        .subscribe((res) => expect(res.data).toEqual([ lendingApplicationApproved ]));

      const lendingApplicationRequest = httpMock.expectOne(API_LENDING_APPLICATIONS.GET_APPLICATIONS_PATH);
      expect(lendingApplicationRequest.request.method).toEqual('GET');
      lendingApplicationRequest.flush({ status: 200, statusTest: 'OK', data: [ lendingApplicationApproved ] });
    });

    it('lendingApplications behaviour subject should initially be empty', () => {
      expect(lendingApplicationsService.lendingApplications$)
        .toEqual(new BehaviorSubject([]));
    });

    it('should set lendingApplications behaviour subject when successfully getting lending applications', () => {
      lendingApplicationsService.loadApplications()
        .pipe(take(1))
        .subscribe(() => {
          lendingApplicationsService.lendingApplications$
            .pipe(take(1))
            .subscribe((value) => expect(value).toEqual([ lendingApplicationApproved ]));
        });

      const lendingApplicationRequest = httpMock.expectOne(API_LENDING_APPLICATIONS.GET_APPLICATIONS_PATH);
      expect(lendingApplicationRequest.request.method).toEqual('GET');
      lendingApplicationRequest.flush({ status: 200, statusText: 'OK', data: [ lendingApplicationApproved ] });
    });

    it('should pass down an error to caller if getting lending applications returns an http error',
      () => {
        HTTP_ERRORS.forEach(httpError => {
          lendingApplicationsService.loadApplications()
            .pipe(take(1))
            .subscribe(
              () => fail('Prevented this unit test from failing silently'), // Nothing to check here, won't be reached
              (err) => expect(err.status).toEqual(httpError.status));

          const lendingApplicationRequest = httpMock.expectOne(API_LENDING_APPLICATIONS.GET_APPLICATIONS_PATH);
          expect(lendingApplicationRequest.request.method).toEqual('GET');
          lendingApplicationRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
        });
      });
  }); // describe - loadApplications

  // -------------------------------------------------------------- getLendingApplication(:id)
  describe('getLendingApplication(:id)', () => {
    const app_id = lendingApplicationApproved.id;
    it('should be able to get lending application for ID', () => {
      lendingApplicationsService.loadApplication(app_id)
        .pipe(take(1))
        .subscribe((res) => expect(res.data).toEqual(lendingApplicationApproved));

      const url = API_LENDING_APPLICATIONS.GET_APPLICATION_PATH.replace(':id', app_id);
      const lendingApplicationRequest = httpMock.expectOne(url);
      expect(lendingApplicationRequest.request.method).toEqual('GET');
      lendingApplicationRequest.flush({ status: 200, statusText: 'OK', data: lendingApplicationApproved });
    });

    it('should set lendingApplication behaviour subject when successfully getting lending application', () => {
      lendingApplicationsService.loadApplication(app_id)
        .pipe(take(1))
        .subscribe(() => {
          lendingApplicationsService.lendingApplication$
          .pipe(take(1))
          .subscribe(
            (value) => expect(value).toEqual(lendingApplicationApproved));
        });

      const url = API_LENDING_APPLICATIONS.GET_APPLICATION_PATH.replace(':id', app_id);
      const lendingApplicationRequest = httpMock.expectOne(url);
      expect(lendingApplicationRequest.request.method).toEqual('GET');
      lendingApplicationRequest.flush({ status: 200, statusText: 'OK', data: lendingApplicationApproved });
    });

    it('should pass down an error to caller if getting lending application returns an http error', () => {
      HTTP_ERRORS.forEach(httpError => {
        lendingApplicationsService.loadApplication(app_id)
          .pipe(take(1))
          .subscribe(
            () => '', // Nothing to check here, won't be reached
            (err) => expect(err.status).toEqual(httpError.status));

        const url = API_LENDING_APPLICATIONS.GET_APPLICATION_PATH.replace(':id', app_id);
        const lendingApplicationRequest = httpMock.expectOne(url);
        expect(lendingApplicationRequest.request.method).toEqual('GET');
        lendingApplicationRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  }); // describe - getLendingApplication(:id)

  // ---------------------------------------------------------------------- loadPadAgreement()
  describe('loadPadAgreement()', () => {
    it('should be able to load a lending application\'s pad agreement', () => {
        lendingApplicationsService.loadPadAgreement(sampleApplicationId)
          .pipe(take(1))
          .subscribe((res) => expect(res.data).toEqual(goodLendingApplicationPadAgreement));

        const url = API_LENDING_APPLICATIONS.GET_PAD_AGREEMENT_PATH.replace(':id', sampleApplicationId);
        const padAgreementRequest = httpMock.expectOne(url);
        expect(padAgreementRequest.request.method).toEqual('GET');
        padAgreementRequest.flush(get_goodLendingApplicationPadAgreementResponse);
      });

    it('public padAgreement behaviour subject should initially be an empty agreement', () => {
      expect(lendingApplicationsService.padAgreement$)
        .toEqual(new BehaviorSubject(new LendingAgreement()));
    });

    it('should set padAgreement behaviour subject when successfully loading a lending application\'s pad agreement',
      () => {
        lendingApplicationsService.loadPadAgreement(sampleApplicationId)
          .pipe(take(1))
          .subscribe(() => {
            lendingApplicationsService.padAgreement$
              .pipe(take(1))
              .subscribe((value) => {
                expect(value).toEqual(goodLendingApplicationPadAgreement);

                // test behaviour subject
                const bValue = lendingApplicationsService.padAgreement$;
                expect(bValue.getValue()).toEqual(goodLendingApplicationPadAgreement);
              });
          });

        const url = API_LENDING_APPLICATIONS.GET_PAD_AGREEMENT_PATH.replace(':id', sampleApplicationId);
        const padAgreementRequest = httpMock.expectOne(url);
        expect(padAgreementRequest.request.method).toEqual('GET');
        padAgreementRequest.flush(get_goodLendingApplicationPadAgreementResponse);
      });

    it('should pass down an error to caller if loading a lending application\'s pad agreement return an http error',
      () => {
        HTTP_ERRORS.forEach(httpError => {
          lendingApplicationsService.loadPadAgreement(sampleApplicationId)
            .pipe(take(1))
            .subscribe(
              () => fail('Prevented silent failure of this unit test.'), // Nothing to check here, should'nt be reached
              (err) => expect(err.status).toEqual(httpError.status));

          const url = API_LENDING_APPLICATIONS.GET_PAD_AGREEMENT_PATH.replace(':id', sampleApplicationId);
          const padAgreementRequest = httpMock.expectOne(url);
          expect(padAgreementRequest.request.method).toEqual('GET');
          padAgreementRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
        });
      });
  }); // describe - loadPadAgreement()

  // ----------------------------------------------------------------------------- loadTerms()
  describe('loadTerms()', () => {
    it('should be able to load a lending application\'s terms',
      () => {
        lendingApplicationsService.loadTerms(sampleApplicationId)
          .pipe(take(1))
          .subscribe((res) => expect(res.data).toEqual(goodLendingApplicationTerms));

        const url = API_LENDING_APPLICATIONS.GET_TERMS_PATH.replace(':id', sampleApplicationId);
        const termsRequest = httpMock.expectOne(url);
        expect(termsRequest.request.method).toEqual('GET');
        termsRequest.flush(get_goodLendingApplicationTermsResponse);
      });

    it('public readonly terms behaviour subject should initially be an empty agreement', () => {
      expect(lendingApplicationsService.terms$)
        .toEqual(new BehaviorSubject(new LendingAgreement()));
    });

    it('should set public readonly terms behaviour subject when successfully loading a lending application\'s terms',
      () => {
        lendingApplicationsService.loadTerms(sampleApplicationId)
          .pipe(take(1))
          .subscribe(() => {
            lendingApplicationsService.terms$
              .pipe(take(1))
              .subscribe((value) => {
                expect(value).toEqual(goodLendingApplicationTerms);

                // test behaviour subject
                const bValue = lendingApplicationsService.terms$;
                expect(bValue.value).toEqual(goodLendingApplicationTerms);
              });
          });

        const url = API_LENDING_APPLICATIONS.GET_TERMS_PATH.replace(':id', sampleApplicationId);
        const termsRequest = httpMock.expectOne(url);
        expect(termsRequest.request.method).toEqual('GET');
        termsRequest.flush(get_goodLendingApplicationTermsResponse);
      });

    it('should pass down an error to caller if loading a lending application\'s terms return an http error',
      () => {
        HTTP_ERRORS.forEach(httpError => {
          lendingApplicationsService.loadTerms(sampleApplicationId)
            .pipe(take(1))
            .subscribe(
              () => fail('Prevented silent failure of this unit test.'), // Nothing to check here, should'nt be reached
              (err) => expect(err.status).toEqual(httpError.status));

          const url = API_LENDING_APPLICATIONS.GET_TERMS_PATH.replace(':id', sampleApplicationId);
          const termsRequest = httpMock.expectOne(url);
          expect(termsRequest.request.method).toEqual('GET');
          termsRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
        });
      });
  }); // describe - loadTerms()

  // -------------------------------------------------------------------------------- accept()
  describe('accept()', () => {
    it('should be able to accept a lending application',
      () => {
        lendingApplicationsService.accept(sampleApplicationId, true, true)
          .pipe(take(1))
          .subscribe((res) => expect(res.data).toEqual(goodLendingApplicationAcceptResponse));

        const url = API_LENDING_APPLICATIONS.PUT_ACCEPT_PATH.replace(':id', sampleApplicationId);
        const termsRequest = httpMock.expectOne(url);
        expect(termsRequest.request.method).toEqual('PUT');
        termsRequest.flush(put_goodLendingApplicationAcceptResponse);
      });

    it('should be able to accept a lending application with payor account id',
      () => {
        lendingApplicationsService.accept(sampleApplicationId, true, true, '1')
          .pipe(take(1))
          .subscribe((res) => expect(res.data).toEqual(goodLendingApplicationAcceptResponse));

        const url = API_LENDING_APPLICATIONS.PUT_ACCEPT_PATH.replace(':id', sampleApplicationId);
        const termsRequest = httpMock.expectOne(url);
        expect(termsRequest.request.method).toEqual('PUT');
        termsRequest.flush(put_goodLendingApplicationAcceptResponse);
      });

    it('should pass down an error to caller if accepting a lending application return an http error',
      () => {
        HTTP_ERRORS.forEach(httpError => {
          lendingApplicationsService.accept(sampleApplicationId, true, true)
            .pipe(take(1))
            .subscribe(
              () => fail('Prevented silent failure of this unit test.'), // Nothing to check here, should'nt be reached
              (err) => expect(err.status).toEqual(httpError.status));

          const url = API_LENDING_APPLICATIONS.PUT_ACCEPT_PATH.replace(':id', sampleApplicationId);
          const termsRequest = httpMock.expectOne(url);
          expect(termsRequest.request.method).toEqual('PUT');
          termsRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
        });
      });
  }); // describe - accept()

  // -------------------------------------------------------------------------------- cancel()
  describe('cancel()', () => {
    it('should be able to cancel a lending application',
      () => {
        lendingApplicationsService.cancel(sampleApplicationId)
          .pipe(take(1))
          .subscribe((res) => expect(res.data).toEqual(goodLendingApplicationAcceptResponse));

        const url = API_LENDING_APPLICATIONS.PUT_CANCEL_PATH.replace(':id', sampleApplicationId);
        const termsRequest = httpMock.expectOne(url);
        expect(termsRequest.request.method).toEqual('PUT');
        termsRequest.flush(put_goodLendingApplicationAcceptResponse);
      });

    it('should pass down an error to caller if canceling a lending application return an http error',
      () => {
        HTTP_ERRORS.forEach(httpError => {
          lendingApplicationsService.cancel(sampleApplicationId)
            .pipe(take(1))
            .subscribe(
              () => fail('Prevented silent failure of this unit test.'), // Nothing to check here, should'nt be reached
              (err) => expect(err.status).toEqual(httpError.status));

          const url = API_LENDING_APPLICATIONS.PUT_CANCEL_PATH.replace(':id', sampleApplicationId);
          const termsRequest = httpMock.expectOne(url);
          expect(termsRequest.request.method).toEqual('PUT');
          termsRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
        });
      });
  }); // describe - cancel()

  // -------------------------------------------------------------------------------- amend()
  describe('amend()', () => {
    const fakePrincipalAmount = 500;
    const fakeLoanTerm = lendingTerm60Days;

    it('should be able to amend a lending application',
      () => {
        lendingApplicationsService.amend(sampleApplicationId, fakePrincipalAmount, fakeLoanTerm)
          .pipe(take(1))
          .subscribe((res) => expect(res.data).toEqual(lendingApplicationApproved));

        const url = `${API_LENDING_APPLICATIONS.PUT_AMEND_PATH.replace(':id', sampleApplicationId)}`
          + `?principal_amount=${fakePrincipalAmount}&loan_term_id=${fakeLoanTerm.id}`;
        const amendRequest = httpMock.expectOne(url);
        expect(amendRequest.request.method).toEqual('PUT');
        amendRequest.flush({ data: lendingApplicationApproved, status: 200 });
      });

    it('should set lendingApplication behaviour subject when successfully amending a lending application', () => {
      lendingApplicationsService.amend(sampleApplicationId, fakePrincipalAmount, fakeLoanTerm)
        .pipe(take(1))
        .subscribe(() => {
          lendingApplicationsService.lendingApplication$
            .pipe(take(1))
            .subscribe((value) => expect(value).toEqual(lendingApplicationApproved));
        });

      const url = `${API_LENDING_APPLICATIONS.PUT_AMEND_PATH.replace(':id', sampleApplicationId)}`
        + `?principal_amount=${fakePrincipalAmount}&loan_term_id=${fakeLoanTerm.id}`;
      const lendingApplicationRequest = httpMock.expectOne(url);
      expect(lendingApplicationRequest.request.method).toEqual('PUT');
      lendingApplicationRequest.flush({ status: 200, statusText: 'OK', data: lendingApplicationApproved });
    });

    it('should pass down an error to caller if amending a lending application returns an http error',
      () => {
        HTTP_ERRORS.forEach(httpError => {
          lendingApplicationsService.amend(sampleApplicationId, fakePrincipalAmount, fakeLoanTerm)
            .pipe(take(1))
            .subscribe(
              () => fail('Prevented silent failure of this unit test.'), // Nothing to check here, should'nt be reached
              (err) => expect(err.status).toEqual(httpError.status));

          const url = `${API_LENDING_APPLICATIONS.PUT_AMEND_PATH.replace(':id', sampleApplicationId)}`
            + `?principal_amount=${fakePrincipalAmount}&loan_term_id=${fakeLoanTerm.id}`;
          const amendRequest = httpMock.expectOne(url);
          expect(amendRequest.request.method).toEqual('PUT');
          amendRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
        });
      });
  }); // describe - amend()

  // -------------------------------------------------------------------------- loadApplicationFee()
  describe('loadApplicationFee()', () => {
    const fakePrincipalAmount = 500;
    const fakeLoanTerm = lendingTerm60Days;

    it('should be able to successfully getting a lending application fee', () => {
      lendingApplicationsService.loadApplicationFee(sampleApplicationId, fakePrincipalAmount, fakeLoanTerm)
        .pipe(take(1))
        .subscribe((res) => expect(res.data).toEqual(lendingApplicationFee),
          (err) => fail('Prevented silent failure of this unit test:' + err));

      const url = `${API_LENDING_APPLICATIONS.GET_APPLICATION_FEE_PATH.replace(':id', sampleApplicationId)}`
        + `?principal_amount=${fakePrincipalAmount}&loan_term_id=${fakeLoanTerm.id}`;
      const lendingApplicationFeeRequest = httpMock.expectOne(url);
      expect(lendingApplicationFeeRequest.request.method).toEqual('GET');
      lendingApplicationFeeRequest.flush({ status: 200, statusText: 'OK', data: lendingApplicationFee });
    });

    it('should set lendingApplicationFee behaviour subject when successfully getting a lending application fee', () => {
      lendingApplicationsService.loadApplicationFee(sampleApplicationId, fakePrincipalAmount, fakeLoanTerm)
        .pipe(take(1))
        .subscribe(() => {
            lendingApplicationsService.lendingApplicationFee$
              .pipe(take(1))
              .subscribe((value) => expect(value).toEqual(lendingApplicationFee));
          },
          (err) => fail('Prevented silent failure of this unit test: ' + err));

      const url = `${API_LENDING_APPLICATIONS.GET_APPLICATION_FEE_PATH.replace(':id', sampleApplicationId)}`
        + `?principal_amount=${fakePrincipalAmount}&loan_term_id=${fakeLoanTerm.id}`;
      const lendingOfferFeeRequest = httpMock.expectOne(url);
      expect(lendingOfferFeeRequest.request.method).toEqual('GET');
      lendingOfferFeeRequest.flush({ status: 200, statusText: 'OK', data: lendingApplicationFee });
    });

    it('should pass down an error to caller if getting a lending application fee returns an http error', () => {
      HTTP_ERRORS.forEach(httpError => {
        lendingApplicationsService.loadApplicationFee(sampleApplicationId, fakePrincipalAmount, fakeLoanTerm)
          .pipe(take(1))
          .subscribe((res) => fail('Prevented silent failure of this unit test: ' + res), // Nothing to check here, won't be reached
            (err) => expect(err.status).toEqual(httpError.status));

        const url = `${API_LENDING_APPLICATIONS.GET_APPLICATION_FEE_PATH.replace(':id', sampleApplicationId)}`
          + `?principal_amount=${fakePrincipalAmount}&loan_term_id=${fakeLoanTerm.id}`;
        const lendingOfferFeeRequest = httpMock.expectOne(url);
        expect(lendingOfferFeeRequest.request.method).toEqual('GET');
        lendingOfferFeeRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  }); // describe - loadApplicationFee()

  // UTILITY METHODS

  // --------------------------------------------------------------------- clearLendingApplicationFee()
  describe('clearLendingApplicationFee()', () => {
    const fakeApplicationId = lendingApplicationApproved.id;
    const fakePrincipalAmount = 500;
    const fakeLoanTerm = lendingTerm60Days;

    it('should set current lending application fee to null', () => {
      lendingApplicationsService.loadApplicationFee(fakeApplicationId, fakePrincipalAmount, fakeLoanTerm)
        .pipe(take(1))
        .subscribe({
          error: (err) => fail('Should not fail:' + err)
        });

      const url = `${API_LENDING_APPLICATIONS.GET_APPLICATION_FEE_PATH.replace(':id', fakeApplicationId)}`
        + `?principal_amount=${fakePrincipalAmount}&loan_term_id=${fakeLoanTerm.id}`;
      const lendingApplicationFeeRequest = httpMock.expectOne(url);
      expect(lendingApplicationFeeRequest.request.method).toEqual('GET');
      lendingApplicationFeeRequest.flush({ status: 200, statusText: 'OK', data: lendingApplicationFee });

      expect(lendingApplicationsService.lendingApplicationFee$.value).toEqual(lendingApplicationFee);

      lendingApplicationsService.clearLendingApplicationFee();

      expect(lendingApplicationsService.lendingApplicationFee$.value).toEqual(null);
    });
  }); // describe - clearLendingApplicationFee()

  // ------------------------------------------------------- setProcessingApplicationForOffer()
  describe('setProcessingApplicationForOffer()', () => {

    describe('should set current lending application', () => {
      it('when found a single processing application for current lending offer', () => {
        const targetOfferId = lendingApplicationPending.offer_id;
        IN_PROGRESS_lendingApplications.forEach(processingApp => {
          const apps = ALL_lendingApplications
            .filter(app => !IN_PROGRESS_APP_STATES.includes(app.state)) // Remove all processing apps
            .concat([ processingApp ]);                                 // And then append just one processing app
          lendingApplicationsService.setProcessingApplicationForOffer(apps, targetOfferId);

          expect(lendingApplicationsService.lendingApplication$.value).toEqual(processingApp);
        });
      });
    }); // describe - 'should set current lending application to null when'

    describe('should set current lending application to null', () => {
      it('found multiple processing applications for current lending offer', () => {
        const targetOfferId = lendingApplicationPending.offer_id;
        const apps = ALL_lendingApplications;

        lendingApplicationsService.setProcessingApplicationForOffer(apps, targetOfferId);

        expect(lendingApplicationsService.lendingApplication$.value).toEqual(null);
      });

      it('when did not find a processing application for current lending offer', () => {
        const targetOfferId = lendingApplicationWcaPending.offer_id; // For a different offer
        const apps = ALL_lendingApplications;

        lendingApplicationsService.setProcessingApplicationForOffer(apps, targetOfferId);

        expect(lendingApplicationsService.lendingApplication$.value).toEqual(null);
      });
    }); // describe - 'should set current lending application to null when'
  }); // describe - setProcessingApplicationForOffer()

  // ------------------------------------------------------- findProcessingApplicationForOffer()
  describe('findProcessingApplicationForOffer()', () => {

    describe('if there are some applications matching with the selected offer,', () => {
      const targetOfferId = lendingApplicationPending.offer_id;

      describe('should return the application when', () => {
        it('there is EXACTLY 1 application in processing state for that offer', () => {
          IN_PROGRESS_lendingApplications.forEach(processingApp => {
            const apps = ALL_lendingApplications
              .filter(app => !IN_PROGRESS_APP_STATES.includes(app.state)) // Remove all processing apps
              .concat([ processingApp ]);                                 // And then append just one processing app
            const result = lendingApplicationsService.findProcessingApplicationForOffer(apps, targetOfferId);

            expect(result).toEqual( processingApp );
          });
        });
      }); // describe - 'should return the application when'

      describe('should return null when', () => {
        it('there are NO applications in processing state', () => {
          const apps = ALL_lendingApplications
            .filter(app => !IN_PROGRESS_APP_STATES.includes(app.state)); // Remove all processing apps
          const result = lendingApplicationsService.findProcessingApplicationForOffer(apps, targetOfferId);

          expect(result).toEqual( null );
        });

        it('there is MORE than 1 application in processing state', () => {
          const apps = ALL_lendingApplications;
          const result = lendingApplicationsService.findProcessingApplicationForOffer(apps, targetOfferId);

          expect(result).toEqual( null );
        });
      }); // describe - 'should return null when'
    }); // describe - 'if there are some applications matching with the selected offer'

    describe('if there are NO applications matching with the selected offer,', () => {
      const targetOfferId = lendingApplicationWcaPending.offer_id; // For a different offer

      describe('should return null when', () => {
        it('there are any number of application in any state for an other offer', () => {
          const apps = ALL_lendingApplications;
          const result = lendingApplicationsService.findProcessingApplicationForOffer(apps, targetOfferId);

          expect(result).toEqual( null );
        });
      }); // describe - 'should return null when'

    }); // describe - 'if there are NO applications matching with the selected offer'

    describe('if there are NO applications at all,', () => {
      const targetOfferId = lendingApplicationPending.offer_id;

      it('should return null', () => {
        const apps = [];
        const result = lendingApplicationsService.findProcessingApplicationForOffer(apps, targetOfferId);

        expect(result).toEqual( null );
      });
    }); // describe - 'if there are NO applications at all'

  }); // describe - findProcessingApplicationForOffer()

  // --------------------------------------------------------------- findApplicationsByStates()
  describe('findApplicationsByStates()', () => {
    it('should return all applications matching passed states', () => {
      const apps = ALL_lendingApplications;
      const result = lendingApplicationsService.findApplicationsByStates(apps, COMPLETED_APP_STATES);

      expect(result).toEqual(COMPLETED_lendingApplications);
    });

    it('should return empty list if there are no applications matching passed states', () => {
      const apps = ALL_lendingApplications
        .filter(app => !COMPLETED_APP_STATES.includes(app.state)); // Remove all completed apps
      const result = lendingApplicationsService.findApplicationsByStates(apps, COMPLETED_APP_STATES);

      expect(result).toEqual([]);
    });
  }); // describe - findApplicationsByStates()


  // -------------------------------------------------------------- findProcessingApplications()
  describe('findProcessingApplications()', () => {
    it('should return all processing applications', () => {
      const apps = ALL_lendingApplications;
      const result = lendingApplicationsService.findProcessingApplications(apps);

      expect(result).toEqual(IN_PROGRESS_lendingApplications);
    });

    it('should return empty list if there are no processing applications', () => {
      const apps = ALL_lendingApplications.filter(app => !IN_PROGRESS_APP_STATES.includes(app.state));
      const result = lendingApplicationsService.findProcessingApplications(apps);

      expect(result).toEqual([]);
    });
  }); // decribe - findProcessingApplications()

  // -------------------------------------------------------------- findCompletedApplications()
  describe('findCompletedApplications()', () => {
    it('should return all completed applications', () => {
      const apps = ALL_lendingApplications;
      const result = lendingApplicationsService.findCompletedApplications(apps);

      expect(result).toEqual(COMPLETED_lendingApplications);
    });

    it('should return empty list if there are no completed applications', () => {
      const apps = ALL_lendingApplications.filter(app => !COMPLETED_APP_STATES.includes(app.state));
      const result = lendingApplicationsService.findCompletedApplications(apps);

      expect(result).toEqual([]);
    });
  }); // decribe - findCompletedApplications()

  // -------------------------------------------------------------- findFailedApplications()
  describe('findFailedApplications()', () => {
    it('findFailedApplications should return all failed applications', () => {
      const apps = ALL_lendingApplications;
      const result = lendingApplicationsService.findFailedApplications(apps);

      expect(result).toEqual(FAILED_lendingApplications);
    });

    it('findFailedApplications should return empty list if there are no failed applications', () => {
      const apps = ALL_lendingApplications.filter(app => !FAILED_APP_STATES.includes(app.state));
      const result = lendingApplicationsService.findFailedApplications(apps);

      expect(result).toEqual([]);
    });
  }); // describe - findFailedApplications()

  describe('isApplicationInProgress()', () => {
    it('should return true for all IN_PROGRESS application states', () => {
      IN_PROGRESS_lendingApplications.forEach(application => {
        expect(lendingApplicationsService.isApplicationInProgress(application.state)).toBeTrue();
      }); // IN_PROGRESS_lendingApplications.forEach
    });

    it('should return false for application states that are not IN_PROGRESS', () => {
      COMPLETED_lendingApplications.forEach(application => {
        expect(lendingApplicationsService.isApplicationInProgress(application.state)).toBeFalse();
      }); // IN_PROGRESS_lendingApplications.forEach
    });
  }); // describe - isApplicationInProgress()

  describe('ApplicationProgress()', () => {
    it('should return ApplicationProgress.before_approved for BEFORE_APPROVED_APP_STATES', () => {
      BEFORE_APPROVED_lendingApplications.forEach(application => {
        expect(lendingApplicationsService.getApplicationProgress(application.state)).toEqual(ApplicationProgress.before_approved);
      }); // BEFORE_APPROVED_lendingApplications.forEach
    });

    it('should return ApplicationProgress.approved for APPROVED_APP_STATES', () => {
      APPROVED_lendingApplications.forEach(application => {
        expect(lendingApplicationsService.getApplicationProgress(application.state)).toEqual(ApplicationProgress.approved);
      }); // APPROVED_lendingApplications.forEach
    });

    it('should return ApplicationProgress.completing for COMPLETING_APP_STATES', () => {
      COMPLETING_lendingApplications.forEach(application => {
        expect(lendingApplicationsService.getApplicationProgress(application.state)).toEqual(ApplicationProgress.completing);
      }); // COMPLETING_lendingApplications.forEach
    });

    it('should return ApplicationProgress.invalid for application states that are not in progress', () => {
      COMPLETED_lendingApplications.forEach(application => {
        expect(lendingApplicationsService.getApplicationProgress(application.state)).toEqual(ApplicationProgress.invalid);
      }); // COMPLETED_lendingApplications.forEach
    });
  }); // describe - ApplicationProgress()

  // ------------------------------------ -------------------------- findApplicationById()
  describe('findApplicationById()', () => {
    it('should return the correct application', () => {
      const apps = [ lendingApplicationApproved, lendingApplicationAccepted, lendingApplicationPending ];
      const app_id = lendingApplicationApproved.id;
      const result = lendingApplicationsService.findApplicationById(apps, app_id);

      expect(result).toEqual(lendingApplicationApproved);
    });

    it('should return the first correct application when there are duplicates', () => {
      const apps = [ lendingApplicationApproved, lendingApplicationApproved, lendingApplicationApproved ];
      const app_id = lendingApplicationApproved.id;
      const result = lendingApplicationsService.findApplicationById(apps, app_id);

      expect(result).toEqual(lendingApplicationApproved);
    });

    it('should return null if applications array is empty', () => {
      const apps = [];
      const app_id = lendingApplicationApproved.id;
      const result = lendingApplicationsService.findApplicationById(apps, app_id);

      expect(result).toEqual(null);
    });

    it('should return null if applications array is undefined', () => {
      const app_id = lendingApplicationApproved.id;
      const result = lendingApplicationsService.findApplicationById(null, app_id);

      expect(result).toEqual(null);
    });

    it('should return null if id is undefined', () => {
      const apps = [ lendingApplicationApproved, lendingApplicationAccepted, lendingApplicationPending ];
      const result = lendingApplicationsService.findApplicationById(apps, null);

      expect(result).toEqual(null);
    });
  });

  describe('getRequiredDocuments()', () => {
    it('should return list of document codes for documents that are required', () => {
      const docs = lendingApplicationsService.getRequiredDocuments(lendingApplicationMultiDocsRequired);

      expect((docs.length > 0)).toBeTruthy();
    });

    it('should return empty list if there are no documents that are required', () => {
      const docs = lendingApplicationsService.getRequiredDocuments(lendingApplicationNoDocsRequired);

      expect((docs.length === 0)).toBeTruthy();
    });
  });

  describe('applicationApproved()', () => {
    it('returns true if application passed is in approved state', () => {
      expect(lendingApplicationsService.applicationApproved(lendingApplicationApproved)).toBeTruthy();
    });

    it('returns true if application passed is in approving state', () => {
      expect(lendingApplicationsService.applicationApproved(lendingApplicationApproving)).toBeTruthy();
    });

    it('returns false if application passed is in any other state', () => {
      BEFORE_APPROVED_lendingApplications.forEach((app) => {
        expect(lendingApplicationsService.applicationApproved(app)).toBeFalsy();
      });
    });
  });

  describe('applicationCompleting()', () => {
    it('returns true if application passed is in completing state', () => {
      COMPLETING_lendingApplications.forEach((app) => {
        expect(lendingApplicationsService.applicationCompleting(app)).toBeTruthy();
      });
    });

    it('returns false if application passed is in any other state', () => {
      NON_COMPLETING_lendingApplications.forEach((app) => {
        expect(lendingApplicationsService.applicationCompleting(app)).toBeFalsy();
      });
    });
  });

  describe('getPayoutsSum()', () => {
    it('should return the sum of all payout amounts', () => {
      const payouts = [ lendingPayoutCra, lendingPayoutLandlord, lendingPayoutOther ];
      const expectedSum = lendingPayoutCra.amount + lendingPayoutLandlord.amount + lendingPayoutOther.amount;

      expect(lendingApplicationsService.getPayoutsSum(payouts)).toEqual(expectedSum);
    });

    it('should return 0 if there are no payouts', () => {
      expect(lendingApplicationsService.getPayoutsSum([])).toEqual(0);
    });

    it('should return 0 if argument passed is null or undefined', () => {
      expect(lendingApplicationsService.getPayoutsSum(null)).toEqual(0);
      expect(lendingApplicationsService.getPayoutsSum(undefined)).toEqual(0);
    });
  });

  describe('hasPayouts()', () => {
    it('should return true if offline_payouts in application has 1 or more elements', () => {
      const application = lendingApplicationFactory.build({ offline_payouts: [ lendingPayoutCra, lendingPayoutLandlord, lendingPayoutOther ] });
      expect(lendingApplicationsService.hasPayouts(application)).toBeTruthy();
    });

    it('should return false if offline_payouts in application is an empty array', () => {
      const application = lendingApplicationFactory.build({ offline_payouts: [] });
      expect(lendingApplicationsService.hasPayouts(application)).toBeFalsy();
    });

    it('should return false if offline_payouts in application is null or undefined', () => {
      const values = [ null, undefined ];
      values.forEach((val) => {
        const application = lendingApplicationFactory.build({ offline_payouts: val });
        expect(lendingApplicationsService.hasPayouts(application)).toBeFalsy();
      });
    });

    it('should return false if passed application is null or undefined', () => {
      const values = [ null, undefined ];
      values.forEach((val) => {
        expect(lendingApplicationsService.hasPayouts(val)).toBeFalsy();
      });
    });
  });

  describe('requiresSignature()', () => {
    it('returns true if application is not null and terms_signature_required is set to true', () => {
      const application = lendingApplicationFactory.build({ terms_signature_required: true });
      expect(lendingApplicationsService.requiresSignature(application)).toEqual(true);
    });

    it('returns false if application is not null and terms_signature_required is set to false', () => {
      const application = lendingApplicationFactory.build({ terms_signature_required: false });
      expect(lendingApplicationsService.requiresSignature(application)).toEqual(false);
    });

    it('returns false if application is not null and terms_signature_required is set to null or undefined', () => {
      const values = [ null, undefined ];

      values.forEach((val) => {
        const application = lendingApplicationFactory.build({ terms_signature_required: val });
        expect(lendingApplicationsService.requiresSignature(application)).toEqual(false);
      });
    });

    it('returns false if application is null or undefined', () => {
      const values = [ null, undefined ];

      values.forEach((val) => {
        expect(lendingApplicationsService.requiresSignature(val)).toEqual(false);
      });
    });
  });
});
