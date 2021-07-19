import { LendingTerm } from 'app/models/api-entities/lending-term';
import { RepaymentSchedule } from './utility';

export interface LendingApplicationPost {
  // merchant_id: string; // Provided server-side
  offer_id: string;
  principal_amount: number;
  apr: number;
  repayment_schedule: RepaymentSchedule;
  merchant_user_email: string;
  merchant_user_id?: string;
  interest_amount: number;
  repayment_amount: number;
  loan_term?: LendingTerm;
  loan_term_id: string;

  payor_account_id?: string;
  payee_id?: string;
  payee_account_num?: string;
  payee_invoice_num?: string;
}
