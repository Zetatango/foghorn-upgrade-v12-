export interface InsightsData {
  name: string;
  series: InsightsDataSeries[];
}

export interface InsightsDataSeries {
  name: Date;
  value: number;
  min?: number;
  max?: number;
}

export interface InsightsCashFlowData {
  name: string;
  series: InsightsCashFlowDataSeries[];
}

export interface InsightsCashFlowDataSeries {
  name: string;
  value: number;
  min?: number;
  max?: number;
}


export interface CashOnHandData {
  currentBalance: number;
  balanceChange: number;
  cashBufferDays: number;

}

export interface OperatingRatioData {
  operatingRatio: number;
  operatingRatioChange: number;
  credits: number;
  debits: number;
}

