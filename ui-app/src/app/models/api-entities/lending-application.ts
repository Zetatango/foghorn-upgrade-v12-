import { LendingOfflinePayout } from 'app/models/api-entities/lending-offline-payout';
import { LendingTerm } from 'app/models/api-entities/lending-term';
import { MerchantDocumentStatus } from 'app/models/api-entities/merchant-document-status';
import { ApplicationState, Currency, RepaymentSchedule, TermUnit } from './utility';

export interface LendingApplication {
  // generic application attributes
  id: string;
  state: ApplicationState;
  merchant_id: string;
  offer_id: string;
  terms: string;
  currency: Currency;
  fee: number;
  merchant_user_email: string;
  merchant_user_id: string;
  expires_at: string;
  cancellation_reason: string;
  ztt_approved_at: string;
  applied_at: string;
  pad_terms_agreed_at: string;
  laas_approved_at: string;
  client_ip_address: string;
  // lending application specific attributes
  loan_id: string;
  principal_amount: number;
  apr: number;
  repayment_schedule: RepaymentSchedule;
  loan_term: number;
  term_duration: number;
  term_unit: TermUnit;
  available_terms: LendingTerm[];
  ubl_terms_agreed_at: string;
  payee_account_id: string;
  payor_account_id: string;
  payee_id: string;
  payee_name?: string;
  payee_account_num: string;
  payee_invoice_num: string;
  terms_signature_required: boolean;
  required_documents: MerchantDocumentStatus[];
  requires_guarantor: boolean;
  repayment_amount: number;
  contract_repayment_amount: number;
  requested_amount: number;
  max_principal_amount: number;
  offline_payouts: LendingOfflinePayout[];
}

export interface LendingApplicationFee {
  application_id: string;
  fee: number;
  principal_amount: number;
  currency: Currency;
  loan_term: LendingTerm;
  repayment_amount: number;
}

/**
 * These state arrays are used to determine where in the lending application flow the user should be directed.
 */

// states AFTER CREATE + BEFORE APPROVAL
export const BEFORE_APPROVED_APP_STATES = [
  ApplicationState.pending,
  ApplicationState.waiting_for_documents,
  ApplicationState.reviewing
];

// states AFTER APPROVAL + BEFORE APPROVAL

export const APPROVED_APP_STATES = [
  ApplicationState.approving,
  ApplicationState.approved
];

// states AFTER ACCEPT + BEFORE COMPLETE
export const COMPLETING_APP_STATES = [
  ApplicationState.accepted,
  ApplicationState.hard_hitting,
  ApplicationState.kyc_verifying,
  ApplicationState.laasing,
  ApplicationState.completing
];

// states COMPLETED
export const COMPLETED_APP_STATES = [
  ApplicationState.completed
];

// states FAILED
export const FAILED_APP_STATES = [
  ApplicationState.kyc_failing,
  ApplicationState.kyc_failed,
  ApplicationState.hard_hit_failing,
  ApplicationState.hard_hit_failed
];

// states DECLINED
export const DECLINED_APP_STATES = [
  ApplicationState.declining,
  ApplicationState.declined
];

// states CANCELLED
export const CANCELLED_APP_STATES = [
  ApplicationState.cancelling,
  ApplicationState.cancelled
];

// states EXPIRED
export const EXPIRED_APP_STATES = [
  ApplicationState.expiring,
  ApplicationState.expired
];

// AGGREGATED STATES

// states AFTER CREATE + BEFORE ACCEPT (pre + post approval)
export const INCOMPLETE_APP_STATES = BEFORE_APPROVED_APP_STATES.concat(APPROVED_APP_STATES);

// state superset AFTER CREATE + BEFORE COMPLETED/FAILED
export const IN_PROGRESS_APP_STATES = COMPLETING_APP_STATES.concat(INCOMPLETE_APP_STATES);

// state superset of stale applications
export const DISREGARDED_APP_STATES = DECLINED_APP_STATES.concat(CANCELLED_APP_STATES, EXPIRED_APP_STATES);

// all application states
export const ALL_APP_STATES = Object.values(ApplicationState);
