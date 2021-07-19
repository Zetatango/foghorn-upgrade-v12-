import * as Factory from 'factory.ts';
import { CustomUploadFile } from 'app/models/custom-upload-file';
import { DocumentCode } from 'app/models/api-entities/merchant-document-status';

export const MAX_FILE_MOCK_SIZE = 1000000;

/********************************* FACTORIES **********************************/

export const uploadFileFactory = Factory.makeFactory<CustomUploadFile>({
  id: '1',
  name: 'Notice Of Assessment',
  fileIndex: 0,
  size: 1024,
  lastModifiedDate: new Date(),
  type: 'image/png',
  form: new FormData(),
  progress: {
    data: {
      endTime: null,
      eta: null,
      etaHuman: null,
      percentage: 0,
      speed: 0,
      speedHuman: '0 Byte/s',
      startTime: null
    },
    status: 0
  },
  documentType: DocumentCode.bank_statements,
  nativeFile: new File([], 'Notice Of Assessment')
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const uploadFileEnqueued = uploadFileFactory.build();

/** @deprecated Prefer factories instead. */
export const uploadFileInProgress = uploadFileFactory.build({
  progress: {
    data: {
      endTime: null,
      eta: null,
      etaHuman: null,
      percentage: 50,
      speed: 0,
      speedHuman: '0 Byte/s',
      startTime: null
    },
    status: 1 // Uploading
  }
});

/** @deprecated Prefer factories instead. */
export const uploadFileProgressDone = uploadFileFactory.build({
  progress: {
    data: {
      endTime: null,
      eta: null,
      etaHuman: null,
      percentage: 100,
      speed: 0,
      speedHuman: '0 Byte/s',
      startTime: null
    },
    status: 2 // Done
  },
  responseStatus: 200
});

/** @deprecated Prefer factories instead. */
export const uploadFileProgressError = uploadFileFactory.build({
  progress: {
    data: {
      endTime: null,
      eta: null,
      etaHuman: null,
      percentage: 100,
      speed: 0,
      speedHuman: '0 Byte/s',
      startTime: null
    },
    status: 2 // Done
  },
  responseStatus: 422
});

/** @deprecated Prefer factories instead. */
export const uploadFileProgressCancelled = uploadFileFactory.build({
  progress: {
    data: {
      endTime: null,
      eta: null,
      etaHuman: null,
      percentage: 100,
      speed: 0,
      speedHuman: '0 Byte/s',
      startTime: null
    },
    status: 3 // Cancelled
  }
});

/** @deprecated Prefer factories instead. */
export const uploadFileMissingDocumentType = uploadFileFactory.build({
  progress: {
    data: {
      endTime: null,
      eta: null,
      etaHuman: null,
      percentage: 0,
      speed: 0,
      speedHuman: '0 Byte/s',
      startTime: null
    },
    status: 0 // Queue
  },
  documentType: null
});

/** @deprecated Prefer factories instead. */
export const pdfFileMock = uploadFileFactory.build({
  type: 'application/pdf'
});

/** @deprecated Prefer factories instead. */
export const jpgFileMock = uploadFileFactory.build({
  type: 'image/jpg'
});

/** @deprecated Prefer factories instead. */
export const jpegFileMock = uploadFileFactory.build({
  type: 'image/jpeg'
});

/** @deprecated Prefer factories instead. */
export const pngFileMock = uploadFileFactory.build();

/** @deprecated Prefer factories instead. */
export const csvFileMock = uploadFileFactory.build({
  type: 'text/csv'
});

/** @deprecated Prefer factories instead. */
export const txtFileMock = uploadFileFactory.build({
  type: 'text/plain'
});

/** @deprecated Prefer factories instead. */
export const largeFileMock = (maxSize: number): CustomUploadFile => uploadFileFactory.build({
  size: maxSize + 1
});

/** @deprecated Prefer factories instead. */
export const negativeFileMock = uploadFileFactory.build({
  size: -1
});

/** @deprecated Prefer factories instead. */
export const gifFileMock = uploadFileFactory.build({
  type: 'image/gif'
});

/** @deprecated Prefer factories instead. */
export const unsupportedMediaTypeErrorFile = uploadFileFactory.build({
  responseStatus: 415,
  progress: {
    status: 2
  }
});

/** @deprecated Prefer factories instead. */
export const payloadTooLargeErrorFile = uploadFileFactory.build({
  responseStatus: 413,
  progress: {
    status: 2
  }
});

/** @deprecated Prefer factories instead. */
export const errorFile = uploadFileFactory.build({
  error: true
});
/** @deprecated Prefer factories instead. */
export const missingDocumentTypeFile = uploadFileFactory.build({
  documentType: undefined
});

/** @deprecated Prefer factories instead. */
export const uploadFileMockId3 = uploadFileFactory.build({
  id: '3'
});
