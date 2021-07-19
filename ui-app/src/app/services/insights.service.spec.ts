import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { InsightsService } from './insights.service';
import { UtilityService } from './utility.service';
import { AGGREGATION, API_DATA_WAREHOUSE } from 'app/constants';
import { aggregatedBankAccountsFactory, aggregatedBankAccountsResponseFactory } from 'app/test-stubs/factories/insights';
import { HTTP_ERRORS } from 'app/test-stubs/api-errors-stubs';
import { of, throwError } from 'rxjs';
import { ErrorResponse } from 'app/models/error-response';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';
import Bugsnag from '@bugsnag/js';
import { take } from 'rxjs/operators';
import { ConfigurationService } from './configuration.service';

describe('InsightsService', () => {
  let configurationService: ConfigurationService;
  let insightsService: InsightsService;
  let utilityService: UtilityService;
  let httpMock: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        ConfigurationService,
        InsightsService,
        UtilityService
      ]
    });

    configurationService = TestBed.inject(ConfigurationService);
    insightsService = TestBed.inject(InsightsService);
    utilityService = TestBed.inject(UtilityService);
    httpMock = TestBed.inject(HttpTestingController);

    spyOn(Bugsnag, 'notify');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(insightsService).toBeDefined();
    expect(insightsService).toBeTruthy();
  });

  describe('fetchGraphData', () => {
    describe('insights enabled', () =>{
      beforeEach(() => {
        spyOnProperty(configurationService, 'insightsEnabled', 'get').and.returnValue(true);
      });

      it('should call fetchCashFlowData + fetchAccountBalanceData', () => {
        spyOn(insightsService, 'fetchCashFlowData').and.returnValue(of());
        spyOn(insightsService, 'fetchAccountBalanceData').and.returnValue(of());
        insightsService.fetchGraphData([]);

        expect(insightsService.fetchCashFlowData).toHaveBeenCalledTimes(1);
        expect(insightsService.fetchAccountBalanceData).toHaveBeenCalledTimes(1);
      });

      it('should trigger Bugsnag on error from fetchCashFlowData', () => {
        const err = new ErrorResponse(internalServerErrorFactory.build());
        spyOn(insightsService, 'fetchCashFlowData').and.returnValue(throwError(err));
        spyOn(insightsService, 'fetchAccountBalanceData').and.returnValue(of());
        insightsService.fetchGraphData([]);

        expect(Bugsnag.notify).toHaveBeenCalled();
      });

      it('should trigger Bugsnag on error from fetchAccountBalanceData', () => {
        const err = new ErrorResponse(internalServerErrorFactory.build());
        spyOn(insightsService, 'fetchCashFlowData').and.returnValue(of());
        spyOn(insightsService, 'fetchAccountBalanceData').and.returnValue(throwError(err));
        insightsService.fetchGraphData([]);

        expect(Bugsnag.notify).toHaveBeenCalled();
      });
    });

    describe('insights disabled', () => {
      beforeEach(() => {
        spyOnProperty(configurationService, 'insightsEnabled', 'get').and.returnValue(false);
      });

      it('should not make API call if insights is disabled', () => {
        spyOn(insightsService, 'fetchCashFlowData');
        spyOn(insightsService, 'fetchAccountBalanceData');

        insightsService.fetchGraphData([]);

        expect(insightsService.fetchCashFlowData).not.toHaveBeenCalled();
        expect(insightsService.fetchAccountBalanceData).not.toHaveBeenCalled();
      });
    });

  });

  describe('fetchCashFlowData', () => {
    const params = {
      account_guids: ['ba_123'],
      aggregation: AGGREGATION.MONTHLY
    };

    beforeEach(() => {
      spyOn(insightsService, 'setCashFlowData');
    });

    it('requests cash flow data', () => {
      insightsService.fetchCashFlowData(params.account_guids)
        .pipe(take(1))
        .subscribe();
      const url = utilityService.getAugmentedUrl(API_DATA_WAREHOUSE.GET_AGGREGRATED_BANK_ACCOUNTS, params);
      const request = httpMock.expectOne(url);
      expect(request.request.method).toEqual('GET');
    });

    it('calls fetchCashFlowData with request data on success', () => {
      insightsService.fetchCashFlowData(params.account_guids)
        .pipe(take(1))
        .subscribe(
          () => expect(insightsService.setCashFlowData).toHaveBeenCalledTimes(1),
          (err) => fail('Prevented this test from failing silently: ' + err)
        );
      const url = utilityService.getAugmentedUrl(API_DATA_WAREHOUSE.GET_AGGREGRATED_BANK_ACCOUNTS, params);
      const request = httpMock.expectOne(url);
      request.flush(aggregatedBankAccountsResponseFactory.build());
      expect(request.request.method).toEqual('GET');
    });

    it('does not call setCashFlowData on error', () => {
      HTTP_ERRORS.forEach(httpError => {
        insightsService.fetchCashFlowData(params.account_guids)
          .pipe(take(1))
          .subscribe(
            () => expect(insightsService.setCashFlowData).toHaveBeenCalledTimes(1),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const url = utilityService.getAugmentedUrl(API_DATA_WAREHOUSE.GET_AGGREGRATED_BANK_ACCOUNTS, params);
        const request = httpMock.expectOne(url);
        request.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('fetchAccountBalanceData', () => {
    const params = {
      account_guids: ['ba_234'],
      aggregation: AGGREGATION.WEEKLY
    };
    beforeEach(() => {
      spyOn(insightsService, 'setAccountBalanceData');
    });

    it('requests account balance data', () => {
      insightsService.fetchAccountBalanceData(params.account_guids)
        .pipe(take(1))
        .subscribe();
      const url = utilityService.getAugmentedUrl(API_DATA_WAREHOUSE.GET_AGGREGRATED_BANK_ACCOUNTS, params);
      const request = httpMock.expectOne(url);
      expect(request.request.method).toEqual('GET');
    });

    it('calls setAccountBalanceData with request data on success', () => {
      insightsService.fetchAccountBalanceData(params.account_guids)
        .pipe(take(1))
        .subscribe(
          () => expect(insightsService.setAccountBalanceData).toHaveBeenCalledTimes(1),
          (err) => fail('Prevented this test from failing silently: ' + err)
        );
      const url = utilityService.getAugmentedUrl(API_DATA_WAREHOUSE.GET_AGGREGRATED_BANK_ACCOUNTS, params);
      const request = httpMock.expectOne(url);
      request.flush(aggregatedBankAccountsResponseFactory.build());
    });

    it('does not call setAccountBalanceData on error', () => {
      HTTP_ERRORS.forEach(httpError => {
        insightsService.fetchAccountBalanceData(params.account_guids)
          .pipe(take(1))
          .subscribe(
            () => expect(insightsService.setAccountBalanceData).toHaveBeenCalledTimes(1),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const url = utilityService.getAugmentedUrl(API_DATA_WAREHOUSE.GET_AGGREGRATED_BANK_ACCOUNTS, params);
        const request = httpMock.expectOne(url);
        request.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });

  describe('setCashFlowData', () => {
    it('Updates the value of cashFlowData BehaviorSubject', () => {
      const data = aggregatedBankAccountsResponseFactory.build();
      spyOn(insightsService.cashFlowData$, 'next');

      insightsService.setCashFlowData(data);
      expect(insightsService.cashFlowData$.next).toHaveBeenCalledTimes(1);
    });

    it('Updates the cashOnHandData + operatingRatioData BehaviorSubject', () => {
      const data = aggregatedBankAccountsResponseFactory.build();
      spyOn(insightsService, 'setOperatingRatioData');
      spyOn(insightsService, 'setCashOnHandData');
      spyOn(insightsService.accountBalanceData$, 'next');

      insightsService.setCashFlowData(data);
      expect(insightsService.setOperatingRatioData).toHaveBeenCalledWith(data.aggregatedBankAccounts);
      expect(insightsService.setCashOnHandData).toHaveBeenCalledWith(data.aggregatedBankAccounts);
    });


    it('Does not update cashFlowData BehaviorSubject when bank account is null', () => {
      const data = aggregatedBankAccountsResponseFactory.build({ aggregatedBankAccounts: null });
      spyOn(insightsService.cashFlowData$, 'next');

      insightsService.setCashFlowData(data);
      expect(insightsService.cashFlowData$.next).not.toHaveBeenCalled();
    });

    it('does not update cashFlowData BehaviorSubject when bank account balance is null', () => {
      const aggregatedBankAccounts = aggregatedBankAccountsFactory.build({ balance: null });
      const data = aggregatedBankAccountsResponseFactory.build({ aggregatedBankAccounts: aggregatedBankAccounts });
      spyOn(insightsService.cashFlowData$, 'next');

      insightsService.setCashFlowData(data);
      expect(insightsService.cashFlowData$.next).not.toHaveBeenCalled();
    });
  });

  describe('setAccountBalanceData', () => {
    it('Does not update accountBalanceData BehaviorSubject when bank account is null', () => {
      const data = aggregatedBankAccountsResponseFactory.build({ aggregatedBankAccounts: null });
      spyOn(insightsService.accountBalanceData$, 'next');

      insightsService.setAccountBalanceData(data);
      expect(insightsService.accountBalanceData$.next).not.toHaveBeenCalled();
    });

    it('Does not update accountBalanceData BehaviorSubject when bank account balance is null', () => {
      const aggregatedBankAccounts = aggregatedBankAccountsFactory.build({ balance: null });
      const data = aggregatedBankAccountsResponseFactory.build({ aggregatedBankAccounts: aggregatedBankAccounts });
      spyOn(insightsService.accountBalanceData$, 'next');

      insightsService.setAccountBalanceData(data);
      expect(insightsService.accountBalanceData$.next).not.toHaveBeenCalled();
    });

    it('Converts date strings to date objects', () => {
      const data = aggregatedBankAccountsResponseFactory.build();

      insightsService.setAccountBalanceData(data);

      expect(insightsService.accountBalanceData$.value[0].series[0].name).toBeInstanceOf(Date);
      expect(insightsService.accountBalanceData$.value[1].series[0].name).toBeInstanceOf(Date);
    });
  });

  describe('getLastTransactionDate', () => {
    it('should have a return value', function () {
      expect(insightsService.getLastTransactionDate()).toBeTruthy();
    });
  });

  describe('operatingRatioData', () => {
    it('should set not operatingRatioData', function () {
      const aggregatedBankAccounts = aggregatedBankAccountsFactory.build({ balance: [] });

      spyOn(insightsService.operatingRatioData, 'next');
      insightsService.setOperatingRatioData(aggregatedBankAccounts);
      expect(insightsService.operatingRatioData.value).toEqual(null);
      expect(insightsService.operatingRatioData.next).not.toHaveBeenCalled();
    });
  });
});
