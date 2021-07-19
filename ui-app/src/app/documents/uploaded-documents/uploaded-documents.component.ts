import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MerchantDocument, MerchantDocumentAttributes } from 'app/documents/models/merchant-document';
import {
  MERCHANT_DOCUMENTS_START_DATE,
  MERCHANT_DOCUMENTS_PAGE_LENGTH
} from 'app/documents/models/merchant-documents-query';
import { DOC_SELECT_OPTIONS, DocumentCode, DocumentTypeOption } from 'app/models/api-entities/merchant-document-status';
import { DatatablesParams, OrderDirection } from 'app/models/datatables';
import { UiError } from 'app/models/ui-error';
import { ErrorService } from 'app/services/error.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'ztt-uploaded-documents',
  templateUrl: './uploaded-documents.component.html'
})
export class UploadedDocumentsComponent implements OnInit {
  @Input() documentTypes = DOC_SELECT_OPTIONS as DocumentTypeOption[];

  merchantDocuments = [] as MerchantDocument[];
  dtOptions = {} as DataTables.Settings;

  constructor(
    public translateService: TranslateService,
    private _errorService: ErrorService,
    private _loggingService: LoggingService,
    private _merchantService: MerchantService
  ) {
  }

  ngOnInit(): void {
    this.setupDataTable();
  }

  /**
   * Searches documentTypes to retrieve the correct translate keys based
   * on the DocumentCode
   *
   * @param code
   */
  getDocumentType(code: DocumentCode): string {
    const documentType =  this.documentTypes.find(type => type.value === code)?.label;
    return documentType || 'COMMON.NOT_AVAILABLE';
  }

  /**
   * Configures the DataTable to render using serverSide and initiates
   * populating merchantDocuments with the response.
   *
   * @private
   */
  private setupDataTable(): void {
    this.dtOptions = {
      ajax: (dtParams: DatatablesParams, callback) => {
        this.queryMerchantDocuments(dtParams, callback);
      },
      columns: [
        {name: MerchantDocumentAttributes.uploaded_at},
        {name: MerchantDocumentAttributes.org_doc_name},
        {name: MerchantDocumentAttributes.doc_type}
      ],
      info: false,
      language: {
        paginate: {
          first: '\uf053\uf053',
          last: '\uf054\uf054',
          next: '\uf054',
          previous: '\uf053'
        }
      },
      lengthChange: false,
      order: [[0, OrderDirection.descending]],
      pageLength: MERCHANT_DOCUMENTS_PAGE_LENGTH,
      processing: true,
      searching: false,
      serverSide: true
    };
  }

  /**
   * Populates merchantDocuments using merchantService.getMerchantDocuments,
   * using dtParams, which are mapped to MerchantDocumentsQuery.
   *
   * The callback data: [] needs to stay an empty array for Angular.
   *
   * @param dtParams
   * @param callback
   * @private
   */
  private queryMerchantDocuments(dtParams: DatatablesParams, callback): void {
    this._merchantService.getMerchantDocuments({
      offset: dtParams.start,
      limit: dtParams.length,
      order_by: dtParams.columns[dtParams.order[0].column].name,
      order_direction: dtParams.order[0].dir,
      upload_start_time: MERCHANT_DOCUMENTS_START_DATE
    })
      .pipe(
        take(1)
      )
      .subscribe(
        merchantDocumentsListing => {
          this.merchantDocuments = merchantDocumentsListing['merchant_documents'];

          callback({
            recordsTotal: merchantDocumentsListing.total_count,
            recordsFiltered: merchantDocumentsListing.filtered_count,
            data: []
          });
        },
        error => {
          this._errorService.show(UiError.getMerchantDocuments);
          this._loggingService.log(error);
        }
      );
  }
}
