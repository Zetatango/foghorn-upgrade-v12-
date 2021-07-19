import { OrderDirection } from 'app/models/datatables';
import { startOfMonth, sub } from 'date-fns';

export const MERCHANT_DOCUMENTS_PAGE_LENGTH = 10;
export const MERCHANT_DOCUMENTS_DATE_RANGE = 12;
export const MERCHANT_DOCUMENTS_START_DATE = startOfMonth(sub(new Date(), {months: MERCHANT_DOCUMENTS_DATE_RANGE})) as Date;

export interface MerchantDocumentsQuery {
  offset: number;
  limit: number;
  order_by: string;
  order_direction: OrderDirection;
  upload_start_time: Date;
}
