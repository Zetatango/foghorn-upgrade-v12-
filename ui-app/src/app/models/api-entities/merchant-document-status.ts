export enum DocumentState {
  required = 'required',
  collected = 'collected'
}

export enum DocumentCode {
  cra_tax_assessment = 'cra_tax_assessment',
  bank_statements = 'bank_statements',
  equifax_business = 'equifax_business',
  equifax_personal = 'equifax_personal',
  gst_hst_doc = 'gst_hst_doc',
  ppsa = 'ppsa',
  business_confirmation = 'business_confirmation',
  uploaded_bank_statements = 'uploaded_bank_statements',
  void_cheque = 'uploaded_void_cheques',
  gst_notice = 'uploaded_gst_notice',
  photo_identification = 'uploaded_photo_identification',
  notarized_documents = 'uploaded_notarized_documents',
  other_by_merchant = 'uploaded_other_by_merchant',
  business_partner_invoice = 'business_partner_invoice'
}

export interface MerchantDocumentStatus {
  code: DocumentCode;
  state: DocumentState;
}

/**
 * List of all possible document codes
 */
export const ALL_DOC_CODES = Object.values(DocumentCode);

export interface DocumentTypeOption {
  label: string;
  value: string;
}

export const DOC_SELECT_OPTIONS: DocumentTypeOption[] = [
  {
    value: DocumentCode.uploaded_bank_statements,
    label: 'DOCUMENT_TYPE.BANK_STATEMENTS'
  },
  {
    value: DocumentCode.void_cheque,
    label: 'DOCUMENT_TYPE.VOID_CHEQUE'
  },
  {
    value: DocumentCode.gst_notice,
    label: 'DOCUMENT_TYPE.GST_NOTICE'
  },
  {
    value: DocumentCode.photo_identification,
    label: 'DOCUMENT_TYPE.PHOTO_IDENTIFICATION'
  },
  {
    value: DocumentCode.notarized_documents,
    label: 'DOCUMENT_TYPE.NOTARIZED_DOCUMENTS'
  },
  {
    value: DocumentCode.other_by_merchant,
    label: 'DOCUMENT_TYPE.OTHER'
  }
];

export const BANKING_DOC_SELECT_OPTIONS: DocumentTypeOption[] = [
  {
    value: DocumentCode.uploaded_bank_statements,
    label: 'DOCUMENT_TYPE.BANK_STATEMENTS'
  },
  {
    value: DocumentCode.void_cheque,
    label: 'DOCUMENT_TYPE.VOID_CHEQUE'
  }
];

/**
 * List of document codes currently supported.
 */
export const SUPPORTED_DOC_CODES = [DocumentCode.cra_tax_assessment];
