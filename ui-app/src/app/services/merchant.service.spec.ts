import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { API_BUSINESS_PARTNER, API_MERCHANT, CONSTANTS, ONBOARDING } from 'app/constants';
import { merchantDocumentsQueryFactory } from 'app/documents/models/merchant-documents-query.factory';
import { QuickBooksState } from 'app/models/api-entities/merchant';
import { Province } from 'app/models/province';
import { MerchantUpdateThrottling } from 'app/services/business-logic/merchant-update-throttling';
import { LoggingService } from 'app/services/logging.service';
import { UtilityService } from 'app/services/utility.service';
import { HTTP_ERRORS } from 'app/test-stubs/api-errors-stubs';
import { addressFormFactory, businessFormFactory } from 'app/test-stubs/factories/forms';
import { kycCheckIAVerified } from 'app/test-stubs/factories/kyc-check';
import {
  kycVerifiedCOEFailed,
  kycVerifiedCOEMissing,
  kycVerifiedCOEUnverified,
  kycVerifiedFailed,
  kycVerifiedIAFailed,
  kycVerifiedIAFailedOtherKycPassed,
  kycVerifiedIAMissing,
  kycVerifiedInProgress,
  kycVerifiedPass,
  kycVerifiedUnverified,
  malformedKycProfiles
} from 'app/test-stubs/factories/kyc-verified';
import {
  merchantDataFactory,
  merchantDataResponseFactory,
  merchantPost,
  merchantPutFactory,
  merchantPutWithOptional
} from 'app/test-stubs/factories/merchant';
import {
  merchantQueryPost,
  merchantQueryPostWhiteSpace,
  merchantQueryResponse
} from 'app/test-stubs/factories/merchant-query';
import { voidResponseFactory } from 'app/test-stubs/factories/response';
import { merchantDocumentsListingFactory } from 'app/documents/models/merchant-documents-listing.factory';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { MerchantService } from './merchant.service';

