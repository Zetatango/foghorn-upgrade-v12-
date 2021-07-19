import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InvoiceStatus } from 'app/models/api-entities/invoice';
import { TrackedObjectState } from 'app/models/tracked-object-state';
import { BusinessPartnerService } from 'app/services/business-partner.service';
import { InvoiceService } from 'app/services/invoice.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { UtilityService } from 'app/services/utility.service';
import { invoiceResponseFactory } from 'app/test-stubs/factories/invoice';

import { CookieService } from 'ngx-cookie-service';
import { BusinessPartnerSentInvoicesV2Component } from './business-partner-sent-invoices-v2.component';
import { BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { ComponentLoaderFactory } from 'ngx-bootstrap/component-loader';
import { PositioningService } from 'ngx-bootstrap/positioning';
import { ZttDataListType } from 'app/models/data-list-config';

describe('BusinessPartnerSentInvoicesV2Component', () => {
  let component: BusinessPartnerSentInvoicesV2Component;
  let fixture: ComponentFixture<BusinessPartnerSentInvoicesV2Component>;

  let bsModalService: BsModalService;
  let invoiceService: InvoiceService;
  let translateService: TranslateService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ BusinessPartnerSentInvoicesV2Component ],
      imports: [
        HttpClientTestingModule,
        ModalModule.forRoot(),
        TranslateModule.forRoot()
      ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [
        BsModalService,
        BusinessPartnerService,
        ComponentLoaderFactory,
        CookieService,
        InvoiceService,
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
    fixture = TestBed.createComponent(BusinessPartnerSentInvoicesV2Component);
    component = fixture.componentInstance;

    bsModalService = TestBed.inject(BsModalService);
    invoiceService = TestBed.inject(InvoiceService);
    translateService = TestBed.inject(TranslateService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getInvoiceLastEvent', () => {
    it('should call business partner service getInvoiceStatus', () => {
      spyOn(BusinessPartnerService, 'getLastEventFromTrackedObjectState');
      component.getInvoiceLastEvent(TrackedObjectState.clicked);
      expect(BusinessPartnerService.getLastEventFromTrackedObjectState).toHaveBeenCalledTimes(1);
    });
  });

  describe('getInvoiceStatus', () => {
    it('should call invoice service getInvoiceStatus', () => {
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.paid });
      spyOn(invoiceService, 'getInvoiceStatus');
      component.getInvoiceStatus(invoice);
      expect(invoiceService.getInvoiceStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('getInvoiceSource', () => {
    it('should call invoice service getInvoiceSource', () => {
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.paid });
      spyOn(invoiceService, 'getInvoiceSource');
      component.getInvoiceSource(invoice);
      expect(invoiceService.getInvoiceSource).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasDifferentEmails', () => {
    it('should call invoice service hasDifferentEmails', () => {
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.paid });
      spyOn(invoiceService, 'hasDifferentEmails');
      component.hasDifferentEmails(invoice);
      expect(invoiceService.hasDifferentEmails).toHaveBeenCalledTimes(1);
    });
  });

  describe('isPaid', () => {
    it('should return true when invoice status is InvoiceStatus.paid', () => {
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.paid });
      expect(component.isPaid(invoice)).toBeTruthy();
    });

    it('should return false when invoice status is NOT InvoiceStatus.paid', () => {
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.unpaid });
      expect(component.isPaid(invoice)).toBeFalsy();
    });
  });

  describe('isSentAndNotPaid', () => {
    it('should return true when invoice status is InvoiceStatus.unpaid and sent', () => {
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.paid });
      expect(component.isSentAndNotPaid(invoice)).toBeFalsy();
    });

    it('should return false when invoice status is InvoiceStatus.unpaid and sent is false', () => {
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.paid, sent: false });
      expect(component.isSentAndNotPaid(invoice)).toBeFalsy();
    });

    it('should return false when invoice status is NOT InvoiceStatus.paid', () => {
      const invoice = invoiceResponseFactory.build({ status: InvoiceStatus.unpaid });
      expect(component.isSentAndNotPaid(invoice)).toBeTruthy();
    });
  });

  describe('getCurrentLang', () => {
    it('should get current langugage', () => {
      const language = 'en';
      spyOnProperty(translateService, 'currentLang').and.returnValue(language);
      expect(component.getCurrentLang()).toBe(language);
    });
  });

  describe('openInvoiceHistoryModal', () => {
    it('should open invoice history modal with invoice', () => {
      spyOn(bsModalService, 'show');
      const invoice = invoiceResponseFactory.build();
      component.openInvoiceHistoryModal(invoice);

      expect(component.trackedInvoice).toEqual(invoice);
      expect(bsModalService.show).toHaveBeenCalledOnceWith(component.invoiceTrackedObjectModal, { class: 'modal-lg' });
    });
  });

  describe('hideModal', () => {
    it('should hide modalRef', () => {
      const invoice = invoiceResponseFactory.build();
      component.openInvoiceHistoryModal(invoice);

      spyOn(component.modalRef, 'hide');
      component.hideModal();

      expect(component.modalRef.hide).toHaveBeenCalledTimes(1);
    });
  });

  describe('configType', () => {
    it('should be set on init', () => {
      fixture.detectChanges();
      expect(component.configType).toEqual(ZttDataListType.BP_INVOICES);
    });
  });
});
