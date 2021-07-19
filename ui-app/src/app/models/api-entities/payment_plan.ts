import { Currency, RepaymentSchedule } from './utility';

export interface PaymentPlan {
  activated_at: string;
  activation_date: string;
  activation_failed_at: string;
  actual_financed_amount: number;
  apr: number;
  created_at: string;
  currency: Currency;
  duration: string;
  estimated_interest_amount: number;
  estimated_repayment_amount: number;
  frequency: RepaymentSchedule;
  id: string;
  merchant_cancelled_at: string;
  merchant_id: string;
  original_invoice_amount: number;
  partner_id: string;
  scheduled_at: string;
  state: PaymentPlanState;
  unscheduled_at: string;
  updated_at: string;
  ztt_rejected_at: string;
  term: string;
}

export enum PaymentPlanState {
  activated = 'activated',
  activating = 'activating',
  cancelled = 'cancelled',
  completed = 'completed',
  failed = 'failed',
  in_progress = 'in_progress',
  pending = 'pending',
  rejected = 'rejected',
  scheduled = 'scheduled',
  unscheduled = 'unscheduled'
}
