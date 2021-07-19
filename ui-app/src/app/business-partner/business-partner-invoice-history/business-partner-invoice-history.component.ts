import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { Invoice } from 'app/models/api-entities/invoice';
import { Merchant } from 'app/models/api-entities/merchant';
import { TrackedObject, TrackedObjectEvent } from 'app/models/api-entities/tracked-object';
import { DatatablesParams } from 'app/models/datatables';
import { TrackedObjectState } from 'app/models/tracked-object-state';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import Bugsnag from '@bugsnag/js';
import { ErrorResponse } from "app/models/error-response";

const DEFAULT_DATATABLE_PAGE_LENGTH = 25;

@Component({
  selector: 'ztt-business-partner-invoice-history',
  templateUrl: './business-partner-invoice-history.component.html'
})
export class BusinessPartnerInvoiceHistoryComponent implements OnDestroy, OnInit {
  private _trackedInvoice: Invoice;
  private _merchant: Merchant;
  dtOptions: any; // eslint-disable-line
  private _trackedObjectEvents: TrackedObjectEvent[];
  private _businessPartnerInvoiceEventHistorySubscription$: Subscription;

  @Output() sendHideModalEvent = new EventEmitter<boolean>();

  constructor(private businessPartnerService: BusinessPartnerService,
              private _translateService: TranslateService) {}

  ngOnDestroy(): void {
    if (this.businessPartnerInvoiceEventHistorySubscription$ && !this.businessPartnerInvoiceEventHistorySubscription$.closed) {
      this.businessPartnerInvoiceEventHistorySubscription$.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.setDtOptions();
  }

  hideModal(): void {
    this.sendHideModalEvent.emit(true);
  }

  getMerchantLastEvent(lastEvent: TrackedObjectState): string {
    return BusinessPartnerService.getLastEventFromTrackedObjectState(lastEvent);
  }

  getFullHistoryForInvoice(datatablesParams: DatatablesParams, datatablesCallback: any): void { // eslint-disable-line
    let offset = 0;
    let limit = DEFAULT_DATATABLE_PAGE_LENGTH;

    if (datatablesParams) {
      offset = datatablesParams.start;
      limit = datatablesParams.length;
    }

    const trackedObjectId = this.trackedInvoice.tracked_object_id;
    this.businessPartnerService.getTrackedObjectEventHistory(trackedObjectId, offset, limit).pipe(take(1)).subscribe(
      () => {
        this.setBusinessPartnerInvoiceEventSubscription(datatablesCallback);
      },
      (e: ErrorResponse) => {
        Bugsnag.notify(e);
      }
    );
  }

  private setDtOptions(): void {
    this.dtOptions = {
      // sorting column 1 as Date, not as String
      columnDefs: [
        {
          'type': 'date',
          'targets': 1,
        },
        {
          'orderable': false,
          'targets': [0, 1]
        }
      ],
      // default order from newest date to oldest
      order: [[1, 'desc']],
      dom: 'rtlip',
      lengthMenu: [5, 10, 25, 50, 100],
      pageLength: DEFAULT_DATATABLE_PAGE_LENGTH,
      processing: false,
      serverSide: true,
      ajax: /* istanbul ignore next */(dataTablesParameters: DatatablesParams, callback) => {
        this.getFullHistoryForInvoice(dataTablesParameters, callback);
      },
    };
  }

  private setBusinessPartnerInvoiceEventSubscription(datatablesCallback: any): void { // eslint-disable-line
    this.businessPartnerInvoiceEventHistorySubscription$ = this.businessPartnerService.getBusinessPartnerTrackedObjectHistory().subscribe(
      (trackedObj: TrackedObject) => {
        this.trackedObjectEvents = trackedObj.tracked_object_events;

        if (datatablesCallback) {
          datatablesCallback({
            recordsTotal: trackedObj.total_count,
            recordsFiltered: trackedObj.filtered_count,
            data: [] // Set this to empty so we use Angular's renderer/two way data binding to display the data instead of Datatables renderer
          });
        }
      }
    );
  }

  get translateService(): TranslateService {
    return this._translateService;
  }

  get trackedInvoice(): Invoice {
    return this._trackedInvoice;
  }

  @Input()
  set trackedInvoice(value: Invoice) {
    this._trackedInvoice = value;
  }

  get trackedObjectEvents(): TrackedObjectEvent[] {
    return this._trackedObjectEvents;
  }

  set trackedObjectEvents(value: TrackedObjectEvent[]) {
    this._trackedObjectEvents = value;
  }

  get businessPartnerInvoiceEventHistorySubscription$(): Subscription {
    return this._businessPartnerInvoiceEventHistorySubscription$;
  }

  set businessPartnerInvoiceEventHistorySubscription$(value: Subscription) {
    this._businessPartnerInvoiceEventHistorySubscription$ = value;
  }
}
