import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { FilePayload, SubmitDocsPayload, UploadedDocumentDestination } from 'app/models/api-entities/file-storage';
import { DocumentCode } from 'app/models/api-entities/merchant-document-status';
import { UiError } from 'app/models/ui-error';
import { ErrorService } from 'app/services/error.service';
import { FileStorageService } from 'app/services/file-storage.service';
import { MerchantService } from 'app/services/merchant.service';
import { UtilityService } from 'app/services/utility.service';
import {
  uploadFileMissingDocumentType,
  errorFile,
  largeFileMock,
  missingDocumentTypeFile,
  negativeFileMock,
  payloadTooLargeErrorFile,
  pngFileMock,
  uploadFileEnqueued,
  uploadFileInProgress,
  uploadFileProgressDone,
  uploadFileMockId3,
  MAX_FILE_MOCK_SIZE,
  uploadFileProgressError, uploadFileFactory
} from 'app/test-stubs/factories/upload-file';
import {
  uploadOutputDoneNotFound,
  uploadOutputUploadingNotFound,
  uploadOutputDone,
  uploadOutputDoneWithError,
  uploadOutputDragOver,
  uploadOutputEnqueued,
  uploadOutputMock,
  uploadOutputUploading,
  uploadOutputCancelled,
  uploadOutputRemoved,
  uploadOutputRejected
} from 'app/test-stubs/factories/upload-output';
import { CookieService } from 'ngx-cookie-service';
import { NgxUploaderModule, UploadOutput, UploadInput } from 'ngx-uploader';
import { of } from 'rxjs';
import { throwError } from 'rxjs/internal/observable/throwError';
import { UploadBoxComponent } from './upload-box.component';
import { LoggingService } from 'app/services/logging.service';
import { inputChangeEnabledEvent, statusReadyEvent, resetEvent, finalizedEventWithFiles, errorDisabledEvent } from 'app/test-stubs/factories/upload-event';
import { ConfigurationService } from 'app/services/configuration.service';
import { CustomUploadFile } from 'app/models/custom-upload-file';
import { UiAlertStatus } from 'app/models/ui-alerts';
import { fileInputsStub } from 'app/test-stubs/input';
import { lendingApplicationApproved } from 'app/test-stubs/factories/lending-application';
import { IMAGE_MIME_TYPES } from 'app/models/mime-types';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { uiAlertFactory } from 'app/test-stubs/factories/ui-alerts';
import {
  badRequestFactory,
  expectationFailedFactory,
  internalServerErrorFactory,
  notFoundFactory,
  stringResponseFactory,
  voidResponseFactory
} from 'app/test-stubs/factories/response';
import { uploaderOptionsFactory } from 'app/test-stubs/factories/uploader-options';
import Bugsnag from '@bugsnag/js';
import { ErrorResponse } from 'app/models/error-response';

