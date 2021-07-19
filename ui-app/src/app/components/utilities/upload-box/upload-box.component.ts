import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  ViewChildren
} from '@angular/core';
import { FilePayload, SubmitDocsPayload } from 'app/models/api-entities/file-storage';
import { DOC_SELECT_OPTIONS, DocumentTypeOption } from 'app/models/api-entities/merchant-document-status';
import { CustomUploadFile } from 'app/models/custom-upload-file';
import { CustomUploaderOptions } from 'app/models/custom-uploader-options';
import { UiError } from 'app/models/ui-error';
import { ErrorService } from 'app/services/error.service';
import { FileStorageService, PAYLOAD_TOO_LARGE, UNSUPPORTED_MEDIA_TYPE } from 'app/services/file-storage.service';
import { MerchantService } from 'app/services/merchant.service';
import { UploadInput, UploadOutput, UploadStatus } from 'ngx-uploader';
import { finalize, take } from 'rxjs/operators';
import { UploadEvent, UploadEventType } from 'app/models/upload-event';
import { ConfigurationService } from 'app/services/configuration.service';
import { UiAlert, UiAlertStatus } from 'app/models/ui-alerts';
import { ZttResponse } from 'app/models/api-entities/response';
import { ErrorResponse } from 'app/models/error-response';
import Bugsnag from '@bugsnag/js';

@Component({
  selector: 'ztt-upload-box',
  templateUrl: './upload-box.component.html'
})
export class UploadBoxComponent implements OnInit {
  @ViewChildren('fileInput') fileInputs!: QueryList<ElementRef>;

  @Input() documentTypes = DOC_SELECT_OPTIONS as DocumentTypeOption[];
  @Input() options: CustomUploaderOptions;

  @Input() set isUserSubmitting(isUserSubmitting: boolean) {
    if (!isUserSubmitting) return;

    this.options.autoUpload ? this.finalizeUpload() : this.startUpload();
  }

  @Output() statusChanged = new EventEmitter<UploadEvent>();
  @Output() fileChangedEvent = new EventEmitter<File>(); // for business partner branding.

  currentDate = new Date();
  disableInputs = false;
  files = [] as CustomUploadFile[];
  uploadInput = new EventEmitter<UploadInput>();

  private _alerts: Array<UiAlert> = [];
  private _filesUploaded = 0;
  private _supportedFileFormats: string;

  get alerts(): Array<UiAlert> {
    return this._alerts;
  }

  get supportedFileFormats(): string {
    return this._supportedFileFormats;
  }

  set supportedFileFormats(value: string) {
    this._supportedFileFormats = value;
  }

  get fileSize(): number {
    return this.configurationService.maxFileSize / 1024 / 1024;
  }

  constructor(
    private configurationService: ConfigurationService,
    private errorService: ErrorService,
    private fileStorageService: FileStorageService,
    private merchantService: MerchantService,
  ) {}

  ngOnInit(): void {
    this.initializeUploader();
  }

  onUploadOutput(output: UploadOutput): void {
    if (output.type === 'allAddedToQueue' && this.options.autoUpload) {
      this.startUpload();
    } else if (output.type === 'addedToQueue' && output.file && this.options.uploader.maxUploads > this.files.length) {
      this.files.push(output.file);
      this.fileChangedEvent.emit(output.file.nativeFile);
      this.clearFileInputs();
    } else if (output.type === 'uploading') {
      const index = this.files.findIndex((file: CustomUploadFile) => output.file && file.id === output.file.id);
      if (index >= 0 && index < this.files.length) {
        this.files[index] = output.file;
        this.updateStatus(UploadEventType.INPUT_CHANGE, undefined, true);
      }
    } else if (output.type === 'rejected') {
      const illegalFileMessage = {
        msg: 'UPLOAD.REJECTED_FILE',
        params: {
          filename: output.file.name
        },
        type: UiAlertStatus.danger
      };
      this.alerts.push(illegalFileMessage);
      this.clearFileInputs();
    } else if (output.type === 'allAddedToQueue' && !this.options.autoUpload) {
      this.updateStatus(UploadEventType.INPUT_CHANGE);
    } else if (output.type === 'cancelled' || output.type === 'removed') {
      this.files = this.files.filter((file: CustomUploadFile) => file !== output.file);
      this.fileChangedEvent.emit(null);
      this.updateStatus(UploadEventType.INPUT_CHANGE);
    } else if (output.type === 'done') {
      if (output.file.responseStatus !== 200) {
        const index = this.files.findIndex((file: CustomUploadFile) => output.file && file.id === output.file.id);
        if (index >= 0 && index < this.files.length) {
          this.files[index].error = true;
          this.errorService.show(UiError.general);
          this.updateStatus(UploadEventType.ERROR);
        }
      }
      const allUploaded = this.files.filter((file: CustomUploadFile) => file.progress.status === UploadStatus.Done).length - this.files.length === 0;

      if (allUploaded) {
        if (this.options.autoUpload) {
          this.updateStatus(UploadEventType.READY);
        } else {
          //  Let the user know how many files they uploaded,
          //  then reset the uploader for more uploading
          this.finalizeUpload();
        }
      }
    }
  }

