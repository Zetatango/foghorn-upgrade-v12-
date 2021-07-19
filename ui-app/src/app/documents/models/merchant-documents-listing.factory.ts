import { MerchantDocumentAttributes } from 'app/documents/models/merchant-document';
import { MERCHANT_DOCUMENTS_PAGE_LENGTH } from 'app/documents/models/merchant-documents-query';
import { merchantDocumentFactory } from 'app/documents/models/merchant-document.factory';
import { OrderDirection } from 'app/models/datatables';
import * as Factory from 'factory.ts';
import { MerchantDocumentsListing } from 'app/documents/models/merchant-documents-listing';

const merchantDocuments = merchantDocumentFactory.buildList(MERCHANT_DOCUMENTS_PAGE_LENGTH + 1);

export const merchantDocumentsListingFactory = Factory.Sync.makeFactory<MerchantDocumentsListing>({
  filter: '',
  filtered_count: merchantDocuments.length,
  limit: MERCHANT_DOCUMENTS_PAGE_LENGTH,
  merchant_documents: merchantDocuments,
  offset: 0,
  order_by: MerchantDocumentAttributes.uploaded_at,
  order_direction: OrderDirection.descending,
  total_count: merchantDocuments.length
});
