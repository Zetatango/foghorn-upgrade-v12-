import { OrderDirection } from 'app/models/datatables';

export interface DatatablesRequestParameters {
  filter: string;
  limit: number;
  offset: number;
  order_by: string;
  order_direction: OrderDirection;
}
