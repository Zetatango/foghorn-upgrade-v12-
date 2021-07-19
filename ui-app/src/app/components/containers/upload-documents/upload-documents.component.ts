import { Component, OnDestroy, OnInit } from '@angular/core';
import { UploadedDocumentDestination } from 'app/models/api-entities/file-storage';
import { LendingApplication } from 'app/models/api-entities/lending-application';
import { DocumentCode } from 'app/models/api-entities/merchant-document-status';
import { CustomUploaderOptions } from 'app/models/custom-uploader-options';
import { UploadEvent, UploadEventType } from 'app/models/upload-event';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { Subscription } from 'rxjs';
import { StateRoutingService } from 'app/services/state-routing.service';
import { AppRoutes } from 'app/models/routes';

@Component({
  selector: 'ztt-upload-documents',
  templateUrl: './upload-documents.component.html'
})
export class UploadDocumentsComponent implements OnInit, OnDestroy {
  static className =  'upload_documents';
  // Service Entities
  lendingApplication: LendingApplication;

  // Subscriptions
  private lendingApplicationSubscription$: Subscription;

  // Document Uploaded related
  _uploaderOptions: CustomUploaderOptions;

  // UI flags
  private submittingDocs: boolean;
  private disableSubmit: boolean;

  constructor(private lendingApplicationsService: LendingApplicationsService,
              private bankingFlowService: BankingFlowService,
              private stateRoutingService: StateRoutingService) {}

  ngOnInit(): void {
    this.setLendingApplicationSubscription();
    this.submittingDocs = false;
    this.disableSubmit = true;
    this.uploaderOptions = {
      autoUpload: true,
      destination: UploadedDocumentDestination.WILE_E,
      documentType: DocumentCode.cra_tax_assessment,
      messageSupport: false,
      requireDocumentType: false,
      uploader: {
        concurrency: 1
      },
      source_guid: this.lendingApplication.id
    };
  }

  ngOnDestroy(): void {
    if (this.lendingApplicationSubscription$ && !this.lendingApplicationSubscription$.closed) { this.lendingApplicationSubscription$.unsubscribe(); }
  }

  // SUBSCRIPTIONS

  /**
   * Subscribes to current application.
   */
  setLendingApplicationSubscription(): void {
    this.lendingApplicationSubscription$ = this.lendingApplicationsService.lendingApplication$
      .subscribe((application: LendingApplication) => this.lendingApplication = application);
  }

  onStatusChange(event: UploadEvent): void {
    this.disableSubmit = event.disabled;
    if (event.type === UploadEventType.FINALIZED) {
      this.submittingDocs = false;
      this.stateRoutingService.navigate(AppRoutes.application.approval_pending, true);
    } else if (event.type === UploadEventType.ERROR) {
      this.submittingDocs = false;
    } else if (event.type === UploadEventType.RESET) {
      this.submittingDocs = false;
      this.disableSubmit = true;
    }
  }

  submit(): void {
    this.disableSubmit = true;
    this.submittingDocs = true;
  }

  cancel(): void {
    this.bankingFlowService.triggerCancelEvent();
  }

  // GETTERS

  isSubmitDisabled(): boolean {
    return this.disableSubmit;
  }

  isSubmittingDocuments(): boolean {
    return this.submittingDocs;
  }

  get uploaderOptions(): CustomUploaderOptions {
    return this._uploaderOptions;
  }

  set uploaderOptions(value: CustomUploaderOptions) {
    this._uploaderOptions = value;
  }
}
