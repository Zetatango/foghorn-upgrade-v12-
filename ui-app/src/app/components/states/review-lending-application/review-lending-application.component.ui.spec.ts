import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ReviewLendingApplicationComponent } from './review-lending-application.component';
import { ErrorService } from 'app/services/error.service';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { OfferService } from 'app/services/offer.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { SupplierService } from 'app/services/supplier.service';
import { UtilityService } from 'app/services/utility.service';
import { MerchantService } from 'app/services/merchant.service';
import { LoggingService } from 'app/services/logging.service';
import { supplierLcbo } from 'app/test-stubs/factories/supplier';
import {
  lendingApplicationApproved,
  lendingApplicationNoInvoice,
  lendingApplicationFactory
} from 'app/test-stubs/factories/lending-application';
import { By } from '@angular/platform-browser';
import {
  offer,
  offerWca
} from 'app/test-stubs/factories/lending/offers';

import { CookieService } from 'ngx-cookie-service';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UiAssetService } from 'app/services/ui-asset.service';
import { lendingPayoutCra, lendingPayoutLandlord, lendingPayoutOther } from 'app/test-stubs/factories/lending-offline-payout';
import { BehaviorSubject } from 'rxjs';
import { LendingApplication } from 'app/models/api-entities/lending-application';
import { Supplier } from 'app/models/api-entities/supplier';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { RouterTestingModule } from '@angular/router/testing';
import { offers$, loadOffers$ } from 'app/test-stubs/factories/lending/offer-stubs';
import { ZttCurrencyPipe } from 'app/pipes/ztt-currency.pipe';
import { SupportedLanguage } from 'app/models/languages';
import Bugsnag from '@bugsnag/js';

