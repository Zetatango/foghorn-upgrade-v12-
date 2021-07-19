import * as Factory from 'factory.ts';
import { CustomUploaderOptions } from 'app/models/custom-uploader-options';
import { UploadedDocumentDestination } from 'app/models/api-entities/file-storage';

/********************************* FACTORIES **********************************/

export const uploaderOptionsFactory = Factory.makeFactory<CustomUploaderOptions>({
  autoUpload: true,
  destination: UploadedDocumentDestination.ZETATANGO,
  messageSupport: false,
  requireDocumentType: false,
  uploader: {
    concurrency: 1
  }
});
