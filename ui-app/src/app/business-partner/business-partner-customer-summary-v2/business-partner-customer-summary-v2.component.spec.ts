import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA, EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SmallBusinessGrade } from 'app/models/api-entities/offer';
import { TrackedObjectState } from 'app/models/tracked-object-state';
import { BusinessPartnerMerchantService } from 'app/services/business-partner-merchant.service';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { GTMEvent, LoggingService } from 'app/services/logging.service';
import { UtilityService } from 'app/services/utility.service';
import { businessPartnerCustomerSummaryResponseFactory } from 'app/test-stubs/factories/business-partner';

import { BsModalRef, BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { ComponentLoaderFactory } from 'ngx-bootstrap/component-loader';
import { PositioningService } from 'ngx-bootstrap/positioning';
import { CookieService } from 'ngx-cookie-service';
import { of } from 'rxjs';
import { BusinessPartnerCustomerSummaryV2Component } from './business-partner-customer-summary-v2.component';
import { MerchantService } from 'app/services/merchant.service';
import { ZttButtons, ZttDataListType } from 'app/models/data-list-config';
import { expandableListItemFactory } from 'app/test-stubs/factories/expandable-list';
import { AutoSendParams } from 'app/models/api-entities/business-partner-customer-summary';
import { businessPartnerMerchantFactory } from 'app/test-stubs/factories/business-partner-merchant';

describe('BusinessPartnerCustomerSummaryV2Component', () => {
  let component: BusinessPartnerCustomerSummaryV2Component;
  let fixture: ComponentFixture<BusinessPartnerCustomerSummaryV2Component>;

  let bpms: BusinessPartnerMerchantService;
  let bsModalService: BsModalService;
  let loggingService: LoggingService;
  let businessPartnerService: BusinessPartnerService;
  let merchantService: MerchantService;
  let translateService: TranslateService;

  let msIsQuickBooksConnected: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BusinessPartnerCustomerSummaryV2Component ],
      imports: [
        HttpClientTestingModule,
        ModalModule.forRoot(),
        TranslateModule.forRoot()
      ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [
        BsModalService,
        BusinessPartnerService,
        BusinessPartnerMerchantService,
        ComponentLoaderFactory,
        CookieService,
        LoggingService,
        MerchantService,
        PositioningService,
        TranslateService,
        UtilityService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BusinessPartnerCustomerSummaryV2Component);
    component = fixture.componentInstance;

    bpms = TestBed.inject(BusinessPartnerMerchantService);
    bsModalService = TestBed.inject(BsModalService);
    businessPartnerService = TestBed.inject(BusinessPartnerService);
    loggingService = TestBed.inject(LoggingService);
    merchantService = TestBed.inject(MerchantService);
    translateService = TestBed.inject(TranslateService);

    spyOn(businessPartnerService, 'getCustomerSummary').and.returnValue(of(businessPartnerCustomerSummaryResponseFactory.build()));
    msIsQuickBooksConnected = spyOn(merchantService, 'isQuickBooksConnected');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('createInvoice', () => {
    it('should emit event to open modal and call GTM event', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build();
      spyOn(loggingService, 'GTMUpdate');
      spyOn(component.createInvoiceEvent, 'emit');
      component.createInvoice(businessPartnerMerchant);
      expect(loggingService.GTMUpdate).toHaveBeenCalledOnceWith(GTMEvent.BUTTON_CLICKED, 'Create Invoice');
      expect(component.createInvoiceEvent.emit).toHaveBeenCalledOnceWith(businessPartnerMerchant);
    });
  });

  describe('showBusinessGradeModal', () => {
    it('should show business grade modal', () => {
      spyOn(bsModalService, 'show');
      component.showBusinessGradeModal();
      expect(bsModalService.show).toHaveBeenCalledOnceWith(component.businessGradeModal, { class: 'modal-lg' });
    });

    it('should set grade and modalRed', () => {
      spyOn(bsModalService, 'show').and.returnValue(new BsModalRef());
      component.showBusinessGradeModal(SmallBusinessGrade.A);
      expect(component.grade).toBe(SmallBusinessGrade.A);
      expect(component.modalRef).toBeDefined();
    });
  });

  describe('hasAutoPay', () => {
    it('should call bpms function', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build();
      spyOn(bpms, 'hasAutoPay');
      component.hasAutoPay(businessPartnerMerchant);
      expect(bpms.hasAutoPay).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasAutoSend', () => {
    it('should call bpms function', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build();
      spyOn(bpms, 'hasAutoSend');
      component.hasAutoSend(businessPartnerMerchant);
      expect(bpms.hasAutoSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAutoPayStatus', () => {
    it('should call bpms function', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build();
      spyOn(bpms, 'getAutoPayStatus');
      component.getAutoPayStatus(businessPartnerMerchant);
      expect(bpms.getAutoPayStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAutoSendStatus', () => {
    it('should call bpms function', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build();
      spyOn(bpms, 'getAutoSendStatus');
      component.getAutoSendStatus(businessPartnerMerchant);
      expect(bpms.getAutoSendStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCustomerSource', () => {
    it('should call bpms function', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build();
      spyOn(bpms, 'getCustomerSource');
      component.getCustomerSource(businessPartnerMerchant);
      expect(bpms.getCustomerSource).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasSmallBusinessGrade', () => {
    it('should call bpms function', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build();
      spyOn(bpms, 'hasSmallBusinessGrade');
      component.hasSmallBusinessGrade(businessPartnerMerchant);
      expect(bpms.hasSmallBusinessGrade).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasAvailableAmount', () => {
    it('should call bpms function', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build();
      spyOn(bpms, 'hasAvailableAmount');
      component.hasAvailableAmount(businessPartnerMerchant);
      expect(bpms.hasAvailableAmount).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasLinkedMerchant', () => {
    it('should call bpms function', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build();
      spyOn(bpms, 'hasLinkedMerchant');
      component.hasLinkedMerchant(businessPartnerMerchant);
      expect(bpms.hasLinkedMerchant).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasDifferentSignupProperties', () => {
    it('should call bpms function', () => {
      const businessPartnerMerchant = businessPartnerMerchantFactory.build();
      spyOn(bpms, 'hasDifferentSignupProperties');
      component.hasDifferentSignupProperties(businessPartnerMerchant);
      expect(bpms.hasDifferentSignupProperties).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCurrentLang', () => {
    it('should get current langugage', () => {
      const language = 'en';
      spyOnProperty(translateService, 'currentLang').and.returnValue(language);
      expect(component.getCurrentLang()).toBe(language);
    });
  });

  describe('getCustomerLastEvent', () => {
    it('should call translate function', () => {
      const event = TrackedObjectState.clicked;
      spyOn(BusinessPartnerService, 'getLastEventFromTrackedObjectState');
      component.getCustomerLastEvent(event);

      expect(BusinessPartnerService.getLastEventFromTrackedObjectState).toHaveBeenCalledOnceWith(event);
    });
  });

  describe('selectAllButtonLabel', () => {
    it('should set button label to "unselect all" when areAllSelected is true', () => {
      expect(component.selectAllButtonLabel(true)).toBe(ZttButtons.unselectAll);
    });

    it('should set button label to "select all" when areAllSelected is false', () => {
      expect(component.selectAllButtonLabel(false)).toBe(ZttButtons.selectAll);
    });
  });

  describe('subscribeToAutoSend()', () => {
    it('should emit updateEvent with all selected listItems', () => {
      const listItems = expandableListItemFactory.buildList(3, { data: businessPartnerMerchantFactory.build(), isSelected: true });
      const ids = listItems.map((m) => m.data.id);
      const updateEvent = new EventEmitter<AutoSendParams>();
      const editEvent = new EventEmitter();

      spyOn(editEvent, 'emit');
      spyOn(updateEvent, 'emit');
      component.subscribeToAutoSend(listItems, true, updateEvent, editEvent);

      expect(editEvent.emit).toHaveBeenCalled();
      expect(updateEvent.emit).toHaveBeenCalledWith({ business_partner_merchants_ids: ids, auto_send: true });
    });

    it('should emit updateEvent with no listItems since none are selected', () => {
      const listItems = expandableListItemFactory.buildList(3, { data: businessPartnerMerchantFactory.build() });
      const updateEvent = new EventEmitter<AutoSendParams>();
      const editEvent = new EventEmitter();

      spyOn(editEvent, 'emit');
      spyOn(updateEvent, 'emit');
      component.subscribeToAutoSend(listItems, true, updateEvent, editEvent);

      expect(editEvent.emit).toHaveBeenCalled();
      expect(updateEvent.emit).toHaveBeenCalledWith({ business_partner_merchants_ids: [], auto_send: true });
    });
  });

  describe('toggleSelectAll()', () => {
    it('should set all listItems to masterSelected value and toggle masterSelected value', () => {
      const listItems = expandableListItemFactory.buildList(3, { data: businessPartnerMerchantFactory.build() });
      component.masterSelected = true;
      component.toggleSelectAll(listItems);
      listItems.forEach((item) => {
        expect(item.isSelected).toBe(false);
      });
      expect(component.masterSelected).toBe(false);

      component.toggleSelectAll(listItems);
      listItems.forEach((item) => {
        expect(item.isSelected).toBe(true);
      });
      expect(component.masterSelected).toBe(true);
    });
  });

  describe('toggleEdit()', () => {
    it('should toggle button label between "cancel" and "edit" ', () => {
      const listItems = expandableListItemFactory.buildList(3, { data: businessPartnerMerchantFactory.build() });
      const editEvent = new EventEmitter();
      component.editButtonLabel = ZttButtons.edit;

      component.toggleEdit(listItems, editEvent);
      expect(component.editButtonLabel).toBe(ZttButtons.cancel);

      component.toggleEdit(listItems, editEvent);
      expect(component.editButtonLabel).toBe(ZttButtons.edit);
    });
  });

  describe('isQuickBooksConnected', () => {
    it('should mirror value of merchantService.isQuickBooksConnected', () => {
      msIsQuickBooksConnected.and.returnValue(false);
      expect(component.isQuickBooksConnected).toBe(false);

      msIsQuickBooksConnected.and.returnValue(true);
      expect(component.isQuickBooksConnected).toBe(true);
    });
  });

  describe('openCustomerHistoryModal', () => {
    it('should open customer history modal', () => {
      spyOn(bsModalService, 'show');
      const bpm = businessPartnerMerchantFactory.build();
      component.openCustomerHistoryModal(bpm);

      expect(component.trackedBusinessPartnerMerchant).toEqual(bpm);
      expect(bsModalService.show).toHaveBeenCalledOnceWith(component.merchantTrackedObjectModal, { class: 'modal-lg' });
    });
  });

  describe('hideModal', () => {
    it('should hide modalRef', () => {
      const bpm = businessPartnerMerchantFactory.build();
      component.openCustomerHistoryModal(bpm);

      spyOn(component.modalRef, 'hide');
      component.hideModal();

      expect(component.modalRef.hide).toHaveBeenCalledTimes(1);
    });
  });

  describe('configType', () => {
    it('should be set on init', () => {
      fixture.detectChanges();
      expect(component.configType).toEqual(ZttDataListType.BP_CUSTOMERS);
    });
  });
});
