import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AGGREGATION, API_DATA_WAREHOUSE } from 'app/constants';
import { take, tap } from 'rxjs/operators';
import { UtilityService } from './utility.service';
import {
  CashOnHandData,
  InsightsCashFlowData,
  InsightsCashFlowDataSeries,
  InsightsData,
  InsightsDataSeries, OperatingRatioData
} from 'app/models/insights-data';
import { AggregatedBankAccounts, AggregatedBankAccountsResponse } from 'app/models/api-entities/insights';
import { ZttResponse } from 'app/models/api-entities/response';
import { ErrorResponse } from 'app/models/error-response';
import Bugsnag from '@bugsnag/js';
import { BugsnagSeverity } from 'app/models/bugsnag';
import { ConfigurationService } from './configuration.service';

@Injectable()
export class InsightsService {
  accountBalanceData$: BehaviorSubject<InsightsData[]> = new BehaviorSubject<InsightsData[]>([]);
  cashFlowData$: BehaviorSubject<InsightsCashFlowData[]> = new BehaviorSubject<InsightsCashFlowData[]>([]);

  private _cashOnHandData$: BehaviorSubject<CashOnHandData> = new BehaviorSubject<CashOnHandData>(null);
  private _lastTransactionDate$: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  private _operatingRatioData$: BehaviorSubject<OperatingRatioData> = new BehaviorSubject<OperatingRatioData>(null);

  constructor(
    private configurationService: ConfigurationService,
    private http: HttpClient,
    private utilityService: UtilityService
  ) { }

  setCashFlowData(data: AggregatedBankAccountsResponse): void {
    if (!data.aggregatedBankAccounts) return;

    const bankAccount = data.aggregatedBankAccounts;
    if (!bankAccount.balance) return;

    this.lastTransactionDate = bankAccount.lastTransactionDate;

    this.setCashOnHandData(data.aggregatedBankAccounts);

    this.setOperatingRatioData(data.aggregatedBankAccounts);

    const cashFlowSeries = bankAccount.balance.map((balance) => {
      const cashFlowDebitData: InsightsCashFlowDataSeries = {
        name: 'INSIGHTS.CHART_LABEL_DEBITS',
        value: -balance.debits
      };

      const cashFlowCreditData: InsightsCashFlowDataSeries = {
        name: 'INSIGHTS.CHART_LABEL_CREDITS',
        value: balance.credits
      };

      const cashFlow: InsightsCashFlowData = {
        name: balance.date,
        series: [
          cashFlowCreditData,
          cashFlowDebitData
        ]
      };
      return cashFlow;
    });
    const projectionCashFlowSeries = bankAccount.projection.map((projection) => {
      const cashFlowDebitData: InsightsCashFlowDataSeries = {
        name: 'Projection Debits',
        value: -projection.debits
      };

      const cashFlowCreditData: InsightsCashFlowDataSeries = {
        name: 'Projection Credits',
        value: projection.credits
      };

      const cashFlow: InsightsCashFlowData = {
        name: projection.date,
        series: [
          cashFlowCreditData,
          cashFlowDebitData
        ]
      };
      return cashFlow;
    });

    const cashFlowData = [
      ...cashFlowSeries,
      ...projectionCashFlowSeries
    ];

    this.cashFlowData$.next(cashFlowData);
  }

  fetchGraphData(bankAccountIds: string[]): void {
    if (!this.configurationService.insightsEnabled) return;
    this.fetchCashFlowData(bankAccountIds)
      .pipe(take(1))
      .subscribe({
        error: (e: ErrorResponse) => {
          /* istanbul ignore next */
          Bugsnag.notify(e, event => { event.severity = BugsnagSeverity.info });
        }
      });

    this.fetchAccountBalanceData(bankAccountIds)
      .pipe(take(1))
      .subscribe({
        error: (e: ErrorResponse) => {
          /* istanbul ignore next */
          Bugsnag.notify(e, event => { event.severity = BugsnagSeverity.info });
        }
      });
  }

  setAccountBalanceData(data: AggregatedBankAccountsResponse): void {
    if (!data.aggregatedBankAccounts) return;

    const bankAccount = data.aggregatedBankAccounts;
    if (!bankAccount.balance) return;

    this.lastTransactionDate = bankAccount.lastTransactionDate;

    // TODO: use selected bank account - requires changes in graphql schema for bank account
    const accountBalanceSeries = bankAccount.balance.map((balance) => {
      const accountBalance: InsightsDataSeries = {
        name: new Date(balance.date),
        value: balance.openingBalance + balance.credits - balance.debits
      };

      return accountBalance;
    });


    const projectionBalanceSeries = bankAccount.projection.map((projection) => {
      const projectionBalance: InsightsDataSeries = {
        name: new Date(projection.date),
        value: projection.openingBalance + projection.credits - projection.debits
      };

      return projectionBalance;
    });

    const balanceInsightsData: InsightsData[] = [
      {
        name: 'INSIGHTS.CHART_LABEL_ACCOUNT_BALANCE',
        series: accountBalanceSeries
      },
      {
        name: 'INSIGHTS.CHART_LABEL_PROJECTIONS',
        series: projectionBalanceSeries
      }
    ];
    this.accountBalanceData$.next(balanceInsightsData);
  }

  set lastTransactionDate(date: string) {
    this._lastTransactionDate$.next(date);
  }

  getLastTransactionDate(): Observable<string> {
    return this._lastTransactionDate$.asObservable();
  }


  get cashOnHandData(): BehaviorSubject<CashOnHandData> {
    return this._cashOnHandData$;
  }

  setCashOnHandData(data: AggregatedBankAccounts): void {
    const cashOnHandData: CashOnHandData = {
      currentBalance: data.currentBalance,
      cashBufferDays: data.cashBufferDays,
      balanceChange: data.performance.balanceChange
    };
    this.cashOnHandData.next(cashOnHandData);
  }

  get operatingRatioData(): BehaviorSubject<OperatingRatioData> {
    return this._operatingRatioData$;
  }

  setOperatingRatioData(data: AggregatedBankAccounts): void {
    if (!data.balance.length) return;

    const latestBalanceData = data.balance[data.balance.length - 1];

    const operatingRatioData: OperatingRatioData = {
      credits: latestBalanceData.credits,
      debits: latestBalanceData.debits,
      operatingRatio: data.performance.currentOperatingRatio,
      operatingRatioChange: data.performance.operatingRatioChange
    };
    this._operatingRatioData$.next(operatingRatioData);
  }

  fetchAccountBalanceData(selectedBankAccounts: string[]): Observable<ZttResponse<AggregatedBankAccountsResponse>> {
    const params = {
      account_guids: [selectedBankAccounts],
      aggregation: AGGREGATION.WEEKLY
    };

    const url = this.utilityService.getAugmentedUrl(API_DATA_WAREHOUSE.GET_AGGREGRATED_BANK_ACCOUNTS, params);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<AggregatedBankAccountsResponse>) => this.setAccountBalanceData(res.data))
      );
  }

  fetchCashFlowData(selectedBankAccounts: string[]): Observable<ZttResponse<AggregatedBankAccountsResponse>> {
    const params = {
      account_guids: [selectedBankAccounts],
      aggregation: AGGREGATION.MONTHLY
    };
    const url = this.utilityService.getAugmentedUrl(API_DATA_WAREHOUSE.GET_AGGREGRATED_BANK_ACCOUNTS, params);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<AggregatedBankAccountsResponse>) => this.setCashFlowData(res.data))
      );
  }


}
