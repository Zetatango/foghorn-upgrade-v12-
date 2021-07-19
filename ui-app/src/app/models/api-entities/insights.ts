export interface BankAccountBalanceGQL {
  date: string;
  credits: number;
  debits: number;
  openingBalance: number;
  operatingRatio: number;
}

export interface BankAccountPerformanceGQL {
  currentDate: string;
  previousDate: string;
  currentBalance: number;
  previousBalance: number;
  currentOperatingRatio: number;
  previousOperatingRatio: number;
  balanceChange: number;
  operatingRatioChange: number;
}

export interface BackAccountProjectionGQL {
  projectionId: string;
  date: string;
  openingBalance: number;
  debits: number;
  credits: number;
  loBalance: number;
  hiBalance: number;
  operatingRatio: number;
}
export interface AggregatedBankAccounts {
  balance: BankAccountBalanceGQL[];
  accountGuids: string [];
  aggregation: number;
  averageDailyExpenses;
  cashBufferDays: number;
  currentBalance: number;
  lastTransactionDate: string;
  performance: BankAccountPerformanceGQL;
  projection: BackAccountProjectionGQL [];
}

export interface AggregatedBankAccountsResponse {
  aggregatedBankAccounts: AggregatedBankAccounts;
}
