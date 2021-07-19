export interface BusinessPartnerApplication {
  id: string;
  merchant_id: string;
  partner_theme_id: string;
  state: BusinessPartnerApplicationState;
  terms: string;
  vanity: string;
}

export enum BusinessPartnerApplicationState {
  complete = 'complete',
  kyc_failed = 'kyc_failed',
  kyc_verifying = 'kyc_verifying',
  pending = 'pending',
  processing = 'processing'
}
