import { TrackedObjectState } from 'app/models/tracked-object-state';
import { BusinessPartnerMerchant } from './business-partner-customer-summary';
import { DirectPayment } from './direct-payment';
import { PaymentPlan, PaymentPlanState } from './payment_plan';
import { Supplier } from './supplier';
import { Currency, RepaymentSchedule } from './utility';

export interface Invoice {
  id: string;
  invoice_number: string;
  account_number: string;
  amount: number;
  processing_amount: number;
  amount_paid: number;
  sender_id: string;
  receiver_entity: BusinessPartnerMerchant;
  supplier_entity: Supplier;
  status: InvoiceStatus;
  merchant_document_id: string;
  tracked_object_id: string;
  last_paid_at: string;
  last_event: TrackedObjectState;
  last_event_at: string;
  display_status?: string;
  due_date: string;
  direct_payments: DirectPayment[];
  paf_activation_date: string;
  payment_plan_entity: PaymentPlan;
  sent: boolean;
  sent_to?: string;
  quickbooks_invoice_id?: string;
  displayStatus?: string;
}

export enum InvoiceStatus {
  unpaid = 'unpaid',
  partially = 'partially',
  paid = 'paid',
  overpaid = 'overpaid',
  processing = 'processing'
}

export const emptyBorrowerInvoice: Invoice = {
  id: '',
  invoice_number: '',
  account_number: '',
  amount: 0,
  processing_amount: 0,
  amount_paid: 0,
  sender_id: '',
  receiver_entity: {
    id: '',
    name: '',
    linked_merchants: [],
    last_event: null,
    last_event_at: '',
    tracked_object_id: '',
    email: '',
    sign_up_name: '',
    sign_up_email: '',
    auto_send: false,
    quickbooks_customer_id: ''
  },
  supplier_entity: {
    id: '',
    name: '',
    is_business_partner: true
  },
  status: InvoiceStatus.unpaid,
  merchant_document_id: '',
  tracked_object_id: '',
  last_paid_at: null,
  last_event: null,
  last_event_at: '',
  due_date: null,
  direct_payments: [],
  paf_activation_date: '',
  quickbooks_invoice_id: '',
  sent: true,
  sent_to: '',
  payment_plan_entity: {
    activated_at: '',
    activation_date: '',
    activation_failed_at: '',
    actual_financed_amount: 0.00,
    apr: 0.00,
    created_at: '',
    currency: Currency.CAD,
    duration: '',
    estimated_interest_amount: 0.00,
    estimated_repayment_amount: 0.00,
    frequency: RepaymentSchedule.daily,
    id: '',
    merchant_cancelled_at: '',
    merchant_id: '',
    original_invoice_amount: 0.00,
    partner_id: '',
    scheduled_at: '',
    state: PaymentPlanState.pending,
    unscheduled_at: '',
    updated_at: '',
    ztt_rejected_at: '',
    term: ''
  }
};

export const PAYABLE_STATES = [
  InvoiceStatus.unpaid,
  InvoiceStatus.processing,
  InvoiceStatus.partially
];
