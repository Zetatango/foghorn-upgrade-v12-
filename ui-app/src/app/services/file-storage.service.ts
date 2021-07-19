import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_FILE_STORAGE, CONSTANTS } from 'app/constants';
import { FilePayload, SubmitDocsPayload, UploadedDocumentDestination } from 'app/models/api-entities/file-storage';
import { DocumentCode } from 'app/models/api-entities/merchant-document-status';
import { ZttResponse } from 'app/models/api-entities/response';
import { ErrorResponse } from "app/models/error-response";
import { CustomUploadFile } from 'app/models/custom-upload-file';
import { EncryptionBundle } from 'app/models/encryption-bundle';
import { UploadInput } from 'ngx-uploader';
import { Observable, Observer } from 'rxjs';
import { take } from 'rxjs/operators';
import { ConfigurationService } from './configuration.service';
import { CryptoService } from './crypto.service';
import { UtilityService } from './utility.service';

export const PAYLOAD_TOO_LARGE = 413;
export const UNSUPPORTED_MEDIA_TYPE = 415;
export const UPLOAD_URL = location.origin.toString() + API_FILE_STORAGE.UPLOAD_FILE_PATH;
export const CACHE_URL = location.origin.toString() + API_FILE_STORAGE.CACHE_FILE_PATH;

@Injectable({
  providedIn: 'root'
})

export class FileStorageService {

  constructor(private http: HttpClient,
    private utilityService: UtilityService,
    private configurationService: ConfigurationService,
    private cryptoService: CryptoService) {
  }

  // API CALLS
  removeFile(fileStoragePayload: FilePayload): Observable<ZttResponse<void>> {
    const url = API_FILE_STORAGE.REMOVE_FILE_PATH;
    const httpOptions = this.utilityService.getHttpOptionsForBody();
    return this.http.post<ZttResponse<void>>(url, fileStoragePayload, httpOptions);
  }

  submitDocuments(submitDocsPayload: SubmitDocsPayload): Observable<ZttResponse<string>> {
    const url = API_FILE_STORAGE.SUBMIT_DOCUMENTS_PATH;
    const httpOptions = this.utilityService.getHttpOptionsForBody();
    return this.http.post<ZttResponse<string>>(url, submitDocsPayload, httpOptions);
  }

  cleanFiles(): Observable<ZttResponse<void>> {
    const url = API_FILE_STORAGE.CLEAN_FILES_PATH;
    const httpOptions = this.utilityService.getHttpOptionsForBody();
    return this.http.post<ZttResponse<void>>(url, {}, httpOptions);
  }

  s3Upload(url: string, data: File, contentType: string): Observable<ZttResponse<void>> {
    const httpOptions = { headers: new HttpHeaders({ 'Content-Type': contentType }) };
    return this.http.put<ZttResponse<void>>(url, data, httpOptions);
  }

  private prepareS3(file: CustomUploadFile): Observable<ZttResponse<EncryptionBundle>> {
    return new Observable((observer: Observer<ZttResponse<EncryptionBundle>>) => {
      this.cryptoService.fetchEncryptionBundle(file.name)
        .pipe(take(1))
        .subscribe(
          (encryptionBundle: ZttResponse<EncryptionBundle>) => {
            this.s3Upload(encryptionBundle.body.presigned_url, file.nativeFile, file.type)
              .pipe(take(1))
              .subscribe(
                () => observer.next(encryptionBundle),
                (err: ErrorResponse) => observer.error(err));
          },
          (err: ErrorResponse) => observer.error(err));
    });
  }

  prepareUpload(file: CustomUploadFile, destination: UploadedDocumentDestination, documentType: DocumentCode): Observable<UploadInput> {
    return new Observable<UploadInput>((observer: Observer<UploadInput>) => {
      if (this.configurationService.fileEncryptionType === 'backend') {
        return observer.next(this.createUploadInput(file, destination, documentType));
      }
      this.prepareS3(file)
        .subscribe(
          (encryptionBundle: ZttResponse<EncryptionBundle>) =>
            observer.next(this.createUploadInput(file, destination, documentType, encryptionBundle.body.s3_key))
          ,
          (err: ErrorResponse) => observer.error(err));
    });
  }

  private createUploadInput(file: CustomUploadFile, destination: string, documentType: DocumentCode, s3Key?: string): UploadInput {
    if (s3Key) {
      file.nativeFile = new File([''], 'filename');
    }
    const token = this.utilityService.getHttpOptions().headers.get(CONSTANTS.CSRF_KEY);
    const event: UploadInput = {
      type: 'uploadFile',
      url: s3Key ? CACHE_URL : UPLOAD_URL,
      headers: {
        'X-CSRF-Token': token
      },
      method: 'POST',
      file: file,
      id: file.id,
      data: {
        file_id: file.id,
        document_type: file.documentType || documentType,
        destination: s3Key ? CACHE_URL : destination,
        s3_key: s3Key ? s3Key : null
      }
    };
    return event;
  }

  getSupportedFileFormats(formats: string[]): string {
    if (!formats || !formats.length) {
      return '';
    }

    const formatsString = formats.toString();
    return formatsString.split(',').map(w => w.split('/')[1]).join(', ').replace(/plain/gi, 'txt');
  }
}
