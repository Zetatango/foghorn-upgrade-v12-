import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { DirectPaymentService } from 'app/services/direct-payment.service';
import { UtilityService } from 'app/services/utility.service';
import { directPaymentPostFactory, directPaymentResponseFactory } from 'app/test-stubs/factories/direct-payment';
import { HTTP_ERRORS } from 'app/test-stubs/api-errors-stubs';
import { supplierInfoLcbo } from 'app/test-stubs/factories/supplier';
import { API_DIRECT_PAYMENT, DIRECT_DEBIT_POST_KEY, SUPPLIER_INFORMATION_KEY } from '../constants';
import { CookieService } from 'ngx-cookie-service';

describe('DirectPaymentService', () => {
  let directDebitPostSpy;
  let supplierInformationSpy;

  let directPaymentService: DirectPaymentService;
  let httpMock: HttpTestingController;
  const directPaymentResp = directPaymentResponseFactory.build();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [ CookieService, UtilityService, DirectPaymentService ]
    });
  });

  beforeEach(() => {
    directPaymentService = TestBed.inject(DirectPaymentService);
    localStorage.removeItem(DIRECT_DEBIT_POST_KEY);
    localStorage.removeItem(SUPPLIER_INFORMATION_KEY);
    httpMock = TestBed.inject(HttpTestingController);
    directDebitPostSpy = spyOnProperty(directPaymentService, 'directPaymentPost$').and.returnValue(new BehaviorSubject(null));
    supplierInformationSpy = spyOnProperty(directPaymentService, 'supplierInformation$').and.returnValue(new BehaviorSubject(null))
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(directPaymentService).toBeTruthy();
  });

  describe('storeDirectPaymentInformation', () => {
    it('should store direct payment and supplier information on local storage', () => {
      const directPaymentPost = directPaymentPostFactory.build();
      const supplierInformation = supplierInfoLcbo;
      directPaymentService.storeDirectPaymentInformation(directPaymentPost, supplierInformation);

      expect(JSON.parse(localStorage.getItem(DIRECT_DEBIT_POST_KEY))).toEqual(directPaymentPost);
      expect(JSON.parse(localStorage.getItem(SUPPLIER_INFORMATION_KEY))).toEqual(supplierInformation);
    });

    it('should set direct payment information', () => {
      directDebitPostSpy.and.callThrough();
      const directPaymentPost = directPaymentPostFactory.build();
      const supplierInformation = supplierInfoLcbo;
      directPaymentService.storeDirectPaymentInformation(directPaymentPost, supplierInformation);

      expect(directPaymentService.directPaymentPost$).toEqual(new BehaviorSubject(directPaymentPost));
    });

    it('should set supplier information', () => {
      supplierInformationSpy.and.callThrough();
      const directPaymentPost = directPaymentPostFactory.build();
      const supplierInformation = supplierInfoLcbo;
      directPaymentService.storeDirectPaymentInformation(directPaymentPost, supplierInformation);

      expect(directPaymentService.supplierInformation$).toEqual(new BehaviorSubject(supplierInformation));
    });
  });

  describe('postDirectPayment', () => {
    it('should be able to post a direct payment data', () => {
      directDebitPostSpy.and.returnValue(directPaymentPostFactory.build());
      directPaymentService.postDirectPayment()
        .pipe(take(1))
        .subscribe((res) => expect(res.data).toEqual(directPaymentResponseFactory.build()));

      const directPaymentRequest = httpMock.expectOne(API_DIRECT_PAYMENT.POST_NEW_PATH);
      expect(directPaymentRequest.request.method).toEqual('POST');
      directPaymentRequest.flush({ status: 200, statusText: 'OK', data: directPaymentResponseFactory.build() });
    });

    it('directPayment behaviour subject should initially be empty', () => {
      expect(directPaymentService.directPaymentPost$)
        .toEqual(new BehaviorSubject(null));
    });

    it('should pass down an error to caller if posting a direct payment return an http error', () => {
      HTTP_ERRORS.forEach(httpError => {
        directPaymentService.postDirectPayment()
          .pipe(take(1))
          .subscribe(
            () => fail('Prevented silent failure of this unit test.'),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const directPaymentRequest = httpMock.expectOne(API_DIRECT_PAYMENT.POST_NEW_PATH);
        expect(directPaymentRequest.request.method).toEqual('POST');
        directPaymentRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('refreshDirectPayment', () => {
    it('should be able to reload a direct payment information from local storage', () => {
      directDebitPostSpy.and.callThrough();
      supplierInformationSpy.and.callThrough();

      const directPaymentPost = directPaymentPostFactory.build();
      const supplierInformation = supplierInfoLcbo;
      localStorage.setItem(DIRECT_DEBIT_POST_KEY, JSON.stringify(directPaymentPost));
      localStorage.setItem(SUPPLIER_INFORMATION_KEY, JSON.stringify(supplierInformation));

      directPaymentService.refreshDirectPayment();

      expect(directPaymentService.directPaymentPost$).toEqual(new BehaviorSubject(directPaymentPost));
      expect(directPaymentService.supplierInformation$).toEqual(new BehaviorSubject(supplierInformation));
    });

    it('should throw error if no direct payment information found in local storage', () => {
      expect(() => directPaymentService.refreshDirectPayment()).toThrowError('No active direct debit found');
    });
  });

  describe('getActiveId', () => {
    it('should get active id when set', () => {
      localStorage.setItem(DIRECT_DEBIT_POST_KEY, directPaymentResp.id);
      expect(directPaymentService.activeId).toBe(directPaymentResp.id);
    });

    it('should get null active id when not set', () => {
      expect(directPaymentService.activeId).toBe(null);
    });
  });

  describe('clearActiveId', () => {
    it('should clear active id when set', () => {
      localStorage.setItem(DIRECT_DEBIT_POST_KEY, directPaymentResp.id);
      directPaymentService.clearActiveId();
      expect(directPaymentService.activeId).toBe(null);
    });
  });

  describe('getDirectDebitFee', () =>  {
    it('should return direct debit fee even when directPayment is null', () => {
      expect(directPaymentService.directDebitFee).toEqual(2);
    });
  });

  describe('getDirectDebitPromoFee', () => {
    it('should return the promo fee for direct debit', () => {
      expect(directPaymentService.directDebitPromoFee).toEqual(directPaymentResp.promoFee);
    });
  });

});
