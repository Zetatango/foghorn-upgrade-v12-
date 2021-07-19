import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BorrowerInvoicesComponent } from './borrower-invoices.component';

import { ZttDataListType } from 'app/models/data-list-config';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { BorrowerInvoiceService } from 'app/services/borrower-invoice.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UtilityService } from 'app/services/utility.service';
import { CookieService } from 'ngx-cookie-service';
import { SupportedLanguage } from 'app/models/languages';
import { invoiceResponseFactory } from 'app/test-stubs/factories/invoice';
import { PafTermsModalComponent } from 'app/components/utilities/paf-terms-modal/paf-terms-modal.component';
import { ComponentLoaderFactory } from 'ngx-bootstrap/component-loader';
import { BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { PositioningService } from 'ngx-bootstrap/positioning';
import { OfferService } from 'app/services/offer.service';
import { LoggingService } from 'app/services/logging.service';
import { RouterTestingModule } from '@angular/router/testing';
import { AppRoutes } from 'app/models/routes';

describe('BorrowerInvoicesComponent', () => {
  let component: BorrowerInvoicesComponent;
  let fixture: ComponentFixture<BorrowerInvoicesComponent>;

  let borrowerInvoiceService: BorrowerInvoiceService;
  let stateRoutingService: StateRoutingService;
  let translateService: TranslateService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        BorrowerInvoicesComponent,
        PafTermsModalComponent
      ],
      imports: [
        HttpClientTestingModule,
        ModalModule.forRoot(),
        TranslateModule.forRoot(),
        RouterTestingModule
      ],
      schemas: [ NO_ERRORS_SCHEMA ],
      providers: [
        BorrowerInvoiceService,
        BsModalService,
        ComponentLoaderFactory,
        CookieService,
        OfferService,
        LoggingService,
        PositioningService,
        TranslateService,
        UtilityService,
        StateRoutingService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BorrowerInvoicesComponent);
    component = fixture.componentInstance;

    borrowerInvoiceService = TestBed.inject(BorrowerInvoiceService);
    stateRoutingService = TestBed.inject(StateRoutingService);
    translateService = TestBed.inject(TranslateService);

    spyOn(stateRoutingService, 'navigate');
  });

  describe('configType', () => {
    it('should return BORROWER_INVOICES', () => {
      expect(component.configType).toBe(ZttDataListType.BORROWER_INVOICES);
    });
  });

  describe('currentLang', () => {
    it('should return value from TranslateService.currentLang', () => {
      spyOnProperty(translateService, 'currentLang').and.returnValue(SupportedLanguage.default);
      expect(component.currentLang).toEqual(translateService.currentLang);
    });
  });

  describe('canInvoiceBePaid', () => {
    beforeEach(() => {
      spyOn(borrowerInvoiceService, 'canInvoiceBePaid');
    });

    it('should call borrowerInvoiceService.canInvoiceBePaid', () => {
      const invoice = null;
      component.canInvoiceBePaid(invoice);
      expect(borrowerInvoiceService.canInvoiceBePaid).toHaveBeenCalledOnceWith(invoice);
    });
  });

  describe('getInvoiceDisplayStatusClass', () => {
    beforeEach(() => {
      spyOn(borrowerInvoiceService, 'getInvoiceDisplayStatusClass');
    });

    it('should call borrowerInvoiceService.getInvoiceDisplayStatusClass', () => {
      const invoice = null;
      component.getInvoiceDisplayStatusClass(invoice);
      expect(borrowerInvoiceService.getInvoiceDisplayStatusClass).toHaveBeenCalledOnceWith(invoice);
    });
  });

  describe('isPaidByPaf', () => {
    beforeEach(() => {
      spyOn(borrowerInvoiceService, 'isScheduled');
    });

    it('should call borrowerInvoiceService.isScheduled', () => {
      const invoice = null;
      component.isPaidByPaf(invoice);

      expect(borrowerInvoiceService.isScheduled).toHaveBeenCalledOnceWith(invoice);
    });
  });

  describe('payInvoice', () => {
    beforeEach(() => {
      spyOn(borrowerInvoiceService, 'saveActiveInvoiceId');
    });

    it('should call borrowerInvoiceService.saveActiveInvoiceId with null when a null invoice is attempted to be paid', () => {
      const invoice = null;
      component.payInvoice(invoice);
      expect(borrowerInvoiceService.saveActiveInvoiceId).toHaveBeenCalledOnceWith(null);
    });

    it('should call borrowerInvoiceService.saveActiveInvoiceId with invoice id', () => {
      const invoice = invoiceResponseFactory.build();
      component.payInvoice(invoice);
      expect(borrowerInvoiceService.saveActiveInvoiceId).toHaveBeenCalledOnceWith(invoice.id);
    });

    it('should route to onboarding', () => {
      const invoice = null;
      component.payInvoice(invoice);
      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.root);
    });
  });

  describe('showPaymentPlanReview', () => {
    beforeEach(() => {
      spyOn(component.pafTermsModalComponent, 'show');
    });

    it('should attempt to open PAF modal', () => {
      const invoice = invoiceResponseFactory.build();
      component.showPaymentPlanReview(invoice);

      expect(component.pafTermsModalComponent.show).toHaveBeenCalledOnceWith(invoice);
    });
  });
});
