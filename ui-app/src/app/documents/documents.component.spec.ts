import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BANKING_DOC_SELECT_OPTIONS, DOC_SELECT_OPTIONS } from 'app/models/api-entities/merchant-document-status';
import {
  errorDisabledEvent,
  errorEnabledEvent,
  finalizedEventWithFiles,
  inputChangeEnabledEvent,
  resetEvent
} from 'app/test-stubs/factories/upload-event';
import { DocumentsComponent } from 'app/documents/documents.component';
import { RouterTestingModule } from '@angular/router/testing';
import { MyDocumentsComponent } from 'app/documents/my-documents/my-documents.component';
import { UploadBankingComponent } from 'app/documents/upload-banking/upload-banking.component';
import { LoggingService } from 'app/services/logging.service';
import { StateRoutingService} from 'app/services/state-routing.service';
import { UtilityService } from 'app/services/utility.service';
import { UploadBoxComponentStub } from 'app/components/utilities/upload-box/upload-box-stub.component';
import { uploadFileFactory } from 'app/test-stubs/factories/upload-file';

const mockFirstChild = {
  data: {
    documentTypes: BANKING_DOC_SELECT_OPTIONS,
    showMerchantDocuments: false
  }
};

const mockActivatedRoute = {
  get snapshot() {
    return {
      firstChild: mockFirstChild
    }
  }
};


