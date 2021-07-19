import { ComponentFixture, TestBed, inject, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { NgxUploaderModule } from 'ngx-uploader';
import { lendingApplicationApproved } from 'app/test-stubs/factories/lending-application';
import { UtilityService } from 'app/services/utility.service';
import { UploadDocumentsComponent } from './upload-documents.component';
import { ApprovalPendingComponent } from 'app/components/containers/approval-pending/approval-pending.component';
import { DynamicComponentService } from 'app/services/dynamic-component.service';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { LoggingService } from 'app/services/logging.service';
import { CookieService } from 'ngx-cookie-service';
import { MerchantService } from 'app/services/merchant.service';
import { ErrorService } from 'app/services/error.service';
import { UploadedDocumentDestination } from 'app/models/api-entities/file-storage';

import { DocumentCode } from 'app/models/api-entities/merchant-document-status';
import {
  errorDisabledEvent,
  errorEnabledEvent,
  finalizedEventWithFiles,
  inputChangeEnabledEvent,
  resetEvent
} from 'app/test-stubs/factories/upload-event';
import { RouterTestingModule } from '@angular/router/testing';
import { StateRoutingService } from 'app/services/state-routing.service';
import { AppRoutes } from 'app/models/routes';

describe('UploadDocumentsComponent', () => {
  let component: UploadDocumentsComponent;
  let fixture: ComponentFixture<UploadDocumentsComponent>;

  let componentLoader: DynamicComponentService;
  let lendingApplicationsService: LendingApplicationsService;
  let stateRoutingService: StateRoutingService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        HttpClientTestingModule,
        NgxUploaderModule,
        RouterTestingModule
      ],
      declarations: [ UploadDocumentsComponent, ApprovalPendingComponent ],
      providers: [
        BankingFlowService,
        CookieService,
        DynamicComponentService,
        LoggingService,
        MerchantService,
        UtilityService,
        StateRoutingService,
        TranslateService,
        ErrorService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    }).overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [
          ApprovalPendingComponent
        ],
      }
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadDocumentsComponent);
    component = fixture.componentInstance;
    componentLoader = TestBed.inject(DynamicComponentService);

    stateRoutingService = TestBed.inject(StateRoutingService);
    spyOn(stateRoutingService, 'navigate');
    lendingApplicationsService = TestBed.inject(LendingApplicationsService);
    spyOn(componentLoader, 'loadComponent');
    spyOnProperty(lendingApplicationsService, 'lendingApplication$').and.returnValue(new BehaviorSubject(lendingApplicationApproved));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ------------------------------------------------------------------- ngOnInit()
  describe('ngOnInit()', () => {
    it('should set lendingApplication', () => {
        fixture.detectChanges();
        expect(component.lendingApplication).toEqual(lendingApplicationApproved);
    });

    it('should set up component', () => {
      fixture.detectChanges();
      expect(component.isSubmitDisabled()).toBeTruthy();
      expect(component.isSubmittingDocuments()).toBeFalsy();
      const expectedUploaderOptions = {
        autoUpload: true,
        destination: UploadedDocumentDestination.WILE_E,
        documentType: DocumentCode.cra_tax_assessment,
        messageSupport: false,
        requireDocumentType: false,
        uploader: {
          concurrency: 1,
        },
        source_guid: lendingApplicationApproved.id
      };
      expect(component.uploaderOptions).toEqual(expectedUploaderOptions);
    });
  }); // describe - ngOnInit()

  // ------------------------------------------------------------------- submit()
  describe('submit()', () => {
    it('should set submittingDocuments to true ', () => {
      expect(component.isSubmittingDocuments()).toBeFalsy();
      component.onStatusChange(errorEnabledEvent);
      expect(component.isSubmitDisabled()).toBeFalsy();
      component.submit();

      expect(component.isSubmittingDocuments()).toBeTruthy();
      expect(component.isSubmitDisabled()).toBeTruthy();
    });
  }); // describe - submit()

  // ------------------------------------------------------------------- cancel()
  describe('cancel()', () => {
    it('should call triggerCancelEvent from BankingFlowService', inject([BankingFlowService], (bankingFlowService: BankingFlowService) => {
      spyOn(bankingFlowService, 'triggerCancelEvent');

      component.cancel();

      expect(bankingFlowService.triggerCancelEvent).toHaveBeenCalledTimes(1);
    }));
  }); // describe - cancel()

  describe('onStatusChange', () => {
    it('should enable submit button when errorDisabledEvent is received', () => {
      component.submit();
      component.onStatusChange(errorDisabledEvent);

      expect(component.isSubmitDisabled()).toBeTruthy();
      expect(component.isSubmittingDocuments()).toBeFalsy();
    });

    it('should disable submit button when errorEnabledEvent is received', () => {
      component.submit();
      component.onStatusChange(errorEnabledEvent);

      expect(component.isSubmitDisabled()).toBeFalsy();
      expect(component.isSubmittingDocuments()).toBeFalsy();
    });

    it('should reset submit button when reset event is received', () => {
      component.onStatusChange(inputChangeEnabledEvent);
      expect(component.isSubmitDisabled()).toBeFalsy();

      component.submit();
      expect(component.isSubmittingDocuments()).toBeTruthy();

      component.onStatusChange(resetEvent);
      expect(component.isSubmitDisabled()).toBeTruthy();
      expect(component.isSubmittingDocuments()).toBeFalsy();
    });

    it('should load ApprovalPendingComponent on finalized event', () => {
      component.submit();
      component.onStatusChange(finalizedEventWithFiles(1));
      expect(component.isSubmittingDocuments()).toBeFalsy();
      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.approval_pending, true);
    });
  });

  describe('isSubmittingDocuments', () => {
    it('should return submittingDocs ', () => {
      expect(component.isSubmittingDocuments()).toBeFalsy();
      component.submit();
      expect(component.isSubmittingDocuments()).toBeTruthy();
    });
  });

  describe('isSubmitDisabled', () => {
    it('should return waitingForDocuments', () => {
      fixture.detectChanges();
      expect(component.isSubmitDisabled()).toBeTruthy();
      component.onStatusChange(errorEnabledEvent);
      expect(component.isSubmitDisabled()).toBeFalsy();
    });
  });
}); // describe - UploadDocumentsComponent
