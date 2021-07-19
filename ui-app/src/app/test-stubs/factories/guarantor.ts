import { ZttResponse } from 'app/models/api-entities/response';
import { Country } from 'app/models/api-entities/utility';
import * as Factory from 'factory.ts';
import { Guarantor, GuarantorPost } from 'app/models/api-entities/guarantor';

/********************************* FACTORIES **********************************/

export const guarantorFactory = Factory.makeFactory<Guarantor>({
  first_name: 'George',
  last_name: 'Guarantor',
  date_of_birth: new Date(1985, 1, 1),
  phone_number: '(514) 555-5555',
  email: 'george@guarantor.com',
  relationship: 'acquaintance'
});

export const guarantorPostFactory = Factory.makeFactory<GuarantorPost>({
  application_id: 'lap_1',
  first_name: 'George',
  last_name: 'Guarantor',
  date_of_birth: 'Tue Jan 01 1985 00:00:00 GMT-0500 (GMT−05:00)',
  phone_number: '(514) 555-5555',
  email: 'george@guarantor.com',
  relationship: 'acquaintance',
  address_line_1: '1 first street',
  city: 'Montréal',
  country: Country.Canada,
  state_province: 'QC',
  postal_code: 'A1A1A1'
});

export const guarantorCreatedResponse = Factory.makeFactory<ZttResponse<void>>({
  status: 'SUCCESS',
  message: 'Guarantor info added',
  data: null
});
