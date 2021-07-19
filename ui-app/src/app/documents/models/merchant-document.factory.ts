import * as Factory from 'factory.ts';
import  * as crype from 'crypto-js';
import { MerchantDocument } from 'app/documents/models/merchant-document';
import { DocumentCode } from 'app/models/api-entities/merchant-document-status';

const merchant_guid = `m_${crype.lib.WordArray.random(8).toString(crype.enc.Hex)}`;
const partner_guid = `p_${crype.lib.WordArray.random(8).toString(crype.enc.Hex)}`;
const current_date = new Date().toISOString();

export const merchantDocumentFactory = Factory.Sync.makeFactory<MerchantDocument>({
  created_at: current_date,
  doc_type: DocumentCode.uploaded_bank_statements,
  id: `md_${crype.lib.WordArray.random(8).toString(crype.enc.Hex)}`,
  merchant_id: merchant_guid,
  org_doc_name: 'acme_banking_docs.pdf',
  partner_id: partner_guid,
  source_guid: merchant_guid,
  uploaded_at: current_date,
  uploaded_by: 'Alice Merchant (alice.merchant@email.ca)'
});
