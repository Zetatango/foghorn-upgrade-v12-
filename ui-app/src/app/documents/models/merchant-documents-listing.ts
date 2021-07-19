import { MerchantDocument } from 'app/documents/models/merchant-document';
import { OrderDirection } from 'app/models/datatables';

export interface MerchantDocumentsListing {
  filter: string;
  filtered_count: number;
  limit: number;
  merchant_documents: MerchantDocument[];
  offset: number;
  order_by: string;
  order_direction: OrderDirection;
  total_count: number;
}
