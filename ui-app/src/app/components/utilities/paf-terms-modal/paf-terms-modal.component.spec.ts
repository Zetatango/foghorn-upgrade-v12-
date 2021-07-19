import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, tick, fakeAsync, waitForAsync } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { OfferService } from 'app/services/offer.service';
import { LoggingService } from 'app/services/logging.service';
import { UtilityService } from 'app/services/utility.service';

import { BsModalRef, BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { CookieService } from 'ngx-cookie-service';

import { PafTermsModalComponent } from './paf-terms-modal.component';

import {
  invoiceResponseFactory
} from 'app/test-stubs/factories/invoice';
import { InvoiceStatus } from 'app/models/api-entities/invoice';
import { UiAssetService } from 'app/services/ui-asset.service';
import { RepaymentSchedule, TermUnit } from 'app/models/api-entities/utility';
import { paymentPlanFactory } from 'app/test-stubs/factories/payment_plan';
import { ZttCurrencyPipe } from 'app/pipes/ztt-currency.pipe';

describe('PafTermsModalComponent', () => {
  let component: PafTermsModalComponent;
  let fixture: ComponentFixture<PafTermsModalComponent>;

  let modalService: BsModalService;
  let uiAssetService: UiAssetService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), ModalModule.forRoot(), HttpClientTestingModule],
      declarations: [
        PafTermsModalComponent,
        ZttCurrencyPipe
      ],
      providers: [
        BsModalRef,
        BsModalService,
        CookieService,
        OfferService,
        LoggingService,
        UiAssetService,
        UtilityService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PafTermsModalComponent);
    component = fixture.componentInstance;

    modalService = TestBed.inject(BsModalService);
    uiAssetService = TestBed.inject(UiAssetService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // PUBLIC HELPERS


  // ----------------------------------------------------------------------------------- show()
  describe('show()', () => {
    describe('when defining a custom error modal context', () => {
      it('sets the payment plan entity', () => {
        const unpaidInvoice = invoiceResponseFactory.build({
          status: InvoiceStatus.unpaid,
          payment_plan_entity: paymentPlanFactory.build({ frequency: RepaymentSchedule.daily })
        });
        component.show(unpaidInvoice);

        expect(component.invoice).toEqual(unpaidInvoice);
      });
    });

    it('should assign & show modal', fakeAsync(() => {
      spyOn(modalService, 'show').and.returnValue(new BsModalRef());
      const unpaidInvoice = invoiceResponseFactory.build({
        status: InvoiceStatus.unpaid,
        payment_plan_entity: paymentPlanFactory.build({ frequency: RepaymentSchedule.daily })
      });
      component.show(unpaidInvoice);
      tick();

      expect(component.pafAgreementModalRef).toBeTruthy();
      expect(modalService.show).toHaveBeenCalledOnceWith(component.pafAgreementModal, component.pafAgreementModalOptions);
    }));
  }); // describe - show()


  // ----------------------------------------------------------------------------------- hide()
  describe('hide()', () => {
    beforeEach(() => {
      spyOn(modalService, 'show').and.returnValue(new BsModalRef());
    });

    it('should call hide on the modal ref', fakeAsync(() => {
      const unpaidInvoice = invoiceResponseFactory.build({
        status: InvoiceStatus.unpaid,
        payment_plan_entity: paymentPlanFactory.build({ frequency: RepaymentSchedule.daily })
      });
      component.show(unpaidInvoice); // Mocking State
      tick();
      expect(component.pafAgreementModalRef).toBeTruthy();

      spyOn(component.pafAgreementModalRef, 'hide').and.callThrough();
      component.hide();

      expect(component.pafAgreementModalRef.hide).toHaveBeenCalledTimes(1);
    }));
  }); // describe - hide()

  describe('repaymentScheduleLocalizationKey', () => {
    it('should return the right repayment schedule label', () => {
      spyOn(uiAssetService, 'getRepaymentScheduleLocalizationKey').and.returnValue('PAY_REVIEW.DAILY');

      component.invoice = invoiceResponseFactory.build({
        status: InvoiceStatus.unpaid,
        payment_plan_entity: paymentPlanFactory.build({ frequency: RepaymentSchedule.daily })
      });
      const localizationKey = component.repaymentScheduleLocalizationKey;
      expect(localizationKey).toBe('PAY_REVIEW.DAILY');
      expect(uiAssetService.getRepaymentScheduleLocalizationKey).toHaveBeenCalledOnceWith(RepaymentSchedule.daily);
    });
  });

  describe('pafReviewFormulaLocalizationKey', () => {
    it('should return the right pay review  label', () => {
      spyOn(uiAssetService, 'getPafReviewFormulaLocalizationKey').and.returnValue('PAY_REVIEW_LENDING_FORMULA.DAILY');
      component.invoice = invoiceResponseFactory.build({
        status: InvoiceStatus.unpaid,
        payment_plan_entity: paymentPlanFactory.build({ frequency: RepaymentSchedule.daily })
      });
      const localizationKey = component.pafReviewFormulaLocalizationKey;
      expect(localizationKey).toBe('PAY_REVIEW_LENDING_FORMULA.DAILY');
      expect(uiAssetService.getPafReviewFormulaLocalizationKey).toHaveBeenCalledOnceWith(RepaymentSchedule.daily);
    });
  });

  describe('localizedLoanTermUnit', () => {
    it('should return expected translation key', () => {
      spyOn(uiAssetService, 'getLocalizedLoanTermUnit').and.returnValue('PAY_TERMS.LABEL_DAYS');

      const localizedLoanTermUnit = component.localizedLoanTermUnit;
      expect(localizedLoanTermUnit).toBe('PAY_TERMS.LABEL_DAYS');
      expect(uiAssetService.getLocalizedLoanTermUnit).toHaveBeenCalledOnceWith(TermUnit.days);
    });
  });
});
