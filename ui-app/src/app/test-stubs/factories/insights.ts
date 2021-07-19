import * as Factory from 'factory.ts';
import { ZttResponse } from 'app/models/api-entities/response';
import {
  AggregatedBankAccounts, AggregatedBankAccountsResponse, BackAccountProjectionGQL, BankAccountBalanceGQL, BankAccountPerformanceGQL,
} from 'app/models/api-entities/insights';
export const bankAccountBalanceFactory = Factory.makeFactory<BankAccountBalanceGQL>({
    date: '2021-03-31',
    credits: 932.14,
    debits: 1023.11,
    openingBalance: 400.00,
    operatingRatio: 2
});

export const bankAccountProjectionFactory = Factory.makeFactory<BackAccountProjectionGQL>({
    date: '2021-03-31',
    openingBalance: 11.01,
    debits: 1.11,
    credits: 1.51,
    loBalance: 0.01,
    hiBalance: 1.01,
    operatingRatio: 0.99,
    projectionId: '1d665b9b1467944c128a5575119d1cfd',
});

export const bankAccountPerformanceFactory = Factory.makeFactory<BankAccountPerformanceGQL>({
    currentDate: '2021-03-31',
    previousDate: '2021-03-31',
    currentBalance: 0.01,
    previousBalance: 0.01,
    currentOperatingRatio: 0.01,
    previousOperatingRatio: 0.01,
    balanceChange: 0.01,
    operatingRatioChange: 0.01
});

export const aggregatedBankAccountsFactory = Factory.makeFactory<AggregatedBankAccounts>({
  aggregation: 7,
  averageDailyExpenses: 1,
  balance: bankAccountBalanceFactory.buildList(3),
  accountGuids: ['acct1', 'acct2'],
  cashBufferDays: 0,
  currentBalance: 0,
  lastTransactionDate: '2021-03-31',
  performance: bankAccountPerformanceFactory.build(),
  projection: bankAccountProjectionFactory.buildList(3)
});


export const aggregatedBankAccountsResponseFactory = Factory.makeFactory<AggregatedBankAccountsResponse>({
  aggregatedBankAccounts: aggregatedBankAccountsFactory.build()
});

export const zttAggregatedBankAccountsResponseFactory = Factory.makeFactory<ZttResponse<AggregatedBankAccountsResponse>>({
  data: {
   aggregatedBankAccounts: aggregatedBankAccountsFactory.build()
  },
  status: 'Success',
  message: 'Returned aggregated accounts insights'
});
