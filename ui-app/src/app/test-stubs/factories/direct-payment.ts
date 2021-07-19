import * as Factory from 'factory.ts';
import { DirectPaymentPost } from 'app/models/api-entities/direct-payment-post';
import {
  AgreementSummary,
  BankAccountSummary,
  DirectPaymentState,
  InvoiceSummary,
  DirectPaymentFee
} from 'app/models/api-entities/direct-payment';
import { Supplier} from 'app/models/api-entities/supplier';
import { Currency } from 'app/models/api-entities/utility';

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
const suppResp: Supplier = {
  id: '123',
  name: 'Borrower Merchant 1',
  is_business_partner: true
};

/** @deprecated Prefer factories instead. */
const bankResp: BankAccountSummary = {
  id: 'ba_123',
  name: 'test bank account',
  account_type: 'Chequing',
  institution_number: '003',
  transit_number: '00412',
  account_number: '343212',
  verified: 'true'
};

/** @deprecated Prefer factories instead. */
const bpivResponse: InvoiceSummary = {
  id: 'bpiv_nFyBMiPnAmCTq5q4',
  invoice_number: '1DRCHSo56BxAFuqX',
  account_number: 'otxPTXpBdSBNu2ZW',
  amount: 2699.60,
  amount_paid: 0.0,
  due_date: '',
  sent_at: '',
  last_paid_at: null,
  status: 'processing',
  supplier_entity: suppResp
};

/** @deprecated Prefer factories instead. */
const agreeResp: AgreementSummary = {
  id: 'pag_123',
  accepted: true
};

/********************************* FACTORIES **********************************/

export const directPaymentPostFactory = Factory.Sync.makeFactory<DirectPaymentPost>({
  merchant_id: 'm_123456',
  invoice_id: 'bpiv_123456',
  amount: 1234.00
});

export const directPaymentPostWithoutInvoiceFactory = Factory.Sync.makeFactory<DirectPaymentPost>({
  merchant_id: 'm_123456',
  amount: 1234.00,
  invoice_number: '666',
  payee_id: 'su_123456'
});

export const supplierResponseFactory = Factory.Sync.makeFactory<Supplier>( {
  id: '123',
  name: 'Borrower Merchant 1',
  is_business_partner: true
});

export const directPaymentResponseFactory = Factory.Sync.makeFactory<DirectPaymentFee>({
  id: 'dp_123456',
  correlation_type: 'BusinessPartner::Invoice',
  correlation_id: 'bpiv_123456',
  amount: 1234.00,
  currency: Currency.CAD,
  memo: 'memo for direct payment',
  state: DirectPaymentState.pending,
  business_partner_invoice_entity: bpivResponse,
  bank_account_entity: bankResp,
  agreement_entity: agreeResp,
  fee: 2,
  promoFee: -2
});
