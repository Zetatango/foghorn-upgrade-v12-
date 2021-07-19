import * as Factory from 'factory.ts';
import { PaymentPlan, PaymentPlanState } from 'app/models/api-entities/payment_plan';
import { Currency, RepaymentSchedule } from 'app/models/api-entities/utility';

/********************************* FACTORIES **********************************/

export const paymentPlanFactory = Factory.Sync.makeFactory<PaymentPlan>({
  activated_at: '2019-01-01',
  activation_date: '2019-01-01',
  activation_failed_at: '',
  actual_financed_amount: 500.00,
  apr: 0.37,
  created_at: '2019-01-01',
  currency: Currency.CAD,
  duration: '90',
  estimated_interest_amount: 25.00,
  estimated_repayment_amount: 525.00,
  frequency: RepaymentSchedule.daily,
  id: 'bppp_1234',
  merchant_cancelled_at: '',
  merchant_id: 'm_1234',
  original_invoice_amount: 500.00,
  partner_id: 'p_1234',
  scheduled_at: '2019-01-01',
  state: PaymentPlanState.pending,
  unscheduled_at: '',
  updated_at: '2019-01-01',
  ztt_rejected_at: '',
  term: ''
});
