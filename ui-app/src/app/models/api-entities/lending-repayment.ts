import { Currency, RepaymentSchedule } from './utility';

export interface LendingRepayment {
  id: string;
  state: LendingRepaymentState;
  ubl_id: string;
  merchant_account_id: string;
  currency: Currency;
  repayment_amount: number;
  repayment_requested_for: string;
  repayment_schedule: RepaymentSchedule;
}

export enum LendingRepaymentState {
  pending = 'pending',
  transferring = 'transferring',
  transferred = 'transferred',
  failed = 'failed',
  nsf_unresolved = 'NSF (UNRESOLVED)',
  nsf_resolved = 'NSF (RESOLVED)'
}

export const INCOMPLETE_REPAYMENT_STATES = [LendingRepaymentState.pending, LendingRepaymentState.transferring];

export const COMPLETED_REPAYMENT_STATES = [LendingRepaymentState.transferred];

export const FAILED_REPAYMENT_STATES = [LendingRepaymentState.failed];

export const NSF_REPAYMENT_STATES = [LendingRepaymentState.nsf_resolved, LendingRepaymentState.nsf_unresolved];
