import * as Factory from 'factory.ts';
import { InsightsCashFlowData, InsightsData } from 'app/models/insights-data';

export const insightsDataFactory = Factory.makeFactory<InsightsData>({
  name: 'sales volume',
  series: [
    {
      name: new Date('2020-06-01'),
      value: 500.00
    },
    {
      name: new Date('2020-07-01'),
      value: 400.00
    },
    {
      name: new Date('2020-08-01'),
      value: 600.00
    }
  ]
});

export const insightsCashFlowFactory = Factory.makeFactory<InsightsCashFlowData>({
  name: 'cash flow',
  series: [
    {
      'name': 'Credit',
      'value': 128.83
    },
    {
      'name': 'Debit',
      'value': -128.83
    },
  ],
});
