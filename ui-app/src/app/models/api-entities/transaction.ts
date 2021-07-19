import { BankAccountSummary, DirectPaymentState } from 'app/models/api-entities/direct-payment';
import { Currency } from 'app/models/api-entities/utility';
import { Translation } from 'app/models/languages';

export enum TransactionState {
  pending = 'pending',
  requesting = 'requesting',
  requested = 'requested',
  progressing = 'progressing',
  in_progress = 'in_progress',
  fail_retry = 'fail_retry',
  completing = 'completing',
  success = 'success',
  error = 'error',
  verified = 'verified',
  verify_failed = 'verify_failed'
}

export const TRANSACTION_STATES = Object.values(TransactionState);

export enum PaymentDirection {
  on_behalf_of = 'on_behalf_of',
  credit = 'credit',
  debit = 'debit'
}

export interface Transaction {
  id: string;
  created_at: string;
  bank_account_info?: BankAccountSummary;
  amount: number;
  currency: Currency;
  direction: PaymentDirection;
  state: TransactionState;
  request_sent_at: string;
  request_started_at: string;
  success_at?: string;
  error_at?: string;
  last_failure_at?: string;
  invoice_id?: string;
  invoice_number?: string;
  merchant_id: string;
  merchant_name: string;
  supplier_id?: string;
  supplier_name?: string;
  ubl_id?: string;
  ubl_reference_number?: string;
  direct_payment_id?: string;
  direct_payment_state?: DirectPaymentState;
  offline_entity_name?: string;
  description?: Translation;
}
