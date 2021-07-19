import { Transaction } from 'app/models/api-entities/transaction';
import { OrderDirection } from 'app/models/datatables';

export interface TransactionList {
  transactions: Transaction[];
  limit: number;
  offset: number;
  total_count: number;
  filtered_count: number;
  order_by: string;
  order_direction: OrderDirection;
}

export interface TransactionDatatableParams {
  offset: number;
  limit: number;
  order_by?: string;
  order_direction?: OrderDirection;
}

export const DEFAULT_DATATABLE_PAGE_LENGTH = 25;

export const TransactionDatatableParamsDefaults: TransactionDatatableParams = {
  offset: 0,
  limit: DEFAULT_DATATABLE_PAGE_LENGTH
};
