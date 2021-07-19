import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { API_FILE_STORAGE } from 'app/constants';
import { FilePayload, SubmitDocsPayload, UploadedDocumentDestination } from 'app/models/api-entities/file-storage';
import { DocumentCode } from 'app/models/api-entities/merchant-document-status';
import { missingDocumentTypeFile } from 'app/test-stubs/factories/upload-file';
import { uploadOutputMock } from 'app/test-stubs/factories/upload-output';
import { CookieService } from 'ngx-cookie-service';
import { UploadInput } from 'ngx-uploader';
import { of, throwError } from 'rxjs';
import { take } from 'rxjs/internal/operators/take';
import { ConfigurationService } from './configuration.service';
import { CryptoService } from './crypto.service';
import { CACHE_URL, FileStorageService, UPLOAD_URL } from './file-storage.service';

import { DEFAULT_MIME_TYPES, IMAGE_MIME_TYPES, MimeType } from 'app/models/mime-types';
import { UtilityService } from './utility.service';
import { encryptionBundleResponseFactory } from 'app/test-stubs/factories/encryption-bundle';

describe('FileStorageService', () => {
  let fileStorageService: FileStorageService;
  let configurationService: ConfigurationService;
  let cryptoService: CryptoService;
  let httpMock: HttpTestingController;

  const destination = UploadedDocumentDestination.WILE_E;
  const documentType = DocumentCode.bank_statements;
  const inputFile = uploadOutputMock.file;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [
        ConfigurationService,
        CookieService,
        CryptoService,
        FileStorageService,
        UtilityService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    configurationService = TestBed.inject(ConfigurationService);
    cryptoService = TestBed.inject(CryptoService);
    fileStorageService = TestBed.inject(FileStorageService);

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });


  it('should be created', () => {
    expect(fileStorageService).toBeTruthy();
  });

  // API CALLS
  // ----------------------------------------------------------------------- removeFile()
  describe('removeFile()', () => {
    it('should be able to remove a file', () => {
      const removeFilePayloadMock: FilePayload = {
        file_id: '1',
        document_type: 'cra_tax_assessment'
      };
      fileStorageService.removeFile(removeFilePayloadMock).subscribe();

      const fileStorageRemoveRequest = httpMock.expectOne(API_FILE_STORAGE.REMOVE_FILE_PATH);
      expect(fileStorageRemoveRequest.request.method).toEqual('POST');
      fileStorageRemoveRequest.flush({ status: 200 });
    });

    it('should pass down an error to caller if request to remove a file returns an http error', () => {
      const removeFilePayloadMock: FilePayload = {
        file_id: '1',
        document_type: 'cra_tax_assessment'
      };
      fileStorageService.removeFile(removeFilePayloadMock)
        .pipe(take(1))
        .subscribe(
          () => fail('Prevented this unit test from failing silently'), // Nothing to check here, won't be reached
          (err) => expect(err.status).toEqual(500));

      const fileStorageRemoveRequest = httpMock.expectOne(API_FILE_STORAGE.REMOVE_FILE_PATH);
      expect(fileStorageRemoveRequest.request.method).toEqual('POST');
      fileStorageRemoveRequest.flush([], { status: 500, statusText: 'Internal Server Error' });
    });
  }); // describe - removeFile()

  // ----------------------------------------------------------------------- submitDocuments()
  describe('submitDocuments()', () => {
    it('should be able to submit documents', () => {
      const payload: SubmitDocsPayload = {
        source_guid: 'some-application-guid',
        destination: UploadedDocumentDestination.WILE_E
      };
      fileStorageService.submitDocuments(payload).subscribe();

      const submitDocumentsRequest = httpMock.expectOne(API_FILE_STORAGE.SUBMIT_DOCUMENTS_PATH);
      expect(submitDocumentsRequest.request.method).toEqual('POST');
      submitDocumentsRequest.flush({ status: 200 });
    });

    it('should pass down an error to caller if submitting documents return an http error', () => {
      const payload: SubmitDocsPayload = {
        source_guid: 'some-application-guid',
        destination: UploadedDocumentDestination.WILE_E
      };
      fileStorageService.submitDocuments(payload)
        .pipe(take(1))
        .subscribe(
          () => fail('Prevented this unit test from failing silently'), // Nothing to check here, won't be reached
          (err) => expect(err.status).toEqual(500));

      const submitDocumentsRequest = httpMock.expectOne(API_FILE_STORAGE.SUBMIT_DOCUMENTS_PATH);
      expect(submitDocumentsRequest.request.method).toEqual('POST');
      submitDocumentsRequest.flush([], { status: 500, statusText: 'Internal Server Error' });
    });
  }); // describe - submitDocuments()

  // ----------------------------------------------------------------------- cleanFiles()
  describe('cleanFiles()', () => {
    it('should be able to clean collected documents cache', () => {
      fileStorageService.cleanFiles()
        .pipe(take(1))
        .subscribe(
          (res) => expect(res.status).toEqual('SUCCESS'),
          () => fail('Prevented this unit test from failing silently')); // Nothing to check here, won't be reached

      const cleanCollectedFilesRequest = httpMock.expectOne(API_FILE_STORAGE.CLEAN_FILES_PATH);
      expect(cleanCollectedFilesRequest.request.method).toEqual('POST');
      cleanCollectedFilesRequest.flush({ status: 'SUCCESS' });
    });

    it('should pass down an error to caller if request to clean collected documents returns an http error', () => {
      fileStorageService.cleanFiles()
        .pipe(take(1))
        .subscribe(
          () => fail('Prevented this unit test from failing silently'), // Nothing to check here, won't be reached
          (err) => expect(err.status).toEqual(500));

      const cleanCollectedFilesRequest = httpMock.expectOne(API_FILE_STORAGE.CLEAN_FILES_PATH);
      expect(cleanCollectedFilesRequest.request.method).toEqual('POST');
      cleanCollectedFilesRequest.flush([], { status: 500, statusText: 'Internal Server Error' });
    }); // describe - cleanFiles()
  });

  // ----------------------------------------------------------------------- s3Upload()
  describe('s3Upload()', () => {
    it('should be able to upload file to s3 directly', () => {
      const url = API_FILE_STORAGE.CACHE_FILE_PATH;
      const file = new File([''], 'filename');
      const contentType = 'image/png';

      fileStorageService.s3Upload(url, file, contentType)
        .pipe(take(1))
        .subscribe(
          (res) => expect(res.status).toEqual('SUCCESS'),
          () => fail('Prevented this unit test from failing silently')); // Nothing to check here, won't be reached

      const cleanCollectedFilesRequest = httpMock.expectOne(API_FILE_STORAGE.CACHE_FILE_PATH);
      expect(cleanCollectedFilesRequest.request.method).toEqual('PUT');
      cleanCollectedFilesRequest.flush({ status: 'SUCCESS' });
    });

    it('should pass down an error to caller if request to upload to s3 returns an http error', () => {
      const url = API_FILE_STORAGE.CACHE_FILE_PATH;
      const file = new File([''], 'filename');
      const contentType = 'image/png';

      fileStorageService.s3Upload(url, file, contentType)
        .pipe(take(1))
        .subscribe(
          () => fail('Prevented this unit test from failing silently'), // Nothing to check here, won't be reached
          (err) => expect(err.status).toEqual(500));

      const cleanCollectedFilesRequest = httpMock.expectOne(API_FILE_STORAGE.CACHE_FILE_PATH);
      expect(cleanCollectedFilesRequest.request.method).toEqual('PUT');
      cleanCollectedFilesRequest.flush([], { status: 500, statusText: 'Internal Server Error' });
    }); // describe - s3Upload()

    // ----------------------------------------------------------------------- s3Upload()
    describe('prepareUpload()', () => {
      it('should create proper upload input when using non-s3 upload ', () => {
        spyOnProperty(configurationService, 'fileEncryptionType', 'get').and.returnValue('backend');
        fileStorageService.prepareUpload(missingDocumentTypeFile, destination, documentType)
          .subscribe(
            (uploadInput: UploadInput) => {
              expect(uploadInput.url).toBe(UPLOAD_URL);
              expect(uploadInput.data.destination).toBe(destination);
              expect(uploadInput.data.s3_key).toBeFalsy();
              expect(uploadInput.file.nativeFile).toEqual(inputFile.nativeFile);
            },
            () => fail('Prevented this unit test from failing silently')
          );
      });

      it('should return input event with s3 attributes', waitForAsync(() => {
        const bundleResponse = encryptionBundleResponseFactory.build();
        spyOnProperty(configurationService, 'fileEncryptionType', 'get').and.returnValue('');
        spyOn(cryptoService, 'fetchEncryptionBundle').and.returnValue(of(bundleResponse));
        spyOn(fileStorageService, 's3Upload').and.returnValue(of(null));

        fileStorageService.prepareUpload(inputFile, destination, documentType)
          .subscribe(
            (uploadInput: UploadInput) => {
              expect(uploadInput.url).toBe(CACHE_URL);
              expect(uploadInput.data.destination).toBe(CACHE_URL);
              expect(uploadInput.data.s3_key).toBe(bundleResponse.body.s3_key);
              expect(uploadInput.file.nativeFile).toEqual(new File([''], 'filename'));
            },
            () => fail('Prevented this unit test from failing silently')
          );
      }));

      it('should pass down an error to caller if request to upload to s3 returns an http error', waitForAsync(() => {
        spyOnProperty(configurationService, 'fileEncryptionType', 'get').and.returnValue('');
        spyOn(cryptoService, 'fetchEncryptionBundle').and.returnValue(of(encryptionBundleResponseFactory.build()));
        spyOn(fileStorageService, 's3Upload').and.returnValue(throwError(new HttpErrorResponse({ status: 500 })));

        fileStorageService.prepareUpload(inputFile, destination, documentType)
          .subscribe(
            () => fail('Prevented this unit test from failing silently'),
            (err) => expect(err.status).toEqual(500)
          );
      }));

      it('should pass down an error to caller if request to fetch encryption bundle returns an http error', waitForAsync(() => {
        spyOnProperty(configurationService, 'fileEncryptionType', 'get').and.returnValue('');
        spyOn(cryptoService, 'fetchEncryptionBundle').and.returnValue(throwError(new HttpErrorResponse({ status: 500 })));

        fileStorageService.prepareUpload(inputFile, destination, documentType)
          .subscribe(
            () => fail('Prevented this unit test from failing silently'),
            (err) => expect(err.status).toEqual(500)
          );
      })); // describe - prepareUpload()
    });
  });

  describe('getSupportedFileFormats()', () => {
    it('should return empty string when falsy value is passed in', () => {
      expect(fileStorageService.getSupportedFileFormats(null)).toBe('');
      expect(fileStorageService.getSupportedFileFormats(undefined)).toBe('');
      expect(fileStorageService.getSupportedFileFormats([])).toBe('');
    });

    it('should return lowercase value of subtype when MimeType is passed in, except for text/plain', () => {
      for (const key in MimeType) {
        if (!MimeType[key]) {
          fail(`Unexpected error: MIME Type does not exist, ${key}`);
        } else if (key === 'TEXT') {
          expect(fileStorageService.getSupportedFileFormats([ MimeType[key] ])).toBe('txt');
        } else {
          expect(fileStorageService.getSupportedFileFormats([ MimeType[key] ])).toBe(key.toLowerCase());
        }
      }
    });

    it('should return expected string for IMAGE_MIME_TYPES', () => {
      const expectedValue = 'png, jpg, jpeg';
      expect(fileStorageService.getSupportedFileFormats(IMAGE_MIME_TYPES)).toBe(expectedValue);
    });

    it('should return expected string for DEFAULT_MIME_TYPES', () => {
      const expectedValue = 'pdf, jpeg, jpg, png, csv, txt';
      expect(fileStorageService.getSupportedFileFormats(DEFAULT_MIME_TYPES)).toBe(expectedValue);
    });
  });
});
