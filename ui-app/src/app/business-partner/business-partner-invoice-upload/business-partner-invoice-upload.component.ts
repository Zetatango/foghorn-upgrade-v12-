import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { finalize, take } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { BusinessPartnerMerchant } from 'app/models/api-entities/business-partner-customer-summary';
import { UploadedDocumentDestination } from 'app/models/api-entities/file-storage';
import { BusinessPartnerMerchantService } from 'app/services/business-partner-merchant.service';
import { ErrorService } from 'app/services/error.service';
import { LoggingService, GTMEvent } from 'app/services/logging.service';
import { CustomUploaderOptions } from 'app/models/custom-uploader-options';
import { DocumentCode } from 'app/models/api-entities/merchant-document-status';
import { UploadEvent, UploadEventType } from 'app/models/upload-event';
import { UiError } from 'app/models/ui-error';
import { ErrorModalContext } from 'app/components/utilities/error-modal/error-modal-context';
import { CURRENCY_CLEAVE_CONFIG } from 'app/constants/formatting.constants';
import { ZttResponse } from 'app/models/api-entities/response';
import { ErrorMessage, ErrorResponse } from "app/models/error-response";
import Bugsnag from '@bugsnag/js';

@Component({
  selector: 'ztt-business-partner-invoice-upload',
  templateUrl: './business-partner-invoice-upload.component.html',
  providers: [DatePipe]
})
export class BusinessPartnerInvoiceUploadComponent implements OnInit {
  readonly currencyCleaveConfig = CURRENCY_CLEAVE_CONFIG;
  private _invoiceFormGroup: FormGroup;
  private _businessPartnerMerchant: BusinessPartnerMerchant;
  private _dateValue: Date = new Date();
  private _uploaderOptions: CustomUploaderOptions;

  private submittingDocs: boolean;
  private disableSubmit: boolean;

  @Output() sendInvoiceCompleteEvent = new EventEmitter<boolean>();
  @Output() sendHideModalEvent = new EventEmitter<boolean>();

  constructor(private businessPartnerMerchantService: BusinessPartnerMerchantService,
              private errorService: ErrorService,
              private translateService: TranslateService,
              private formBuilder: FormBuilder,
              private loggingService: LoggingService,
              private datePipe: DatePipe) {}

  ngOnInit(): void {
    this.invoiceFormGroup = this.formBuilder.group({
      invAccountNumber: [null, null],
      invInvoiceNumber: [null, null],
      invAmount: [null, null],
      invDueDate: [null, null]
    });
    this.submittingDocs = false;
    this.disableSubmit = true;
    this.uploaderOptions = {
      autoUpload: true,
      destination: UploadedDocumentDestination.ZETATANGO,
      documentType: DocumentCode.business_partner_invoice,
      messageSupport: false,
      requireDocumentType: false,
      uploader: {concurrency: 1, maxUploads: 1}
    };
  }

  onStatusChange(event: UploadEvent): void {
    this.disableSubmit = event.disabled;
    if (event.type === UploadEventType.FINALIZED) {
      this.submittingDocs = false;
      this.submitSendInvoice(event.response);
    } else if (event.type === UploadEventType.ERROR) {
      this.submittingDocs = false;
    } else if (event.type === UploadEventType.RESET) {
      this.submittingDocs = false;
      this.disableSubmit = true;
    }
  }

  submitSendInvoice(response: ZttResponse<string>): void {
    this.loggingService.GTMUpdate(GTMEvent.BUTTON_CLICKED, 'Send Invoice');
    if (response?.data) {
      const merchantDocuments: string[] = JSON.parse(response.data);
      this.sendInvoice(this.businessPartnerMerchant, merchantDocuments);
    } else {
      Bugsnag.notify(new ErrorMessage('Error submitting invoice'));

      this.errorService.show(UiError.general);
      this.hideModal();
    }
  }

  private sendInvoice(payor: BusinessPartnerMerchant, merchantDocuments: string[]) {
    const invoiceNumber: string = this.invoiceFormGroup.controls['invInvoiceNumber'].value;
    const accountNumber: string = this.invoiceFormGroup.controls['invAccountNumber'].value;
    const amount: number = parseFloat(this.invoiceFormGroup.controls['invAmount'].value);
    const merchantDocument: string = merchantDocuments[0];
    const chosenDate = new Date(this.invoiceFormGroup.controls['invDueDate'].value);
    const dueDate: string = this.datePipe.transform(chosenDate, 'dd/MM/yyyy');

    this.businessPartnerMerchantService.sendInvoice(payor.id, invoiceNumber, accountNumber, amount, merchantDocument, dueDate).pipe(take(1),
      finalize(() => this.submittingDocs = false)).subscribe(
      () => {
        this.sendInvoiceCompleteEvent.emit(true);
      },
      (e: ErrorResponse) => {
        Bugsnag.notify(e);

        if (e.errorCode === 71007) {
          const context: ErrorModalContext = new ErrorModalContext(
            'INVOICE.SEND_ERROR',
            [
              this.translateService.instant('INVOICE.DUPLICATE_INVOICE_NUMBER_ERROR')
            ]
          );
          this.errorService.show(UiError.general, context);
        } else {
          this.errorService.show(UiError.general);
        }
        this.hideModal();
      }
    );
  }

  onSubmit(): void {
    this.submittingDocs = true;
    this.disableSubmit = true;
  }

  hideModal(): void {
    this.sendHideModalEvent.emit();
  }

  get invoiceFormGroup(): FormGroup {
    return this._invoiceFormGroup;
  }

  set invoiceFormGroup(value: FormGroup) {
    this._invoiceFormGroup = value;
  }

  get businessPartnerMerchant(): BusinessPartnerMerchant {
    return this._businessPartnerMerchant;
  }

  @Input()
  set businessPartnerMerchant(value: BusinessPartnerMerchant) {
    this._businessPartnerMerchant = value;
  }

  get dateValue(): Date {
    return this._dateValue;
  }

  set dateValue(value: Date) {
    this._dateValue = value;
  }

  get invoiceEmail(): string {
    return (this._businessPartnerMerchant.sign_up_email) ? this._businessPartnerMerchant.sign_up_email : this._businessPartnerMerchant.email;
  }

  get invoicePayor(): string {
    return (this._businessPartnerMerchant.sign_up_name) ? this._businessPartnerMerchant.sign_up_name : this._businessPartnerMerchant.name;
  }

  isSubmittingDocs(): boolean {
    return this.submittingDocs;
  }

  isSubmitDisabled(): boolean {
    return this.disableSubmit;
  }

  get uploaderOptions(): CustomUploaderOptions {
    return this._uploaderOptions;
  }

  set uploaderOptions(value: CustomUploaderOptions) {
    this._uploaderOptions = value;
  }
}