describe('ReviewLendingApplicationComponent-UI', () => {
  let component: ReviewLendingApplicationComponent;
  let fixture: ComponentFixture<ReviewLendingApplicationComponent>;

  /**
   * Configure: LendingApplicationsService
   */
  let lendingApplicationsService: LendingApplicationsService;

  // Spies:
  let getLendingApplicationSpy: jasmine.Spy;

  // Stubs:
  const lendingApplication$ = new BehaviorSubject<LendingApplication>(lendingApplicationApproved);

  /**
   * Configure: OfferService
   */
  let merchantService: MerchantService;
  let offerService: OfferService;
  let supplierService: SupplierService;
  let translateService: TranslateService;

  // Spies:
  let findOfferByIdSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        CollapseModule.forRoot(),
        BrowserAnimationsModule,
        RouterTestingModule
      ],
      declarations: [
        ReviewLendingApplicationComponent,
        ZttCurrencyPipe
      ],
      providers: [
        CookieService,
        UtilityService,
        SupplierService,
        LendingApplicationsService,
        ErrorService,
        MerchantService,
        OfferService,
        UiAssetService,
        LoggingService,
        StateRoutingService,
        {
          provide: ErrorService,
          useClass: class {
            show = jasmine.createSpy('show');
          }
        }
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
      fixture = TestBed.createComponent(ReviewLendingApplicationComponent);
      component = fixture.componentInstance;
      component.loaded = true;

      /**
       * Setup: LendingApplicationsService
       */
      // Inject:
      lendingApplicationsService = TestBed.inject(LendingApplicationsService);
      merchantService = TestBed.inject(MerchantService);
      supplierService = TestBed.inject(SupplierService);
      translateService = TestBed.inject(TranslateService);

      // Set spies:
      getLendingApplicationSpy = spyOnProperty(lendingApplicationsService, 'lendingApplication$').and.returnValue(lendingApplication$);

      /**
       * Setup: OfferService
       */
      // Inject:
      offerService = TestBed.inject(OfferService);

      // Set spies:
      spyOn(offerService, 'loadOffers$').and.returnValue(loadOffers$);
      spyOnProperty(offerService, 'offers$').and.returnValue(offers$);
      findOfferByIdSpy = spyOn(offerService, 'findOfferById').and.returnValue(offerWca);

      // Set default entity subscriptions in component
      spyOn(supplierService, 'getSupplier').and.returnValue(new BehaviorSubject<Supplier>(supplierLcbo));
      spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
      spyOn(Bugsnag, 'notify');
      spyOnProperty(translateService, 'currentLang').and.returnValue(SupportedLanguage.en);
    });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Values in Card', () => {
    describe('recipient', () => {
      it('should be set if payee_name present', () => {
        fixture.detectChanges();

        const elem = fixture.debugElement.query(By.css('p[data-ng-id="recipient-value"]'));
        const expectedValue = lendingApplicationApproved.payee_name;

        expect(elem.nativeElement.innerHTML).toEqual(expectedValue);
      });

      it('should not display if payee_name not present', () => {
        const application = lendingApplicationFactory.build({payee_name: undefined});
        getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(application));
        fixture.detectChanges();

        const elem = fixture.debugElement.query(By.css('p[data-ng-id="recipient-value"]'));
        expect(elem).toBeFalsy();
      });
    });

    describe('account number', () => {
      it('should be set if present', () => {
        fixture.detectChanges();

        const elem = fixture.debugElement.query(By.css('p[data-ng-id="account-num-value"]'));
        const expectedValue = lendingApplicationApproved.payee_account_num;

        expect(elem.nativeElement.innerHTML).toEqual(expectedValue);
      });

      it('should not display if not present', () => {
        getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(lendingApplicationNoInvoice));
        fixture.detectChanges();

        const elem = fixture.debugElement.query(By.css('p[data-ng-id="account-num-value"]'));
        expect(elem).toBeFalsy();
      });
    });

    describe('invoice number', () => {
      it('should be set if present', () => {
        fixture.detectChanges();

        const elem = fixture.debugElement.query(By.css('p[data-ng-id="invoice-num-value"]'));
        const expectedValue = lendingApplicationApproved.payee_invoice_num;

        expect(elem.nativeElement.innerHTML).toEqual(expectedValue);
      });

      it('should not display if not present', () => {
        getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(lendingApplicationNoInvoice));
        fixture.detectChanges();

        const elem = fixture.debugElement.query(By.css('p[data-ng-id="invoice-num-value"]'));

        expect(elem).toBeFalsy();
      });
    });

    describe('approved amount', () => {
      it('should be set correctly if requested_amount is present', () => {
        findOfferByIdSpy.and.returnValue(offerWca);

        fixture.detectChanges();

        const elem = fixture.debugElement.query(By.css('p[data-ng-id="approved-amount-value"]'));
        const expectedValue = '$' + lendingApplicationApproved.max_principal_amount.toLocaleString('en', { minimumFractionDigits: 2 });

        expect(elem.nativeElement.innerHTML).toEqual(expectedValue);
      });

      it('should not display if requested_amount is null, undefined, or 0', () => {
        const values = [ null, undefined, 0 ];

        values.forEach((val) => {
          getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(lendingApplicationFactory.build({ requested_amount: val })));
          fixture.detectChanges();

          const elem = fixture.debugElement.query(By.css('p[data-ng-id="approved-amount-value"]'));

          expect(elem).toBeFalsy();
        });
      });
    });

    describe('requested amount', () => {
      it('should be set correctly if requested_amount is present and offer is WCA offer', () => {
        fixture.detectChanges();

        const elem = fixture.debugElement.query(By.css('p[data-ng-id="requested-amount-value"]'));
        const expectedValue = '$' + lendingApplicationApproved.requested_amount.toLocaleString('en', { minimumFractionDigits: 2 });

        expect(elem.nativeElement.innerHTML).toEqual(expectedValue);
      });

      it('should not display if requested_amount is null, undefined, or 0', () => {
        const values = [ null, undefined, 0 ];

        values.forEach((val) => {
          getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(lendingApplicationFactory.build({ requested_amount: val })));
          fixture.detectChanges();

          const elem = fixture.debugElement.query(By.css('p[data-ng-id="requested-amount-value"]'));

          expect(elem).toBeFalsy();
        });
      });

      it('should not display if offer is not a WCA offer', () => {
        findOfferByIdSpy.and.returnValue(offer);
        getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(lendingApplicationFactory.build({ requested_amount: 0 })));
        fixture.detectChanges();

        const elem = fixture.debugElement.query(By.css('p[data-ng-id="requested-amount-value"]'));

        expect(elem).toBeFalsy();
      });
    });

    it('deposit amount should be set correctly', () => {
      fixture.detectChanges();

      const elem = fixture.debugElement.query(By.css('p[data-ng-id="principal-amount-value"]'));
      const expectedValue = '$' + lendingApplicationApproved.principal_amount.toLocaleString('en', { minimumFractionDigits: 2 });

      expect(elem.nativeElement.innerHTML).toEqual(expectedValue);
    });

    describe('payouts', () => {
      it('should be displayed if there are payouts in the lending application', () => {
        const payouts = [ lendingPayoutCra, lendingPayoutLandlord, lendingPayoutOther ];
        getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(lendingApplicationFactory.build({ offline_payouts: payouts })));
        fixture.detectChanges();

        const elem = fixture.debugElement.query(By.css('p[data-ng-id="payout-amount-label"]'));

        expect(elem.nativeElement).toBeTruthy();
      });

      it('should not be displayed if there are no payouts', () => {
        const payouts = [];
        getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(lendingApplicationFactory.build({ offline_payouts: payouts })));
        fixture.detectChanges();

        const elem = fixture.debugElement.query(By.css('p[data-ng-id="payout-amount-label"]'));

        expect(elem).toBeFalsy();
      });

      it('should display all the payout labels and values if there are payouts', () => {
        const payouts = [ lendingPayoutCra, lendingPayoutLandlord, lendingPayoutOther ];
        getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(lendingApplicationFactory.build({ offline_payouts: payouts })));
        fixture.detectChanges();

        const labelElems = fixture.debugElement.queryAll(By.css('p[data-ng-id="payout-sub-label"]'));
        const valueElems = fixture.debugElement.queryAll(By.css('p[data-ng-id="payout-sub-value"]'));

        expect(labelElems.length).toEqual(3);
        expect(labelElems[ 0 ].nativeElement.innerHTML).toEqual('PAY_REVIEW_PAYOUT.TYPE.CRA');
        expect(labelElems[ 1 ].nativeElement.innerHTML).toEqual('PAY_REVIEW_PAYOUT.TYPE.LANDLORD');
        expect(labelElems[ 2 ].nativeElement.innerHTML).toEqual('PAY_REVIEW_PAYOUT.TYPE.OTHER');

        expect(valueElems.length).toEqual(3);
        expect(valueElems[ 0 ].nativeElement.innerHTML).toEqual('$' +
          lendingPayoutCra.amount.toLocaleString('en', { minimumFractionDigits: 2 }));
        expect(valueElems[ 1 ].nativeElement.innerHTML).toEqual('$' +
          lendingPayoutLandlord.amount.toLocaleString('en', { minimumFractionDigits: 2 }));
        expect(valueElems[ 2 ].nativeElement.innerHTML).toEqual('$' +
          lendingPayoutOther.amount.toLocaleString('en', { minimumFractionDigits: 2 }));
      });

      it('should display account row if there are payouts', () => {
        const payouts = [ lendingPayoutCra, lendingPayoutLandlord, lendingPayoutOther ];
        const application = lendingApplicationFactory.build({ principal_amount: 50000, offline_payouts: payouts });
        getLendingApplicationSpy.and.returnValue(new BehaviorSubject<LendingApplication>(application));
        fixture.detectChanges();

        const expectedAccountValue = application.principal_amount - component.totalPayouts;
        const labelElem = fixture.debugElement.query(By.css('p[data-ng-id="amount-sub-label"]'));
        const valueElem = fixture.debugElement.query(By.css('p[data-ng-id="amount-sub-value"]'));

        expect(labelElem.nativeElement.innerHTML).toEqual('PAY_REVIEW_PAYOUT.TYPE.ACCOUNT');
        expect(valueElem.nativeElement.innerHTML).toEqual('$' +
          expectedAccountValue.toLocaleString('en', { minimumFractionDigits: 2 }));
      });
    });

    it('cost of borrowing should be set correctly', () => {
      fixture.detectChanges();

      const elem = fixture.debugElement.query(By.css('p[data-ng-id="cost-borrowing-value"]'));
      const expectedValue = '$' + lendingApplicationApproved.fee.toLocaleString('en', { minimumFractionDigits: 2 });

      expect(elem.nativeElement.innerHTML).toEqual(expectedValue);
    });

    it('total repayment should be set correctly', () => {
      fixture.detectChanges();

      const elem = fixture.debugElement.query(By.css('p[data-ng-id="total-repayment-value"]'));
      const total = lendingApplicationApproved.principal_amount + lendingApplicationApproved.fee;
      const expectedValue = '$' + total.toLocaleString('en', { minimumFractionDigits: 2 });

      expect(elem.nativeElement.innerHTML).toEqual(expectedValue);
    });

    it('term should be set correctly', () => {
      fixture.detectChanges();

      const elem = fixture.debugElement.query(By.css('p[data-ng-id="repayment-term-value"]'));
      const expectedValue = lendingApplicationApproved.term_duration + ' PAY_TERMS.LABEL_MONTHS';

      expect(elem.nativeElement.innerHTML).toEqual(expectedValue);
    });

    it('daily repayment should be set based on contract_repayment_amount', () => {
      fixture.detectChanges();

      const elem = fixture.debugElement.query(By.css('p[data-ng-id="contract-repayment-amount-value"]'));
      const expectedValue = '$' + lendingApplicationApproved.contract_repayment_amount.toLocaleString('en', { minimumFractionDigits: 2 });

      expect(elem.nativeElement.innerHTML).toEqual(expectedValue);
    });

    it('explanation of annual percentage rate is shown for pay a supplier application', () => {
      findOfferByIdSpy.and.returnValue(offer);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('p[data-ng-id="annual_percentage_rate_summary"]')).nativeElement).toBeTruthy();
    });

    it('explanation of annual percentage rate is not shown for working capital application', () => {
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('p[data-ng-id="annual_percentage_rate_summary"]'))).toBeNull();
    });
  });

  describe('Buttons', () => {
    describe('Modify', () => {
      it('should be visible when offer is WCA offer', () => {
        fixture.detectChanges();

        const elem = fixture.debugElement.query(By.css('button[data-ng-id="review-lending-app-modify-btn"]'));

        expect(elem.nativeElement).toBeTruthy();
      });

      it('should not be visible when offer is not WCA offer', () => {
        findOfferByIdSpy.and.returnValue(offer);
        fixture.detectChanges();

        const elem = fixture.debugElement.query(By.css('button[data-ng-id="review-lending-app-modify-btn"]'));

        expect(elem).toBeFalsy();
      });
    });

    describe('Cancel', () => {
      it('should not be visible when offer is WCA offer', () => {
        fixture.detectChanges();

        const elem = fixture.debugElement.query(By.css('button[data-ng-id="review-lending-app-cancel-btn"]'));

        expect(elem).toBeFalsy();
      });

      it('should be visible when offer is not WCA offer', () => {
        findOfferByIdSpy.and.returnValue(offer);
        fixture.detectChanges();

        const elem = fixture.debugElement.query(By.css('button[data-ng-id="review-lending-app-cancel-btn"]'));

        expect(elem.nativeElement).toBeTruthy();
      });
    });

    describe('Next', () => {
      it('should be visible when offer is WCA offer', () => {
        fixture.detectChanges();

        const elem = fixture.debugElement.query(By.css('button[data-ng-id="review-lending-app-next-btn"]'));

        expect(elem.nativeElement).toBeTruthy();
      });

      it('should be visible when offer is not WCA offer', () => {
        findOfferByIdSpy.and.returnValue(offer);
        fixture.detectChanges();

        const elem = fixture.debugElement.query(By.css('button[data-ng-id="review-lending-app-next-btn"]'));

        expect(elem.nativeElement).toBeTruthy();
      });

      describe('step navigation', () => {
        it('should be disabled while submitting', () => {
          findOfferByIdSpy.and.returnValue(offer);
          spyOn(lendingApplicationsService, 'requiresSignature').and.returnValue(false);
          // Replicate the behaviour that would regularly be performed by approval-post component.
          component.nextEvent.subscribe(() => {
            component.processingApplication = true;
          });
          fixture.detectChanges();
          const nextBtn = fixture.debugElement.query(By.css('button[data-ng-id="review-lending-app-next-btn"]'));
          const cancelBtn = fixture.debugElement.query(By.css('button[data-ng-id="review-lending-app-cancel-btn"]'));

          fixture.detectChanges();
          expect(nextBtn.nativeElement.disabled).toBe(false);
          expect(cancelBtn.nativeElement.disabled).toBe(false);

          nextBtn.triggerEventHandler('click', null);
          fixture.detectChanges();
          expect(cancelBtn.nativeElement.disabled).toBe(true);
          expect(nextBtn.nativeElement.disabled).toBe(true);
        });
      });
    });
  });
});