  removeFile(file: CustomUploadFile): void {
    if (!file) return;

    switch (file.progress.status) {
      case UploadStatus.Uploading:
        return this.cancelFileUpload(file.id);
      case UploadStatus.Done:
        return this.removeFileUpload(file);
      case UploadStatus.Queue:
      default:
        return this.clearFileUpload(file.id);
    }
  }

  updateSelectStatus(): void {
    this.updateStatus(UploadEventType.INPUT_CHANGE);
  }

  hasMessage(file: CustomUploadFile): boolean {
    if (!file) return false;

    return file.error || !this.isFileValid(file) || this.isFileUploading(file) || (this.options.autoUpload && this.isFileValid(file));
  }

  isFileSizeAllowed(file: CustomUploadFile): boolean {
    return !!file && !!file.size && file.size > 0 && file.size < this.configurationService.maxFileSize && file.responseStatus !== PAYLOAD_TOO_LARGE;
  }

  isFileUploading(file: CustomUploadFile): boolean {
    if (!file) return false;

    const percent = this.fileUploadPercent(file);
    return  percent > 0 && percent < 100;
  }

  fileUploadPercent(file: CustomUploadFile): number {
    return file?.progress?.data?.percentage ?? 0;
  }

  isFileUploadDone(file: CustomUploadFile): boolean {
    return this.fileUploadPercent(file) === 100;
  }

  isFileValid(file: CustomUploadFile): boolean {
    return this.isFileSizeAllowed(file) && this.isFileTypeSupported(file) && !this.isMissingFileType(file) && !file.error;
  }

  isMissingFileType(file: CustomUploadFile): boolean {
    return this.options.requireDocumentType && !!file && !file.documentType;
  }

  isUploaderDisabled(): boolean {
    return this.disableInputs || (!Number.isNaN(this.options.uploader.maxUploads) && this.options.uploader.maxUploads <= this.files.length);
  }

  isUploadMessageVisible(f: CustomUploadFile): boolean {
    return !this.isFileUploadDone(f) && this.isFileValid(f);
  }

  private clearFileUpload(fileId: string): void {
    // Since file wasn't uploaded, we cannot cancel it
    // Emitting 'remove' is the same as cancel just without handling in-progress file uploading
    this.uploadInput.emit({ type: 'remove', id: fileId });
  }

  private cancelFileUpload(fileId: string): void {
    this.uploadInput.emit({ type: 'cancel', id: fileId });
  }

  private removeFileUpload(file: CustomUploadFile): void {
    const removeFilePayload: FilePayload = {
      file_id: file.id,
      document_type: file.documentType || this.options.documentType
    };

    this.fileStorageService.removeFile(removeFilePayload)
      .pipe(take(1))
      .subscribe(
        () => {
          this.uploadInput.emit({ type: 'remove', id: file.id })
        },
        (err: ErrorResponse) => {
          if (err.statusCode === 404) {
            this.uploadInput.emit({ type: 'remove', id: file.id });
          } else {
            this.errorService.show(UiError.general);
          }
        }
      );
  }

