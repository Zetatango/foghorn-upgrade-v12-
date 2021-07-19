import { LendingTerm } from 'app/models/api-entities/lending-term';
import { Currency, RepaymentSchedule } from './utility';

export interface Ubl {
  id: string;
  state: UblState;
  application_id: string;
  merchant_id: string;
  merchant_account_id: string;
  terms: string;
  currency: Currency;
  principal_amount: number;
  interest_amount: number;
  apr: number;
  loan_term: LendingTerm;
  repayment_schedule: RepaymentSchedule;
  activated_at: string;
  loan_sent_at: string;
  loan_deposited_at: string;
  fully_repaid_at: string;
  first_repayment_at: string;
  next_repayment_amount: number;
  next_repayment_at: string;
  loan_status: string;
}

export enum UblState {
  pending = 'pending', // when UBL is created
  in_progress = 'in_progress', // when EFT is in progress but money has not landed
  repaying = 'repaying', // when EFT is complete
  last_repayment = 'last_repayment', // when UBL is one payment away from being paid in full
  complete = 'complete' // when UBL has been repaid in full
}

export const INCOMPLETE_UBL_STATES = [UblState.pending, UblState.in_progress];

export const COMPLETING_UBL_STATES = [UblState.repaying, UblState.last_repayment];

export const COMPLETED_UBL_STATES = [UblState.complete];
