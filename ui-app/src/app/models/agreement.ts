export interface Agreement {
  id: string;
  content: string;
  type: AgreementType;
  accepted_at: string;
  opt_out_at: string;
  declined_at: string;
  merchant_id: string;
  business_partner_id: string;
  partner_id: string;
  user_id: string;
  accepted_ip_address: string;
  opt_out_ip_address: string;
  declined_ip_address: string;
  state: AgreementState;
}

export enum AgreementType {
  pre_authorized_debit = 'PAD',
  pre_authorized_financing = 'PAF',
  business_partner = 'BUSINESS_PARTNER',
  unsecured_business_loan = 'UNSECURED_BUSINESS_LOAN'
}

export enum AgreementState {
  completed = 'completed',
  declined = 'declined',
  opted_out = 'opted_out',
  pending = 'pending'
}
