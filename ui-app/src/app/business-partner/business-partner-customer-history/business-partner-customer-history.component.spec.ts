import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, inject, TestBed, waitForAsync } from '@angular/core/testing';

import { CookieService } from 'ngx-cookie-service';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { BusinessPartnerCustomerHistoryComponent } from './business-partner-customer-history.component';
import { DatatablesParams, OrderDirection } from 'app/models/datatables';
import { TrackedObjectState } from 'app/models/tracked-object-state';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { UtilityService } from 'app/services/utility.service';
import { trackedObjectHistory, businessPartnerCustomerSummary, trackedObjectHistoryResponseFactory } from 'app/test-stubs/factories/business-partner';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';
import Bugsnag from '@bugsnag/js';

describe('BusinessPartnerCustomerHistoryComponent', () => {
  let component: BusinessPartnerCustomerHistoryComponent;
  let fixture: ComponentFixture<BusinessPartnerCustomerHistoryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        BusinessPartnerCustomerHistoryComponent
      ],
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        BusinessPartnerService,
        CookieService,
        UtilityService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BusinessPartnerCustomerHistoryComponent);
    component = fixture.componentInstance;

    // Set Input values
    component.trackedBusinessPartnerMerchant = businessPartnerCustomerSummary.business_partner_merchants[0];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set dtOptions to a non-null value', () => {
      component.ngOnInit();
      expect(component.dtOptions).not.toBeNull();
      expect(component.translateService).not.toBeNull();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from business partner customer event history subscription if set',
      inject([BusinessPartnerService], (businessPartnerService: BusinessPartnerService) => {
      spyOn(businessPartnerService, 'getTrackedObjectEventHistory').and.returnValue(of(trackedObjectHistoryResponseFactory.build()));
      spyOn(businessPartnerService, 'getBusinessPartnerTrackedObjectHistory').and.returnValue(new BehaviorSubject(trackedObjectHistory));

      component.getFullHistoryForMerchant(null, null);

      expect(component.businessPartnerCustomerEventHistorySubscription$.closed).toBeFalsy();
      component.ngOnDestroy();
      expect(component.businessPartnerCustomerEventHistorySubscription$.closed).toBeTruthy();
    }));

    it('should not unsubscribe from business partner customer event history subscription if not set',
      inject([BusinessPartnerService], (businessPartnerService: BusinessPartnerService) => {
      spyOn(businessPartnerService, 'getTrackedObjectEventHistory').and.returnValue(of(trackedObjectHistoryResponseFactory.build()));
      spyOn(businessPartnerService, 'getBusinessPartnerTrackedObjectHistory').and.returnValue(new BehaviorSubject(trackedObjectHistory));

      component.getFullHistoryForMerchant(null, null);

      component.businessPartnerCustomerEventHistorySubscription$.unsubscribe();
      spyOn(component.businessPartnerCustomerEventHistorySubscription$, 'unsubscribe');
      component.ngOnDestroy();
      expect(component.businessPartnerCustomerEventHistorySubscription$.unsubscribe).toHaveBeenCalledTimes(0);
    }));
  });

  describe('getFullHistoryForMerchant', () => {
    it('should get the full history for merchant', inject([BusinessPartnerService], (businessPartnerService: BusinessPartnerService) => {
      spyOn(businessPartnerService, 'getTrackedObjectEventHistory').and.returnValue(of(trackedObjectHistoryResponseFactory.build()));
      spyOn(businessPartnerService, 'getBusinessPartnerTrackedObjectHistory').and.returnValue(new BehaviorSubject(trackedObjectHistory));

      component.getFullHistoryForMerchant(null, null);

      expect(component.trackedObjectEvents).toEqual(trackedObjectHistory.tracked_object_events);
    }));

    it('should get the full history for merchant using datatables params',
      inject([BusinessPartnerService], (businessPartnerService: BusinessPartnerService) => {
      spyOn(businessPartnerService, 'getTrackedObjectEventHistory').and.returnValue(of(trackedObjectHistoryResponseFactory.build()));
      spyOn(businessPartnerService, 'getBusinessPartnerTrackedObjectHistory').and.returnValue(new BehaviorSubject(trackedObjectHistory));

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
      component.getFullHistoryForMerchant(datatableParams, callback);

      expect(component.trackedObjectEvents).toEqual(trackedObjectHistory.tracked_object_events);
    }));

    it('should trigger a bugsnag if get full history fails', inject([BusinessPartnerService], (businessPartnerService: BusinessPartnerService) => {
      spyOn(businessPartnerService, 'getTrackedObjectEventHistory').and.returnValue(throwError(internalServerErrorFactory.build()));
      spyOn(Bugsnag, 'notify');

      component.getFullHistoryForMerchant(null, null);

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
    }));
  });

  describe('getMerchantLastEvent', () => {
    it('should return clicked for TrackedObjectState.clicked', () => {
      expect(component.getMerchantLastEvent(TrackedObjectState.clicked)).toEqual('TRACKED_OBJECT.CLICKED');
    });

    it('should return created for TrackedObjectState.created', () => {
      expect(component.getMerchantLastEvent(TrackedObjectState.created)).toEqual('TRACKED_OBJECT.CREATED');
    });

    it('should return invited for TrackedObjectState.invited', () => {
      expect(component.getMerchantLastEvent(TrackedObjectState.invited)).toEqual('TRACKED_OBJECT.INVITED');
    });

    it('should return invoiced for TrackedObjectState.invoiced', () => {
      expect(component.getMerchantLastEvent(TrackedObjectState.invoiced)).toEqual('TRACKED_OBJECT.INVOICED');
    });

    it('should return linked for TrackedObjectState.linked', () => {
      expect(component.getMerchantLastEvent(TrackedObjectState.linked)).toEqual('TRACKED_OBJECT.LINKED');
    });

    it('should return sent for TrackedObjectState.sent', () => {
      expect(component.getMerchantLastEvent(TrackedObjectState.sent)).toEqual('TRACKED_OBJECT.SENT');
    });

    it('should return security violation for TrackedObjectState.securityViolation', () => {
      expect(component.getMerchantLastEvent(TrackedObjectState.securityViolation)).toEqual('TRACKED_OBJECT.SECURITY_VIOLATION');
    });

    it('should return viewed for TrackedObjectState.viewed', () => {
      expect(component.getMerchantLastEvent(TrackedObjectState.viewed)).toEqual('TRACKED_OBJECT.VIEWED');
    });

    it('should return invited by default', () => {
      expect(component.getMerchantLastEvent(null)).toEqual('TRACKED_OBJECT.INVITED');
    });
  });

  describe('hideModal', () => {
    it('should send an event to the parent component to hide the customer history dialog', () => {
      spyOn(component.sendHideModalEvent, 'emit');

      component.hideModal();

      expect(component.sendHideModalEvent.emit).toHaveBeenCalledTimes(1);
    });
  });
});
