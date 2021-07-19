import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UploadedDocumentDestination } from 'app/models/api-entities/file-storage';
import { CustomUploaderOptions } from 'app/models/custom-uploader-options';
import { UploadEvent, UploadEventType } from 'app/models/upload-event';
import { DOC_SELECT_OPTIONS, DocumentTypeOption } from 'app/models/api-entities/merchant-document-status';
import { GTMStatus, LoggingService } from 'app/services/logging.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UploadBoxComponent} from 'app/components/utilities/upload-box/upload-box.component';

@Component({
  selector: 'ztt-documents',
  templateUrl: './documents.component.html'
})
export class DocumentsComponent implements OnInit {
  @ViewChild(UploadBoxComponent) uploadBox!: UploadBoxComponent;

  disableSubmit = true;
  documentTypes: DocumentTypeOption[];
  filesUploaded = 0;
  showSuccessMessage = false;
  showMerchantDocuments: boolean;
  submittingDocs = false;

  uploaderOptions: CustomUploaderOptions = {
    autoUpload: false,
    destination: UploadedDocumentDestination.WILE_E,
    messageSupport: true,
    requireDocumentType: true,
    uploader: {
      concurrency: 1
    }
  };

  get filesQueued(): boolean {
    return this.uploadBox?.files.length > 0;
  }

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _loggingService: LoggingService,
    private _stateRoutingService: StateRoutingService
  ) {}


  ngOnInit(): void {
    this.documentTypes = this._activatedRoute.snapshot.firstChild.data['documentTypes'] || DOC_SELECT_OPTIONS;
    this.showMerchantDocuments = this._activatedRoute.snapshot.firstChild.data['showMerchantDocuments'] ?? true;
  }

  onStatusChange(event: UploadEvent): void {
    this.disableSubmit = event.disabled;

    if (event.type === UploadEventType.FINALIZED && !this.showSuccessMessage && event.filesUploaded > 0) {
      this.filesUploaded = event.filesUploaded;

      const url = this._stateRoutingService.url;
      this.uploadBox.files?.forEach(file => {
        this._loggingService.GTMAction(url, file.documentType, GTMStatus.SUCCESS);
      });
      this.showSuccessMessage = true;
      this.submittingDocs = false;
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 5000);
    } else if (event.type === UploadEventType.ERROR) {
      this.submittingDocs = false;
    } else if (event.type === UploadEventType.RESET) {
      this.submittingDocs = false;
      this.disableSubmit = true;
    }
  }

  onSubmit(): void {
    this.submittingDocs = true;
    this.disableSubmit = true;
  }
}