  private isFileTypeSupported(file: CustomUploadFile): boolean {
    return !!file && !!file.type && this.options.uploader.allowedContentTypes.includes(file.type) && file.responseStatus !== UNSUPPORTED_MEDIA_TYPE;
  }

  private cleanFiles(): void {
    this.fileStorageService.cleanFiles()
      .pipe(take(1))
      .subscribe({
        error: (e: ErrorResponse) => Bugsnag.notify(e)
      });
  }

  private clearFileInputs(): void {
    this.fileInputs?.forEach((input) => {
      input.nativeElement.value = '';
    });
  }

  private enableInputs(): void {
    if (this.options.autoUpload) this.disableInputs = false;
  }

  private finalizeUpload(): void {
    this.disableInputs = true;
    const source_guid = (this.options.source_guid === undefined) ? this.merchantId : this.options.source_guid;
    const docs_payload: SubmitDocsPayload = {
      source_guid: source_guid,
      destination: this.options.destination
    };
    this.fileStorageService.submitDocuments(docs_payload)
      .pipe(take(1))
      .subscribe(
        (res: ZttResponse<string>) => {
          if (this.options.messageSupport) {
            this.messageSupport();
          } else {
            this.updateStatus(UploadEventType.FINALIZED, res);
            this.resetUploader();
          }
        },
        (e: ErrorResponse) => {
          Bugsnag.notify(e);

          this.resetUploader();
          this.errorService.show(UiError.general);
        });
  }

  private initializeUploader(): void {
    this.options.uploader.allowedContentTypes ||= this.configurationService.supportedFileFormats.split(',');
    this.options.uploader.maxUploads ||= this.configurationService.maxUploads;
    this.supportedFileFormats = this.fileStorageService.getSupportedFileFormats(this.options.uploader.allowedContentTypes);
  }

  private isSubmitDisabled(): boolean {
    const invalidFiles = this.files.filter(file => !this.isFileValid(file));
    return invalidFiles.length > 0 || this.files.length === 0;
  }

  private messageSupport(): void {
    const reason = `A merchant just uploaded ${this.files.length} documents.`;

    this.merchantService.requestAssistance(reason)
      .then(() => {
        this.updateStatus(UploadEventType.FINALIZED);
      })
      .catch(() => {
        this.errorService.show(UiError.general);
      })
      .finally(() => {
        this.resetUploader();
      });
  }

  private resetUploader(): void {
    this.uploadInput.emit({ type: 'removeAll' });
    this.files = [];
    this._filesUploaded = 0;
    this.disableInputs = false;
    this.updateStatus(UploadEventType.RESET);
    this.cleanFiles();
  }

  private startUpload(): void {
    const files = this.files.filter(file => file.progress && file.progress.status === UploadStatus.Queue && this.isFileValid(file));
    if (!files.length) return;

    this.disableInputs = true;
    files.forEach((file: CustomUploadFile) => {
      const upload = this.fileStorageService.prepareUpload(file, this.options.destination, this.options.documentType);
      upload.pipe(take(1), finalize(() => this.enableInputs()))
        .subscribe(
          (event: UploadInput) => this.uploadInput.emit(event),
          (e: ErrorResponse) => {
            Bugsnag.notify(e);

            file.error = true;
            this.updateStatus(UploadEventType.ERROR);
            this.errorService.show(UiError.general);
          });
    });
  }

  private updateStatus(type: UploadEventType, submitResponse?: ZttResponse<string>, disabled?: boolean): void {
    const uploadedFiles = this.files.filter(file => file.progress.status === UploadStatus.Done && file.responseStatus === 200);
    this._filesUploaded = (uploadedFiles.length > this._filesUploaded) ? uploadedFiles.length : this._filesUploaded;
    const event = {
      type: type,
      disabled: this.isSubmitDisabled() || !!disabled,
      filesUploaded: type !== UploadEventType.ERROR ? this._filesUploaded : 0,
      response: submitResponse
    };
    this.statusChanged.emit(event);
  }

  private get merchantId(): string {
    return this.merchantService.getMerchant().id;
  }
}
