import { Supplier } from './supplier';
import { Currency } from './utility';

export interface DirectPayment {
  id: string;
  correlation_type: string;
  correlation_id: string;
  amount: number;
  currency: Currency;
  state: DirectPaymentState;
  memo: string;
  business_partner_invoice_entity: InvoiceSummary;
  bank_account_entity: BankAccountSummary;
  agreement_entity?: AgreementSummary;
}

export interface DirectPaymentFee extends DirectPayment {
  fee: number;
  promoFee: number;
}

export interface InvoiceSummary {
  id: string;
  invoice_number: string;
  account_number: string;
  amount: number;
  amount_paid: number;
  last_paid_at: string;
  status: string;
  supplier_entity: Supplier;
  due_date: string;
  sent_at: string;
}

export interface BankAccountSummary {
  id: string;
  name: string;
  account_type: string;
  institution_number: string;
  transit_number: string;
  account_number: string;
  verified: string;
}

export interface AgreementSummary {
  id: string;
  accepted: boolean;
}

export enum DirectPaymentState {
  complete = 'complete',
  funds_obtained = 'funds_obtained',
  obtain_funds_failed = 'obtain_funds_failed',
  obtaining_funds = 'obtaining_funds',
  payment_completed = 'payment_completed',
  payment_failed = 'payment_failed',
  pending = 'pending',
  sending_payment = 'sending_payment'
}
