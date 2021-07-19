import { ApplicationSummary } from 'app/models/api-entities/offer';
import { ApplicationState } from 'app/models/api-entities/utility';
import * as Factory from 'factory.ts';

export const applicationSummaryFactory = Factory.Sync.makeFactory<ApplicationSummary>({
  applied_at: 'Thu, 16 Feb 2018 02:38:08 +0000',
  id: 'lap_covUf1qRn67PATec',
  max_principal_amount: 20000.00,
  principal_amount: 10000.00,
  requested_amount: 10000.00,
  state: ApplicationState.approved,
  updated_at: 'Thu, 16 Feb 2018 02:38:08 +0000'
});
