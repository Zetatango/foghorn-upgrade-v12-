import * as Factory from 'factory.ts';
import { BankAccountDetails } from 'app/models/api-entities/merchant';

export const bankAccountDetailsFactory = Factory.Sync.makeFactory<BankAccountDetails>({
  id: 'ba_123',
  institution_name: 'FlinksCapital',
  masked_account_number: '***4567',
  flinks_account_uuid: '62cf2b28-5e87-11e8-9c2d-fa7ae01bbebc'
});
