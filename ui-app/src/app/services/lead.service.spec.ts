import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { take } from 'rxjs/operators';
import { LeadService } from 'app/services/lead.service';
import { UtilityService } from 'app/services/utility.service';
import {
  leadFactory,
  leadResponseFactory,
} from 'app/test-stubs/factories/lead';
import { API_LEAD } from '../constants';
import { HTTP_ERRORS } from '../test-stubs/api-errors-stubs';
import { ApplicantInfo, MerchantInfo } from 'app/models/api-entities/lead';

describe('LeadService', () => {
  let service: LeadService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LeadService,
        UtilityService
      ]
    });
  });

  beforeEach(() => {
    service = TestBed.inject(LeadService);
    httpMock = TestBed.inject(HttpTestingController);

    spyOn(service.lead$, 'next');
    spyOn(service.merchantInfo$, 'next');
    spyOn(service.applicantInfo$, 'next');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setLead', () => {
    it('should make expected calls with falsy lead/attributes', () => {
      const expectedMerchantInfo = new MerchantInfo(null, undefined);
      const expectedApplicantInfo = new ApplicantInfo(null, undefined);
      service.setLead(null);

      expect(service.lead$.next).toHaveBeenCalledOnceWith(null);
      expect(service.merchantInfo$.next).toHaveBeenCalledOnceWith(expectedMerchantInfo);
      expect(service.applicantInfo$.next).toHaveBeenCalledOnceWith(expectedApplicantInfo);
    });

    it('should make expected calls with lead', () => {
      const lead = leadFactory.build();
      const expectedMerchantInfo = new MerchantInfo(lead, lead.attributes);
      const expectedApplicantInfo = new ApplicantInfo(lead, lead.attributes);
      service.setLead(lead);

      expect(service.lead$.next).toHaveBeenCalledOnceWith(lead);
      expect(service.merchantInfo$.next).toHaveBeenCalledOnceWith(expectedMerchantInfo);
      expect(service.applicantInfo$.next).toHaveBeenCalledOnceWith(expectedApplicantInfo);
    });
  });

  describe('getLead', () => {
    const leadData = leadFactory.build();

    it('should make a call to getLead', () => {
      service.getLead()
        .pipe(take(1))
        .subscribe({
          error: (err) => fail('Prevent this test to fail silently: ' + err)
        });
      const url = API_LEAD.GET_LEAD_PATH;
      const getLeadRequest = httpMock.expectOne({ url: url, method: 'GET' });

      getLeadRequest.flush(leadResponseFactory.build({ data: leadData }));
    });

    it('should pass down an error if getLead returns an HTTP error', () => {
      HTTP_ERRORS.forEach(httpError => {
        service.getLead()
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );
        const url = API_LEAD.GET_LEAD_PATH;
        const getLeadRequest = httpMock.expectOne({ url: url, method: 'GET' });

        getLeadRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('updateDesiredBankAccountBalance', () => {
    const leadData = leadFactory.build();
    const response = leadResponseFactory.build();
    const balance = 5000;

    it('should call updateDesiredBankAccountBalance with the correct parameters', () => {
      service.updateDesiredBankAccountBalance(leadData.id, balance)
        .pipe(take(1))
        .subscribe(
          () => expect(service.lead$.next).toHaveBeenCalledOnceWith(response.data),
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const url = API_LEAD.UPDATE_DESIRED_BANK_ACCOUNT_BALANCE_LEADS_PATH.replace(':id', leadData.id);
      const leadRequest = httpMock.expectOne({ url: url, method: 'PUT' });
      leadRequest.flush(leadResponseFactory.build());
    });

    it('should pass down an error if updateDesiredBankAccountBalance returns an HTTP error', () => {
      HTTP_ERRORS.forEach(httpError => {
        service.updateDesiredBankAccountBalance(leadData.id, balance)
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const url = API_LEAD.UPDATE_DESIRED_BANK_ACCOUNT_BALANCE_LEADS_PATH.replace(':id', leadData.id);
        const patchLeadRequest = httpMock.expectOne({ url: url, method: 'PUT' });

        patchLeadRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('updateSelectedInsightsAccounts', () => {
    const leadData = leadFactory.build();
    const response = leadResponseFactory.build();
    const accounts = ['accounts1', 'account2'];


    it('should call updateSelectedInsightsAccounts with the correct parameters', () => {
      service.updateSelectedInsightsAccounts(leadData.id, accounts)
        .pipe(take(1))
        .subscribe(
          () => expect(service.lead$.next).toHaveBeenCalledOnceWith(response.data),
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const url = API_LEAD.UPDATE_SELECTED_INSIGHTS_BANK_ACCOUNTS_LEADS_PATH.replace(':id', leadData.id);
      const leadRequest = httpMock.expectOne({ url: url, method: 'POST' });
      leadRequest.flush(leadResponseFactory.build());
    });

    it('should pass down an error if updateSelectedInsightsAccounts returns an HTTP error', () => {
      HTTP_ERRORS.forEach(httpError => {
        service.updateSelectedInsightsAccounts(leadData.id, accounts)
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const url = API_LEAD.UPDATE_SELECTED_INSIGHTS_BANK_ACCOUNTS_LEADS_PATH.replace(':id', leadData.id);
        const leadRequest = httpMock.expectOne({ url: url, method: 'POST' });

        leadRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });
});
