import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { BusinessPartnerMerchantService } from './business-partner-merchant.service';
import { UtilityService } from './utility.service';
import { API_BUSINESS_PARTNER_MERCHANT } from 'app/constants';
import { invoiceResponse } from 'app/test-stubs/factories/invoice';
import { HTTP_ERRORS } from 'app/test-stubs/api-errors-stubs';
import {
  businessPartnerMerchantFactory, linkedMerchant, noGradelinkedMerchant, pafLinkedMerchant
} from 'app/test-stubs/factories/business-partner-merchant';

describe('BusinessPartnerMerchantService', () => {
  let bpms: BusinessPartnerMerchantService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        BusinessPartnerMerchantService,
        CookieService,
        UtilityService
      ]
    });

    bpms = TestBed.inject(BusinessPartnerMerchantService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(bpms).toBeTruthy();
  });

  describe('sendInvoice', () => {
    it('should be able to send an invoice to a business partner customer', () => {
      bpms.sendInvoice('bpm_123', '123', '321', 1234.00, 'md_456', '2019-01-01')
        .pipe(take(1))
        .subscribe(
          () => {
            expect(bpms.getBusinessPartnerMerchantInvoiceApplication()).toEqual(new BehaviorSubject(invoiceResponse));
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const invoiceRequest = httpMock.expectOne(API_BUSINESS_PARTNER_MERCHANT.POST_INVOICE.replace(':id', 'bpm_123'));
      expect(invoiceRequest.request.method).toEqual('POST');
      invoiceRequest.flush({ status: 'SUCCESS', data: invoiceResponse });
    });

    it('should pass down an error if sendInvoice returns an http error', () => {
      HTTP_ERRORS.forEach(httpError => {
        bpms.sendInvoice('bpm_123', '123', '321', 1234.00, 'md_456', '2019-01-01')
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const invoiceRequest = httpMock.expectOne(API_BUSINESS_PARTNER_MERCHANT.POST_INVOICE.replace(':id', 'bpm_123'));
        expect(invoiceRequest.request.method).toEqual('POST');
        invoiceRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('hasSmallBusinessGrade', () => {
    it('should return true when linked merchant has small business grade', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build({ linked_merchants: [ linkedMerchant ] });
      expect(bpms.hasSmallBusinessGrade(businessPartnerMerchant)).toBe(true);
    });

    it('should return false when linked merchant has no small business grade', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build({ linked_merchants: [ noGradelinkedMerchant ] });
      expect(bpms.hasSmallBusinessGrade(businessPartnerMerchant)).toBe(false);
    });
  });

  describe('hasAvailableAmount', () => {
    it('should return true when linked merchant has available amount', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build({ linked_merchants: [ linkedMerchant ] });
      expect(bpms.hasAvailableAmount(businessPartnerMerchant)).toBe(true);
    });

    it('should return false when linked merchant has no available amount', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build();
      expect(bpms.hasAvailableAmount(businessPartnerMerchant)).toBe(false);
    });
  });

  describe('hasLinkedMerchant', () => {
    it('should return true when linked merchant exists', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build({ linked_merchants: [ linkedMerchant ] });
      expect(bpms.hasLinkedMerchant(businessPartnerMerchant)).toBe(true);
    });

    it('should return true when linked merchant does not exist', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build();
      expect(bpms.hasLinkedMerchant(businessPartnerMerchant)).toBe(false);
    });
  });

  describe('hasAutoPay', () => {
    it('should return true when bpm is set for auto_pay', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build({ linked_merchants: [ pafLinkedMerchant ] });
      expect(bpms.hasAutoPay(businessPartnerMerchant)).toBe(true);
    });

    it('should return false when bpm is not set for auto_pay', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build();
      expect(bpms.hasAutoPay(businessPartnerMerchant)).toBe(false);
    });
  });

  describe('hasAutoSend', () => {
    it('should return true when bpm is set for auto_send', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build({ auto_send: true });
      expect(bpms.hasAutoSend(businessPartnerMerchant)).toBe(true);
    });

    it('should return true when bpm is not set for auto_send', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build();
      expect(bpms.hasAutoSend(businessPartnerMerchant)).toBe(false);
    });
  });

  describe('getAutoPayStatus', () => {
    it('should return PARTNER_DASHBOARD.CUSTOMER_SUMMARY.PAYMENT_PLAN when bpm is set for auto_pay', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build({ linked_merchants: [ pafLinkedMerchant ] });
      expect(bpms.getAutoPayStatus(businessPartnerMerchant)).toBe('PARTNER_DASHBOARD.CUSTOMER_SUMMARY.PAYMENT_PLAN');
    });

    it('should return PARTNER_DASHBOARD.CUSTOMER_SUMMARY.MANUAL_PAY when bpm is not set for auto_pay', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build();
      expect(bpms.getAutoPayStatus(businessPartnerMerchant)).toBe('PARTNER_DASHBOARD.CUSTOMER_SUMMARY.MANUAL_PAY');
    });
  });

  describe('getAutoSendStatus', () => {
    it('should return PARTNER_DASHBOARD.CUSTOMER_SUMMARY.AUTO_SEND when bpm is set for auto_send', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build({ auto_send: true });
      expect(bpms.getAutoSendStatus(businessPartnerMerchant)).toBe('PARTNER_DASHBOARD.CUSTOMER_SUMMARY.AUTO_SEND');
    });

    it('should return PARTNER_DASHBOARD.CUSTOMER_SUMMARY.MANUAL_SEND when bpm is not set for auto_send', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build();
      expect(bpms.getAutoSendStatus(businessPartnerMerchant)).toBe('PARTNER_DASHBOARD.CUSTOMER_SUMMARY.MANUAL_SEND');
    });
  });

  describe('getCustomerSource', () => {
    it('should return DATA_SOURCE.QUICKBOOKS when a QuickBooks created invoice is passed in', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build({ quickbooks_customer_id: 'qb_123' });
      expect(bpms.getCustomerSource(businessPartnerMerchant)).toBe('DATA_SOURCE.QUICKBOOKS');
    });

    it('should return null otherwise', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build();
      expect(bpms.getCustomerSource(businessPartnerMerchant)).toBeNull();
    });
  });

  describe('hasDifferentSignupEmail', () => {
    it('should return true when emails are set and do not match', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build({ sign_up_email: 'not_test@test.com' });
      expect(bpms.hasDifferentSignupEmail(businessPartnerMerchant)).toBe(true);
    });

    it('should return false when bpm is null', () => {
      expect(bpms.hasDifferentSignupEmail(null)).toBe(false);
    });

    it('should return false when both emails are not set', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build({ email: null, sign_up_email: null });
      expect(bpms.hasDifferentSignupEmail(businessPartnerMerchant)).toBe(false);
    });
  });

  describe('hasDifferentSignupName', () => {
    it('should return true when names are set and do not match', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build({ sign_up_name: 'Not Same'});
      expect(bpms.hasDifferentSignupName(businessPartnerMerchant)).toBe(true);
    });

    it('should return false when bpm is null', () => {
      expect(bpms.hasDifferentSignupName(null)).toBe(false);
    });

    it('should return false when both name are not set', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build();
      expect(bpms.hasDifferentSignupName(businessPartnerMerchant)).toBe(false);
    });
  });

  describe('hasDifferentSignupProperties', () => {
    it('should return false when merchant is null', () => {
      expect(bpms.hasDifferentSignupProperties(null)).toBeFalse();
    });

    it('should return false when names match', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build();
      expect(bpms.hasDifferentSignupProperties(businessPartnerMerchant)).toBeFalse();
    });

    it('should return true when bpm emails mismatch', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build({ sign_up_email: 'not_same@test.com'});
      expect(bpms.hasDifferentSignupProperties(businessPartnerMerchant)).toBeTrue();
    });

    it('should return false when bpm names mismatch', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build({ sign_up_name: 'Not Same'});
      expect(bpms.hasDifferentSignupProperties(businessPartnerMerchant)).toBeTrue();
    });
  });

  describe('fetchBusinessPartnerApplication', () => {
    it('should be able to send request to get the business partner application', () => {
      bpms.subscribeToAutoSend(['1', '2'], true)
        .pipe(take(1))
        .subscribe(
          (res) => {
            expect(res).toBeDefined();
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const url = API_BUSINESS_PARTNER_MERCHANT.PUT_SUBSCRIBE;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toEqual('PUT');
      req.flush({ data: null, message: 'Business partner merchant subscribed to auto send payment plans successfully', status: 'SUCCESS'});
    });

    it('should pass down an error if fetchBusinessPartnerApplication returns an http error', () => {
      HTTP_ERRORS.forEach(httpError => {
        bpms.subscribeToAutoSend(['1', '2'], true)
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const url = API_BUSINESS_PARTNER_MERCHANT.PUT_SUBSCRIBE;
        const req = httpMock.expectOne(url);
        expect(req.request.method).toEqual('PUT');
        req.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });
});
