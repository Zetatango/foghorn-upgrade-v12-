import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, inject, TestBed, waitForAsync } from '@angular/core/testing';
import { LoggingService } from 'app/services/logging.service';

import { CookieService } from 'ngx-cookie-service';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { BusinessPartnerInvoiceHistoryComponent } from './business-partner-invoice-history.component';
import { DatatablesParams, OrderDirection } from 'app/models/datatables';
import { TrackedObjectState } from 'app/models/tracked-object-state';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { UtilityService } from 'app/services/utility.service';
import { trackedObjectHistory, trackedObjectHistoryResponseFactory } from 'app/test-stubs/factories/business-partner';
import { invoiceResponse } from 'app/test-stubs/factories/invoice';
import Bugsnag from '@bugsnag/js';

describe('BusinessPartnerInvoiceHistoryComponent', () => {
  let component: BusinessPartnerInvoiceHistoryComponent;
  let fixture: ComponentFixture<BusinessPartnerInvoiceHistoryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        BusinessPartnerInvoiceHistoryComponent
      ],
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        BusinessPartnerService,
        CookieService,
        LoggingService,
        UtilityService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BusinessPartnerInvoiceHistoryComponent);
    component = fixture.componentInstance;

    // Set input values
    component.trackedInvoice = invoiceResponse;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('dtOptions should be set on init', () => {
      component.ngOnInit();
      expect(component.dtOptions).not.toBeNull();
      expect(component.translateService).not.toBeNull();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from business partner invoice history subscription if set',
      inject([BusinessPartnerService], (businessPartnerService: BusinessPartnerService) => {
      spyOn(businessPartnerService, 'getTrackedObjectEventHistory').and.returnValue(of(trackedObjectHistoryResponseFactory.build()));
      spyOn(businessPartnerService, 'getBusinessPartnerTrackedObjectHistory').and.returnValue(
          new BehaviorSubject(trackedObjectHistory));

      component.getFullHistoryForInvoice(null, null);

      expect(component.businessPartnerInvoiceEventHistorySubscription$.closed).toBeFalsy();
      component.ngOnDestroy();
      expect(component.businessPartnerInvoiceEventHistorySubscription$.closed).toBeTruthy();
    }));

    it('should not unsubscribe from business partner invoice history subscription if not set',
      inject([BusinessPartnerService], (businessPartnerService: BusinessPartnerService) => {
      spyOn(businessPartnerService, 'getTrackedObjectEventHistory').and.returnValue(of(trackedObjectHistoryResponseFactory.build()));
      spyOn(businessPartnerService, 'getBusinessPartnerTrackedObjectHistory').and.returnValue(
          new BehaviorSubject(trackedObjectHistory));

      component.getFullHistoryForInvoice(null, null);

      component.businessPartnerInvoiceEventHistorySubscription$.unsubscribe();
      spyOn(component.businessPartnerInvoiceEventHistorySubscription$, 'unsubscribe');
      component.ngOnDestroy();
      expect(component.businessPartnerInvoiceEventHistorySubscription$.unsubscribe).toHaveBeenCalledTimes(0);
    }));
  });

  describe('hideModal', () => {
    it('should emit an event to dismiss the modal dialog', () => {
      spyOn(component.sendHideModalEvent, 'emit');

      component.hideModal();
      expect(component.sendHideModalEvent.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMerchantLastEvent', () => {
    it('should call getLastEventFromTrackedObjectState', () => {
      spyOn(BusinessPartnerService, 'getLastEventFromTrackedObjectState');

      component.getMerchantLastEvent(TrackedObjectState.invoiced);

      expect(BusinessPartnerService.getLastEventFromTrackedObjectState).toHaveBeenCalledOnceWith(TrackedObjectState.invoiced);
    });
  });

  describe('getFullHistoryForInvoice', () => {
    it('should get the full history for invoice', inject([BusinessPartnerService], (businessPartnerService: BusinessPartnerService) => {
      spyOn(businessPartnerService, 'getTrackedObjectEventHistory').and.returnValue(of(trackedObjectHistoryResponseFactory.build()));
      spyOn(businessPartnerService, 'getBusinessPartnerTrackedObjectHistory').and.returnValue(
          new BehaviorSubject(trackedObjectHistory));

      component.getFullHistoryForInvoice(null, null);

      expect(component.trackedObjectEvents).toEqual(trackedObjectHistory.tracked_object_events);
    }));

    it('should get the full history for invoice using datatables params',
      inject([BusinessPartnerService], (businessPartnerService: BusinessPartnerService) => {
      spyOn(businessPartnerService, 'getTrackedObjectEventHistory').and.returnValue(of(trackedObjectHistoryResponseFactory.build()));
      spyOn(businessPartnerService, 'getBusinessPartnerTrackedObjectHistory').and.returnValue(
          new BehaviorSubject(trackedObjectHistory));

      const datatableParams: DatatablesParams = {
        start: 0,
        length: 10,
        columns: [],
        draw: 1,
        order: [
          {
            column: 0,
            dir: OrderDirection.ascending
          }
        ],
        search: {
          regex: false,
          value: ''
        }
      };
      const callback = () => undefined;
      component.getFullHistoryForInvoice(datatableParams, callback);

      expect(component.trackedObjectEvents).toEqual(trackedObjectHistory.tracked_object_events);
    }));

    it('should trigger a bugsnag if get full history fails', inject([ BusinessPartnerService ], (businessPartnerService: BusinessPartnerService) => {
      spyOn(businessPartnerService, 'getTrackedObjectEventHistory').and.returnValue(throwError(new HttpErrorResponse({ status: 500 })));
      spyOn(Bugsnag, 'notify');

      component.getFullHistoryForInvoice( null, null);

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    }));
  });
});
