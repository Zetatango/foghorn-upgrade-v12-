import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { CookieService } from 'ngx-cookie-service';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { BusinessPartnerInvoiceUploadComponent } from './business-partner-invoice-upload.component';
import { Invoice } from 'app/models/api-entities/invoice';
import { UiError } from 'app/models/ui-error';
import { BusinessPartnerMerchantService } from 'app/services/business-partner-merchant.service';
import { ErrorService } from 'app/services/error.service';
import { UtilityService } from 'app/services/utility.service';
import { ErrorModalContext } from 'app/components/utilities/error-modal/error-modal-context';
import { LoggingService, GTMEvent } from 'app/services/logging.service';
import { businessPartnerCustomerSummary } from 'app/test-stubs/factories/business-partner';
import { invoiceResponse, invoiceResponseResponseFactory } from 'app/test-stubs/factories/invoice';
import {
  errorDisabledEvent,
  errorEnabledEvent,
  inputChangeEnabledEvent,
  resetEvent,
  finalizedEventWithResponse,
  finalizedEventWithFilesAndResponse
} from 'app/test-stubs/factories/upload-event';
import { businessPartnerMerchantFactory } from 'app/test-stubs/factories/business-partner-merchant';
import { HttpErrorResponse } from '@angular/common/http';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';
import Bugsnag from '@bugsnag/js';
import { ErrorResponse } from "app/models/error-response";

