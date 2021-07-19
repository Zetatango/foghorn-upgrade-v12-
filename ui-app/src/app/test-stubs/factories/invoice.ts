import * as Factory from 'factory.ts';
import { emptyBorrowerInvoice, Invoice, InvoiceStatus } from 'app/models/api-entities/invoice';
import { InvoiceList } from 'app/models/api-entities/invoice-list';
import { OrderDirection } from 'app/models/datatables';
import { TrackedObjectState } from 'app/models/tracked-object-state';
import { businessPartnerMerchantFactory } from './business-partner-merchant';
import { ZttResponse } from 'app/models/api-entities/response';

/********************************* FACTORIES **********************************/

export const invoiceResponseFactory = Factory.Sync.makeFactory<Invoice>({
  account_number: '123',
  amount: 1234.00,
  processing_amount: 0.0,
  amount_paid: 0.0,
  last_paid_at: '2019-01-01',
  id: 'bpiv_1234567890',
  invoice_number: '321',
  last_event: TrackedObjectState.sent,
  last_event_at: '2019-01-01',
  sender_id: 'm_abc123',
  receiver_entity: businessPartnerMerchantFactory.build(),
  supplier_entity: {
    name: 'Supplier 1',
    id: 'su_789',
    is_business_partner: true
  },
  status: InvoiceStatus.unpaid,
  merchant_document_id: 'md_0987654321',
  tracked_object_id: 'obj_11111111',
  due_date: '2019-01-01',
  direct_payments: [],
  paf_activation_date: null,
  sent: true,
  sent_to: businessPartnerMerchantFactory.build().email,
  quickbooks_invoice_id: '',
  payment_plan_entity: null
});

export const invoiceResponseResponseFactory = Factory.Sync.makeFactory<ZttResponse<Invoice>>({
  status: 'SUCCESS',
  message: 'Loaded',
  data: invoiceResponseFactory.build()
});

export const invoiceListFactory = Factory.Sync.makeFactory<InvoiceList>({
  business_partner_invoices: [invoiceResponseFactory.build(), invoiceResponseFactory.build()],
  limit: 20,
  offset: 0,
  total_count: 2,
  filtered_count: 2,
  order_by: '',
  order_direction: OrderDirection.ascending
});

export const invoiceListResponseFactory = Factory.Sync.makeFactory<ZttResponse<InvoiceList>>({
  status: 'SUCCESS',
  message: 'Loaded',
  data: invoiceListFactory.build()
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const receivedBorrowerInvoices: InvoiceList = {
  business_partner_invoices: [invoiceResponseFactory.build(), invoiceResponseFactory.build()],
  limit: 20,
  offset: 0,
  total_count: 2,
  filtered_count: 2,
  order_by: '',
  order_direction: OrderDirection.ascending
};

/** @deprecated Prefer factories instead. */
export const emptyBorrowerInvoices: InvoiceList = {
  business_partner_invoices: [invoiceResponseFactory.build(), invoiceResponseFactory.build()],
  limit: 20,
  offset: 0,
  total_count: 2,
  filtered_count: 2,
  order_by: '',
  order_direction: OrderDirection.ascending
};

/** @deprecated Prefer factories instead. */
export const receivedMatchingBorrowerInvoices: InvoiceList = {
  business_partner_invoices: [invoiceResponseFactory.build()],
  limit: 1,
  offset: 0,
  total_count: 1,
  filtered_count: 1,
  order_by: 'created_at',
  order_direction: OrderDirection.descending
};

/** @deprecated Prefer factories instead. */
export const receivedNoMatchingBorrowerInvoices: InvoiceList = {
  business_partner_invoices: [],
  limit: 1,
  offset: 0,
  total_count: 1,
  filtered_count: 0,
  order_by: 'created_at',
  order_direction: OrderDirection.descending
};

/** @deprecated Prefer factories instead. */
export const multiStatusBorrowerInvoices: InvoiceList = {
  business_partner_invoices: [invoiceResponseFactory.build({status: InvoiceStatus.unpaid}),
                              invoiceResponseFactory.build({status: InvoiceStatus.processing}),
                              invoiceResponseFactory.build({status: InvoiceStatus.partially}),
                              invoiceResponseFactory.build({status: InvoiceStatus.paid}),
                              invoiceResponseFactory.build({status: InvoiceStatus.overpaid}),
                              invoiceResponseFactory.build({status: null})],
  limit: 20,
  offset: 0,
  total_count: 2,
  filtered_count: 2,
  order_by: '',
  order_direction: OrderDirection.ascending
};

/** @deprecated Prefer factories instead. */
export const borrowerInvoice: Invoice = invoiceResponseFactory.build();
/** @deprecated Prefer factories instead. */
export const blankBorrowerInvoice: Invoice = emptyBorrowerInvoice;

/** @deprecated Prefer factories instead. */
export const invoiceResponse = invoiceResponseFactory.build();
