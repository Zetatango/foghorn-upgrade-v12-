import { Invoice } from 'app/models/api-entities/invoice';
import { OrderDirection } from 'app/models/datatables';

export interface InvoiceList {
  business_partner_invoices: Invoice[];
  limit: number;
  offset: number;
  total_count: number;
  filtered_count: number;
  order_by: string;
  order_direction: OrderDirection;
}

export interface InvoiceDatatableParams {
  offset: number;
  limit: number;
  order_by?: string;
  order_direction?: OrderDirection;
  filter?: string;
}

export const DEFAULT_DATATABLE_PAGE_LENGTH = 25;

export const InvoiceDatatableParamsDefaults: InvoiceDatatableParams = {
  offset: 0,
  limit: DEFAULT_DATATABLE_PAGE_LENGTH
};