describe('DocumentsComponent', () => {
  let component: DocumentsComponent;
  let fixture: ComponentFixture<DocumentsComponent>;
  let loggingService: LoggingService;
  let activatedRoute: ActivatedRoute;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        DocumentsComponent,
        MyDocumentsComponent,
        UploadBankingComponent,
        UploadBoxComponentStub
      ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: mockActivatedRoute
        },
        LoggingService,
        StateRoutingService,
        UtilityService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentsComponent);
    component = fixture.componentInstance;
    loggingService = TestBed.inject(LoggingService);
    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set up component values', () => {
    expect(component.filesUploaded).toBe(0);
    expect(component.showSuccessMessage).toBeFalsy();
    expect(component.disableSubmit).toBeTruthy();
    expect(component.submittingDocs).toBeFalsy();
    expect(component.uploaderOptions).toBeTruthy();
  });

  describe('ngOnInit', () => {
    describe('ActivatedRoute: root', () => {
      describe('when snapshot data IS set', () => {
        it('should configure properly', () => {
          expect(component.documentTypes).toEqual(mockFirstChild.data.documentTypes);
          expect(component.showMerchantDocuments).toEqual(mockFirstChild.data.showMerchantDocuments);
        });
      }); // describe - when snapshot data IS set

      describe('when snapshot data is NOT set', () => {
        beforeEach(() => {
          const badMockFirstChild = {
              firstChild: {
                data: {}
              }
          };
          spyOnProperty(activatedRoute, 'snapshot').and.returnValue(badMockFirstChild);
        });

        it('should use defaults', () => {
          component.ngOnInit();

          expect(component.documentTypes).toEqual(DOC_SELECT_OPTIONS);
          expect(component.showMerchantDocuments).toBeTrue();
        });
      }); // describe - when snapshot data is NOT set
    }); // describe - ActivatedRoute: root
  }); // describe - construct

  describe('onSubmit()', () => {
    it('should set submittingDocs to true ', () => {
      expect(component.submittingDocs).toBeFalsy();
      component.onStatusChange(errorEnabledEvent);
      expect(component.disableSubmit).toBeFalsy();
      component.onSubmit();

      expect(component.submittingDocs).toBeTruthy();
      expect(component.disableSubmit).toBeTruthy();
    });
  });

  describe('onStatusChange()', () => {
    it('should not show success message and should enable submit button event from uploader says so', () => {
      component.showSuccessMessage = false;
      component.onSubmit();
      component.onStatusChange(errorDisabledEvent);

      expect(component.showSuccessMessage).toBeFalsy();
      expect(component.disableSubmit).toBeTruthy();
      expect(component.filesUploaded).toBe(0);
      expect(component.submittingDocs).toBeFalsy();
    });

    it('should not show success message and should disable submit button event from uploader says so', () => {
      component.showSuccessMessage = false;
      component.onSubmit();
      component.onStatusChange(errorEnabledEvent);

      expect(component.showSuccessMessage).toBeFalsy();
      expect(component.disableSubmit).toBeFalsy();
      expect(component.filesUploaded).toBe(0);
      expect(component.submittingDocs).toBeFalsy();
    });

    it('should show success message if it isn\'t showing it already and a file was uploaded', fakeAsync(() => {
      component.showSuccessMessage = false;
      component.onSubmit();
      component.onStatusChange(finalizedEventWithFiles(1));

      expect(component.disableSubmit).toBeFalsy();
      expect(component.filesUploaded).toBe(1);
      expect(component.submittingDocs).toBeFalsy();
      expect(component.showSuccessMessage).toBeTruthy();
      tick(5000);
      expect(component.showSuccessMessage).toBeFalsy();
    }));

    it('should send GTM Action for each file when finalized', fakeAsync(() => {
      component.showSuccessMessage = false;
      component.uploadBox.files = uploadFileFactory.buildList(2);
      spyOn(loggingService, 'GTMAction').and.returnValue();
      component.onSubmit();
      component.onStatusChange(finalizedEventWithFiles(2));

      expect(loggingService.GTMAction).toHaveBeenCalledTimes(2);
      expect(component.disableSubmit).toBeFalse();
      expect(component.filesUploaded).toBe(2);
      expect(component.submittingDocs).toBeFalse();
      expect(component.showSuccessMessage).toBeTrue();
      tick(5000);
      expect(component.showSuccessMessage).toBeFalse();
    }));

    it('should handle null files', fakeAsync(() => {
      component.showSuccessMessage = false;
      component.uploadBox.files = null;
      spyOn(loggingService, 'GTMAction').and.returnValue();
      component.onSubmit();
      component.onStatusChange(finalizedEventWithFiles(2));

      expect(loggingService.GTMAction).not.toHaveBeenCalled();
      expect(component.disableSubmit).toBeFalse();
      expect(component.filesUploaded).toBe(2);
      expect(component.submittingDocs).toBeFalse();
      expect(component.showSuccessMessage).toBeTrue();
      tick(5000);
      expect(component.showSuccessMessage).toBeFalse();
    }));

    it('should not show success message if it is already showing success message', () => {
      component.showSuccessMessage = true;
      component.filesUploaded = 3;
      component.onSubmit();
      component.onStatusChange(finalizedEventWithFiles(1));

      expect(component.filesUploaded).toEqual(3);
      expect(component.disableSubmit).toBeFalsy();
      expect(component.submittingDocs).toBeTruthy();
      expect(component.showSuccessMessage).toBeTruthy();
    });

    it('should reset submit button when reset event is received', () => {
      component.onStatusChange(inputChangeEnabledEvent);
      expect(component.disableSubmit).toBeFalsy();

      component.onSubmit();
      expect(component.submittingDocs).toBeTruthy();

      component.onStatusChange(resetEvent);
      expect(component.disableSubmit).toBeTruthy();
      expect(component.submittingDocs).toBeFalsy();
    });
  });

  describe('isSubmittingDocuments', () => {
    it('should return submittingDocs ', () => {
      expect(component.submittingDocs).toBeFalsy();
      component.onSubmit();
      expect(component.submittingDocs).toBeTruthy();
    });
  });

  describe('isSubmitDisabled', () => {
    it('should return waitingForDocuments', () => {
      expect(component.disableSubmit).toBeTruthy();
      component.onStatusChange(errorEnabledEvent);
      expect(component.disableSubmit).toBeFalsy();
    });
  });
});
