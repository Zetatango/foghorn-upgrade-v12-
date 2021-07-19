import * as Factory from 'factory.ts';
import { ApplicantPost } from 'app/models/api-entities/applicant-post';
import { Country } from 'app/models/api-entities/utility';
import { SubmitApplicantResponse } from 'app/models/api-entities/applicant';
import { ZttResponse } from 'app/models/api-entities/response';

/********************************* FACTORIES **********************************/

export const applicantPostFactory = Factory.makeFactory<ApplicantPost>({
  first_name: 'Jean',
  last_name: 'Seberg',
  date_of_birth: '13-11-1938',
  owner_since: '01-01-2016',
  phone_number: '613-555-1234',
  sin: null,
  address_line_1: '99 rue street',
  city: 'Ottawa',
  country: Country.Canada,
  province: 'ON', // Province.ON, // TODO [Val] Use enum
  postal_code: 'H0H0H0'
});

export const submitApplicantResponseFactory = Factory.makeFactory<ZttResponse<SubmitApplicantResponse>>({
  data: {
    id: 'app_123',
    first_name: 'FIRST',
    last_name: 'LAST'
  },
  status: 'SUCCESS',
  message: 'Loaded'
});
