import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { BusinessPartnerService } from './business-partner.service';
import { UtilityService } from './utility.service';
import { API_BUSINESS_PARTNER, API_MERCHANT, API_TRACKED_OBJECT } from 'app/constants';
import { BusinessPartnerBrandingRequestParams } from 'app/models/api-entities/business-partner-branding-request-params';
import { BusinessPartnerProfileRequestParams } from 'app/models/api-entities/business-partner-profile-request-params';
import { DatatablesRequestParameters } from 'app/models/api-entities/datatables-request-parameters';
import { TrackedObjectState } from 'app/models/tracked-object-state';
import {
  businessPartnerApplicationFactory,
  businessPartnerBrandingFactory,
  businessPartnerCustomerSummary,
  trackedObjectHistory
} from 'app/test-stubs/factories/business-partner';
import {
  emptyBusinessPartnerProfile,
  partnerTrainingCompletedBusinessPartnerProfile
} from 'app/test-stubs/factories/business-partner-profile';
import { receivedBorrowerInvoices } from 'app/test-stubs/factories/invoice';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { HTTP_ERRORS } from 'app/test-stubs/api-errors-stubs';
import {
  defaultCustomerSummaryRequestParams,
  defaultDatatableRequestParams
} from 'app/test-stubs/factories/datatables';

import { BusinessPartnerApplicationState } from 'app/models/api-entities/business-partner-application';