describe('BusinessPartnerInvoiceUploadComponent', () => {
  let component: BusinessPartnerInvoiceUploadComponent;
  let fixture: ComponentFixture<BusinessPartnerInvoiceUploadComponent>;
  let loggingService: LoggingService;
  let bpms: BusinessPartnerMerchantService;
  let errorService: ErrorService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        BusinessPartnerInvoiceUploadComponent
      ],
      imports: [
        HttpClientTestingModule,
        ReactiveFormsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        BusinessPartnerMerchantService,
        CookieService,
        ErrorService,
        LoggingService,
        UtilityService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BusinessPartnerInvoiceUploadComponent);
    component = fixture.componentInstance;
    // Set Input values
    component.businessPartnerMerchant = businessPartnerCustomerSummary.business_partner_merchants[0];

    loggingService = TestBed.inject(LoggingService);
    errorService = TestBed.inject(ErrorService);
    bpms = TestBed.inject(BusinessPartnerMerchantService);
    spyOn(loggingService, 'GTMUpdate');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize the form group', () => {
      component.ngOnInit();
      expect(component.invoiceFormGroup).not.toBeNull();
      expect(component.uploaderOptions).not.toBeNull();
      expect(component.isSubmitDisabled()).toBeTruthy();
      expect(component.isSubmittingDocs()).toBeFalsy();
    });
  });

  describe('submitSendInvoice', () => {
    it('should display generic error dialog if call to submitDocuments does not receive response data', () => {
      spyOn(Bugsnag, 'notify');
      spyOn(errorService, 'show');

      component.submitSendInvoice(errorEnabledEvent.response);

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general);
    });

    it('should trigger a bugsnag if call to submitSendInvoice does not receive response data', () => {
        spyOn(errorService, 'show');
        spyOn(Bugsnag, 'notify');
        spyOn(component.sendHideModalEvent, 'emit');

        component.submitSendInvoice(errorEnabledEvent.response);

        expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
        expect(component.sendHideModalEvent.emit).toHaveBeenCalledTimes(1);
        expect(errorService.show).toHaveBeenCalledTimes(1);
      });

    it('should emit a dismiss dialog event if submitSendInvoice fails', () => {
        fixture.detectChanges();
        spyOn(errorService, 'show');
        spyOn(Bugsnag, 'notify');
        spyOn(component.sendHideModalEvent, 'emit');

        component.submitSendInvoice(null);

        expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
        expect(component.sendHideModalEvent.emit).toHaveBeenCalledTimes(1);
        expect(errorService.show).toHaveBeenCalledTimes(1);
      });

    it('should trigger a bugsnag if call to sendInvoice fails', () => {
      const error = internalServerErrorFactory.build();
      fixture.detectChanges();
        spyOn(errorService, 'show');
        spyOn(Bugsnag, 'notify');
        spyOn(component.sendHideModalEvent, 'emit');
        spyOn(bpms, 'sendInvoice').and.returnValue(throwError(error));

        component.invoiceFormGroup.setValue({
          invInvoiceNumber: '123',
          invAccountNumber: '321',
          invAmount: '1234.56',
          invDueDate: '01/01/2019'
        });
        component.submitSendInvoice(finalizedEventWithResponse.response);

        expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    });

    it('should show generic error modal if call to sendInvoice fails', () => {
      fixture.detectChanges();
      spyOn(bpms, 'sendInvoice').and.returnValue(throwError(internalServerErrorFactory.build()));
      spyOn(errorService, 'show');
      spyOn(Bugsnag, 'notify');

      component.invoiceFormGroup.setValue({
        invInvoiceNumber: '123',
        invAccountNumber: '321',
        invAmount: '1234.56',
        invDueDate: '01/01/2019'
      });

      component.submitSendInvoice(finalizedEventWithResponse.response);

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general);
    });

    it('should show duplicate invoice error if call to sendInvoice fails with duplicate error', () => {
      fixture.detectChanges();
      const err = new ErrorResponse(new HttpErrorResponse({ status: 422, error: { code: 71007 } }));
      spyOn(bpms, 'sendInvoice').and.returnValue(throwError(err));
      spyOn(errorService, 'show');
      spyOn(Bugsnag, 'notify');

      component.invoiceFormGroup.setValue({
        invInvoiceNumber: '123',
        invAccountNumber: '321',
        invAmount: '1234.56',
        invDueDate: '01/01/2019'
      });

      component.submitSendInvoice(finalizedEventWithResponse.response);

      const expectedContext: ErrorModalContext = new ErrorModalContext(
        'INVOICE.SEND_ERROR',
        [ 'INVOICE.DUPLICATE_INVOICE_NUMBER_ERROR' ]
      );

      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general, expectedContext);
    });

    it('should call loggingService.GTMUpdate with correct button label', () => {
        fixture.detectChanges();
        spyOn(bpms, 'sendInvoice').and.returnValue(of(invoiceResponseResponseFactory.build()));
        spyOn(bpms, 'getBusinessPartnerMerchantInvoiceApplication').and.returnValue(new BehaviorSubject<Invoice>(invoiceResponse));

        component.invoiceFormGroup.setValue({
          invInvoiceNumber: '123',
          invAccountNumber: '321',
          invAmount: '1234.56',
          invDueDate: '01/01/2019'
        });

        component.submitSendInvoice(finalizedEventWithResponse.response);

        expect(loggingService.GTMUpdate).toHaveBeenCalledOnceWith(GTMEvent.BUTTON_CLICKED, 'Send Invoice');
    });
  });

  describe('onStatusChange', () => {
    it('should enable submit button when errorDisabledEvent is received', () => {
      component.onSubmit();
      component.onStatusChange(errorDisabledEvent);

      expect(component.isSubmitDisabled()).toBeTruthy();
      expect(component.isSubmittingDocs()).toBeFalsy();
    });

    it('should disable submit button when errorEnabledEvent is received', () => {
      component.onSubmit();
      component.onStatusChange(errorEnabledEvent);

      expect(component.isSubmitDisabled()).toBeFalsy();
      expect(component.isSubmittingDocs()).toBeFalsy();
    });

    it('should reset submit button when reset event is received', () => {
      component.onStatusChange(inputChangeEnabledEvent);
      expect(component.isSubmitDisabled()).toBeFalsy();

      component.onSubmit();
      expect(component.isSubmittingDocs()).toBeTruthy();

      component.onStatusChange(resetEvent);
      expect(component.isSubmitDisabled()).toBeTruthy();
      expect(component.isSubmittingDocs()).toBeFalsy();
    });

    it('it should call submitSendInvoice', () => {
      spyOn(component, 'submitSendInvoice');

      component.onStatusChange(finalizedEventWithFilesAndResponse(1));
      expect(component.isSubmittingDocs()).toBeFalsy();
      expect(component.submitSendInvoice).toHaveBeenCalledOnceWith(finalizedEventWithFilesAndResponse(1).response);
    });
  });

  describe('isSubmittingDocuments', () => {
    it('should return submittingDocs ', () => {
      expect(component.isSubmittingDocs()).toBeFalsy();
      component.onSubmit();
      expect(component.isSubmittingDocs()).toBeTruthy();
    });
  });

  describe('onSubmit', () => {
    it('should update status of submittingDocs, disableSubmit to be true', () => {
      component.onSubmit();
      expect(component.isSubmittingDocs()).toBeTruthy();
      expect(component.isSubmitDisabled()).toBeTruthy();
    });
  });

  describe('form validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('empty form is invalid', () => {
      expect(component.invoiceFormGroup.valid).toBeFalsy();
    });

    it('should have no errors on valid input', () => {
      component.invoiceFormGroup.setValue({
        invAccountNumber: '123',
        invInvoiceNumber: '321',
        invAmount: '1234.00',
        invDueDate: '01/01/2019'
      });
      expect(component.invoiceFormGroup.valid).toBeTruthy();
    });

    it('should allow account number to be optional', () => {
      component.invoiceFormGroup.setValue({
        invAccountNumber: '',
        invInvoiceNumber: '321',
        invAmount: '1234.00',
        invDueDate: '01/01/2019'
      });
      expect(component.invoiceFormGroup.valid).toBeTruthy();
    });

    it('should enforce account number pattern', () => {
      component.invoiceFormGroup.setValue({
        invAccountNumber: '&^*&^%$%',
        invInvoiceNumber: '321',
        invAmount: '1234.00',
        invDueDate: '01/01/2019'
      });
      expect(component.invoiceFormGroup.valid).toBeFalsy();

      const errors = component.invoiceFormGroup.controls['invAccountNumber'].errors || {};
      expect(errors['pattern']).toBeTruthy();
    });

    it('should enforce invoice number as a required field', () => {
      component.invoiceFormGroup.setValue({
        invAccountNumber: '123',
        invInvoiceNumber: '',
        invAmount: '1234.00',
        invDueDate: '01/01/2019'
      });
      expect(component.invoiceFormGroup.valid).toBeFalsy();

      const errors = component.invoiceFormGroup.controls['invInvoiceNumber'].errors || {};
      expect(errors['required']).toBeTruthy();
    });

    it('should enforce invoice number pattern', () => {
      component.invoiceFormGroup.setValue({
        invAccountNumber: '123',
        invInvoiceNumber: '&^*&^%$%',
        invAmount: '1234.00',
        invDueDate: '01/01/2019'
      });
      expect(component.invoiceFormGroup.valid).toBeFalsy();

      const errors = component.invoiceFormGroup.controls['invInvoiceNumber'].errors || {};
      expect(errors['pattern']).toBeTruthy();
    });

    it('should enforce amount as a required field', () => {
      component.invoiceFormGroup.setValue({
        invAccountNumber: '123',
        invInvoiceNumber: '321',
        invAmount: '',
        invDueDate: '01/01/2019'
      });
      expect(component.invoiceFormGroup.valid).toBeFalsy();

      const errors = component.invoiceFormGroup.controls['invAmount'].errors || {};
      expect(errors['required']).toBeTruthy();
    });

    it('should enforce amount pattern', () => {
      component.invoiceFormGroup.setValue({
        invAccountNumber: '123',
        invInvoiceNumber: '321',
        invAmount: '0.12',
        invDueDate: '01/01/2019'
      });
      expect(component.invoiceFormGroup.valid).toBeFalsy();

      const errors = component.invoiceFormGroup.controls['invAmount'].errors || {};
      expect(errors['pattern']).toBeTruthy();
    });

    it('should enforce due date as a required field', () => {
      component.dateValue = null;
      component.invoiceFormGroup.setValue({
        invAccountNumber: '123',
        invInvoiceNumber: '321',
        invAmount: '1234.00',
        invDueDate: ''
      });
      expect(component.invoiceFormGroup.valid).toBeFalsy();

      const errors = component.invoiceFormGroup.controls['invDueDate'].errors || {};
      expect(errors['required']).toBeTruthy();
    });
  });

  describe('hideModal', () => {
    it('should send an event to the parent component to hide the invoice dialog', () => {
      spyOn(component.sendHideModalEvent, 'emit');

      component.hideModal();

      expect(component.sendHideModalEvent.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('invoiceEmail', () => {
    it('should return the sign up email when present', () => {
      const email = component.businessPartnerMerchant.sign_up_email;
      expect(component.invoiceEmail).toEqual(email);
    });

    it('should return the email when sign up email is nil', () => {
      component.businessPartnerMerchant = businessPartnerMerchantFactory.build({ sign_up_email: null });
      const email = component.businessPartnerMerchant.email;
      expect(component.invoiceEmail).toEqual(email);
    });
  });

  describe('invoicePayor', () => {
    it('should return the sign up name when present', () => {
      const name = component.businessPartnerMerchant.sign_up_name;
      expect(component.invoicePayor).toEqual(name);
    });

    it('should return the name when sign up name is nil', () => {
      component.businessPartnerMerchant = businessPartnerMerchantFactory.build({ sign_up_name: null });
      const name = component.businessPartnerMerchant.name;
      expect(component.invoicePayor).toEqual(name);
    });
  });
});
