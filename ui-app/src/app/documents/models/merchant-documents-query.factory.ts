import { OrderDirection } from 'app/models/datatables';
import * as Factory from 'factory.ts';
import { MerchantDocumentAttributes } from 'app/documents/models/merchant-document';
import {
  MERCHANT_DOCUMENTS_PAGE_LENGTH,
  MERCHANT_DOCUMENTS_START_DATE,
  MerchantDocumentsQuery
} from 'app/documents/models/merchant-documents-query';

export const merchantDocumentsQueryFactory = Factory.Sync.makeFactory<MerchantDocumentsQuery>({
  offset: 0,
  limit: MERCHANT_DOCUMENTS_PAGE_LENGTH,
  order_by: MerchantDocumentAttributes.uploaded_at,
  order_direction: OrderDirection.descending,
  upload_start_time: MERCHANT_DOCUMENTS_START_DATE
});
