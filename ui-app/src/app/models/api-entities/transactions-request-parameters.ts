import { OrderDirection } from 'app/models/datatables';

export interface TransactionsRequestParameters {
  offset: number;
  limit: number;
  order_by: string;
  order_direction: OrderDirection;
}
