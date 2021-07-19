import { UploadedDocumentDestination } from 'app/models/api-entities/file-storage';
import { DocumentCode } from 'app/models/api-entities/merchant-document-status';
import { UploaderOptions } from 'ngx-uploader';

export interface CustomUploaderOptions {
  autoUpload: boolean;
  destination: UploadedDocumentDestination;
  documentType?: DocumentCode;
  messageSupport: boolean;
  requireDocumentType: boolean;
  source_guid?: string;
  uploader: UploaderOptions;
}