describe('MerchantService', () => {
  let merchantService: MerchantService;
  let httpMock: HttpTestingController;

  let merchantSpy: jasmine.Spy;
  let utilityService: UtilityService;

  const lead_guid = 'lead_123';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CookieService,
        LoggingService,
        MerchantService,
        UtilityService
      ]
    });

    merchantService = TestBed.inject(MerchantService);
    httpMock = TestBed.inject(HttpTestingController);
    utilityService = TestBed.inject(UtilityService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(merchantService).toBeTruthy();
  });

  describe('merchantId', () => {
    it('should return merchant guid merchant is not falsy', () => {
      const merchant = merchantDataFactory.build();
      merchantService.setMerchant(merchant);
      expect(merchantService.merchantId).toEqual(merchant.id);
    });

    it('should return undefined if merchant is falsy', () => {
      expect(merchantService.merchantId).toBeUndefined();
    });
  });

  it('getMerchant() should return the merchant', () => {
    merchantService.loadMerchant()
      .pipe(take(1))
      .subscribe(
        () => expect(merchantService.getMerchant()).toEqual(merchantDataFactory.build()),
        (err) => fail('Prevented this test to fail silently: ' + err)
      );

    const merchantsRequest = httpMock.expectOne(API_MERCHANT.GET_MERCHANTS_PATH);
    expect(merchantsRequest.request.method).toEqual('GET');
    merchantsRequest.flush(merchantDataResponseFactory.build({ data: merchantDataFactory.build() }));
  });

  it('merchantObs() should return the merchant behaviour subject', () => {
    merchantService.loadMerchant()
      .pipe(take(1))
      .subscribe(
        () => expect(merchantService.merchantObs).toEqual(new BehaviorSubject(merchantDataFactory.build())),
        (err) => fail('Prevented this test to fail silently: ' + err)
      );

    const merchantsRequest = httpMock.expectOne(API_MERCHANT.GET_MERCHANTS_PATH);
    expect(merchantsRequest.request.method).toEqual('GET');
    merchantsRequest.flush(merchantDataResponseFactory.build({ data: merchantDataFactory.build() }));
  });

  describe('setLogoutUrl()', () => {
    it('should set logout url if key is set in meta tags', inject([Meta], (meta: Meta) => {
      const url = '/logout/url';
      meta.updateTag({name: 'logout_url', content: url});

      merchantService.setLogoutUrl();

      expect(merchantService.logoutUrl).toEqual(url);
    }));

    it('should set logout url to null if logout url key is not set in meta tags', inject([Meta], (meta: Meta) => {
      meta.removeTag(CONSTANTS.LOGOUT_URL_KEY);

      merchantService.setLogoutUrl();

      expect(merchantService.logoutUrl).toEqual(null);
    }));
  });

  describe('getMerchantOutstandingBalance', () => {
    it('should return the correct value when total_remaining_payment_amount is present', () => {
      const testMerchant$ = new BehaviorSubject(merchantDataFactory.build({total_remaining_payment_amount: 500}));
      spyOnProperty(merchantService, 'merchantObs').and.returnValue(testMerchant$);

      expect(merchantService.getMerchantOutstandingBalance()).toEqual(500);
    });

    it('should return 0 when total_remaining_payment_amount is not present', () => {
      const testMerchant$ = new BehaviorSubject(merchantDataFactory.build({total_remaining_payment_amount: undefined}));
      spyOnProperty(merchantService, 'merchantObs').and.returnValue(testMerchant$);

      expect(merchantService.getMerchantOutstandingBalance()).toEqual(0);
    });

    it('should return 0 when merchant is not present', () => {
      spyOnProperty(merchantService, 'merchantObs').and.returnValue(undefined);

      expect(merchantService.getMerchantOutstandingBalance()).toEqual(0);
    });
  }); // describe - getMerchantOutstandingBalance

  describe('setAccountInfoUrl()', () => {
    it('should set account info url if key is set in meta tags', inject([Meta], (meta: Meta) => {
      const url = '/account/info/url';
      meta.updateTag({name: 'account_info_url', content: url});

      merchantService.setAccountInfoUrl();

      expect(merchantService.accountInfoUrl).toEqual(url);
    }));

    it('should set account info url to null if account info url key is not set in meta tags', inject([Meta], (meta: Meta) => {
      meta.removeTag(CONSTANTS.ACCOUNT_INFO_URL_KEY);

      merchantService.setAccountInfoUrl();

      expect(merchantService.accountInfoUrl).toEqual(null);
    }));
  });

  describe('loadMerchant()', () => {
    it('should be able to load merchant data', () => {
      merchantService.loadMerchant()
        .pipe(take(1))
        .subscribe(
          () => expect(merchantService.getMerchant()).toEqual(merchantDataFactory.build()),
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const merchantsRequest = httpMock.expectOne(API_MERCHANT.GET_MERCHANTS_PATH);
      expect(merchantsRequest.request.method).toEqual('GET');
      merchantsRequest.flush(merchantDataResponseFactory.build({data: merchantDataFactory.build()}));
    });

    it('should set isDelinquent observable', () => {
      const merchant = merchantDataFactory.build({delinquent: true});
      merchantService.loadMerchant()
        .pipe(take(1))
        .subscribe(
          () => {
            expect(merchantService.getMerchant()).toEqual(merchant);
            expect(merchantService.isDelinquent$.value).toEqual(true);
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const merchantsRequest = httpMock.expectOne(API_MERCHANT.GET_MERCHANTS_PATH);
      expect(merchantsRequest.request.method).toEqual('GET');
      merchantsRequest.flush(merchantDataResponseFactory.build({data: merchant}));
    });

    it('should pass down an error if loadMerchant returns an http error', () => {
      HTTP_ERRORS.forEach(httpError => {
        merchantService.loadMerchant()
          .pipe(take(1))
          .subscribe(
            () => fail('Should not succeed'),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        expect(merchantService.isDelegatedAccessMode()).toBeFalsy();

        const merchantsRequest = httpMock.expectOne(API_MERCHANT.GET_MERCHANTS_PATH);
        expect(merchantsRequest.request.method).toEqual('GET');
        merchantsRequest.flush([], {status: httpError.status, statusText: httpError.statusText});
      });
    });
  });

  describe('postMerchant()', () => {
    it('should be able to post merchant data', () => {
      const merchantResponse = merchantDataResponseFactory.build();
      merchantService.postMerchant(merchantPost)
        .pipe(take(1))
        .subscribe(
          (res) => expect(res).toEqual(merchantResponse),
          (err) => fail('Should not fail: ' + err)
        );

      const merchantsRequest = httpMock.expectOne(API_MERCHANT.POST_MERCHANTS_PATH);
      expect(merchantsRequest.request.method).toEqual('POST');
      merchantsRequest.flush(merchantResponse);
    });
  });

  describe('requestAssistance()', () => {
    it('should be able to post request for assistance', () => {
      merchantService.requestAssistance('because I said so')
        .then((res) => expect(res).toBeTruthy())
        .catch((err) => fail('Prevented unit test from failing silently: ' + err));

      const merchantsRequest = httpMock.expectOne(API_MERCHANT.REQUEST_ASSISTANCE_PATH);
      expect(merchantsRequest.request.method).toEqual('POST');
      merchantsRequest.flush({status: 200, statusText: 'SUCCESS'});
    });

    it('should pass down an error if getting a lending UBL returns an http error', () => {
      HTTP_ERRORS.forEach(httpError => {
        merchantService.requestAssistance('because I said so')
          .then((res) => fail('Should not fail: ' + res))
          .catch((err) => expect(err.status).toEqual(httpError.status));

        const ublRequest = httpMock.expectOne(API_MERCHANT.REQUEST_ASSISTANCE_PATH);
        expect(ublRequest.request.method).toEqual('POST');
        ublRequest.flush([], {status: httpError.status, statusText: httpError.statusText});
      });
    });
  });

  describe('queryMerchant()', () => {
    it('should be able to post a merchant query', () => {
      merchantService.queryMerchant(merchantQueryPost)
        .pipe(take(1))
        .subscribe(
          (res) => expect(res).toBeTruthy(),
          (err) => fail('Should not fail: ' + err));

      const merchantsRequest = httpMock.expectOne(ONBOARDING.POST_MERCHANT_QUERY_PATH);
      expect(merchantsRequest.request.method).toEqual('POST');
      merchantsRequest.flush({status: 200, statusText: 'OK', data: merchantQueryResponse});
    });

    it('should strip leading and trailing whitespace characters from merchant parameters before performing merchant query', () => {
      merchantService.queryMerchant(merchantQueryPostWhiteSpace)
        .pipe(take(1))
        .subscribe(
          (res) => expect(res).toBeTruthy(),
          (err) => fail('Should not fail: ' + err));

      const merchantRequest = httpMock.expectOne(ONBOARDING.POST_MERCHANT_QUERY_PATH);
      expect(merchantRequest.request.method).toEqual('POST');
      expect(merchantRequest.request.body).toEqual(merchantQueryPost);
      merchantRequest.flush({status: 200, statusText: 'OK', data: merchantQueryResponse});
    });

    it('should set merchantQueryResponse behaviour subject when successfully executing merchant query', () => {
      merchantService.queryMerchant(merchantQueryPost)
        .pipe(take(1))
        .subscribe(
          () => expect(merchantService.getMerchantQueryResponse()).toEqual(merchantQueryResponse),
          (err) => fail('Should not fail: ' + err));

      const merchantsRequest = httpMock.expectOne(ONBOARDING.POST_MERCHANT_QUERY_PATH);
      expect(merchantsRequest.request.method).toEqual('POST');
      merchantsRequest.flush({status: 200, statusText: 'OK', data: merchantQueryResponse});
    });

    it('should pass down an error if executing merchant query returns an http error',
      () => {
        HTTP_ERRORS.forEach(httpError => {
          merchantService.queryMerchant(merchantQueryPost)
            .pipe(take(1))
            .subscribe(
              () => fail('Prevented this unit test from failing silently'), // Nothing to check here, won't be reached
              (err) => expect(err.status).toEqual(httpError.status));

          const merchantsRequest = httpMock.expectOne(ONBOARDING.POST_MERCHANT_QUERY_PATH);
          expect(merchantsRequest.request.method).toEqual('POST');
          merchantsRequest.flush([], {status: httpError.status, statusText: httpError.statusText});
        });
      });
  });

  describe('logOut()', () => {
    it('should be able to call logout', () => {
      merchantService.logoutUrl = '/logout';
      merchantService.logOut()
        .then((res) => expect(res).toBeTruthy())
        .catch((err) => fail('Prevented unit test from failing silently: ' + err));

      const merchantsRequest = httpMock.expectOne(merchantService.logoutUrl);
      expect(merchantsRequest.request.method).toEqual('GET');
      merchantsRequest.flush({status: 200, statusText: 'SUCCESS'});
    });

    it('should pass down an error if logout returns an http error', () => {
      merchantService.logoutUrl = '/logout';

      HTTP_ERRORS.forEach(httpError => {
        merchantService.logOut()
          .then((res) => fail('Should not fail: ' + res))
          .catch((err) => expect(err.status).toEqual(httpError.status));

        const ublRequest = httpMock.expectOne(merchantService.logoutUrl);
        expect(ublRequest.request.method).toEqual('GET');
        ublRequest.flush([], {status: httpError.status, statusText: httpError.statusText});
      });
    });
  });

  describe('logOutDelegated()', () => {
    it('should be able to call logOutDelegated', () => {
      merchantService.logOutDelegated()
        .catch((err) => fail('Prevented unit test from failing silently: ' + err));

      const merchantsRequest = httpMock.expectOne(CONSTANTS.DELEGATED_LOGOUT);
      expect(merchantsRequest.request.method).toEqual('POST');
      merchantsRequest.flush({status: 200, statusText: 'SUCCESS'});
    });

    it('should pass down an error if logOutDelegated returns an http error', () => {
      HTTP_ERRORS.forEach(httpError => {
        merchantService.logOutDelegated()
          .then((res) => fail('Should not fail: ' + res))
          .catch((err) => expect(err.status).toEqual(httpError.status));

        const ublRequest = httpMock.expectOne(CONSTANTS.DELEGATED_LOGOUT);
        expect(ublRequest.request.method).toEqual('POST');
        ublRequest.flush([], {status: httpError.status, statusText: httpError.statusText});
      });
    });
  });

  describe('isKycUnverified() helper', () => {
    beforeEach(() => {
      merchantSpy = spyOn(merchantService, 'getMerchant');
    });

    it('should return true if the merchant is kyc in-progress or unverified', () => {
      [kycVerifiedUnverified, kycVerifiedInProgress].forEach(trueValues => {
        const merchant = merchantDataFactory.build({kyc_verified: trueValues});
        merchantSpy.and.returnValue(merchant);

        expect(merchantService.isKycUnverified()).toBeTrue();
      });
    });

    it('should return false if the merchant is kyc verified', () => {
      const merchant = merchantDataFactory.build({kyc_verified: kycVerifiedPass});
      merchantSpy.and.returnValue(merchant);

      expect(merchantService.isKycUnverified()).toBeFalse();
    });

    it('should return true if anything in merchant.kyc_verified.details chain is not set', () => {
      malformedKycProfiles.forEach(malformedKycProfile => {
        const merchant = merchantDataFactory.build({kyc_verified: malformedKycProfile});
        merchantSpy.and.returnValue(merchant);

        expect(merchantService.isKycUnverified()).toBeTrue();
      });
    });
  });

  describe('isKycProfilePresent() helper', () => {
    beforeEach(() => {
      merchantSpy = spyOn(merchantService, 'getMerchant');
    });

    it('should return true if the merchant has failed KYC profile', () => {
      const merchant = merchantDataFactory.build({kyc_verified: kycVerifiedFailed});
      merchantSpy.and.returnValue(merchant);

      expect(merchantService.isKycProfilePresent()).toBeTrue();
    });

    it('should return false if the merchant is falsy', () => {
      merchantSpy.and.returnValue(null);

      expect(merchantService.isKycProfilePresent()).toBeFalse();
    });

    it('should return false if anything in merchant.kyc_verified.details chain is falsy', () => {
      malformedKycProfiles.forEach(badValue => {
        const merchant = merchantDataFactory.build({kyc_verified: badValue});
        merchantSpy.and.returnValue(merchant);

        expect(merchantService.isKycProfilePresent()).toBeFalse();
      });
    });
  });

  describe('isKycFailed() helper', () => {
    beforeEach(() => {
      merchantSpy = spyOn(merchantService, 'getMerchant');
    });

    it('should return true if the merchant has failed kyc', () => {
      const merchant = merchantDataFactory.build({kyc_verified: kycVerifiedFailed});
      merchantSpy.and.returnValue(merchant);

      expect(merchantService.isKycFailed()).toBeTrue();
    });

    it('should return false if the merchant is KYC unverified or KYC verified', () => {
      [kycVerifiedUnverified, kycVerifiedPass].forEach(falseValue => {
        const merchant = merchantDataFactory.build({kyc_verified: falseValue});
        merchantSpy.and.returnValue(merchant);
        expect(merchantService.isKycFailed()).toBeFalse();
      });
    });

    it('should return true if anything in merchant.kyc_verified.details chain is falsy', () => {
      malformedKycProfiles.forEach(malformedKycProfile => {
        const merchant = merchantDataFactory.build({kyc_verified: malformedKycProfile});
        merchantSpy.and.returnValue(merchant);

        expect(merchantService.isKycFailed()).toBeTrue();
      });
    });
  });

  describe('isAuthenticationFailed() helper', () => {
    const applicantId = kycCheckIAVerified.guid;
    beforeEach(() => {
      merchantSpy = spyOn(merchantService, 'getMerchant');
    });

    it('should return true if the merchant failed EID or failed EID but passed other KYC', () => {
      [kycVerifiedIAFailed, kycVerifiedIAFailedOtherKycPassed].forEach(trueValue => {
        const merchant = merchantDataFactory.build({kyc_verified: trueValue});
        merchantSpy.and.returnValue(merchant);

        expect(merchantService.isAuthenticationFailed(applicantId)).toBeTrue();
      });
    });

    it('should return false if the merchant passed EID', () => {
      const passedIdAuthMerchant = merchantDataFactory.build({kyc_verified: kycVerifiedPass});
      merchantSpy.and.returnValue(passedIdAuthMerchant);

      expect(merchantService.isAuthenticationFailed(applicantId)).toBeFalse();
    });

    it('should return true if anything in merchant.kyc_verified.details chain is not set', () => {
      malformedKycProfiles.forEach(malformedKycProfile => {
        const merchant = merchantDataFactory.build({kyc_verified: malformedKycProfile});
        merchantSpy.and.returnValue(merchant);

        expect(merchantService.isAuthenticationFailed(applicantId)).toBeTrue();
      });
    });
  });

  describe('authenticationCheckComplete()', () => {
    const applicantId = kycCheckIAVerified.guid;
    beforeEach(() => {
      merchantSpy = spyOn(merchantService, 'getMerchant');
    });


    it('should return true if the user\'s applicant is authenticated or has failed authentication', () => {
      [kycVerifiedIAFailed, kycCheckIAVerified].forEach(trueValue => {
        const merchant = merchantDataFactory.build({kyc_verified: trueValue});
        merchantSpy.and.returnValue(merchant);

        expect(merchantService.authenticationCheckComplete(applicantId)).toBeTrue();
      });
    });

    it('should return true if the user\'s applicant has failed authenticatiom', () => {
      const merchant = merchantDataFactory.build({kyc_verified: kycVerifiedIAFailed});
      merchantSpy.and.returnValue(merchant);

      expect(merchantService.authenticationCheckComplete(applicantId)).toBeTrue();
    });

    it('should return false if the user\'s applicantId is falsy', () => {
      const merchant = merchantDataFactory.build();
      merchantSpy.and.returnValue(merchant);

      expect(merchantService.authenticationCheckComplete(null)).toBeFalse();
    });

    it('should return false if the authentication entry for the user\'s applicant is missing from kyc_verified', () => {
      const merchant = merchantDataFactory.build({kyc_verified: kycVerifiedIAMissing});
      merchantSpy.and.returnValue(merchant);

      expect(merchantService.authenticationCheckComplete(applicantId)).toBeFalse();
    });

    it('should return false if provided applicantId is null-like', () => {
      merchantSpy.and.returnValue(merchantDataFactory.build());
      const invalidApplicantIds = [null, undefined, ''];

      invalidApplicantIds.forEach((a_id) => {
        expect(merchantService.authenticationCheckComplete(a_id)).toBeFalse();
      });
    });

    it('should return false if anything in merchant.kyc_verified.details chain is not set', () => {
      malformedKycProfiles.forEach(malformedKycProfile => {
        const merchant = merchantDataFactory.build({kyc_verified: malformedKycProfile});
        merchantSpy.and.returnValue(merchant);

        expect(merchantService.authenticationCheckComplete(applicantId)).toBeFalse();
      });
    });
  });

  describe('isCOECheckFailed()', () => {
    beforeEach(() => {
      merchantSpy = spyOn(merchantService, 'getMerchant');
    });

    it('should return true if the user\'s merchant is null', () => {
      merchantSpy.and.returnValue(null);
      expect(merchantService.isCOECheckFailed()).toBeTrue();
    });

    it('should return true if the user\'s merchant KYC profile is null', () => {
      const merchant = merchantDataFactory.build({kyc_verified: null});
      merchantSpy.and.returnValue(merchant);
      expect(merchantService.isCOECheckFailed()).toBeTrue();
    });

    it('should return false if the user passed confirmation of existance', () => {
      merchantSpy.and.returnValue(merchantDataFactory.build());
      expect(merchantService.isCOECheckFailed()).toBeFalse();
    });

    it('should return true if the user failed confirmation of existance', () => {
      const merchant = merchantDataFactory.build({kyc_verified: kycVerifiedCOEFailed});
      merchantSpy.and.returnValue(merchant);
      expect(merchantService.isCOECheckFailed()).toBeTrue();
    });

    it('should return false if the user\'s confirmation of existance has not been verified yet', () => {
      const merchant = merchantDataFactory.build({kyc_verified: kycVerifiedCOEUnverified});
      merchantSpy.and.returnValue(merchant);

      expect(merchantService.isCOECheckFailed()).toBeFalse();
    });

    it('should return false if the COE entry for the user\'s merchant is missing from kyc_verified', () => {
      const merchant = merchantDataFactory.build({kyc_verified: kycVerifiedCOEMissing});
      merchantSpy.and.returnValue(merchant);

      expect(merchantService.isCOECheckFailed()).toBeFalse();
    });

    it('should return true if anything in merchant.kyc_verified.details chain is not set', () => {
      malformedKycProfiles.forEach(malformedKycProfile => {
        const merchant = merchantDataFactory.build({kyc_verified: malformedKycProfile});
        merchantSpy.and.returnValue(merchant);

        expect(merchantService.isCOECheckFailed()).toBeTrue();
      });
    });
  });

  describe('merchantHasSelectedBankAccount()', () => {
    beforeEach(() => {
      merchantSpy = spyOn(merchantService, 'getMerchant');
    });

    it('should return true if selected_bank_account is set', () => {
      const merchant = merchantDataFactory.build({selected_bank_account: 'someaccount'});
      merchantSpy.and.returnValue(merchant);

      expect(merchantService.merchantHasSelectedBankAccount()).toBeTrue();
    });

    it('should return false if merchant is not set', () => {
      merchantSpy.and.returnValue(null);

      expect(merchantService.merchantHasSelectedBankAccount()).toBeFalse();
    });

    it('should return false if merchant is set but selected_bank_account is undefined, null, or empty', () => {
      const values = [null, undefined, ''];

      values.forEach((val) => {
        const merchant = merchantDataFactory.build({selected_bank_account: val});
        merchantSpy.and.returnValue(merchant);

        expect(merchantService.merchantHasSelectedBankAccount()).toBeFalse();
        merchantSpy.calls.reset();
      });
    });
  });

  describe('merchantSalesVolumeRequired()', () => {
    beforeEach(() => {
      merchantSpy = spyOn(merchantService, 'getMerchant');
    });

    it('should return false if there is 1 account in selected_sales_volume_accounts', () => {
      const merchant = merchantDataFactory.build({selected_sales_volume_accounts: ['ba_123']});
      merchantSpy.and.returnValue(merchant);

      expect(merchantService.merchantSalesVolumeRequired()).toBeFalse();
    });

    it('should return false if there is more than 1 account in selected_sales_volume_accounts', () => {
      const merchant = merchantDataFactory.build({selected_sales_volume_accounts: ['ba_123', 'ba_456']});
      merchantSpy.and.returnValue(merchant);

      expect(merchantService.merchantSalesVolumeRequired()).toBeFalse();
    });

    it('should return false if there is no merchant set', () => {
      merchantSpy.and.returnValue(null);

      expect(merchantService.merchantSalesVolumeRequired()).toBeFalse();
    });

    it('should return true if merchant is set but selected_sales_volume_accounts is null, empty, or undefined', () => {
      const values = [null, [], undefined];

      values.forEach((val) => {
        const merchant = merchantDataFactory.build({selected_sales_volume_accounts: val});
        merchantSpy.and.returnValue(merchant);

        expect(merchantService.merchantSalesVolumeRequired()).toBeTrue();
        merchantSpy.calls.reset();
      });
    });
  });

  describe('isQuickBooksConnected()', () => {
    beforeEach(() => {
      merchantSpy = spyOn(merchantService, 'getMerchant');
    });

    it('should return true if quickbooks_state is set to connected', () => {
      const merchant = merchantDataFactory.build({quickbooks_state: QuickBooksState.connected});
      merchantSpy.and.returnValue(merchant);

      expect(merchantService.isQuickBooksConnected()).toBeTrue();
    });

    it('should return true if quickbook_state is aboutToExpire', () => {
      const merchant = merchantDataFactory.build({quickbooks_state: QuickBooksState.aboutToExpire});
      merchantSpy.and.returnValue(merchant);

      expect(merchantService.isQuickBooksConnected()).toBeTrue();
    });

    it('should return false if quickbook_state is not_connected', () => {
      const merchant = merchantDataFactory.build({quickbooks_state: QuickBooksState.notConnected});
      merchantSpy.and.returnValue(merchant);

      expect(merchantService.isQuickBooksConnected()).toBeFalse();
    });

    it('should return false if merchant is set but quickbooks_state is null or undefined', () => {
      const values = [null, undefined];

      values.forEach((val) => {
        const merchant = merchantDataFactory.build({quickbooks_state: val});
        merchantSpy.and.returnValue(merchant);

        expect(merchantService.merchantHasSelectedBankAccount()).toBeFalse();
        merchantSpy.calls.reset();
      });
    });
  });

  describe('becomeBusinessPartner()', () => {
    beforeEach(() => {
      merchantSpy = spyOn(merchantService, 'getMerchant');
    });

    it('should be able to send request to become a business partner', () => {
      const response = voidResponseFactory.build();
      spyOn(localStorage, 'setItem');
      merchantSpy.and.returnValue(merchantDataFactory.build());
      merchantService.becomeBusinessPartner()
        .pipe(take(1))
        .subscribe(
          (res) => expect(res).toEqual(response),
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const merchantRequest = httpMock.expectOne(API_BUSINESS_PARTNER.POST_BUSINESS_PARTNER_NEW_PATH);
      expect(merchantRequest.request.method).toEqual('POST');
      merchantRequest.flush(response);
    });

    it('should pass down an error if becomeBusinessPartner returns an http error', () => {
      merchantSpy.and.returnValue(merchantDataFactory.build());
      HTTP_ERRORS.forEach(httpError => {
        merchantService.becomeBusinessPartner()
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const merchantRequest = httpMock.expectOne(API_BUSINESS_PARTNER.POST_BUSINESS_PARTNER_NEW_PATH);
        expect(merchantRequest.request.method).toEqual('POST');
        merchantRequest.flush([], {status: httpError.status, statusText: httpError.statusText});
      });
    });
  });

  describe('refreshOffers$()', () => {
    describe('HttpRequest returns status: 200', () => {
      function returnStatusSuccess() {
        const url = API_MERCHANT.REFRESH_OFFERS_PATH;
        const offersRefreshRequest = httpMock.expectOne(url);

        expect(offersRefreshRequest.request.method).toEqual('POST');
        offersRefreshRequest.flush({status: 200, statusText: 'OK', data: {}});
      }

      it('should make an API call to refresh offers', () => {
        merchantService.refreshOffers$()
          .pipe(take(1))
          .subscribe({
            error: (err) => fail('Prevent this test to fail silently: ' + err)
          });

        returnStatusSuccess();
      });
    }); // describe - HttpRequest returns status: 200

    describe('HttpRequest returns status: HttpErrorResponse', () => {
      it('should pass down an error to caller if loading offers returns an http error', () => {
        HTTP_ERRORS.forEach(httpError => {
          merchantService.refreshOffers$()
            .pipe(take(1))
            .subscribe(
              (res) => fail('Prevented silent failure of this unit test: ' + res),
              (err) => expect(err.status).toEqual(httpError.status)
            );

          const url = API_MERCHANT.REFRESH_OFFERS_PATH;
          const offersRefreshRequest = httpMock.expectOne(url);

          expect(offersRefreshRequest.request.method).toEqual('POST');
          offersRefreshRequest.flush([], {status: httpError.status, statusText: httpError.statusText});
        });
      });
    }); // describe - HttpRequest returns status: HttpErrorResponse
  }); // describe - refreshOffers$()

  describe('updateDesiredBankAccountBalance', () => {
    const merchantPutData = merchantPutFactory.build();
    const editedMerchantData = merchantDataFactory.build(merchantPutData);

    it('should make a call to update merchant', () => {
      merchantService.updateDesiredBankAccountBalance(merchantPutData.id, merchantPutData.desired_bank_account_balance)
        .pipe(take(1))
        .subscribe(
          (res) => expect(res.data).toBeTruthy(),
          (err) => fail('Prevent this test to fail silently: ' + err)
        );

      const url: string = API_MERCHANT.PUT_MERCHANTS_PATH.replace(':id', merchantPutData.id);
      const putMerchantsRequest: TestRequest = httpMock.expectOne({ url: url, method: 'PUT' });

      putMerchantsRequest.flush({ status: 'SUCCESS', data: editedMerchantData });
    });
  });

  describe('updateMerchant', () => {
    const merchantPutData = merchantPutFactory.build();
    const editedMerchantData = merchantDataFactory.build(merchantPutData);

    const editedMerchantDataWithOptional = merchantDataFactory.build(merchantPutWithOptional);

    // Note: [Graham] do these tests do anything without an expectation?
    it('should make a call to update merchant', () => {
      merchantService.updateMerchant(merchantPutData, false)
        .pipe(take(1))
        .subscribe({
          error: (err) => fail('Prevent this test to fail silently: ' + err)
        });

      const url: string = API_MERCHANT.PUT_MERCHANTS_PATH.replace(':id', merchantPutData.id);
      const putMerchantsRequest: TestRequest = httpMock.expectOne({url: url, method: 'PUT'});

      putMerchantsRequest.flush({status: 'SUCCESS', data: editedMerchantData});
    });

    it('should make a call to update merchant with optional parameters when specified', () => {
      merchantService.updateMerchant(merchantPutWithOptional, false)
        .pipe(take(1))
        .subscribe({
          error: (err) => fail('Prevent this test to fail silently: ' + err)
        });

      const url: string = API_MERCHANT.PUT_MERCHANTS_PATH.replace(':id', merchantPutWithOptional.id);
      const putMerchantsRequest: TestRequest = httpMock.expectOne({url: url, method: 'PUT'});

      putMerchantsRequest.flush({status: 'SUCCESS', data: editedMerchantDataWithOptional});
    });

    describe('when successful', () => {
      it('should update the merchant', () => {
        expect(merchantService.getMerchant()).toBeNull();

        merchantService.updateMerchant(merchantPutData, false)
          .pipe(take(1))
          .subscribe(
            () => expect(merchantService.getMerchant()).toEqual(editedMerchantData),
            (err) => fail('Prevent this test to fail silently: ' + err)
          );

        const url: string = API_MERCHANT.PUT_MERCHANTS_PATH.replace(':id', merchantPutData.id);
        const putMerchantsRequest: TestRequest = httpMock.expectOne({url: url, method: 'PUT'});

        putMerchantsRequest.flush({status: 'SUCCESS', data: editedMerchantData});
      });

      it('should update the merchant with optional parameters when specified', () => {
        expect(merchantService.getMerchant()).toBeNull();

        merchantService.updateMerchant(merchantPutWithOptional, false)
          .pipe(take(1))
          .subscribe(
            () => expect(merchantService.getMerchant()).toEqual(editedMerchantDataWithOptional),
            (err) => fail('Prevent this test to fail silently: ' + err)
          );

        const url: string = API_MERCHANT.PUT_MERCHANTS_PATH.replace(':id', merchantPutWithOptional.id);
        const putMerchantsRequest: TestRequest = httpMock.expectOne({url: url, method: 'PUT'});

        putMerchantsRequest.flush({status: 'SUCCESS', data: editedMerchantDataWithOptional});
      });

      it('should record the merchant update when record is true', () => {
        spyOn(MerchantUpdateThrottling, 'recordMerchantUpdate');

        merchantService.updateMerchant(merchantPutData, true)
          .pipe(take(1))
          .subscribe(
            () => {
              expect(MerchantUpdateThrottling.recordMerchantUpdate).toHaveBeenCalledOnceWith(editedMerchantData.id);
            },
            (err) => fail('Prevent this test to fail silently: ' + err)
          );

        const url: string = API_MERCHANT.PUT_MERCHANTS_PATH.replace(':id', merchantPutData.id);
        const putMerchantsRequest: TestRequest = httpMock.expectOne({url: url, method: 'PUT'});

        putMerchantsRequest.flush({status: 'SUCCESS', data: editedMerchantData});
      });

      it('should not record the merchant update when record is false', () => {
        spyOn(MerchantUpdateThrottling, 'recordMerchantUpdate');

        merchantService.updateMerchant(merchantPutData, false)
          .pipe(take(1))
          .subscribe(
            () => {
              expect(MerchantUpdateThrottling.recordMerchantUpdate).not.toHaveBeenCalled();
            },
            (err) => fail('Prevent this test to fail silently: ' + err)
          );

        const url: string = API_MERCHANT.PUT_MERCHANTS_PATH.replace(':id', merchantPutData.id);
        const putMerchantsRequest: TestRequest = httpMock.expectOne({url: url, method: 'PUT'});

        putMerchantsRequest.flush({status: 'SUCCESS', data: editedMerchantData});
      });

      it('should not record the merchant update when record is not provided', () => {
        spyOn(MerchantUpdateThrottling, 'recordMerchantUpdate');

        merchantService.updateMerchant(merchantPutData)
          .pipe(take(1))
          .subscribe(
            () => {
              expect(MerchantUpdateThrottling.recordMerchantUpdate).not.toHaveBeenCalled();
            },
            (err) => fail('Prevent this test to fail silently: ' + err)
          );

        const url: string = API_MERCHANT.PUT_MERCHANTS_PATH.replace(':id', merchantPutData.id);
        const putMerchantsRequest: TestRequest = httpMock.expectOne({url: url, method: 'PUT'});

        putMerchantsRequest.flush({status: 'SUCCESS', data: editedMerchantData});
      });

    }); // describe - 'when successful'

    it('should pass down an error if updateMerchant returns an HTTP error', () => {
      HTTP_ERRORS.forEach(httpError => {
        merchantService.updateMerchant(merchantPutData, false)
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const url: string = API_MERCHANT.PUT_MERCHANTS_PATH.replace(':id', merchantPutData.id);
        const putMerchantsRequest: TestRequest = httpMock.expectOne({url: url, method: 'PUT'});

        putMerchantsRequest.flush([], {status: httpError.status, statusText: httpError.statusText});
      });
    });
  });

  describe('getMerchantDocuments()', () => {
    const uploadedDocumentsResponse = merchantDocumentsListingFactory.build();
    const params = merchantDocumentsQueryFactory.build();

    describe('on SUCCESS', () => {
      it('should return a MerchantDocumentsListing', () => {
        merchantService.getMerchantDocuments(params)
          .pipe(
            take(1)
          )
          .subscribe(
            (res) => expect(res).toEqual(uploadedDocumentsResponse),
            err => fail('Prevent this test from failing silently: ' + err)
          );

        const url = utilityService.getAugmentedUrl(API_MERCHANT.GET_MERCHANT_DOCUMENTS_PATH, params);
        const getMerchantDocumentsRequest: TestRequest = httpMock.expectOne({url: url, method: 'GET'});

        getMerchantDocumentsRequest.flush({status: 'SUCCESS', data: uploadedDocumentsResponse})
      });
    }); // describe - on SUCCESS

    describe('on ERROR', () => {
      // NOTE: these type of tests are basically self fulfilling. We should consider removing.
      it('should forward the error', () => {
        HTTP_ERRORS.forEach(httpError => {
          merchantService.getMerchantDocuments(params)
            .pipe(
              take(1)
            )
            .subscribe({
              error: (err) => expect(err.status).toEqual(httpError.status)
            });

          const url = utilityService.getAugmentedUrl(API_MERCHANT.GET_MERCHANT_DOCUMENTS_PATH, params);
          const getMerchantDocumentsRequest: TestRequest = httpMock.expectOne({url: url, method: 'GET'});

          getMerchantDocumentsRequest.flush({status: httpError.status, statusText: httpError.statusText});
        }); // forEach
      });
    }); // describe - on ERROR
  }); // describe - getMerchantDocuments()

  describe('setMerchant', () => {
    it('should set merchant', () => {
      merchantService.setMerchant(null);
      expect(merchantService.getMerchant()).toBeNull();

      merchantService.setMerchant(merchantDataFactory.build());
      expect(merchantService.getMerchant()).toEqual(merchantDataFactory.build());
    });

    it('should set sanitize certain properties', () => {
      merchantService.setMerchant(merchantDataFactory.build({incorporated_in: 'x' as Province, state_province: 'y'}));
      const merchant = merchantService.getMerchant();

      expect(merchant.incorporated_in).toBeNull();
      expect(merchant.state_province).toBeNull();
    });
  });

  describe('buildMerchantQueryPost()', () => {
    it('succeeds with proper form data', () => {
      const result = merchantService.buildMerchantQueryPost(businessFormFactory.build(), addressFormFactory.build());
      expect(result).toBeTruthy(); // 'to be set'
    });

    describe('should return undefined when', () => {
      it('businessData is null-like', () => {
        [null, undefined].forEach(nullLikeValue => {
          const result = merchantService.buildMerchantQueryPost(nullLikeValue, addressFormFactory.build());
          expect(result).toBeUndefined();
        }); // forEach
      });

      it('addressData is null-like', () => {
        [null, undefined].forEach(nullLikeValue => {
          const result = merchantService.buildMerchantQueryPost(businessFormFactory.build(), nullLikeValue);
          expect(result).toBeUndefined();
        }); // forEach
      });
    }); // describe - 'should return undefined when'
  }); // describe - buildMerchantQueryPost()

  describe('buildMerchantPost()', () => {
    it('should succeed with proper form data', () => {
      const result = merchantService.buildMerchantPost(businessFormFactory.build(), addressFormFactory.build(), null);

      expect(result).toBeTruthy(); // 'to be set'
      expect(result.lead_guid).toBeFalsy();
    });

    it('should take lead from user session', () => {
      const result = merchantService.buildMerchantPost(businessFormFactory.build(), addressFormFactory.build(), lead_guid);
      expect(result).toBeTruthy();
      expect(result.lead_guid).toBeTruthy();
    });

    it('succeeds with proper form data with owner_since', () => {
      [new Date(), null].forEach(value => {
        const result = merchantService.buildMerchantPost(businessFormFactory.build({owner_since: value}), addressFormFactory.build(), null);
        expect(result).toBeTruthy();
      });
    });

    it('succeeds with proper form data with self_attested_date_established', () => {
      [new Date(), null].forEach(value => {
        const result = merchantService.buildMerchantPost(businessFormFactory.build({self_attested_date_established: value}), addressFormFactory.build(), null);
        expect(result).toBeTruthy();
      });
    });

    it('succeeds with proper form data with self_attested_average_monthly_sales', () => {
      [10000, null].forEach(value => {
        const result = merchantService.buildMerchantPost(businessFormFactory.build({self_attested_average_monthly_sales: value}), addressFormFactory.build(), null);
        expect(result).toBeTruthy();
      });
    });

    describe('should return undefined when', () => {
      it('businessData is null-like', () => {
        [null, undefined].forEach(nullLikeValue => {
          const result = merchantService.buildMerchantPost(nullLikeValue, addressFormFactory.build(), lead_guid);
          expect(result).toBeUndefined();
        }); // forEach
      });

      it('addressData is null-like', () => {
        [null, undefined].forEach(nullLikeValue => {
          const result = merchantService.buildMerchantPost(businessFormFactory.build(), nullLikeValue, lead_guid);
          expect(result).toBeUndefined();
        }); // forEach
      });
    }); // describe - 'should return undefined when'
  }); // describe -buildMerchantPost()

  describe('buildMerchantQuerySelectPost()', () => {
    it('succeeds with proper form data', () => {
      const result = merchantService.buildMerchantQuerySelectPost(businessFormFactory.build(), 'queryId', 'businessId', null);
      expect(result).toBeTruthy();
      expect(result.lead_guid).toBeFalsy();
    });

    it('succeeds with proper form data with owner_since', () => {
      [new Date(), null].forEach(value => {
        const result = merchantService.buildMerchantQuerySelectPost(businessFormFactory.build({owner_since: value}), 'queryId', 'businessId', lead_guid);
        expect(result).toBeTruthy();
      });
    });

    it('succeeds with proper form data with self_attested_date_established', () => {
      [new Date(), null].forEach(value => {
        const result = merchantService.buildMerchantQuerySelectPost(businessFormFactory.build({self_attested_date_established: value}), 'queryId', 'businessId', lead_guid);
        expect(result).toBeTruthy();
      });
    });

    it('succeeds with proper form data with self_attested_average_monthly_sales', () => {
      [10000, null].forEach(value => {
        const result = merchantService.buildMerchantQuerySelectPost(businessFormFactory.build({self_attested_average_monthly_sales: value}), 'queryId', 'businessId', lead_guid);
        expect(result).toBeTruthy();
      });
    });

    describe('should return undefined when', () => {
      it('businessData is null-like', () => {
        [null, undefined].forEach(nullLikeValue => {
          const result = merchantService.buildMerchantQuerySelectPost(nullLikeValue, 'queryId', 'businessId', lead_guid);
          expect(result).toBeUndefined();
        }); // forEach
      });

      it('queryId is null-like', () => {
        [null, undefined].forEach(nullLikeValue => {
          const result = merchantService.buildMerchantQuerySelectPost(businessFormFactory.build(), nullLikeValue, 'businessId', lead_guid);
          expect(result).toBeUndefined();
        }); // forEach
      });

      it('businessId is null-like', () => {
        [null, undefined].forEach(nullLikeValue => {
          const result = merchantService.buildMerchantQuerySelectPost(businessFormFactory.build(), 'queryId', nullLikeValue, lead_guid);
          expect(result).toBeUndefined();
        }); // forEach
      });
    }); // describe - 'should return undefined when'
  }); // describe - buildMerchantQuerySelectPost()
});
