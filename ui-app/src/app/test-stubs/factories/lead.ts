import * as Factory from 'factory.ts';
import {
  Lead,
  LeadAttributes,
  ApplicantInfo,
  MerchantInfo
} from 'app/models/api-entities/lead';
import { Industry } from 'app/models/industry';
import { SupportedLanguage } from 'app/models/languages';
import { Province } from 'app/models/province';
import { ZttResponse } from '../../models/api-entities/response';

/********************************* FACTORIES **********************************/
export const leadMerchantAttributesFactory = Factory.Sync.makeFactory<LeadAttributes>({
  merchant_phone_number: '+1 613 555-1234',
  merchant_industry: Industry.APPAREL_AND_ACCESSORIES,
  merchant_doing_business_as: 'Alice Bakery',
  merchant_jurisdiction: Province.ON,
  merchant_business_number: '12-345-678',
  merchant_self_attested_date_established: '12-15-2020',

  merchant_operate_in: Province.ON,          // Not used
  merchant_referrer: 'ref_123',              // Not used
  merchant_equifax_file_number: '501237059', // Not used

  merchant_address_line_1: 'XX Some Street',
  merchant_address_line_2: 'Building Y',
  merchant_city: 'Ottawa',
  merchant_postal_code: 'H0H0H0',
  merchant_state_province: Province.ON
});

export const leadApplicantAttributesFactory = Factory.Sync.makeFactory<LeadAttributes>({
  applicant_phone_number: '+1 555 123-1234',
  applicant_date_of_birth: '01-01-1980',
  applicant_owner_since: '01-01-2000',

  applicant_middle_name: 'Trudy',      // Not used
  applicant_suffix: 'Mrs',             // Not used

  applicant_address_line_1: 'YY Some Street',
  applicant_address_line_2: 'Building Z',
  applicant_city: 'Montreal',
  applicant_postal_code: 'H0H0H0',
  applicant_state_province: Province.QC
});

export const leadFactory = Factory.Sync.makeFactory<Lead>({
  id: 'lead_123',
  external_id: '',
  language: SupportedLanguage.en,
  casl_consent: false,
  attributes: leadMerchantAttributesFactory.build(),
  applicant_email: 'lead@lead.com',
  applicant_first_name: 'First',
  applicant_last_name: 'Last',
  merchant_name: 'Lead Business',
  desired_bank_account_balance: 0,
  selected_insights_bank_accounts: []
});

export const applicantInfoFactory = Factory.Sync.makeFactory<ApplicantInfo>(
  new ApplicantInfo(leadFactory.build(), leadApplicantAttributesFactory.build())
);

export const merchantInfoFactory = Factory.Sync.makeFactory<MerchantInfo>(
  new MerchantInfo(leadFactory.build(), leadMerchantAttributesFactory.build())
);

export const leadResponseFactory = Factory.Sync.makeFactory<ZttResponse<Lead>>({
  status: 'SUCCESS',
  message: 'Loaded',
  data: leadFactory.build()
});
