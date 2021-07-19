import { UploadFile } from 'ngx-uploader';
import { DocumentCode } from 'app/models/api-entities/merchant-document-status';

export interface CustomUploadFile extends UploadFile {
  documentType?: DocumentCode;
  error?: boolean;
}
