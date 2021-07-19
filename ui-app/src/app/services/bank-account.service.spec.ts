import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, RequestMatch } from '@angular/common/http/testing';
import { merchantDataFactory, merchantDataResponseFactory } from 'app/test-stubs/factories/merchant';
import { take } from 'rxjs/operators';
import { BankAccount, BankAccountOwner, BankAccountPost } from 'app/models/bank-account';
import { BankAccountLoadingState, BankAccountService } from './bank-account.service';
import { MerchantService } from './merchant.service';
import { LoggingService } from './logging.service';
import { UtilityService } from 'app/services/utility.service';
import { CookieService } from 'ngx-cookie-service';
import { API_BANK_ACCOUNTS, API_LEAD, API_MERCHANT, FLINKS } from 'app/constants';
import {
  ALL_BANK_ACCOUNTS,
  ALL_VALID_BANK_ACCOUNTS,
  bankAccountFactory,
  FLINKS_BANK_ACCOUNTS,
  MANUAL_BANK_ACCOUNTS,
  verifiedBankAccount
} from 'app/test-stubs/factories/bank-account';
import { flinksRequestStateFail, flinksRequestStateSuccess } from 'app/test-stubs/factories/flinks-request-state';
import { HTTP_ERRORS } from 'app/test-stubs/api-errors-stubs';
import { of } from 'rxjs';
import { BankingStatus } from './banking-flow.service';
import { leadFactory, leadResponseFactory } from 'app/test-stubs/factories/lead';
import { ErrorMessage } from 'app/models/error-response';
import Bugsnag from '@bugsnag/js';
import { LeadService } from './lead.service';

