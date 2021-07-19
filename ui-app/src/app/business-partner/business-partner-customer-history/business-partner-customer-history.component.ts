import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { BusinessPartnerMerchant } from 'app/models/api-entities/business-partner-customer-summary';
import { TrackedObject, TrackedObjectEvent } from 'app/models/api-entities/tracked-object';
import { DatatablesParams } from 'app/models/datatables';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { TrackedObjectState } from 'app/models/tracked-object-state';
import Bugsnag from '@bugsnag/js';
import { ErrorResponse } from "app/models/error-response";

const DEFAULT_DATATABLE_PAGE_LENGTH = 25;

@Component({
  selector: 'ztt-business-partner-customer-history',
  templateUrl: './business-partner-customer-history.component.html'
})
export class BusinessPartnerCustomerHistoryComponent implements OnDestroy, OnInit {
  
  dtOptions: any; // eslint-disable-line
  private _trackedObjectEvents: TrackedObjectEvent[];
  private _businessPartnerCustomerEventHistorySubscription$: Subscription;
  private _trackedBusinessPartnerMerchant: BusinessPartnerMerchant;

  @Output() sendHideModalEvent = new EventEmitter<boolean>();

  constructor(private businessPartnerService: BusinessPartnerService,
              private _translateService: TranslateService) {}

  ngOnDestroy(): void {
    if (this.businessPartnerCustomerEventHistorySubscription$ && !this.businessPartnerCustomerEventHistorySubscription$.closed) {
      this.businessPartnerCustomerEventHistorySubscription$.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.setDtOptions();
  }

  getMerchantLastEvent(lastEvent: TrackedObjectState): string {
    return BusinessPartnerService.getLastEventFromTrackedObjectState(lastEvent);
  }

  getFullHistoryForMerchant(datatablesParams: DatatablesParams, datatablesCallback: any): void { // eslint-disable-line
    let offset = 0;
    let limit = DEFAULT_DATATABLE_PAGE_LENGTH;

    if (datatablesParams) {
      offset = datatablesParams.start;
      limit = datatablesParams.length;
    }

    const trackedObjectId = this.trackedBusinessPartnerMerchant.tracked_object_id;
    this.businessPartnerService.getTrackedObjectEventHistory(trackedObjectId, offset, limit).pipe(take(1)).subscribe(
      () => {
        this.setBusinessPartnerCustomerHistoryEventSubscription(datatablesCallback);
      },
      (e: ErrorResponse) => {
        Bugsnag.notify(e);
      }
    );
  }

  hideModal(): void {
    this.sendHideModalEvent.emit(true);
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
        this.getFullHistoryForMerchant(dataTablesParameters, callback);
      },
    };
  }

  private setBusinessPartnerCustomerHistoryEventSubscription(datatablesCallback: any): void { // eslint-disable-line
    this.businessPartnerCustomerEventHistorySubscription$ = this.businessPartnerService.getBusinessPartnerTrackedObjectHistory().subscribe(
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

  get trackedObjectEvents(): TrackedObjectEvent[] {
    return this._trackedObjectEvents;
  }

  set trackedObjectEvents(trackedObjEvents: TrackedObjectEvent[]) {
    this._trackedObjectEvents = trackedObjEvents;
  }

  get businessPartnerCustomerEventHistorySubscription$(): Subscription {
    return this._businessPartnerCustomerEventHistorySubscription$;
  }

  set businessPartnerCustomerEventHistorySubscription$(subscription: Subscription) {
    this._businessPartnerCustomerEventHistorySubscription$ = subscription;
  }

  get trackedBusinessPartnerMerchant(): BusinessPartnerMerchant {
    return this._trackedBusinessPartnerMerchant;
  }

  @Input()
  set trackedBusinessPartnerMerchant(value: BusinessPartnerMerchant) {
    this._trackedBusinessPartnerMerchant = value;
  }
}
