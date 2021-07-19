import { Campaign } from 'app/models/api-entities/campaign';
import { Country, DateString } from 'app/models/api-entities/utility';
import { Province } from 'app/models/province';


/** Response from POST /merchants
 *                GET  /merchants
 *                GET  /merchant
 *                POST /merchant_queries/{query_id}/select
 */
export interface Merchant {
  address: string;
  address_line_1: string;
  address_line_2?: string;
  bank_connection_required: boolean;
  business_num: string;
  campaigns: Array<Campaign>;
  city: string;
  country: Country;
  desired_bank_account_balance: number;
  doing_business_as: string;
  email: string;
  endorsing_partner_id: string;
  id: string;
  incorporated_in: Province; // Jurisdiction // TODO [Val] -type- annotate
  kyc_verified: KycVerified;
  name: string;
  /** @deprecated operate_in is along unused attribute. */
  operate_in: Province;
  partner_id: string;
  partner_merchant_id: string;
  postal_code: string;
  quickbooks_imported_at: DateString;
  quickbooks_realm_id: string;
  quickbooks_state: QuickBooksState;
  selected_bank_account: string;
  selected_sales_volume_account_details?: BankAccountDetails;
  selected_insights_bank_accounts: Array<string>;
  selected_insights_bank_accounts_details?: Array<BankAccountDetails>;
  selected_sales_volume_accounts: Array<string>;
  state_province: string; // Province // TODO [Val] -type- annotate
  total_remaining_payment_amount: number;
  total_remaining_repayment_amount: number;
  delinquent: boolean;
  marketing_qualified_lead?: boolean;
}

/**
 * Body for POST /merchants
 */
export interface MerchantPost {
  name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  country: Country;
  postal_code: string;
  state_province: string; // Province // TODO [Val] -type- annotate=
  phone_number?: string;
  industry?: string;
  business_num?: string;
  email?: string;
  incorporated_in?: string; // Jurisdiction // TODO [Val] -type- annotate
  doing_business_as?: string;
  owner_since?: string;
  lead_guid?: string;
  self_attested_date_established: string;
  self_attested_average_monthly_sales: number;
  /** @deprecated In the SwaggerAPI but should not be posted. */
  avg_monthly_sales?: number;
  /** @deprecated In the SwaggerAPI but should not be posted. */
  partner_merchant_id?: string;
  /** @deprecated In the SwaggerAPI but should not be posted. */
  onboarding?: boolean;
  /** @deprecated In the SwaggerAPI but should not be posted. */
  address?: string;
}

/**
 * Body for PUT /merchants
 */
export interface MerchantPut {
  id: string;
  business_num?: string;
  doing_business_as?: string;
  incorporated_in?: Province; // Jurisdiction; // TODO [Val] -type- annotate
  name?: string;

  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  country?: Country;
  postal_code?: string;
  state_province?: Province;

  desired_bank_account_balance?: number;

  /** @deprecated */
  kyc_verified?: KycVerified;
  /** @deprecated */
  quickbooks_refresh_token?: string;
  /** @deprecated */
  quickbooks_refresh_token_expires_at?: DateString;
  /** @deprecated */
  quickbooks_realm_id?: string;
  /** @deprecated */
  facebook_access_token?: string;
  /** @deprecated */
  facebook_access_token_expires_at?: DateString;
}

export interface BankAccountDetails {
  id: string;
  institution_name: string;
  masked_account_number: string;
  flinks_account_uuid: string;
}

export interface EditBusinessFormData {
  name: string;
  doing_business_as: string;
  business_num?: string;
  incorporated_in?: Province; // Jurisdiction; // TODO [Val] -type- annotation
}

export interface EditAddressFormData {
  address_line_1: string;
  city: string;
  postal_code: string;
  state_province: string; // Province; // TODO [Val] -type- annotation
}

export interface KycVerified {
  status: KycCheckStatus;
  date_last_verified: string;
  details: Array<KycCheck>;
}

export interface KycCheck {
  check: KycCheckType;
  status: KycCheckStatus;
  date_last_verified: string;
  guid: string;
  reason_code: KycCheckReasonCode;
}

export enum KycCheckType {
  COE = 'confirmation_of_existence', // Confirmation of existence of a business (~ merchant).
  IV = 'identity_verification',      // Verification that the applicant matches a real individual.
  IA = 'authentication',             // Authenticate the user providing the applicant information as the real individual.
  WLV = 'watch_list_verification',   // Verification that the individual (~ applicant) is not on any watchlists.
  OV = 'owner_verification'          // Verification that the individual (~ applicant) the owner of the business (~ merchant).
}

export enum KycCheckStatus {
  unverified = 'unverified',
  verified = 'verified',
  failed = 'failed',
  in_progress = 'in_progress'
}

export enum QuickBooksState {
  notConnected = 'not_connected',
  connected = 'connected',
  aboutToExpire = 'about_to_expire'
}

/** @TODO ReasonCode number to be filled for nameMismatch, addressMismatch, cancelled */
export enum KycCheckReasonCode {
  noMatch = 1000,
  nameMismatch,
  addressMismatch,
  cancelled
}