describe('BankAccountService', () => {
  let bankService: BankAccountService;
  let httpMock: HttpTestingController;
  let leadService: LeadService;
  let merchantService: MerchantService;

  let merchantHasSelectedBankAccountSpy: jasmine.Spy;
  let bankConnectionRequiredSpy: jasmine.Spy;
  let merchantSalesVolumeRequiredSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        BankAccountService,
        CookieService,
        LeadService,
        MerchantService,
        LoggingService,
        UtilityService
      ]
    });
  });

  beforeEach(() => {
    bankService = TestBed.inject(BankAccountService);
    leadService = TestBed.inject(LeadService);
    merchantService = TestBed.inject(MerchantService);

    httpMock = TestBed.inject(HttpTestingController);

    bankService.owner = new BankAccountOwner(merchantDataFactory.build());

    merchantHasSelectedBankAccountSpy = spyOn(merchantService, 'merchantHasSelectedBankAccount');
    bankConnectionRequiredSpy = spyOn(bankService.owner, 'bankConnectionRequired');
    merchantSalesVolumeRequiredSpy = spyOn(merchantService, 'merchantSalesVolumeRequired');

    spyOn(Bugsnag, 'notify');
    spyOn(merchantService, 'setMerchant');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(bankService).toBeTruthy();
  });

  describe('loadBankAccounts()', () => {
    describe('HttpRequest returns status: 200', () => {
      function returnStatusSuccess() {
        const url = API_BANK_ACCOUNTS.GET_BANK_ACCOUNTS_PATH;
        const bankAccountsRequest = httpMock.expectOne(url);

        expect(bankAccountsRequest.request.method).toEqual('GET');
        bankAccountsRequest.flush({ status: 200, statusText: 'OK', data: ALL_BANK_ACCOUNTS });
      }

      it('should be able to successfully load bank accounts', () => {
        bankService.loadBankAccounts()
          .pipe(take(1))
          .subscribe(
            (res) => expect(res.data).toEqual(ALL_BANK_ACCOUNTS),
            (err) => fail('Prevented silent failure of this unit test: ' + err)
          );

        returnStatusSuccess();
      });

      it('should set bank accounts when successfully loading bank accounts', () => {
        bankService.loadBankAccounts()
          .pipe(take(1))
          .subscribe(
            (res) => expect(res.data).toEqual(ALL_BANK_ACCOUNTS),
            (err) => fail('Prevented silent failure of this unit test: ' + err)
          );

        returnStatusSuccess();

        expect(bankService.bankAccounts).toEqual(ALL_BANK_ACCOUNTS);
      });
    });

    describe('HttpRequest returns status: 200 with no data', () => {
      function returnStatusSuccess() {
        const url = API_BANK_ACCOUNTS.GET_BANK_ACCOUNTS_PATH;
        const bankAccountsRequest = httpMock.expectOne(url);

        expect(bankAccountsRequest.request.method).toEqual('GET');
        bankAccountsRequest.flush(null);
      }

      it('should be able to successfully load bank accounts', () => {
        bankService.loadBankAccounts()
          .pipe(take(1))
          .subscribe(
            () => expect(bankService.bankAccounts).toBeUndefined(),
            (err) => fail('Prevented silent failure of this unit test: ' + err)
          );

        returnStatusSuccess();
      });
    });

    describe('HttpRequest returns status: HttpErrorResponse', () => {
      it('should pass down an error to caller if loading bank accounts returns an http error', () => {
        HTTP_ERRORS.forEach(httpError => {
          bankService.loadBankAccounts()
            .pipe(take(1))
            .subscribe(
              (res) => fail('Prevented silent failure of this unit test: ' + res),
              (err) => expect(err.status).toEqual(httpError.status)
            );

          const url = API_BANK_ACCOUNTS.GET_BANK_ACCOUNTS_PATH;
          const bankAccountsRequest = httpMock.expectOne(url);

          expect(bankAccountsRequest.request.method).toEqual('GET');
          bankAccountsRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
        });
      });
    });
  });

  describe('pollingFlinks', () => {
    it('should succeed when server returns flinks request state success-like response', () => {
      const requestId = 'id';

      flinksRequestStateSuccess.forEach(requestSate => {
        bankService.pollFlinks(requestId)
          .subscribe(
            (res) => expect(res).toBeTruthy(),
            (err) => fail('should not fail: ' + err)
          );

        const flinksRequest = httpMock.expectOne(FLINKS.GET_REQUEST_STATE_PATH.concat(`/${requestId}`));
        flinksRequest.flush(requestSate);
      });
    });

    it('should reject when server returns error', () => {
      const requestId = 'id';

      flinksRequestStateFail.forEach(requestFailedState => {
        bankService.pollFlinks(requestId)
          .subscribe(
            (res) => fail('should not succeed: ' + res),
            (err) => expect(err).toBeTruthy()
          );

        const flinksRequest = httpMock.expectOne(FLINKS.GET_REQUEST_STATE_PATH.concat(`/${requestId}`));
        flinksRequest.flush(null, requestFailedState);
      });
    });
  });

  describe('setSelectedBankAccount', () => {
    it('setSelectedBankAccount should select a bank account and also set selectedBankAccountId', () => {
      bankService.setSelectedBankAccount(verifiedBankAccount)
        .subscribe(
          () => {
            expect(bankService.selectedBankAccount).toEqual(verifiedBankAccount);
            expect(bankService.selectedBankAccountId).toEqual(verifiedBankAccount.id);
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const bankAccountsRequest = httpMock.expectOne(API_BANK_ACCOUNTS.SELECT_BANK_ACCOUNT_PATH);
      expect(bankAccountsRequest.request.method).toEqual('POST');
    });

    it('should make request to select_bank_account api if merchant does not have selected bank account and sales volume not required',
      fakeAsync(() => {
        const merchantResponse = merchantDataResponseFactory.build();
        merchantHasSelectedBankAccountSpy.and.returnValue(false);
        merchantSalesVolumeRequiredSpy.and.returnValue(false);
        spyOn(bankService, 'selectBankAccount').and.returnValue(of(merchantResponse));

        bankService.setSelectedBankAccount(verifiedBankAccount)
          .subscribe(
            (res) => expect(res).toEqual(merchantResponse),
            (err) => fail('Prevented this test to fail silently: ' + err)
          );
        tick();

        expect(bankService.selectBankAccount).toHaveBeenCalledTimes(1);
      }));

    it('should make request to select_sales_volume_accounts api if merchant has selected bank account and sales volume required',
      fakeAsync(() => {
        const merchant = merchantDataResponseFactory.build();
        merchantHasSelectedBankAccountSpy.and.returnValue(true);
        merchantSalesVolumeRequiredSpy.and.returnValue(true);
        spyOn(bankService, 'selectSalesVolumeAccounts').and.returnValue(of(merchantDataResponseFactory.build()));

        bankService.setSelectedBankAccount(verifiedBankAccount)
          .subscribe(
            (res) => expect(res).toEqual(merchant),
            (err) => fail('Prevented this test to fail silently: ' + err)
          );
        tick();

        expect(bankService.selectSalesVolumeAccounts).toHaveBeenCalledTimes(1);
      }));
  });

  describe('selectBankAccount', () => {
    const expectedRequest: RequestMatch = { method: 'POST', url: API_BANK_ACCOUNTS.SELECT_BANK_ACCOUNT_PATH };

    it('should be successful if there is a selectedBankAccount', () => {
      const merchantResponse = merchantDataResponseFactory.build();
      bankService.selectedBankAccount = verifiedBankAccount;
      bankService.selectBankAccount(verifiedBankAccount.owner_guid, verifiedBankAccount.id)
        .subscribe(
          (res) => {
            expect(res).toEqual(merchantResponse);
            expect(merchantService.setMerchant).toHaveBeenCalledOnceWith(merchantResponse.data);
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const bankAccountsRequest = httpMock.expectOne(expectedRequest);
      bankAccountsRequest.flush(merchantResponse);
    });

    it('should pass down an error if selectBankAccount returns an http error', () => {
      HTTP_ERRORS.forEach(httpError => {
        bankService.selectBankAccount(null, null)
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const bankAccountsRequest = httpMock.expectOne(expectedRequest);
        bankAccountsRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('selectSalesVolumeAccounts', () => {
    const expectedRequest: RequestMatch = { method: 'POST', url: API_BANK_ACCOUNTS.SELECT_SALES_VOLUME_ACCOUNTS_PATH };

    it('should be successful with multiple bank account ids passed', () => {
      const merchantResponse = merchantDataResponseFactory.build();
      bankService.selectSalesVolumeAccounts(verifiedBankAccount.owner_guid, ['ba_123', 'ba_456'])
        .subscribe(
          (res) => {
            expect(res).toEqual(merchantResponse);
            expect(merchantService.setMerchant).toHaveBeenCalledOnceWith(merchantResponse.data);
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const selectSalesVolumeAccountsRequest = httpMock.expectOne(expectedRequest);
      selectSalesVolumeAccountsRequest.flush(merchantResponse);
    });

    it('should pass down an error if selectBankAccount returns an http error', () => {
      HTTP_ERRORS.forEach(httpError => {
        bankService.selectSalesVolumeAccounts(null, null)
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const selectSalesVolumeAccountsRequest = httpMock.expectOne(expectedRequest);
        selectSalesVolumeAccountsRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('setSelectedInsightsBankAccounts - merchant', () => {
    let insightsBankAccounts: BankAccount[];

    beforeEach(() => {
      insightsBankAccounts = bankAccountFactory.buildList(2);
      bankService.owner = new BankAccountOwner(merchantDataFactory.build());
    });

    it('setSelectedInsightsBankAccounts should select insights bank accounts and also set insightsBankAccountsId', () => {
      bankService.setSelectedInsightsBankAccounts([insightsBankAccounts[0]])
        .subscribe(
          () => {
            expect(bankService.selectedInsightsBankAccounts).toEqual([insightsBankAccounts[0]]);
            expect(bankService.selectedInsightsBankAccountsIds).toEqual([insightsBankAccounts[0].id]);
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const bankAccountsRequest = httpMock.expectOne(API_BANK_ACCOUNTS.SELECT_INSIGHTS_BANK_ACCOUNTS_PATH);

      expect(bankAccountsRequest.request.method).toEqual('POST');
    });

    it('setSelectedInsightsBankAccounts should select insights bank accounts and also set insightsBankAccountsId for multiple accounts', () => {
      const ba_ids = insightsBankAccounts.map(account => account.id);

      insightsBankAccounts.push(bankAccountFactory.build());
      bankService.setSelectedInsightsBankAccounts(insightsBankAccounts)
        .subscribe(
          () => {
            expect(bankService.selectedInsightsBankAccounts).toEqual(insightsBankAccounts);
            expect(bankService.selectedInsightsBankAccounts.length).toEqual(insightsBankAccounts.length);
            expect(bankService.selectedInsightsBankAccountsIds).toEqual(ba_ids);
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const bankAccountsRequest = httpMock.expectOne(API_BANK_ACCOUNTS.SELECT_INSIGHTS_BANK_ACCOUNTS_PATH);
      expect(bankAccountsRequest.request.method).toEqual('POST');
    });

    it('should make request to select_insights_bank_accounts api if merchant does not have selected insights bank accounts',
      fakeAsync(() => {
        const merchantResponse = merchantDataResponseFactory.build();
        spyOn(bankService, 'selectInsightsBankAccounts').and.returnValue(of(merchantDataResponseFactory.build()));

        bankService.setSelectedInsightsBankAccounts(insightsBankAccounts)
          .subscribe(
            (res) => expect(res).toEqual(merchantResponse),
            (err) => fail('Prevented this test to fail silently: ' + err)
          );

        tick();

        expect(bankService.selectInsightsBankAccounts).toHaveBeenCalledTimes(1);
      }));
  });

  // TODO cleanup and move merchant call to merchantservice
  describe('setSelectedInsightsBankAccounts - lead', () => {
    let insightsBankAccounts: BankAccount[];
    const lead = leadFactory.build();
    beforeEach(() => {
      insightsBankAccounts = bankAccountFactory.buildList(2);
      bankService.owner = new BankAccountOwner(lead);
    });

    it('setSelectedInsightsBankAccounts should select insights bank accounts and also set insightsBankAccountsId', () => {
      bankService.setSelectedInsightsBankAccounts([insightsBankAccounts[0]])
        .subscribe(
          () => {
            expect(bankService.selectedInsightsBankAccounts).toEqual([insightsBankAccounts[0]]);
            expect(bankService.selectedInsightsBankAccountsIds).toEqual([insightsBankAccounts[0].id]);
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const bankAccountsRequest = httpMock.expectOne(API_LEAD.UPDATE_SELECTED_INSIGHTS_BANK_ACCOUNTS_LEADS_PATH.replace(':id', lead.id));

      expect(bankAccountsRequest.request.method).toEqual('POST');
    });
  });

  describe('setSelectedInsightsBankAccounts - null', () => {
    it('setSelectedInsightsBankAccounts should select insights bank accounts and also set insightsBankAccountsId', () => {
      bankService.owner = new BankAccountOwner(null);
      spyOn(bankService, 'setBankAccountOwner');
      bankService.setSelectedInsightsBankAccounts(bankAccountFactory.buildList(1))
        .subscribe(
          () => {
            expect(Bugsnag.notify).toHaveBeenCalledOnceWith(new ErrorMessage('Unknown owner'));
            expect(bankService.setBankAccountOwner).toHaveBeenCalledOnceWith(undefined);
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );
    });
  });

  describe('selectInsightsBankAccounts', () => {
    const expectedRequest: RequestMatch = { method: 'POST', url: API_BANK_ACCOUNTS.SELECT_INSIGHTS_BANK_ACCOUNTS_PATH };

    it('should be successful with multiple bank account ids passed', () => {
      spyOn(bankService, 'setBankAccountOwner');
      const merchantResponse = merchantDataResponseFactory.build();
      bankService.selectInsightsBankAccounts(['ba_123', 'ba_456'])
        .subscribe(
          (res) => {
            expect(res).toEqual(merchantResponse);
            expect(bankService.setBankAccountOwner).toHaveBeenCalledWith(merchantResponse.data);
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );
      const selectInsightsBankAccountsRequest = httpMock.expectOne(expectedRequest);
      selectInsightsBankAccountsRequest.flush(merchantResponse);
    });
  });

  describe('loadBankAccount', () => {
    const bankAccount = verifiedBankAccount;
    const bankAccountId = verifiedBankAccount.id;
    const expectedUrl = API_BANK_ACCOUNTS.GET_BANK_ACCOUNT_PATH.replace(':id', bankAccountId);
    const expectedRequest: RequestMatch = { method: 'GET', url: expectedUrl };

    it('should set the BankAccount BehaviourSubject when successfully loading a bank account', () => {
      expect(bankService.bankAccount.getValue()).toBeNull();

      bankService.loadBankAccount(bankAccountId)
        .pipe(take(1))
        .subscribe(
          (res) => {
            expect(res).toBeTruthy();
            expect(bankService.bankAccount.getValue()).toEqual(bankAccount);
          },
          (err) => fail('Prevented this test to fail silently: ' + err));

      const bankAccountRequest = httpMock.expectOne(expectedRequest);
      bankAccountRequest.flush({ data: bankAccount });
    });

    it('should pass down an error if loadBankAccount returns an http error', () => {
      HTTP_ERRORS.forEach(httpError => {
        bankService.loadBankAccount(bankAccountId)
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status));

        const bankAccountRequest = httpMock.expectOne(expectedRequest);
        bankAccountRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('increaseLimit', () => {
    it('increaseLimit should be false by default', () => {
      expect(bankService.increaseLimit).toBeFalsy();
    });
  });

  describe('postIncreaseLimit', () => {
    it('should be able to request a limit increase', () => {
      bankService.postIncreaseLimit()
        .pipe(take(1))
        .subscribe(
          (res) => expect(res.status).toEqual('SUCCESS'),
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const invoiceRequest = httpMock.expectOne(API_MERCHANT.INCREASE_LIMIT_PATH);
      expect(invoiceRequest.request.method).toEqual('POST');
      invoiceRequest.flush({ status: 'SUCCESS' });
    });

    it('should pass down an error if postIncreaseLimit returns an http error', () => {
      HTTP_ERRORS.forEach(httpError => {
        bankService.postIncreaseLimit()
          .pipe(take(1))
          .subscribe(
            (res) => fail('Prevented this test to fail silently: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const invoiceRequest = httpMock.expectOne(API_MERCHANT.INCREASE_LIMIT_PATH);
        expect(invoiceRequest.request.method).toEqual('POST');
        invoiceRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('postBankAccount()', () => {
    const bankAccountPostBody: BankAccountPost = {
      institution_number: '111', transit_number: '22222', account_number: '33333'
    };

    it('should be able to send request to post a bank account', fakeAsync(() => {
      const merchant = merchantDataResponseFactory.build();
      bankService.postBankAccount(bankAccountPostBody)
        .subscribe(
          (res) => {
            expect(res).toEqual(merchant);
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      tick();

      const expectedRequest: RequestMatch = { method: 'POST', url: API_BANK_ACCOUNTS.CREATE_NEW_BANK_ACCOUNT_PATH };
      const creatBankAccountRequest = httpMock.expectOne(expectedRequest);
      creatBankAccountRequest.flush(merchant);
    }));

    it('should pass down an error if postBankAccount returns an http error', () => {
      HTTP_ERRORS.forEach(httpError => {
        bankService.postBankAccount(bankAccountPostBody)
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const expectedRequest: RequestMatch = { method: 'POST', url: API_BANK_ACCOUNTS.CREATE_NEW_BANK_ACCOUNT_PATH };
        const creatBankAccountRequest = httpMock.expectOne(expectedRequest);
        creatBankAccountRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('createBankAccount()', () => {
    const bankAccountPostBody: BankAccountPost = {
      institution_number: '111', transit_number: '22222', account_number: '33333'
    };

    it('should be able to send request to create a bank account', fakeAsync(() => {
      spyOn(bankService, 'setBankAccountOwner');
      const merchantResponse = merchantDataResponseFactory.build();
      bankService.createBankAccount(bankAccountPostBody)
        .subscribe(
          (res) => {
            expect(res).toEqual(merchantResponse);
            expect(merchantService.setMerchant).toHaveBeenCalledOnceWith(merchantResponse.data);
          },
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      tick();

      const expectedRequest: RequestMatch = { method: 'POST', url: API_BANK_ACCOUNTS.CREATE_NEW_BANK_ACCOUNT_PATH };
      const creatBankAccountRequest = httpMock.expectOne(expectedRequest);
      creatBankAccountRequest.flush(merchantResponse);
    }));

    it('should pass down an error if createBankAccount returns an http error', () => {
      HTTP_ERRORS.forEach(httpError => {
        bankService.createBankAccount(bankAccountPostBody)
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const expectedRequest: RequestMatch = { method: 'POST', url: API_BANK_ACCOUNTS.CREATE_NEW_BANK_ACCOUNT_PATH };
        const creatBankAccountRequest = httpMock.expectOne(expectedRequest);
        creatBankAccountRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('updateDesiredBankBalance', () => {
    const amount = 1000;

    beforeEach(() => {
      spyOn(bankService, 'setBankAccountOwner');
    });

    describe('owner is a merchant', () => {
      const merchant = merchantDataFactory.build();
      const res = merchantDataResponseFactory.build();
      beforeEach(() => {
        bankService.owner = new BankAccountOwner(merchant);
        spyOn(merchantService, 'updateDesiredBankAccountBalance').and.returnValue(of(res))
      });

      it('should call merchant service function and set bank account owner to that merchant', () => {
        bankService.updateDesiredBankBalance(amount)
          .subscribe(
            () => {
              expect(merchantService.updateDesiredBankAccountBalance).toHaveBeenCalledOnceWith(merchant.id, amount);
              expect(bankService.setBankAccountOwner).toHaveBeenCalledOnceWith(res.data);
            },
            (err) => fail('Prevented this test to fail silently: ' + err)
          );
      });
    });

    describe('owner is a lead', () => {
      const lead = leadFactory.build();
      const res = leadResponseFactory.build();
      beforeEach(() => {
        bankService.owner = new BankAccountOwner(lead);
        spyOn(leadService, 'updateDesiredBankAccountBalance').and.returnValue(of(res))
      });

      it('should call lead service function and set bank account owner to that lead', () => {
        bankService.updateDesiredBankBalance(amount)
          .subscribe(
            () => {
              expect(leadService.updateDesiredBankAccountBalance).toHaveBeenCalledOnceWith(lead.id, amount);
              expect(bankService.setBankAccountOwner).toHaveBeenCalledOnceWith(res.data);
            },
            (err) => fail('Prevented this test to fail silently: ' + err)
          );
      });
    });

    describe('owner is ?', () => {
      beforeEach(() => {
        bankService.owner = new BankAccountOwner(null);
      });

      it('should trigger bugsnag and set bank account owner to undefined', () => {
        bankService.updateDesiredBankBalance(amount)
          .subscribe(
            () => {
              expect(Bugsnag.notify).toHaveBeenCalledOnceWith(new ErrorMessage('Unknown owner'));
              expect(bankService.setBankAccountOwner).toHaveBeenCalledOnceWith(undefined);
            },
            (err) => fail('Prevented this test to fail silently: ' + err)
          );
      });
    });
  });

  // HELPERS

  describe('isBankAccountVerified', () => {
    it('should return true if the bank account is verified', () => {
      const BANK_ACCOUNTS = ALL_BANK_ACCOUNTS.filter(ba => ba.verified === 'true');

      BANK_ACCOUNTS.forEach(bankAccount => {
        expect(bankService.isBankAccountVerified(bankAccount)).toEqual(true);
      });
    });

    it('should return false if the bank account is unverified', () => {
      const BANK_ACCOUNTS = ALL_BANK_ACCOUNTS.filter(ba => ba.verified !== 'true');

      BANK_ACCOUNTS.forEach(bankAccount => {
        expect(bankService.isBankAccountVerified(bankAccount)).toEqual(false);
      });
    });

    it('should return false if provided with an invalid value', () => {
      const INVALID_VALUES = [null, undefined];

      INVALID_VALUES.forEach(value => {
        expect(bankService.isBankAccountVerified(value)).toEqual(false);
      });
    });
  });

  describe('isBankAccountManual', () => {
    it('should return true if the bank account has been created manually', () => {
      MANUAL_BANK_ACCOUNTS.forEach(bankAccount => {
        expect(bankService.isBankAccountFromManual(bankAccount)).toEqual(true);
      });
    });

    it('should return false if the bank account has been with anything else but manually', () => {
      const BANK_ACCOUNTS = ALL_VALID_BANK_ACCOUNTS.filter(ba => !MANUAL_BANK_ACCOUNTS.includes(ba));

      BANK_ACCOUNTS.forEach(bankAccount => {
        expect(bankService.isBankAccountFromManual(bankAccount)).toEqual(false);
      });
    });

    it('should return false if provided with an invalid value', () => {
      const INVALID_VALUES = [null, undefined];

      INVALID_VALUES.forEach(value => {
        expect(bankService.isBankAccountFromManual(value)).toEqual(false);
      });
    });
  });

  describe('isBankAccountFromFlinks', () => {
    it('should return true if the bank account has been created with flinks', () => {
      FLINKS_BANK_ACCOUNTS.forEach(bankAccount => {
        expect(bankService.isBankAccountFromFlinks(bankAccount)).toEqual(true);
      });
    });

    it('should return false if the bank account has been created with anything else than flinks', () => {
      const BANK_ACCOUNTS = ALL_VALID_BANK_ACCOUNTS.filter(ba => !FLINKS_BANK_ACCOUNTS.includes(ba));

      BANK_ACCOUNTS.forEach(bankAccount => {
        expect(bankService.isBankAccountFromFlinks(bankAccount)).toEqual(false);
      });
    });

    it('should return false if provided with an invalid value', () => {
      const INVALID_VALUES = [null, undefined];

      INVALID_VALUES.forEach(value => {
        expect(bankService.isBankAccountFromFlinks(value)).toEqual(false);
      });
    });
  });

  describe('getBankingStatus', () => {
    beforeEach(() => {
      merchantHasSelectedBankAccountSpy.and.returnValue(false);
      merchantSalesVolumeRequiredSpy.and.returnValue(false);
      bankConnectionRequiredSpy.and.returnValue(false);
    })
    describe('need_sales_volume', () => {
      it('should return need_sales_volume when merchant has selected a bank account and sales volume is required', () => {
        merchantHasSelectedBankAccountSpy.and.returnValue(true);
        merchantSalesVolumeRequiredSpy.and.returnValue(true);

        expect(bankService.getBankingStatus()).toEqual(BankingStatus.need_sales_volume);
      });
    });

    describe('need_connection_refresh', () => {
      it('should return need_connection_refresh when merchant has selected a bank account and bank connection is required', () => {
        merchantHasSelectedBankAccountSpy.and.returnValue(true);
        bankConnectionRequiredSpy.and.returnValue(true);
        expect(bankService.getBankingStatus()).toEqual(BankingStatus.need_connection_refresh);
      });
    });

    describe('bank_status_optimal', () => {
      it('should return bank_status_optimal when merchant has selected a bank account and no other flags are true', () => {
        merchantHasSelectedBankAccountSpy.and.returnValue(true);
        expect(bankService.getBankingStatus()).toEqual(BankingStatus.bank_status_optimal);
      });
    });

    describe('need_bank_account', () => {
      it('should return need_bank_account when merchant has NOT selected a bank account', () => {
        expect(bankService.getBankingStatus()).toEqual(BankingStatus.need_bank_account);
      });
    });
  });

  describe('setBankAccountLoadingState', () => {
    it('should set value for bankAccountLoadingState', () => {
      bankService.bankAccountLoadingState
        .pipe(take(1))
        .subscribe(
          (res) => expect(res).toEqual(BankAccountLoadingState.MANUAL)
        );
      bankService.setBankAccountLoadingState(BankAccountLoadingState.MANUAL);
    });
  });

  describe('setBankAccountOwner', () => {
    it('sets values when null is passed in', () => {
      bankService.setBankAccountOwner(null);
      expect(bankService.owner).toBeTruthy();
      expect(bankService.owner$.getValue()).toEqual(bankService.owner);
      expect(bankService.selectedInsightsBankAccountsIds).toEqual([]);
    });

    it('sets values when merchant is passed in', () => {
      const merchant = merchantDataFactory.build({selected_insights_bank_accounts: ['ba_123']})
      bankService.setBankAccountOwner(merchant);
      expect(bankService.owner).toBeTruthy();
      expect(bankService.owner$.getValue()).toEqual(bankService.owner);
      expect(bankService.selectedInsightsBankAccountsIds).toEqual(['ba_123']);
    });
  });

});
