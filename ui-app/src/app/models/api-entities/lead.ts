import { Address } from 'app/models/address';
import { Applicant } from 'app/models/api-entities/applicant';
import { Business } from 'app/models/business';
import { SupportedLanguage } from 'app/models/languages';
import { asIndustry, Industry } from 'app/models/industry';
import { asProvince, Province } from 'app/models/province';
import { dd_MM_yyyy_FORMAT } from 'app/constants/formatting.constants';
import { isValid, parse } from 'date-fns';
import { BankAccountDetails } from './merchant';

/**
 * Note: When merging, properties for the right-most type K take precedence over T.
 */
type Merge<T, K> = Omit<T, keyof K> & K;

export interface PartialApplicantLead extends Partial<Merge<Applicant, Address>> {
  [k: string]: any; // eslint-disable-line
}

export interface PartialMerchantLead extends Partial<Merge<Business, Address>> {
  [k: string]: any; // eslint-disable-line
}

export interface Lead {
  applicant_email: string;
  applicant_first_name: string;
  applicant_last_name: string;
  attributes: LeadAttributes;
  casl_consent: boolean;
  desired_bank_account_balance?: number;
  external_id: string;
  id: string;
  language: SupportedLanguage;
  merchant_name: string;
  selected_insights_bank_accounts?: string[];
  selected_insights_bank_accounts_details?: BankAccountDetails[];
}

export interface MerchantLeadRequest {
  merchant_address_line_1?: string;
  merchant_address_line_2?: string;
  merchant_business_number?: string;
  merchant_city?: string;
  merchant_doing_business_as?: string;
  merchant_equifax_file_number?: string;
  merchant_industry?: string;
  merchant_jurisdiction?: string;
  merchant_operate_in?: string;
  merchant_phone_number?: string;
  merchant_postal_code?: string;
  merchant_referrer?: string;
  merchant_self_attested_date_established?: string;
  merchant_state_province?: string;
}

export interface ApplicantLeadRequest {
  applicant_address_line_1?: string;
  applicant_address_line_2?: string;
  applicant_city?: string;
  applicant_date_of_birth?: string;
  applicant_middle_name?: string;
  applicant_owner_since?: string;
  applicant_phone_number?: string;
  applicant_postal_code?: string;
  applicant_state_province?: string;
  applicant_suffix?: string;
}

export type LeadAttributes = Merge<MerchantLeadRequest, ApplicantLeadRequest>

class BaseLeadInfo {
  sanitizePhoneNumber(phoneNumber: string): string {
    return (phoneNumber) ? phoneNumber.replace(/\+1|\+ 1|([()\s-])/g, '') : undefined;
  }

  sanitizeDate(dateVal: string): Date | undefined {
    const parsedDate = new Date(dateVal);
    return isValid(parsedDate) ? parsedDate : undefined;
  }
}

export class MerchantInfo extends BaseLeadInfo {
  address_line_1: string;
  address_line_2: string;
  business_num: string;
  city: string;
  doing_business_as: string;
  equifax_file_number: string;
  incorporated_in: Province;
  industry: Industry
  name: string;
  operate_in: Province;
  phone_number: string;
  postal_code: string;
  referrer: string;
  self_attested_date_established: Date;
  state_province: string;

  constructor(lead: Lead, attributes: LeadAttributes) {
    super();
    this.parseBusiness(lead, attributes);
  }

  private parseBusiness(lead: Lead, attributes: LeadAttributes): void {
    this.address_line_1 = attributes?.merchant_address_line_1;
    this.address_line_2 = attributes?.merchant_address_line_2;
    this.business_num = attributes?.merchant_business_number;  // (Key renamed)
    this.city = attributes?.merchant_city;
    this.doing_business_as = attributes?.merchant_doing_business_as;
    this.equifax_file_number = attributes?.merchant_equifax_file_number; // Unused
    this.incorporated_in = asProvince(attributes?.merchant_jurisdiction); // (Key renamed)
    this.industry = asIndustry(attributes?.merchant_industry);
    this.name = lead?.merchant_name;
    this.operate_in = asProvince(attributes?.merchant_operate_in);                    // Artifact
    this.phone_number = this.sanitizePhoneNumber(attributes?.merchant_phone_number);
    this.postal_code = attributes?.merchant_postal_code;
    this.referrer = attributes?.merchant_referrer;                      // Unused
    this.self_attested_date_established = attributes?.merchant_self_attested_date_established ?
      this.sanitizeDate(attributes.merchant_self_attested_date_established) : undefined;
    this.state_province = asProvince(attributes?.merchant_state_province);
  }
}

export class ApplicantInfo extends BaseLeadInfo {
  address_line_1: string;
  address_line_2: string;
  city: string;
  date_of_birth: Date;
  email: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  owner_since: Date;
  phone_number: string;
  postal_code: string;
  state_province: string;
  suffix: string;

  constructor(lead: Lead, attributes: LeadAttributes) {
    super();
    this.parseApplicant(lead, attributes);
  }

  private parseApplicant(lead: Lead, attributes: LeadAttributes): void {
    this.address_line_1 = attributes?.applicant_address_line_1;
    this.address_line_2 = attributes?.applicant_address_line_2;
    this.city = attributes?.applicant_city;
    this.date_of_birth = (attributes?.applicant_date_of_birth) ? parse(attributes.applicant_date_of_birth, dd_MM_yyyy_FORMAT, new Date()) : undefined;
    this.email = lead?.applicant_email;
    this.first_name = lead?.applicant_first_name;
    this.last_name = lead?.applicant_last_name;
    this.middle_name = attributes?.applicant_middle_name;
    this.owner_since = (attributes?.applicant_owner_since) ? parse(attributes.applicant_owner_since, dd_MM_yyyy_FORMAT, new Date()) : undefined;
    this.phone_number = this.sanitizePhoneNumber(attributes?.applicant_phone_number);
    this.postal_code = attributes?.applicant_postal_code;
    this.state_province = asProvince(attributes?.applicant_state_province);
    this.suffix = attributes?.applicant_suffix;
  }
}
