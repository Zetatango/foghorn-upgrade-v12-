import { DocumentCode } from 'app/models/api-entities/merchant-document-status';

export enum MerchantDocumentAttributes {
  uploaded_at = 'uploaded_at',
  org_doc_name = 'org_doc_name',
  doc_type = 'doc_type'
}

export interface MerchantDocument {
  created_at: string;
  doc_type: DocumentCode;
  id: string;
  merchant_id: string;
  org_doc_name: string;
  partner_id: string;
  source_guid: string;
  uploaded_at: string;
  uploaded_by: string;
}