describe('UploadBoxComponent', () => {
  let component: UploadBoxComponent;
  let fixture: ComponentFixture<UploadBoxComponent>;
  let errorService: ErrorService;
  let fileStorageService: FileStorageService;
  let merchantService: MerchantService;
  let configurationService: ConfigurationService;

  const numberOfFiles = 2;
  const customNumberOfFiles = 1;
  const removedFile: UploadInput = { id: uploadFileEnqueued.id, type: 'remove' };

  function addOutput(iterations: number, file: UploadOutput): void {
    for (let i = 0; i < iterations; i++) {
      component.onUploadOutput(file);
    }
  }

  function getMismatchFile(): UploadOutput {
    const mismatchFile = uploadOutputMock;
    mismatchFile.file.id = mismatchFile.file.id + '1';
    return mismatchFile;
  }

  function initUploader(autoUpload: boolean, allowedContentTypes?: string[]): void {
    component.options = {
      autoUpload: autoUpload,
      documentType: DocumentCode.bank_statements,
      destination: UploadedDocumentDestination.WILE_E,
      messageSupport: false,
      requireDocumentType: false,
      uploader: {
        allowedContentTypes: allowedContentTypes,
        concurrency: 1,
        maxUploads: numberOfFiles
      }
    };

    component.ngOnInit();
    component.isUserSubmitting = false;
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ TranslateModule.forRoot(), HttpClientTestingModule, NgxUploaderModule ],
      declarations: [UploadBoxComponent],
      providers: [
        CookieService,
        UtilityService,
        FileStorageService,
        ErrorService,
        MerchantService,
        LoggingService,
        ConfigurationService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadBoxComponent);
    component = fixture.componentInstance;

    configurationService = TestBed.inject(ConfigurationService);
    errorService = TestBed.inject(ErrorService);
    fileStorageService = TestBed.inject(FileStorageService);
    merchantService = TestBed.inject(MerchantService);

    spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
    spyOnProperty(configurationService, 'maxFileSize').and.returnValue(MAX_FILE_MOCK_SIZE);
    spyOnProperty(configurationService, 'supportedFileFormats').and.callThrough();
    spyOnProperty(configurationService, 'maxUploads').and.returnValue(12);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('uploader maxUploads', () => {
    it('should set the correct value for maxUploads', () => {
      const options = uploaderOptionsFactory.build({ uploader: { concurrency: 1, maxUploads: 4 } });
      component.options = options;
      component.ngOnInit();

      expect(component.options.uploader.maxUploads).toEqual(4);
    });

    it('should set the correct value for maxUploads', () => {
      const options = uploaderOptionsFactory.build({ uploader: { concurrency: 1 } });
      component.options = options;
      component.ngOnInit();

      expect(component.options.uploader.maxUploads).toEqual(12);
    });
  });

  describe('file input', () => {
    beforeEach(() => {
      initUploader(false);
      fixture.detectChanges();

      component.fileInputs = fileInputsStub;
    });

    it('should be cleared after adding a file', () => {
      addOutput(numberOfFiles, uploadOutputEnqueued);
      component.fileInputs.forEach(input => {
        expect(input.nativeElement.value).toBe('');
      });
    });

    it('should be cleared after rejecting a file', () => {
      addOutput(numberOfFiles, uploadOutputRejected);
      component.fileInputs.forEach(input => {
        expect(input.nativeElement.value).toBe('');
      });
    });
  });

  describe('helper methods', () => {
    describe('isFileSizeAllowed', () => {
      it('should return true if file size is allowed', () => {
        expect(component.isFileSizeAllowed(uploadFileEnqueued)).toBeTruthy();
      });

      it('should return false if file size is not allowed', () => {
        const files = [negativeFileMock, largeFileMock(configurationService.maxFileSize)];
        for (const file of files) {
          expect(component.isFileSizeAllowed(file)).toBeFalsy();
        }
      });

      it('should return false for null file', () => {
        expect(component.isFileSizeAllowed(null)).toBeFalse();
      });

      it('should return false for file with response status set to payload too large (413)', () => {
        expect(component.isFileSizeAllowed(payloadTooLargeErrorFile)).toBeFalse();
      });
    });

    describe('isFileUploadDone', () => {
      it('should return true if file upload is complete', () => {
        expect(component.isFileUploadDone(uploadFileProgressDone)).toBeTrue();
      });

      it('should return false if file upload is incomplete', () => {
        expect(component.isFileUploadDone(uploadFileInProgress)).toBeFalse();
      });

      it('should return false if file is null', () => {
        expect(component.isFileUploadDone(null)).toBeFalse();
      });
    });

    describe('isFileUploading', () => {
      it('should return false if the file is null', () => {
        expect(component.isFileUploading(null)).toBeFalse();
      });

      it('should return true if file upload is in progress', () => {
        expect(component.isFileUploading(uploadFileInProgress)).toBeTrue();
      });

      it('should return false if file upload is comeplete', () => {
        expect(component.isFileUploading(uploadFileProgressDone)).toBeFalse();
      });

      it('should return false if file upload has not started', () => {
        expect(component.isFileUploading(uploadFileEnqueued)).toBeFalse();
      });
    });

    describe('isUploadMessageVisible', () => {
      beforeEach(() => {
        initUploader(false);
      });

      it('should return true if file upload is not done and the file is valid', () => {
        expect(component.isUploadMessageVisible(uploadFileInProgress)).toBeTrue();
      });

      it('should return false otherwise', () => {
        expect(component.isUploadMessageVisible(uploadFileProgressDone)).toBeFalse();
        expect(component.isUploadMessageVisible(uploadFileProgressError)).toBeFalse();
      });
    });
  });

  describe('Autouploading', () => {
    beforeEach(() => {
      initUploader(true);
    });

    describe('onUploadOutput', () => {
      it('should call uploadInput.emit as many times as there are files', () => {
        spyOn(component.uploadInput, 'emit');
        addOutput(numberOfFiles, uploadOutputEnqueued);
        addOutput(customNumberOfFiles, uploadOutputMock);

        expect(component.uploadInput.emit).toHaveBeenCalledTimes(numberOfFiles);
        expect(component.disableInputs).toBeFalsy();
      });

      it('should add file to array', () => {
        addOutput(numberOfFiles, uploadOutputEnqueued);
        addOutput(numberOfFiles, uploadOutputUploading);

        component.files.forEach((file: CustomUploadFile) => {
          expect(file).toEqual(uploadOutputUploading.file);
        });
      });

      it('should emit a fileChangedEvent with the added file', () => {
        spyOn(component.fileChangedEvent, 'emit');
        addOutput(1, uploadOutputEnqueued);

        expect(component.fileChangedEvent.emit).toHaveBeenCalledOnceWith(uploadOutputEnqueued.file.nativeFile);
      });

      it('should not add files to array once it\'s reached maxUploads amount', () => {
        addOutput(component.options.uploader.maxUploads + 1, uploadOutputEnqueued);
        component.files.forEach((file: CustomUploadFile) => {
          expect(file).toEqual(uploadOutputEnqueued.file);
        });
        expect(component.files.length).toEqual(component.options.uploader.maxUploads);
      });

      it('should show error and update file when file finishes upload with error', () => {
        spyOn(errorService, 'show');
        spyOn(component.statusChanged, 'emit');

        addOutput(numberOfFiles, uploadOutputEnqueued);
        addOutput(numberOfFiles, uploadOutputDoneWithError);

        expect(component.files.length).toBe(numberOfFiles);
        component.files.forEach(file => expect(file.error).toBeTruthy());
        component.files.forEach(file => expect(component.hasMessage(file)).toBeTruthy());
        component.files.forEach(file => file.error = undefined);

        expect(errorService.show).toHaveBeenCalledTimes(numberOfFiles);
        expect(component.statusChanged.emit).toHaveBeenCalledTimes(numberOfFiles);
        component.files.forEach((file, i) => {
          expect(component.statusChanged.emit['calls']['argsFor'](i)).toEqual([errorDisabledEvent]);
        });
      });

      it('should not emit any events when a mismatched file event is received', () => {
        spyOn(errorService, 'show');
        spyOn(component.statusChanged, 'emit');

        addOutput(customNumberOfFiles, uploadOutputEnqueued);
        addOutput(customNumberOfFiles, getMismatchFile());
        expect(component.files.length).toBe(customNumberOfFiles);
        expect(errorService.show).toHaveBeenCalledTimes(0);
        expect(component.statusChanged.emit).toHaveBeenCalledTimes(0);
      });

      it('should not handle drag over event and not add files', () => {
        spyOn(errorService, 'show');
        spyOn(component.statusChanged, 'emit');

        addOutput(numberOfFiles, uploadOutputDragOver);
        expect(component.files.length).toBe(0);
        expect(component.statusChanged.emit).toHaveBeenCalledTimes(0);
      });

      it('should emit correct number of events and emit ready status', () => {
        spyOn(component.statusChanged, 'emit');
        component.files = [uploadFileProgressDone];
        addOutput(customNumberOfFiles, uploadOutputDone);

        expect(component.files.length).toBe(1);
        expect(component.statusChanged.emit).toHaveBeenCalledTimes(customNumberOfFiles);
        expect(component.statusChanged.emit).toHaveBeenCalledWith(statusReadyEvent);
      });
    });

    describe('isUserSubmitting', () => {
      it('should NOT attempt to start uploading if no files exist', () => {
        spyOn(fileStorageService, 'prepareUpload');
        initUploader(false);
        component.isUserSubmitting = true;

        expect(fileStorageService.prepareUpload).not.toHaveBeenCalled();
      });
    });

    describe('isUserSubmitting', () => {
      beforeEach(fakeAsync(() => {
        const submitDocsResponse = stringResponseFactory.build({ data: `["md_123"]` });
        spyOn(Bugsnag, 'notify');
        spyOn(fileStorageService, 'submitDocuments').and.returnValue(of(submitDocsResponse));

        component.files = Array(numberOfFiles).fill(uploadOutputDone.file);
        expect(component.files.length).toBe(numberOfFiles);

        spyOn(component.statusChanged, 'emit');
        spyOn(component.uploadInput, 'emit');
      }));

      it('should emit two status change events: finalized, reset', () => {
        spyOn(fileStorageService, 'cleanFiles').and.returnValue(of(null));
        component.isUserSubmitting = true;

        expect(fileStorageService.submitDocuments).toHaveBeenCalledTimes(1);
        expect(component.uploadInput.emit).toHaveBeenCalledOnceWith({ type: 'removeAll' });
        expect(component.statusChanged.emit).toHaveBeenCalledTimes(2);
        expect(component.statusChanged.emit['calls']['argsFor'](0)).toEqual([finalizedEventWithFiles(numberOfFiles)]);
        expect(component.statusChanged.emit['calls']['argsFor'](1)).toEqual([resetEvent]);
        expect(Bugsnag.notify).toHaveBeenCalledTimes(0);
      });

      it('should call submitDocuments with source_guid from options if defined', () => {
        component.options.source_guid = lendingApplicationApproved.id;
        spyOn(fileStorageService, 'cleanFiles').and.returnValue(of(null));
        component.isUserSubmitting = true;
        const expected_docs_payload: SubmitDocsPayload = {
          source_guid: lendingApplicationApproved.id,
          destination: component.options.destination
        };

        expect(fileStorageService.submitDocuments).toHaveBeenCalledOnceWith(expected_docs_payload);
        expect(Bugsnag.notify).toHaveBeenCalledTimes(0);
      });


      it('should emit two status change events: finalized, reset, and log bugsnag when error occurs on cleanFiles', () => {
        const error = badRequestFactory.build();
        spyOn(fileStorageService, 'cleanFiles').and.returnValue(throwError(error));
        component.isUserSubmitting = true;

        expect(fileStorageService.submitDocuments).toHaveBeenCalledTimes(1);
        expect(component.uploadInput.emit).toHaveBeenCalledOnceWith({ type: 'removeAll' });
        expect(component.statusChanged.emit).toHaveBeenCalledTimes(2);
        expect(component.statusChanged.emit['calls']['argsFor'](0)).toEqual([finalizedEventWithFiles(numberOfFiles)]);
        expect(component.statusChanged.emit['calls']['argsFor'](1)).toEqual([resetEvent]);
        expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
      });

      it('should create an alert when a file is rejected', () => {
        const rejectedUIAlert = uiAlertFactory.build({
          msg: 'UPLOAD.REJECTED_FILE',
          params: {
            filename: uploadOutputRejected.file.name
          },
          type: UiAlertStatus.danger
        });
        spyOn(component.alerts, 'push');
        component.onUploadOutput(uploadOutputRejected);
        expect(component.alerts.push).toHaveBeenCalledOnceWith(rejectedUIAlert);
      });
    });

    describe('helper methods', () => {
      describe('hasMessage()', () => {
        it('should return false if the file is null', ()=> {
          expect(component.hasMessage(null)).toBeFalse();
        });

        it('should return true if file has completed upload', () => {
          expect(component.hasMessage(uploadFileProgressDone)).toBe(true);
        });
      });
    });



    describe('isUploaderDisabled', () => {
      it('should return false if max uploads has not been reached', () => {
        component.options.uploader.maxUploads = numberOfFiles + 1;
        component.files = Array(numberOfFiles).fill(uploadFileEnqueued);
        expect(component.isUploaderDisabled()).toBeFalsy();
      });

      it('should return true if max uploads has been reached', () => {
        component.options.uploader.maxUploads = numberOfFiles;
        component.files = Array(numberOfFiles).fill(uploadFileEnqueued);
        expect(component.isUploaderDisabled()).toBeTruthy();
      });

      it('should return true if inputs are disabled', () => {
        component.disableInputs = true;
        expect(component.isUploaderDisabled()).toBeTruthy();
      });
    });

    describe('isMissingFileType', () => {
      it('should return false due to requireDocumentType being false', () => {
        component.options.requireDocumentType = false;
        expect(component.isMissingFileType(pngFileMock)).toBeFalsy();
      });
    });
  });

  describe('Manual Upload', () => {
    beforeEach(() => {
      component.options = {
        autoUpload: false,
        destination: UploadedDocumentDestination.WILE_E,
        messageSupport: false,
        requireDocumentType: true,
        uploader: {
          concurrency: 1,
          maxUploads: numberOfFiles
        }
      };
      component.ngOnInit();
      component.isUserSubmitting = false;
    });

    describe('onUploadOutput', () => {
      describe('allAddedToQueue', () => {
        it('update status: input-change', () => {
          addOutput(customNumberOfFiles, uploadOutputEnqueued);
          spyOn(component.statusChanged, 'emit');

          addOutput(customNumberOfFiles, uploadOutputMock);

          expect(component.statusChanged.emit).toHaveBeenCalledTimes(customNumberOfFiles);
          expect(component.files.length).toBe(customNumberOfFiles);
          expect(component.statusChanged.emit).toHaveBeenCalledWith(inputChangeEnabledEvent);
        });
      });

      describe('cancelled or removed', () => {
        it('should emit null file', () => {
          spyOn(component.fileChangedEvent, 'emit');
          addOutput(1, uploadOutputCancelled);

          expect(component.fileChangedEvent.emit).toHaveBeenCalledOnceWith(null);
        });
      });

      describe('when files\'s id does not match', () => {
        it('should not cancel document if id does not match event id', () => {
          spyOn(component.statusChanged, 'emit');
          component.files = [uploadOutputCancelled.file, uploadFileMockId3];
          addOutput(numberOfFiles, uploadOutputCancelled);

          expect(component.files.length).toBe(numberOfFiles - 1);
          expect(component.statusChanged.emit).toHaveBeenCalledWith(inputChangeEnabledEvent);
        });

        it('should not remove document if id does not match event id', () => {
          spyOn(component.statusChanged, 'emit');
          component.files = [uploadOutputRemoved.file, uploadFileMockId3];
          addOutput(numberOfFiles, uploadOutputRemoved);

          expect(component.files.length).toBe(numberOfFiles - 1);
          expect(component.statusChanged.emit).toHaveBeenCalledWith(inputChangeEnabledEvent);
        });
      });

      describe('done', () => {
        it('should not submit documents if not all are uploaded', () => {
          spyOn(fileStorageService, 'submitDocuments');
          addOutput(numberOfFiles, uploadOutputEnqueued);
          addOutput(1, uploadOutputDone);
          expect(fileStorageService.submitDocuments).toHaveBeenCalledTimes(0);
        });

        it('should submit documents if all are uploaded', fakeAsync(() => {
          spyOn(fileStorageService, 'submitDocuments').and.returnValue(of(null));
          spyOn(errorService, 'show');

          component.files = Array(numberOfFiles).fill(uploadFileProgressDone);
          spyOn(component.statusChanged, 'emit');
          addOutput(1, uploadOutputDone);

          expect(fileStorageService.submitDocuments).toHaveBeenCalledTimes(1);
          expect(component.statusChanged.emit).toHaveBeenCalledTimes(2);
          expect(component.files.length).toBe(0);
        }));

        it('should not change array of files if file event cannot be assigned to a file', () => {
          spyOn(errorService, 'show');

          component.files = Array(numberOfFiles).fill(uploadFileProgressDone);
          spyOn(component.statusChanged, 'emit');

          addOutput(1, uploadOutputUploadingNotFound);
          component.files.forEach(file => expect(file).not.toEqual(uploadOutputUploadingNotFound.file));

          addOutput(1, uploadOutputDoneNotFound);
          expect(errorService.show).toHaveBeenCalledTimes(0);
        });

        it('should submit documents if all are uploaded and show error when it occurs', () => {
          const error = badRequestFactory.build();
          spyOn(fileStorageService, 'submitDocuments').and.returnValue(throwError(error));
          spyOn(errorService, 'show');
          spyOn(Bugsnag, 'notify');

          component.files = Array(numberOfFiles).fill(uploadFileProgressDone);
          spyOn(component.statusChanged, 'emit');
          addOutput(1, uploadOutputDone);

          expect(fileStorageService.submitDocuments).toHaveBeenCalledTimes(1);
          expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
          expect(component.statusChanged.emit).toHaveBeenCalledOnceWith(resetEvent);
          expect(errorService.show).toHaveBeenCalledTimes(1);
        });

        it('should submit documents if all are uploaded and send support message if enabled', fakeAsync(() => {
          spyOn(merchantService, 'requestAssistance').and.returnValue(Promise.resolve(voidResponseFactory.build()));
          spyOn(fileStorageService, 'submitDocuments').and.returnValue(of(null));
          spyOn(errorService, 'show');

          component.options.messageSupport = true;
          component.files = Array(numberOfFiles).fill(uploadFileProgressDone);

          spyOn(component.statusChanged, 'emit');
          addOutput(1, uploadOutputDone);
          tick(3000);

          const files = Array(numberOfFiles).fill(uploadFileEnqueued);
          const reason = `A merchant just uploaded ${files.length} documents.`;

          expect(fileStorageService.submitDocuments).toHaveBeenCalledTimes(1);
          expect(component.statusChanged.emit).toHaveBeenCalledTimes(2);
          expect(merchantService.requestAssistance).toHaveBeenCalledWith(reason);
        }));

        it('should submit documents if all are uploaded, send support message if enabled, and show error when it occurs', fakeAsync(() => {
          spyOn(fileStorageService, 'submitDocuments').and.returnValue(of(null));
          spyOn(merchantService, 'requestAssistance').and.returnValue(Promise.reject(new HttpErrorResponse({ status: 500 })));
          spyOn(errorService, 'show');

          component.options.messageSupport = true;
          component.files = Array(numberOfFiles).fill(uploadFileProgressDone);

          expect(component.files.length).toBe(numberOfFiles);

          spyOn(component.statusChanged, 'emit');
          addOutput(1, uploadOutputDone);
          tick(3000);
          const files = Array(numberOfFiles).fill(uploadFileEnqueued);
          const reason = `A merchant just uploaded ${files.length} documents.`;

          expect(merchantService.requestAssistance).toHaveBeenCalledOnceWith(reason);
          expect(errorService.show).toHaveBeenCalledTimes(1);
          expect(component.statusChanged.emit).toHaveBeenCalledOnceWith(resetEvent);
        }));
      });

      describe('isUserSubmitting', () => {
        it('should call fileStorageService and trigger event emitters ', fakeAsync(() => {
          addOutput(numberOfFiles, uploadOutputEnqueued);

          spyOn(errorService, 'show');
          spyOn(component.uploadInput, 'emit');
          spyOn(fileStorageService, 'prepareUpload').and.callThrough();

          component.isUserSubmitting = true;
          tick(3000);

          expect(errorService.show).toHaveBeenCalledTimes(0);
          expect(fileStorageService.prepareUpload).toHaveBeenCalledTimes(numberOfFiles);
          expect(component.uploadInput.emit).toHaveBeenCalledTimes(numberOfFiles);
          expect(component.disableInputs).toBeTruthy();
        }));

        it('should call fileStorageService, show errors when they occur, and trigger bugsnag', fakeAsync(() => {
          addOutput(numberOfFiles, uploadOutputEnqueued);

          spyOn(errorService, 'show');
          spyOn(component.uploadInput, 'emit');
          spyOn(component.statusChanged, 'emit');
          spyOn(fileStorageService, 'prepareUpload').and.callThrough().and.returnValue(throwError(new HttpErrorResponse({ status: 500 })));
          spyOn(Bugsnag, 'notify');

          component.isUserSubmitting = true;
          tick(3000);
          expect(errorService.show).toHaveBeenCalledTimes(numberOfFiles);
          expect(fileStorageService.prepareUpload).toHaveBeenCalledTimes(numberOfFiles);
          expect(component.statusChanged.emit).toHaveBeenCalledTimes(numberOfFiles);
          component.files.forEach((file, i) => {
            expect(component.statusChanged.emit['calls']['argsFor'](i)).toEqual([errorDisabledEvent]);
          });
          expect(component.uploadInput.emit).toHaveBeenCalledTimes(0);
          expect(Bugsnag.notify).toHaveBeenCalledTimes(numberOfFiles);
        }));
      });

      describe('Helper Methods', () => {
        beforeEach(() => {
          expect(component.options.requireDocumentType).toBeTruthy();
        });

        describe('hasMessage', () => {
          it('should return true when file\'s error property has been set', () => {
            const result = component.hasMessage(errorFile);
            expect(result).toBe(true);
          });

          it('should return true when file is missing document type and is required', () => {
            const result = component.hasMessage(missingDocumentTypeFile);
            expect(result).toBe(true);
          });

          it('should return false when file is missing document type and is not required', () => {
            component.options.requireDocumentType = false;
            const result = component.hasMessage(missingDocumentTypeFile);
            expect(result).toBe(false);
          });

          it('should return true when file is too big', () => {
            const result = component.hasMessage(payloadTooLargeErrorFile);
            expect(result).toBe(true);
          });

          it('should return true when file upload is in progress', () => {
            const result = component.hasMessage(uploadFileInProgress);
            expect(result).toBe(true);
          });

          it('should return true when file has completed uploading and autoUpload is true', () => {
            component.options.autoUpload = true;
            const result = component.hasMessage(uploadFileEnqueued);
            expect(result).toBe(true);
          });
        });
        describe('isMissingFileType', () => {
          beforeEach(() => {
            expect(component.options.requireDocumentType).toBeTruthy();
          });

          it('should return false when file has document type and is required', () => {
            expect(component.isMissingFileType(uploadFileEnqueued)).toBeFalsy();
          });

          it('should return true when file is missing type and is required', () => {
            expect(component.isMissingFileType(uploadFileMissingDocumentType)).toBeTruthy();
          });
        });
      });

      describe('removeFile()', () => {
        beforeEach(() => {
          spyOn(component.uploadInput, 'emit');
        });

        it('should not emit anything if the file does not exist', () => {
          component.files = [];
          component.removeFile(null);

          expect(component.uploadInput.emit).not.toHaveBeenCalled();
        });

        describe('UploadStatus.Uploading', () => {
          it('should call cancelFileUpload() and emit cancel', () => {
            component.files = [uploadFileInProgress];
            component.removeFile(uploadFileInProgress);

            expect(component.uploadInput.emit).toHaveBeenCalledOnceWith({ type: 'cancel', id: uploadFileInProgress.id });
          });
        }); // UploadStatus.Uploading

        describe('UploadStatus.Done', () => {
          let removeFileSpy: jasmine.Spy;

          beforeEach(() => {
            removeFileSpy = spyOn(fileStorageService, 'removeFile').and.returnValue(of(null));
          });

          it('should emit remove on success', () => {
            component.files = [uploadFileProgressDone];
            component.removeFile(uploadFileProgressDone);

            expect(component.uploadInput.emit).toHaveBeenCalledOnceWith({ type: 'remove', id: uploadFileProgressDone.id });
          });

          it('should emit remove on error with a statusCode of 404', () => {
            removeFileSpy.and.returnValue(
              throwError(new ErrorResponse(expectationFailedFactory.build({ status: 404 })))
            );

            component.files = [uploadFileProgressDone];
            component.removeFile(uploadFileProgressDone);

            expect(component.uploadInput.emit).toHaveBeenCalledOnceWith({ type: 'remove', id: uploadFileProgressDone.id });
          });

          describe('removeFileUpload()', () => {
            it('should use the file.documentType when it exists', () => {
              const removePayload: FilePayload = {
                file_id: uploadFileProgressDone.id,
                document_type: uploadFileProgressDone.documentType
              }
              component.removeFile(uploadFileProgressDone);

              expect(fileStorageService.removeFile).toHaveBeenCalledOnceWith(removePayload);
            });

            it('should use the options.documentType when no file.documentType exists', () => {
              const noDocumentTypeFile = uploadFileFactory.build({ documentType: null, progress: { status: 2 } });
              component.options.documentType = DocumentCode.bank_statements;
              const removePayload: FilePayload = {
                file_id: noDocumentTypeFile.id,
                document_type: component.options.documentType
              }
              component.removeFile(noDocumentTypeFile);

              expect(fileStorageService.removeFile).toHaveBeenCalledOnceWith(removePayload);
            });

            it('should send to POST /api/v1/remove_file', () => {
              component.removeFile(uploadFileProgressDone);
              expect(fileStorageService.removeFile).toHaveBeenCalledTimes(1);
            });

            it('should emit remove uploadInput event (this deletes file via ngx-uploader) if request succeeds', () => {
              component.removeFile(uploadFileEnqueued);
              expect(component.uploadInput.emit).toHaveBeenCalledOnceWith(removedFile);
            });

            it('should emit remove uploadInput event when specific file\'s document type is not defined but is defined in the uploader', () => {
              component.options.documentType = DocumentCode.bank_statements;
              const missingDocFile = missingDocumentTypeFile;
              component.removeFile(missingDocFile);
              expect(component.uploadInput.emit).toHaveBeenCalledOnceWith(removedFile);
            });

            it('should display general error if request fails', () => {
              spyOn(errorService, 'show');
              removeFileSpy.and.returnValue(throwError(new ErrorResponse(internalServerErrorFactory.build())));

              component.removeFile(uploadFileProgressDone);
              expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general);
            });

            it('should not display general error and instead emit remove event if 404 is received', () => {
              spyOn(errorService, 'show');
              removeFileSpy.and.returnValue(throwError(new ErrorResponse(notFoundFactory.build())));
              component.removeFile(uploadFileEnqueued);
              expect(component.uploadInput.emit).toHaveBeenCalledOnceWith({ type: 'remove', id: uploadFileEnqueued.id });
              expect(errorService.show).toHaveBeenCalledTimes(0);
            });
          }); // describe - removeFileUpload()
        }); // UploadStatus.Done

        describe('UploadStatus.Queue', () => {
          it('should call clearFileUpload() and emit remove', () => {
            component.files = [uploadFileEnqueued];
            component.removeFile(uploadFileEnqueued);

            expect(component.uploadInput.emit).toHaveBeenCalledOnceWith({ type: 'remove', id: uploadFileEnqueued.id });
          });
        }); // UploadStatus.Queue
      });
    });
  });

  describe('supportedFileFormats', () => {
    beforeEach(() => {
      spyOn(fileStorageService, 'getSupportedFileFormats').and.callThrough();
      expect(component.supportedFileFormats).toBeUndefined();
    });

    it('should call fileStorageService with options from uploader', () => {
      initUploader(true, IMAGE_MIME_TYPES);

      expect(component.options.uploader.allowedContentTypes).toEqual(IMAGE_MIME_TYPES);
      expect(fileStorageService.getSupportedFileFormats).toHaveBeenCalledWith(IMAGE_MIME_TYPES);
      expect(component.supportedFileFormats).toBeDefined();
    });

    it('should call fileStorageService.getSupportedFileFormats with default file formats when options are falsy', () => {
      initUploader(true, undefined);

      const defaultSupportedFileFormats = configurationService.supportedFileFormats.split(',');
      expect(component.options.uploader.allowedContentTypes).toEqual(defaultSupportedFileFormats);
      expect(fileStorageService.getSupportedFileFormats).toHaveBeenCalledWith(defaultSupportedFileFormats);
      expect(component.supportedFileFormats).toBeDefined();
    });
  });

  describe('maxFileSize', () => {
    it('should retrieve value set from ConfigurationService', () => {
      expect(component.fileSize).toEqual(configurationService.maxFileSize / 1024 / 1024);
    });
  });

  describe('updateSelectStatus', () => {
    it('should emit status changed event', () => {
      spyOn(component.statusChanged, 'emit');
      component.updateSelectStatus();

      expect(component.statusChanged.emit).toHaveBeenCalledTimes(1);
    });
  });
});
