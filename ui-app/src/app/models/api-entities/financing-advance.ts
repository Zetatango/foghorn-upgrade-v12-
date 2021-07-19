import { Currency } from './utility';

/** @deprecated Belong to the remittance based, old WCA product implementation.
 * Also referred to as MCA: Merchant Capital Advance or flex loan)
 */
export interface FinancingAdvance {
  id: string;
  state: FinancingAdvanceState;
  application_id: string;
  merchant_id: string;
  merchant_account_id: string;
  currency: Currency;
  terms: string;

  advance_amount: number;
  factor_rate: number;
  remittance_rate: number;
  factor_amount: number;
  advance_remitted_amount: number;
  factor_remitted_amount: number;
  advance_remaining_amount: number;
  factor_remaining_amount: number;
  est_time_to_repay: number;

  activated_at: string;
  advance_sent_at: string;
  advance_deposited_at: string;
  advance_completed_at: string;
  first_remittance_at: string;
}

/** @deprecated Belong to the remittance based, old WCA product implementation.
 * Also referred to as MCA: Merchant Capital Advance or flex loan)
 */
export enum FinancingAdvanceState {
  pending = 'pending',
  remitting = 'remitting',
  last_remittance = 'last_remittance',
  complete = 'complete'
}

