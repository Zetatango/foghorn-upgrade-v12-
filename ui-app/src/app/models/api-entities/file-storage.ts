export interface FilePayload {
  file_id: string;
  document_type: string;
}

export interface SubmitDocsPayload {
  source_guid: string;
  destination: UploadedDocumentDestination;
}

export enum UploadedDocumentDestination {
  WILE_E = 'kyc',
  ZETATANGO = 'zetatango'
}
