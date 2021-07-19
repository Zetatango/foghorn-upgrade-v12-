import { inject, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CookieService } from 'ngx-cookie-service';
import { UtilityService } from './utility.service';
import { ACTIVE_PAF_AGREEMENT, AgreementService } from 'app/services/agreement.service';
import { AgreementType } from 'app/models/agreement';
import { API_AGREEMENTS, API_MERCHANT } from 'app/constants';
import { agreementFactory } from 'app/test-stubs/factories/agreement';
import { HTTP_ERRORS } from 'app/test-stubs/api-errors-stubs';

describe('AgreementService', () => {
  let agreementService: AgreementService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AgreementService, CookieService, UtilityService]
    });
  });

  beforeEach(() => {
    agreementService = TestBed.inject(AgreementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(agreementService).toBeTruthy();
  });

  describe('agreement', () => {
    it('should return the agreement when it is set', () => {
      const agreement = agreementFactory.build();
      agreementService.agreement = agreement;
      expect(agreementService.agreement).toEqual(agreement);
    });

    it('should return null when the agreement is set to null', () => {
      agreementService.agreement = agreementFactory.build();
      agreementService.agreement = null;
      expect(agreementService.agreement).toEqual(null);
    });

    it('should return null when the agreement is not set', () => {
      expect(agreementService.agreement).toEqual(null);
    });
  });

  describe('loadAgreementById', () => {
    it('gets an agreement ', inject(
      [ UtilityService ], (utilityService: UtilityService) => {
        const type: AgreementType = AgreementType.pre_authorized_financing;
        const testAgreement = agreementFactory.build({type: type});
        const agreementId = testAgreement.id;

        agreementService.loadAgreementById(agreementId)
          .subscribe(() => {
            expect(agreementService.agreement).toEqual(testAgreement);
            }
          );

        const param_set = { show_terms: true };
        const exp_url = utilityService.getAugmentedUrl(API_AGREEMENTS.GET.replace(':id', agreementId), param_set);
        const agreementRequest = httpMock.expectOne(exp_url);
        expect(agreementRequest.request.method).toEqual('GET');
        agreementRequest.flush({ status: 200, statusText: 'Success', data: testAgreement });
      }));

    it('should pass down an error to caller if request returns an http error', inject(
      [ UtilityService ], (utilityService: UtilityService) => {
        const type: AgreementType = AgreementType.pre_authorized_financing;
        const testAgreement = agreementFactory.build({type: type});
        const agreementId = testAgreement.id;

        HTTP_ERRORS.forEach(httpError => {
          agreementService.loadAgreementById(agreementId)
            .subscribe(() => fail('Prevented silent failure of this unit test.'),
              (err) => expect(err.status).toEqual(httpError.status));

          const param_set = { show_terms: true };
          const exp_url = utilityService.getAugmentedUrl(API_AGREEMENTS.GET.replace(':id', agreementId), param_set);
          const agreementRequest = httpMock.expectOne(exp_url);
          expect(agreementRequest.request.method).toEqual('GET');
          agreementRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
        });
      }));
  });

  describe('loadAgreementByType', () => {
    it('gets an agreement', inject([ UtilityService ], (utilityService: UtilityService) => {
      const merchantId = 'm_123';
      const type: AgreementType = AgreementType.pre_authorized_financing;
      const supplierId = 'su_123';
      const testAgreement = agreementFactory.build({type: type});

      agreementService.loadAgreementByType(merchantId, type, true, supplierId)
        .subscribe(() => {
            expect(agreementService.agreement).toEqual(testAgreement);
          }
        );

      const param_set = {
        type: AgreementType.pre_authorized_financing,
        show_terms: true,
        supplier_id: supplierId
      };

      const exp_url = utilityService.getAugmentedUrl(API_MERCHANT.GET_MERCHANT_AGREEMENT_PATH.replace(':id', merchantId), param_set);

      const agreementRequest = httpMock.expectOne(exp_url);
      expect(agreementRequest.request.method).toEqual('GET');
      agreementRequest.flush({ status: 200, statusText: 'Success', data: testAgreement });
    }));

    it('gets an agreement without the agreement terms', inject([ UtilityService ], (utilityService: UtilityService) => {
        const merchantId = 'm_123';
        const type: AgreementType = AgreementType.pre_authorized_financing;
        const supplierId = 'su_123';
        const testAgreement = agreementFactory.build({ type: type, content: null });

        agreementService.loadAgreementByType(merchantId, type, false, supplierId)
          .subscribe(() => {
              expect(agreementService.agreement).toEqual(testAgreement);
            }
          );

        const param_set = {
          type: AgreementType.pre_authorized_financing,
          show_terms: false,
          supplier_id: supplierId
        };

        const exp_url = utilityService.getAugmentedUrl(API_MERCHANT.GET_MERCHANT_AGREEMENT_PATH.replace(':id', merchantId), param_set);

        const agreementRequest = httpMock.expectOne(exp_url);
        expect(agreementRequest.request.method).toEqual('GET');
        agreementRequest.flush({ status: 200, statusText: 'Success', data: testAgreement });
      }));

    it('should pass down an error to caller if request returns an http error', inject(
      [ UtilityService ], (utilityService: UtilityService) => {
      const merchantId = 'm_123';
      const type: AgreementType = AgreementType.pre_authorized_financing;

      HTTP_ERRORS.forEach(httpError => {
        agreementService.loadAgreementByType(merchantId, type, false)
          .subscribe(() => fail('Prevented silent failure of this unit test.'),
            (err) => expect(err.status).toEqual(httpError.status));

          const param_set = {
            type: AgreementType.pre_authorized_financing,
            show_terms: false
          };
          const exp_url = utilityService.getAugmentedUrl(API_MERCHANT.GET_MERCHANT_AGREEMENT_PATH.replace(':id', merchantId), param_set);
          const agreementRequest = httpMock.expectOne(exp_url);
        expect(agreementRequest.request.method).toEqual('GET');
        agreementRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    }));
  });

  describe('acceptAgreement', () => {
    it('accepts an agreement ', inject(
      [ UtilityService ], (utilityService: UtilityService) => {
        const merchantId = 'm_123';
        const type: AgreementType = AgreementType.pre_authorized_financing;
        const testAgreement = agreementFactory.build({type: type});

        agreementService.loadAgreementByType(merchantId, type, true)
          .subscribe(() => {
            agreementService.accept()
              .subscribe(() => {
                expect(agreementService.agreement).toEqual(testAgreement);
              },
              (err) => fail('Prevented this test to fail silently: ' + err.statusText));

            const acc_url = API_AGREEMENTS.ACCEPT.replace(':id', testAgreement.id);
            const acceptRequest = httpMock.expectOne(acc_url);
            expect(acceptRequest.request.method).toEqual('PUT');
            acceptRequest.flush({ status: 200, statusText: 'Success', data: testAgreement });
            }
          );

        const param_set = { type: AgreementType.pre_authorized_financing, show_terms: true };
        const exp_url = utilityService.getAugmentedUrl(API_MERCHANT.GET_MERCHANT_AGREEMENT_PATH.replace(':id', merchantId), param_set);
        const agreementRequest = httpMock.expectOne(exp_url);
        expect(agreementRequest.request.method).toEqual('GET');
        agreementRequest.flush({ status: 200, statusText: 'Success', data: testAgreement });
      }));

    it('should pass down an error to caller if request returns an http error ', inject(
      [ UtilityService ], (utilityService: UtilityService) => {
        const merchantId = 'm_123';
        const type: AgreementType = AgreementType.pre_authorized_financing;
        const testAgreement = agreementFactory.build({type: type});

        agreementService.loadAgreementByType(merchantId, type, false)
          .subscribe(() => {
            HTTP_ERRORS.forEach(httpError => {
              agreementService.accept()
                .subscribe(() => fail('Prevented silent failure of this unit test.'),
                  (err) => expect(err.status).toEqual(httpError.status));

              const acc_url = API_AGREEMENTS.ACCEPT.replace(':id', testAgreement.id);
              const acceptRequest = httpMock.expectOne(acc_url);
              expect(agreementRequest.request.method).toEqual('GET');
              acceptRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
            });
          });

        const param_set = { type: AgreementType.pre_authorized_financing, show_terms: false };
        const exp_url = utilityService.getAugmentedUrl(API_MERCHANT.GET_MERCHANT_AGREEMENT_PATH.replace(':id', merchantId), param_set);
        const agreementRequest = httpMock.expectOne(exp_url);
        expect(agreementRequest.request.method).toEqual('GET');
        agreementRequest.flush({ status: 200, statusText: 'Success', data: testAgreement });
      }));

    it('accept throws an error if there is no agreement set ', () => {
        agreementService.accept()
          .subscribe(() => fail('Prevented silent failure of this unit test.'),
            (err) => expect(err.status).toEqual(500));
      });
  });

  describe('optOut', () => {
    it('opt out of an agreement ', () => {
      const testAgreement = agreementFactory.build({ id: 'agr_123', type: AgreementType.pre_authorized_financing });
      agreementService.optOut('agr_123').subscribe(
        (res) => {
          expect(agreementService.agreement).toEqual(testAgreement);
          expect(res.data).toEqual(testAgreement);
        },
        (err) => fail('Prevented this test to fail silently: ' + err.statusText));

      const exp_url = API_AGREEMENTS.OPT_OUT.replace(':id', testAgreement.id);
      const agreementRequest = httpMock.expectOne(exp_url);
      expect(agreementRequest.request.method).toEqual('PUT');
      agreementRequest.flush({ status: 200, statusText: 'Success', data: testAgreement });
    });

    it('should pass down an error to caller if request returns an http error ', () => {
      const testAgreement = agreementFactory.build({ id: 'agr_123', type: AgreementType.pre_authorized_financing });

      HTTP_ERRORS.forEach(httpError => {
        agreementService.optOut('agr_123').subscribe(
          () => fail('Prevented silent failure of this unit test.'),
          (err) => expect(err.status).toEqual(httpError.status));

        const exp_url = API_AGREEMENTS.OPT_OUT.replace(':id', testAgreement.id);
        const agreementRequest = httpMock.expectOne(exp_url);
        expect(agreementRequest.request.method).toEqual('PUT');
        agreementRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('active PAF agreement for merchant', () => {
    it('should set true for merchant ID', () => {
      spyOn(localStorage, 'setItem');

      agreementService.setHasActivePafAgreementForMerchant('m_123');

      expect(localStorage.setItem).toHaveBeenCalledOnceWith(ACTIVE_PAF_AGREEMENT + '_m_123', 'true');
    });

    it('should be truthy if active PAF agreement exists', () => {
      spyOn(localStorage, 'getItem').and.returnValue('true');
      expect(agreementService.hasActivePafAgreementForMerchant('m_123')).toBeTruthy();
    });

    it('should be truthy if active PAF agreement exists (case insensitive)', () => {
      spyOn(localStorage, 'getItem').and.returnValue('TRuE');
      expect(agreementService.hasActivePafAgreementForMerchant('m_123')).toBeTruthy();
    });

    it('should be falsy if active PAF agreement does not exist', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);
      expect(agreementService.hasActivePafAgreementForMerchant('m_123')).toBeFalsy();
    });

    it('should be falsy if active PAF agreement is set to false', () => {
      spyOn(localStorage, 'getItem').and.returnValue('false');
      expect(agreementService.hasActivePafAgreementForMerchant('m_123')).toBeFalsy();
    });

    it('should be falsy if active PAF agreement is set to false (case insensitive)', () => {
      spyOn(localStorage, 'getItem').and.returnValue('false');
      expect(agreementService.hasActivePafAgreementForMerchant('m_123')).toBeFalsy();
    });

    it('should remove item from local storage', () => {
      spyOn(localStorage, 'removeItem');

      agreementService.clearActivePafAgreementForMerchant('m_123');

      expect(localStorage.removeItem).toHaveBeenCalledOnceWith(ACTIVE_PAF_AGREEMENT + '_m_123');
    });
  });
});


