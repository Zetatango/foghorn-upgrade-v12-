import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BusinessCertificationService } from './business-certification.service';
import { UtilityService } from 'app/services/utility.service';
import { ONBOARDING, CONSTANTS } from 'app/constants';
import { merchantQuerySelectPost } from 'app/test-stubs/factories/merchant-query-select';
import { applicantPostFactory } from 'app/test-stubs/factories/applicant';
import { StateRoutingService } from 'app/services/state-routing.service';
import { CookieService } from 'ngx-cookie-service';
import { merchantDataResponseFactory } from 'app/test-stubs/factories/merchant';
import { take } from 'rxjs/operators';

describe('BusinessCertificationService', () => {
  let certificationService: BusinessCertificationService;
  let httpMock: HttpTestingController;
  let utility: UtilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        BusinessCertificationService,
        CookieService,
        UtilityService
      ]
    });
  });

  beforeEach(() => {
    certificationService = TestBed.inject(BusinessCertificationService);
    httpMock = TestBed.inject(HttpTestingController);
    utility = TestBed.inject(UtilityService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(certificationService).toBeTruthy();
  });

  describe('selectBusiness()', () => {
    it('should be able to select a merchant query result', () => {
      const merchantResponse = merchantDataResponseFactory.build();
      certificationService.selectBusiness(merchantQuerySelectPost)
        .pipe(take(1))
        .subscribe(
          (res) => expect(res).toEqual(merchantResponse),
          (err) => fail('Should not fail: ' + err)
        );

      const merchantQuerySelectRequest = httpMock.expectOne(ONBOARDING.POST_MERCHANT_QUERY_SELECT_PATH);
      expect(merchantQuerySelectRequest.request.method).toEqual('POST');
      merchantQuerySelectRequest.flush(merchantResponse);
    });
  });

  describe('submitApplicant()', () => {
    it('should be able to successfully submit an applicant', () => {
      certificationService.submitApplicant(applicantPostFactory.build())
        .then((res) => expect(res).toBeTruthy())
        .catch((err) => fail('Should not fail: ' + err));

      const applicantRequest = httpMock.expectOne(ONBOARDING.POST_APPLICANT_PATH);
      expect(applicantRequest.request.method).toEqual('POST');
      applicantRequest.flush({ status: 200, statusText: 'OK', data: {} });
    });
  });

  describe('reauth()', () => {
    const merchantGuid = 'm_123';
    const applicantGuid = 'a_123';

    beforeEach(() => {
      spyOn(StateRoutingService, 'performRedirect');
    });

    it('should redirect to AUTO_LOGIN_URL with merchant guid passed', () => {
      const url = utility.getAugmentedUrl(CONSTANTS.AUTO_LOGIN_URL, { merchant_guid: merchantGuid });
      certificationService.reauth({ merchant_guid: merchantGuid });
      expect(StateRoutingService.performRedirect).toHaveBeenCalledWith(url);
    });

    it('should redirect to AUTO_LOGIN_URL with applicant guid passed', () => {
      const url = utility.getAugmentedUrl(CONSTANTS.AUTO_LOGIN_URL, { applicant_guid: applicantGuid });
      certificationService.reauth({ applicant_guid: applicantGuid });
      expect(StateRoutingService.performRedirect).toHaveBeenCalledWith(url);
    });

    it('should redirect to AUTO_LOGIN_URL with both merchant and applicant guid passed', () => {
      const url = utility.getAugmentedUrl(CONSTANTS.AUTO_LOGIN_URL, {
        merchant_guid: merchantGuid,
        applicant_guid: applicantGuid
      });
      certificationService.reauth({ merchant_guid: merchantGuid, applicant_guid: applicantGuid });
      expect(StateRoutingService.performRedirect).toHaveBeenCalledWith(url);
    });

    it('should redirect to AUTO_LOGIN_URL with no params passed', () => {
      certificationService.reauth();
      expect(StateRoutingService.performRedirect).toHaveBeenCalledWith(CONSTANTS.AUTO_LOGIN_URL);
    });
  });
});