describe('BusinessPartnerService', () => {
  let businessPartnerService: BusinessPartnerService;
  let httpMock: HttpTestingController;
  let utilityService: UtilityService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        BusinessPartnerService,
        CookieService,
        UtilityService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    businessPartnerService = TestBed.inject(BusinessPartnerService);
    httpMock = TestBed.inject(HttpTestingController);
    utilityService = TestBed.inject(UtilityService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(businessPartnerService).toBeTruthy();
  });

  describe('fetchBusinessPartnerApplication', () => {
    it('should be able to send request to get the business partner application', () => {
      const businessPartner = merchantDataFactory.build();
      const bpApplication = businessPartnerApplicationFactory.build();
      businessPartnerService.fetchBusinessPartnerApplication(businessPartner.id, true)
        .pipe(take(1))
        .subscribe(
          () => {
            expect(businessPartnerService.getBusinessPartnerApplication()).toEqual(new BehaviorSubject(bpApplication));
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const url = API_BUSINESS_PARTNER.GET_BUSINESS_PARTNER_APPLICATION_PATH.replace(':id', businessPartner.id) + '?show_terms=true';
      const merchantRequest = httpMock.expectOne(url);
      expect(merchantRequest.request.method).toEqual('GET');
      merchantRequest.flush({ status: 'SUCCESS', data: bpApplication });
    });

    it('should pass down an error if fetchBusinessPartnerApplication returns an http error', () => {
      const businessPartner = merchantDataFactory.build();
      HTTP_ERRORS.forEach(httpError => {
        businessPartnerService.fetchBusinessPartnerApplication(businessPartner.id, true)
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const url = API_BUSINESS_PARTNER.GET_BUSINESS_PARTNER_APPLICATION_PATH.replace(':id', businessPartner.id) + '?show_terms=true';
        const merchantRequest = httpMock.expectOne(url);
        expect(merchantRequest.request.method).toEqual('GET');
        merchantRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('setBusinessPartnerApplcation', () => {
    it('should set business partner application', () => {
      businessPartnerService.setBusinessPartnerApplication(null);
      expect(businessPartnerService.getBusinessPartnerApplication().getValue()).toBeNull();

      const application = businessPartnerApplicationFactory.build();
      businessPartnerService.setBusinessPartnerApplication(application);
      expect(businessPartnerService.getBusinessPartnerApplication().getValue()).toEqual(application);
    });
  }); // describe - setBusinessPartnerApplcation

  describe('inviteBorrower', () => {
    it('should be able to send request to invite a borrower on behalf of a business partner', () => {
      const businessPartner = merchantDataFactory.build();
      businessPartnerService.inviteBorrower(businessPartner.id, 'test@user.com', 'Test User')
        .pipe(take(1))
        .subscribe({
          error: (err) => fail('Prevented this test to fail silently: ' + err)
        });

      const merchantRequest = httpMock.expectOne(API_BUSINESS_PARTNER.POST_BUSINESS_PARTNER_INVITE_BORROWER_PATH.replace(':id', businessPartner.id));
      expect(merchantRequest.request.method).toEqual('POST');
      merchantRequest.flush({ status: 'SUCCESS', data: {} });
    });

    it('should pass down an error if inviteBorrower returns an http error', () => {
      const businessPartner = merchantDataFactory.build();
      HTTP_ERRORS.forEach(httpError => {
        businessPartnerService.inviteBorrower(businessPartner.id, 'test@user.com', 'Test User')
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const merchantRequest = httpMock.expectOne(API_BUSINESS_PARTNER.POST_BUSINESS_PARTNER_INVITE_BORROWER_PATH.replace(':id', businessPartner.id));
        expect(merchantRequest.request.method).toEqual('POST');
        merchantRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('createBusinessCustomer', () => {
    it('should be able to send request to create a business customer on behalf of a business partner', () => {
      const businessPartner = merchantDataFactory.build();
      businessPartnerService.createBusinessCustomer(businessPartner.id, 'test@user.com')
        .pipe(take(1))
        .subscribe({
          error: (err) => fail('Prevented this test to fail silently: ' + err)
        });

      const merchantRequest = httpMock.expectOne(API_BUSINESS_PARTNER.POST_BUSINESS_PARTNER_INVITE_BORROWER_PATH.replace(':id', businessPartner.id));
      expect(merchantRequest.request.method).toEqual('POST');
      merchantRequest.flush({ status: 'SUCCESS', data: {} });
    });

    it('should pass down an error if createBusinessCustomer returns an http error', () => {
      const businessPartner = merchantDataFactory.build();
      HTTP_ERRORS.forEach(httpError => {
        businessPartnerService.createBusinessCustomer(businessPartner.id, 'test@user.com')
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const merchantRequest = httpMock.expectOne(API_BUSINESS_PARTNER.POST_BUSINESS_PARTNER_INVITE_BORROWER_PATH.replace(':id', businessPartner.id));
        expect(merchantRequest.request.method).toEqual('POST');
        merchantRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('getCustomerSummary', () => {
    it('should return a list of business partner merchants on success', () => {
      const businessPartner = merchantDataFactory.build();
      const datatablesParams: DatatablesRequestParameters = defaultCustomerSummaryRequestParams;
      businessPartnerService.getCustomerSummary(businessPartner.id, datatablesParams)
        .pipe(take(1))
        .subscribe(
          () => {
            expect(businessPartnerService.getBusinessPartnerCustomerSummary()).toEqual(new BehaviorSubject(businessPartnerCustomerSummary));
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const url: string = utilityService.getAugmentedUrl(API_BUSINESS_PARTNER.GET_BUSINESS_PARTNER_MERCHANTS_PATH.replace(':id', businessPartner.id),
        datatablesParams);
      const merchantRequest = httpMock.expectOne(url);
      expect(merchantRequest.request.method).toEqual('GET');
      merchantRequest.flush({ status: 'SUCCESS', data: businessPartnerCustomerSummary });
    });

    it('should pass down an error if createBusinessCustomer returns an http error', () => {
      const businessPartner = merchantDataFactory.build();
      HTTP_ERRORS.forEach(httpError => {
        const datatablesParams: DatatablesRequestParameters = defaultCustomerSummaryRequestParams;
        businessPartnerService.getCustomerSummary(businessPartner.id, datatablesParams)
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const url: string = utilityService.getAugmentedUrl(API_BUSINESS_PARTNER.GET_BUSINESS_PARTNER_MERCHANTS_PATH.replace(':id', businessPartner.id),
          datatablesParams);
        const merchantRequest = httpMock.expectOne(url);
        expect(merchantRequest.request.method).toEqual('GET');
        merchantRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('getTrackedObjectEventHistory', () => {
    it('should return a list of business partner merchants on success', () => {
      businessPartnerService.getTrackedObjectEventHistory('obj_123', 0, 10)
        .pipe(take(1))
        .subscribe(
          () => {
            expect(businessPartnerService.getBusinessPartnerTrackedObjectHistory()).toEqual(new BehaviorSubject(trackedObjectHistory));
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const url: string = API_TRACKED_OBJECT.GET_TRACKED_OBJECT_EVENTS_PATH.replace(':id', 'obj_123') + '?offset=0&limit=10';
      const merchantRequest = httpMock.expectOne(url);
      expect(merchantRequest.request.method).toEqual('GET');
      merchantRequest.flush({ status: 'SUCCESS', data: trackedObjectHistory });
    });

    it('should pass down an error if createBusinessCustomer returns an http error', () => {
      HTTP_ERRORS.forEach(httpError => {
        businessPartnerService.getTrackedObjectEventHistory('obj_123', 0, 10)
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const url: string = API_TRACKED_OBJECT.GET_TRACKED_OBJECT_EVENTS_PATH.replace(':id', 'obj_123') + '?offset=0&limit=10';
        const merchantRequest = httpMock.expectOne(url);
        expect(merchantRequest.request.method).toEqual('GET');
        merchantRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('getSentInvoices', () => {
    it('should return a list of invoices with paging options on success', () => {
      const businessPartner = merchantDataFactory.build();
      const datatablesParams: DatatablesRequestParameters = defaultDatatableRequestParams;
      businessPartnerService.getSentInvoices(businessPartner.id, datatablesParams)
        .pipe(take(1))
        .subscribe(
          () => {
            expect(businessPartnerService.getBusinessPartnerSentInvoices()).toEqual(new BehaviorSubject(receivedBorrowerInvoices));
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const url: string = utilityService.getAugmentedUrl(API_BUSINESS_PARTNER.GET_BUSINESS_PARTNER_SENT_INVOICES_PATH.replace(':id', businessPartner.id),
        datatablesParams);
      const invoiceListRequest: TestRequest = httpMock.expectOne(url);
      expect(invoiceListRequest.request.method).toEqual('GET');
      invoiceListRequest.flush({ status: 'SUCCESS', data: receivedBorrowerInvoices });
    });

    it('should pass down an error if getSentInvoices returns an HTTP error', () => {
      HTTP_ERRORS.forEach(httpError => {
        const businessPartner = merchantDataFactory.build();
        const datatablesParams: DatatablesRequestParameters = defaultDatatableRequestParams;
        businessPartnerService.getSentInvoices(businessPartner.id, datatablesParams)
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const url: string = utilityService.getAugmentedUrl(API_BUSINESS_PARTNER.GET_BUSINESS_PARTNER_SENT_INVOICES_PATH.replace(':id', businessPartner.id),
          datatablesParams);
        const invoiceListRequest: TestRequest = httpMock.expectOne(url);
        expect(invoiceListRequest.request.method).toEqual('GET');
        invoiceListRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('getProfile', () => {
    it('should return the business partner profile on success', () => {
      const businessPartner = merchantDataFactory.build();
      businessPartnerService.getProfile(businessPartner.id)
        .pipe(take(1))
        .subscribe(
          () => {
            expect(businessPartnerService.getBusinessPartnerProfile()).toEqual(new BehaviorSubject(emptyBusinessPartnerProfile));
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const url: string = API_BUSINESS_PARTNER.GET_BUSINESS_PARTNER_PROFILE_PATH.replace(':id', businessPartner.id);
      const getProfileRequest: TestRequest = httpMock.expectOne(url);
      expect(getProfileRequest.request.method).toEqual('GET');
      getProfileRequest.flush({ status: 'SUCCESS', data: emptyBusinessPartnerProfile });
    });

    it('should pass down an error if getProfile returns an HTTP error', () => {
      HTTP_ERRORS.forEach(httpError => {
        const businessPartner = merchantDataFactory.build();
        businessPartnerService.getProfile(businessPartner.id)
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const url: string = API_BUSINESS_PARTNER.GET_BUSINESS_PARTNER_PROFILE_PATH.replace(':id', businessPartner.id);
        const getProfileRequest: TestRequest = httpMock.expectOne(url);
        expect(getProfileRequest.request.method).toEqual('GET');
        getProfileRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('updateProfile', () => {
    it('should return the business partner profile on success', () => {
      const businessPartner = merchantDataFactory.build();
      const params: BusinessPartnerProfileRequestParams = {
        partner_training_completed: true
      };
      businessPartnerService.updateProfile(businessPartner.id, params)
        .pipe(take(1))
        .subscribe(
          () => {
            expect(businessPartnerService.getBusinessPartnerProfile()).toEqual(new BehaviorSubject(partnerTrainingCompletedBusinessPartnerProfile));
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const url: string = API_BUSINESS_PARTNER.PUT_BUSINESS_PARTNER_PROFILE_PATH.replace(':id', businessPartner.id);
      const getProfileRequest: TestRequest = httpMock.expectOne(url);
      expect(getProfileRequest.request.method).toEqual('PUT');
      getProfileRequest.flush({ status: 'SUCCESS', data: partnerTrainingCompletedBusinessPartnerProfile });
    });

    it('should pass down an error if getProfile returns an HTTP error', () => {
      HTTP_ERRORS.forEach(httpError => {
        const businessPartner = merchantDataFactory.build();
        const params: BusinessPartnerProfileRequestParams = {};
        businessPartnerService.updateProfile(businessPartner.id, params)
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const url: string = API_BUSINESS_PARTNER.PUT_BUSINESS_PARTNER_PROFILE_PATH.replace(':id', businessPartner.id);
        const getProfileRequest: TestRequest = httpMock.expectOne(url);
        expect(getProfileRequest.request.method).toEqual('PUT');
        getProfileRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('addBrandingAssets', () => {
    it('should return the updated business partner application on success', () => {
      const businessPartner = merchantDataFactory.build();
      const params: BusinessPartnerBrandingRequestParams = {
        logo: 'data:image/png;base64,aaaa',
        primary_color: '#2d3d55',
        secondary_color: '#da3831',
        vanity: 'test-vanity'
      };

      businessPartnerService.addBrandingAssets(businessPartner.id, params)
        .pipe(take(1))
        .subscribe(
          (res) => {
            expect(businessPartnerService.getBusinessPartnerApplication()).toEqual(new BehaviorSubject(res.data));
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const url: string = API_MERCHANT.MERCHANTS_BRANDING_PATH.replace(':id', businessPartner.id);
      const postBrandingRequest: TestRequest = httpMock.expectOne(url);
      expect(postBrandingRequest.request.method).toEqual('POST');
      postBrandingRequest.flush({ status: 'SUCCESS', data: businessPartnerApplicationFactory.build({ partner_theme_id: 'theme_abc123' }) });
    });

    it('should pass down an error if addBrandingAssets returns an HTTP error', () => {
      HTTP_ERRORS.forEach(httpError => {
        const businessPartner = merchantDataFactory.build();
        const params: BusinessPartnerBrandingRequestParams = {
          logo: 'data:image/png;base64,aaaa',
          primary_color: '#2d3d55',
          secondary_color: '#da3831',
          vanity: 'test-vanity'
        };
        businessPartnerService.addBrandingAssets(businessPartner.id, params)
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const url: string = API_MERCHANT.MERCHANTS_BRANDING_PATH.replace(':id', businessPartner.id);
        const postBrandingRequest: TestRequest = httpMock.expectOne(url);
        expect(postBrandingRequest.request.method).toEqual('POST');
        postBrandingRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('getBrandingAssets', () => {
    it('should return the business partner theme on success', () => {
      const businessPartner = merchantDataFactory.build();

      businessPartnerService.getBrandingAssets(businessPartner.id)
        .pipe(take(1))
        .subscribe(
          (res) => {
            expect(businessPartnerService.getBusinessPartnerBranding()).toEqual(new BehaviorSubject(res.data));
          }
        );

      const url: string = API_MERCHANT.MERCHANTS_BRANDING_PATH.replace(':id', businessPartner.id);
      const getBrandingRequest: TestRequest = httpMock.expectOne(url);
      expect(getBrandingRequest.request.method).toEqual('GET');
      getBrandingRequest.flush({ status: 'SUCCESS', data: businessPartnerBrandingFactory.build() });
    });

    it('should pass down an error if getBrandingAssets returns an HTTP error', () => {
      HTTP_ERRORS.forEach(httpError => {
        const businessPartner = merchantDataFactory.build();
        businessPartnerService.getBrandingAssets(businessPartner.id)
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const url: string = API_MERCHANT.MERCHANTS_BRANDING_PATH.replace(':id', businessPartner.id);
        const getBrandingRequest: TestRequest = httpMock.expectOne(url);
        expect(getBrandingRequest.request.method).toEqual('GET');
        getBrandingRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('editBrandingAssets', () => {
    it('should return the updated business partner application on success', () => {
      const businessPartner = merchantDataFactory.build();
      const params: BusinessPartnerBrandingRequestParams = {
        logo: 'data:image/png;base64,aaaa',
        primary_color: '#2d3d55',
        secondary_color: '#da3831',
        vanity: 'test-vanity'
      };

      businessPartnerService.editBrandingAssets(businessPartner.id, params)
        .pipe(take(1))
        .subscribe(
          (res) => {
            expect(businessPartnerService.getBusinessPartnerApplication()).toEqual(new BehaviorSubject(res.data));
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const url: string = API_MERCHANT.MERCHANTS_BRANDING_PATH.replace(':id', businessPartner.id);
      const putBrandingRequest: TestRequest = httpMock.expectOne(url);
      expect(putBrandingRequest.request.method).toEqual('PUT');
      putBrandingRequest.flush({ status: 'SUCCESS', data: businessPartnerApplicationFactory.build({ partner_theme_id: 'theme_abc123' }) });
    });

    it('should pass down an error if editBrandingAssets returns an HTTP error', () => {
      HTTP_ERRORS.forEach(httpError => {
        const businessPartner = merchantDataFactory.build();
        const params: BusinessPartnerBrandingRequestParams = {
          logo: 'data:image/png;base64,aaaa',
          primary_color: '#2d3d55',
          secondary_color: '#da3831',
          vanity: 'test-vanity'
        };
        businessPartnerService.editBrandingAssets(businessPartner.id, params)
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const url: string = API_MERCHANT.MERCHANTS_BRANDING_PATH.replace(':id', businessPartner.id);
        const putBrandingRequest: TestRequest = httpMock.expectOne(url);
        expect(putBrandingRequest.request.method).toEqual('PUT');
        putBrandingRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('getLastEventFromTrackedObjectState', () => {
    it('should return invited by default', () => {
      expect(BusinessPartnerService.getLastEventFromTrackedObjectState(null)).toEqual('TRACKED_OBJECT.INVITED');
    });

    it('should return clicked if tracked object state is clicked', () => {
      expect(BusinessPartnerService.getLastEventFromTrackedObjectState(TrackedObjectState.clicked)).toEqual('TRACKED_OBJECT.CLICKED');
    });

    it('should return invited if tracked object state is invited', () => {
      expect(BusinessPartnerService.getLastEventFromTrackedObjectState(TrackedObjectState.invited)).toEqual('TRACKED_OBJECT.INVITED');
    });

    it('should return invoiced if tracked object state is invoiced', () => {
      expect(BusinessPartnerService.getLastEventFromTrackedObjectState(TrackedObjectState.invoiced)).toEqual('TRACKED_OBJECT.INVOICED');
    });

    it('should return linked if tracked object state is linked', () => {
      expect(BusinessPartnerService.getLastEventFromTrackedObjectState(TrackedObjectState.linked)).toEqual('TRACKED_OBJECT.LINKED');
    });

    it('should return sent if tracked object state is sent', () => {
      expect(BusinessPartnerService.getLastEventFromTrackedObjectState(TrackedObjectState.sent)).toEqual('TRACKED_OBJECT.SENT');
    });

    it('should return security violation if tracked object state is security_violation', () => {
      expect(BusinessPartnerService.getLastEventFromTrackedObjectState(TrackedObjectState.securityViolation)).toEqual('TRACKED_OBJECT.SECURITY_VIOLATION');
    });

    it('should return created if tracked object state is created', () => {
      expect(BusinessPartnerService.getLastEventFromTrackedObjectState(TrackedObjectState.created)).toEqual('TRACKED_OBJECT.CREATED');
    });

    it('should return viewed if tracked object state is viewed', () => {
      expect(BusinessPartnerService.getLastEventFromTrackedObjectState(TrackedObjectState.viewed)).toEqual('TRACKED_OBJECT.VIEWED');
    });

    it('should return paid if tracked object state is paid', () => {
      expect(BusinessPartnerService.getLastEventFromTrackedObjectState(TrackedObjectState.paid)).toEqual('TRACKED_OBJECT.PAID');
    });

    it('should return created_from_quickbooks if tracked object state is created_from_quickbooks', () => {
      expect(BusinessPartnerService.getLastEventFromTrackedObjectState(TrackedObjectState.createdFromQuickBooks))
        .toEqual('TRACKED_OBJECT.CREATED_FROM_QUICKBOOKS');
    });

    it('should return updated_from_quickbooks if tracked object state is updated_from_quickbooks', () => {
      expect(BusinessPartnerService.getLastEventFromTrackedObjectState(TrackedObjectState.updatedFromQuickBooks))
        .toEqual('TRACKED_OBJECT.UPDATED_FROM_QUICKBOOKS');
    });

    it('should return updated_from_quickbooks if tracked object state is subscribed_auto_send', () => {
      expect(BusinessPartnerService.getLastEventFromTrackedObjectState(TrackedObjectState.subscribedAutoSend))
        .toEqual('TRACKED_OBJECT.SUBSCRIBED_AUTO_SEND');
    });

    it('should return updated_from_quickbooks if tracked object state is unsubscribed_auto_send', () => {
      expect(BusinessPartnerService.getLastEventFromTrackedObjectState(TrackedObjectState.unsubscribedAutoSend))
        .toEqual('TRACKED_OBJECT.UNSUBSCRIBED_AUTO_SEND');
    });
  });

  describe('hasActiveApplication', () => {
    it('should return false if business partner application is falsy', () => {
      expect(businessPartnerService.hasActiveApplication(null)).toBeFalse();
    });

    it('should return false if business partner application state is not complete', () => {
      const states = Object.values(BusinessPartnerApplicationState).filter(state => state !== BusinessPartnerApplicationState.complete);
      states.forEach(state => {
        const application = businessPartnerApplicationFactory.build({ state: state });
        expect(businessPartnerService.hasActiveApplication(application)).toBeFalse();
      });
    });

    it('should return true if business partner application state is complete', () => {
        const application = businessPartnerApplicationFactory.build({ state: BusinessPartnerApplicationState.complete });
        expect(businessPartnerService.hasActiveApplication(application)).toBeTrue();
    });
  });

  describe('hasPendingApplication', () => {
    it('should return false if business partner application is falsy', () => {
      expect(businessPartnerService.hasPendingApplication(null)).toBeFalse();
    });

    it('should return false if business partner application state is not pending', () => {
      const states = Object.values(BusinessPartnerApplicationState).filter(state => state !== BusinessPartnerApplicationState.pending);
      states.forEach(state => {
        const application = businessPartnerApplicationFactory.build({ state: state });
        expect(businessPartnerService.hasPendingApplication(application)).toBeFalse();
      });
    });

    it('should return true if business partner application state is pending', () => {
      const application = businessPartnerApplicationFactory.build({ state: BusinessPartnerApplicationState.pending });
      expect(businessPartnerService.hasPendingApplication(application)).toBeTrue();
    });
  });
});
