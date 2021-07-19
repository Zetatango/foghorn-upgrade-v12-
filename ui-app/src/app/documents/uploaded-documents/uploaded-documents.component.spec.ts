import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, flush, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DataTablesModule } from 'angular-datatables';
import { UploadedDocumentsComponent } from 'app/documents/uploaded-documents/uploaded-documents.component';
import { DOC_SELECT_OPTIONS, DocumentCode } from 'app/models/api-entities/merchant-document-status';
import { ErrorResponse } from 'app/models/error-response';
import { UiError } from 'app/models/ui-error';
import { LocalizeDatePipe } from 'app/pipes/localize-date.pipe';
import { ErrorService } from 'app/services/error.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { UtilityService } from 'app/services/utility.service';
import { expectationFailedFactory } from 'app/test-stubs/factories/response';
import { merchantDocumentsListingFactory } from 'app/documents/models/merchant-documents-listing.factory';
import { of, throwError } from 'rxjs';

const uploadedDocumentsResponse = merchantDocumentsListingFactory.build();
const uploadedDocuments = uploadedDocumentsResponse.merchant_documents;

describe('UploadedDocumentsComponent', () => {
  let component: UploadedDocumentsComponent;
  let fixture: ComponentFixture<UploadedDocumentsComponent>;
  let loggingService: LoggingService;
  let errorService: ErrorService;
  let merchantService: MerchantService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        UploadedDocumentsComponent,
        LocalizeDatePipe
      ],
      imports: [
        DataTablesModule.forRoot(),
        HttpClientTestingModule,
        RouterTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        ErrorService,
        LoggingService,
        MerchantService,
        TranslateService,
        UtilityService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadedDocumentsComponent);
    component = fixture.componentInstance;

    errorService = TestBed.inject(ErrorService);
    loggingService = TestBed.inject(LoggingService);

    merchantService = TestBed.inject(MerchantService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit()', () => {
    it('should configure the DataTable', () => {
      const configuredKeys = ['ajax', 'columns', 'info', 'language', 'lengthChange', 'order', 'pageLength', 'processing', 'searching', 'serverSide'];

      component.ngOnInit();

      expect(Object.keys(component.dtOptions)).toEqual(configuredKeys);
    });

    describe('when getMerchantDocuments() SUCCEEDS', () => {
      beforeEach(() => {
        spyOn(merchantService, 'getMerchantDocuments').and.returnValue(of(uploadedDocumentsResponse));
      });

      it('should populate the uploaded documents', fakeAsync(() => {
        fixture.detectChanges();
        flush();

        expect(component.merchantDocuments).toEqual(uploadedDocuments);
      }));
    }); // describe - when getMerchantDocuments() SUCCEEDS

    describe('when getMerchantDocuments() FAILS', () => {
      const error = new ErrorResponse(expectationFailedFactory.build());

      beforeEach(() => {
        spyOn(merchantService, 'getMerchantDocuments').and.returnValue(throwError(error));
        spyOn(errorService, 'show');
        spyOn(loggingService, 'log');
      });

      it('should log the error', fakeAsync(() => {
        fixture.detectChanges();
        flush();

        expect(errorService.show).toHaveBeenCalledWith(UiError.getMerchantDocuments);
        expect(loggingService.log).toHaveBeenCalledWith(error);
      }));
    }); // describe - when getMerchantDocuments() FAILS
  }); // describe - ngOnInit()

  describe('getDocumentType()', () => {
    it('should return the proper label', () => {
      const code = DocumentCode.uploaded_bank_statements;
      const reference = DOC_SELECT_OPTIONS.find(option => option.value === code).label;

      expect(component.getDocumentType(code)).toEqual(reference);
    });

    it('should return N/A when no label is found', () => {
      const code = null;
      const reference = 'COMMON.NOT_AVAILABLE';

      expect(component.getDocumentType(code)).toEqual(reference);
    });
  }); // describe - getDocumentType()
});
