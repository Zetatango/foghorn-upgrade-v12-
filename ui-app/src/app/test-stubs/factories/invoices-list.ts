import * as Factory from 'factory.ts';
import { InvoiceDatatableParams, DEFAULT_DATATABLE_PAGE_LENGTH } from 'app/models/api-entities/invoice-list';
import { OrderDirection } from 'app/models/datatables';

/********************************* FACTORIES **********************************/

export const invoiceDtParamsFactory = Factory.Sync.makeFactory<InvoiceDatatableParams>({
  offset: 0,
  limit: DEFAULT_DATATABLE_PAGE_LENGTH
});

export const sampleInvoiceDatatableParams: InvoiceDatatableParams = invoiceDtParamsFactory.build({
  order_by: 'amount',
  order_direction: OrderDirection.ascending,
  filter: 'dundee'
});

export const sampleInvoiceDatatableParamsWithoutFilter: InvoiceDatatableParams = invoiceDtParamsFactory.build({
  order_by: 'amount',
  order_direction: OrderDirection.ascending,
  filter: null
});
