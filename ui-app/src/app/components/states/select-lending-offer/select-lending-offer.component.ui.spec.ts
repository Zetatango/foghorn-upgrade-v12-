import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, of } from 'rxjs';
import { SelectLendingOfferComponent } from './select-lending-offer.component';
import { OfferService } from 'app/services/offer.service';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { SupplierService } from 'app/services/supplier.service';
import { UserSessionService } from 'app/services/user-session.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { ErrorService } from 'app/services/error.service';
import { MerchantService } from 'app/services/merchant.service';
import { UtilityService } from 'app/services/utility.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { offer, offerNoPreapproval, offerWca } from 'app/test-stubs/factories/lending/offers';
import { GET_LENDING_OFFER_FEE } from 'app/constants';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxCleaveDirectiveModule } from 'ngx-cleave-directive';
import { LoggingService } from 'app/services/logging.service';
import { CookieService } from 'ngx-cookie-service';
import { BorrowerInvoiceService } from 'app/services/borrower-invoice.service';
import { blankBorrowerInvoice, borrowerInvoice } from 'app/test-stubs/factories/invoice';
import { BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { ConfigurationService } from 'app/services/configuration.service';
import { AgreementService } from 'app/services/agreement.service';
import { LendingTermType } from 'app/models/api-entities/lending-term';
import { ReauthService } from 'app/services/reauth.service';
import { FriendlyDatePipe } from 'app/pipes/friendly-date.pipe';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { userSessionFactory } from 'app/test-stubs/factories/user-session';
import { RouterTestingModule } from '@angular/router/testing';
import { UblService } from 'app/services/ubl.service';
import {
  offer$,
  offers$, offerWca$,
  loadOffer$,
  loadOffers$
} from 'app/test-stubs/factories/lending/offer-stubs';
import { LocalizeDatePipe } from 'app/pipes/localize-date.pipe';
import { ZttCurrencyPipe } from 'app/pipes/ztt-currency.pipe';
import { SupportedLanguage } from 'app/models/languages';
import Bugsnag from '@bugsnag/js';

describe('SelectLendingOfferComponent-UI', () => {
  let component: SelectLendingOfferComponent;
  let fixture: ComponentFixture<SelectLendingOfferComponent>;

  let borrowerInvoiceService: BorrowerInvoiceService;
  let configService: ConfigurationService;
  let userSessionService: UserSessionService;
  let supplierService: SupplierService;
  let merchantService: MerchantService;
  let translateService: TranslateService;

  /**
   * Configure: OfferService
   */
  let offerService: OfferService;

  // Spies:
  let loadOfferSpy: jasmine.Spy;
  let offerSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        SelectLendingOfferComponent,
        FriendlyDatePipe,
        LocalizeDatePipe,
        ZttCurrencyPipe
      ],
      imports: [
        ModalModule.forRoot(),
        TranslateModule.forRoot(),
        HttpClientTestingModule,
        ReactiveFormsModule,
        NgxCleaveDirectiveModule,
        RouterTestingModule
       ],
      providers: [
        BsModalService,
        ConfigurationService,
        CookieService,
        OfferService,
        UblService,
        LendingApplicationsService,
        SupplierService,
        UserSessionService,
        ErrorService,
        UtilityService,
        MerchantService,
        LoggingService,
        BorrowerInvoiceService,
        AgreementService,
        ReauthService,
        StateRoutingService
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    });

    fixture = TestBed.createComponent(SelectLendingOfferComponent);
    component = fixture.componentInstance;

    borrowerInvoiceService = TestBed.inject(BorrowerInvoiceService);
    spyOn(borrowerInvoiceService, 'getActiveInvoice').and.returnValue(blankBorrowerInvoice);

    configService = TestBed.inject(ConfigurationService);
    spyOnProperty(configService, 'weeklyRepaymentEnabled', 'get').and.returnValue(false);

    userSessionService = TestBed.inject(UserSessionService);
    spyOnProperty(userSessionService, 'userSession').and.returnValue(userSessionFactory.build());

    /**
     * Setup: OfferService
     */
    // Inject:
    offerService = TestBed.inject(OfferService);

    // Set spies:
    spyOn(offerService, 'loadOffers$').and.returnValue(loadOffers$);

    loadOfferSpy = spyOn(offerService, 'loadOffer$').and.returnValue(loadOffer$);
    spyOnProperty(offerService, 'offers$').and.returnValue(offers$);
    offerSpy = spyOnProperty(offerService, 'offer$').and.returnValue(offer$);

    supplierService = TestBed.inject(SupplierService);
    merchantService = TestBed.inject(MerchantService);
    translateService = TestBed.inject(TranslateService);

    spyOnProperty(translateService, 'currentLang').and.returnValue(SupportedLanguage.en);
  });

  // ----------------------------------------------------------------- amount directive filters non-numeric chars
  describe('amount field', () => {
    beforeEach(() => {
      loadOfferSpy.and.returnValue(of(null));
      offerSpy.and.returnValue(new BehaviorSubject(offerWca));
      spyOnProperty(supplierService, 'currentSupplierInformation', 'get').and.returnValue(new BehaviorSubject(null));
      spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
      spyOn(component, 'onPrincipalChange');
      fixture.detectChanges();
    });

    it('should accept valid amount with all numbers', () => {
      fakeAsync(() => {
        sendInput('999.00');
        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME + 1);
        expect(component.onPrincipalChange).toHaveBeenCalledWith(999.00);
      });
    });

    it('should discard alpha characters', () => {
      fakeAsync(() => {
        sendInput('a999b.00c');
        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME + 1);
        expect(component.onPrincipalChange).toHaveBeenCalledWith(999.00);
      });
    });

    it('should not trigger on amounts lower than min', () => {
      fakeAsync(() => {
        sendInput('1.00');
        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME + 1);
        expect(component.onPrincipalChange).toHaveBeenCalledTimes(0);
      });
    });

    it('should not trigger on amounts larger than max', () => {
      fakeAsync(() => {
        sendInput('100000.00');
        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME + 1);
        expect(component.onPrincipalChange).toHaveBeenCalledTimes(0);
      });
    });

    it('should allow 0 leading valid amounts', () => {
      fakeAsync(() => {
        sendInput('000999.00');
        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME + 1);
        expect(component.onPrincipalChange).toHaveBeenCalledWith(999.00);
      });
    });

    it('should allow 0 trailing valid amounts', () => {
      fakeAsync(() => {
        sendInput('999.00000000');
        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME + 1);
        expect(component.onPrincipalChange).toHaveBeenCalledWith(999.00);
      });
    });

    it('should discard special characters', fakeAsync(() =>  {
        sendInput('$1,234.23');
        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME + 1);
        expect(component.onPrincipalChange).toHaveBeenCalledWith(1234.23);
    }));

    it('should not allow any unexpected characters', fakeAsync(() =>  {
      const ACCEPTED_CHARS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'];
      const BASE_AMT = 1000;

      // go through all characters
      for ( let i = 0 ; i < 256; i++ ) {
        const char = String.fromCharCode(i);

        sendInput(BASE_AMT.toString() + char);
        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME + 1);
        if (!(ACCEPTED_CHARS.includes(char))) {
          expect(component.onPrincipalChange).toHaveBeenCalledWith(BASE_AMT);
        } else {
          const amt = BASE_AMT.toString() + char;
          expect(component.onPrincipalChange).toHaveBeenCalledWith(Number(amt));
        }
      }
    }));

    it('should not trigger on invalid inputs like the hyphen (-) ', () => {
      fakeAsync(() => {
        sendInput('-');
        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME + 1);
        expect(component.onPrincipalChange).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('enter.keyup', () => {
    it('should submit the form if the form is valid', () => {
      fakeAsync(() => {
        sendInput('1000', true);
        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME + 1);

        expect(component.processLendingApplication).toHaveBeenCalledTimes(1);
      });
    });

    it('should not submit the form if the form is invalid', () => {
      fakeAsync(() => {
        sendInput('0', true);
        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME + 1);

        expect(component.processLendingApplication).not.toHaveBeenCalled();
      });
    });
  });

  describe('payment methods', () => {
    beforeEach(() => {
      loadOfferSpy.and.returnValue(loadOffer$);
      offerSpy.and.returnValue(offerWca$);
      spyOnProperty(supplierService, 'currentSupplierInformation', 'get').and.returnValue(new BehaviorSubject(null));
      spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
      spyOn(component, 'onPrincipalChange');
      fixture.detectChanges();
    });

    it('should show lending fee when payment method is direct debit', fakeAsync(() => {
      component.loaded = true;
      component.loaded_invoice = true;
      sendInput('500');
      const event = {
        target: {
          value: LendingTermType.direct_debit
        }
      };
      component.onPaymentMethodChange(event);
      tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME); // debounce time on principal change
      fixture.detectChanges();
      const lendingFeeLabelEl = fixture.debugElement.query(By.css('div[data-ng-id="lending-fee-label'));
      const lendingFeeEl = fixture.debugElement.query(By.css('div[data-ng-id="lending-fee-value'));
      const lendingFee  = ' $' + component.lendingFee.fee + '.00 ';

      expect(lendingFeeLabelEl.nativeElement).toBeTruthy();
      expect(lendingFeeEl.nativeElement.innerHTML).toEqual(lendingFee);
    }));

    it('should show lending fee promo when payment method is direct debit', fakeAsync(() => {
      component.loaded = true;
      component.loaded_invoice = true;
      sendInput('500');
      const event = {
        target: {
          value: LendingTermType.direct_debit
        }
      };
      component.onPaymentMethodChange(event);
      tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME); // debounce time on principal change
      fixture.detectChanges();
      const lendingFeePromoLabelEl = fixture.debugElement.query(By.css('div[data-ng-id="lending-fee-promo-label'));
      const lendingFeePromoEl = fixture.debugElement.query(By.css('div[data-ng-id="lending-fee-promo-value'));
      const lendingFee  = ' -$' + component.lendingFee.fee + '.00 ';

      expect(lendingFeePromoLabelEl.nativeElement).toBeTruthy();
      expect(lendingFeePromoEl.nativeElement.innerHTML).toEqual(lendingFee);
      expect(component.directDebitPromoFee).toEqual(-component.lendingFee.fee);
    }));
  });

  describe('paf sign up button', () => {
    it('should not show if no preapproved offers', () => {
      spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
      spyOnProperty(configService, 'preAuthorizedFinancingEnabled', 'get').and.returnValue(true);
      component.invoice = borrowerInvoice;
      offerSpy.and.returnValue(new BehaviorSubject(offerNoPreapproval));
      spyOn(Bugsnag, 'notify'); // to prevent actual call to bugsnag when offer is invalid

      fixture.detectChanges();

      const pafSignupBtn = fixture.debugElement.query(By.css('button[data-ng-id="pafSignup"]'));
      expect(pafSignupBtn).toBeNull();
    });
  });

  describe('step navigation buttons', () => {
    beforeEach(() => {
      loadOfferSpy.and.returnValue(of(null));
      offerSpy.and.returnValue(new BehaviorSubject(offer));
      spyOnProperty(supplierService, 'currentSupplierInformation', 'get').and.returnValue(new BehaviorSubject(null));
      spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
      spyOn(component, 'onPrincipalChange');

      fixture.detectChanges();
    });

    it('should disable when next is pressed', () => {
      spyOn(merchantService, 'isKycFailed').and.returnValue(false);
      spyOnProperty(component, 'debouncing');
      sendInput('500'); // Send valid input to get form group to pass.

      const nextBtn = fixture.debugElement.query(By.css('button[id="select-offer-btn"]'));
      const backBtn = fixture.debugElement.query(By.css('button[data-ng-id="select-offer-back-btn"]'));

      // Make sure next and back aren't already disabled before test, to ensure a good test.
      expect(nextBtn.nativeElement.disabled).toBe(false);
      expect(backBtn.nativeElement.disabled).toBe(false);

      nextBtn.triggerEventHandler('click', null);
      fixture.detectChanges();

      expect(nextBtn.nativeElement.disabled).toBe(true);
      expect(backBtn.nativeElement.disabled).toBe(true);
    });

    it('should disable next if amount is empty', fakeAsync(() => {
      component.loaded = true;
      component.loaded_invoice = true;
      const event = {
        target: {
          value: LendingTermType.financing
        }
      };
      const nextBtn = fixture.debugElement.query(By.css('button[id="select-offer-btn"]'));

      component.onPaymentMethodChange(event);
      tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME); // debounce time on principal change
      fixture.detectChanges();

      expect(nextBtn.nativeElement.disabled).toBe(true);
    }));
  });

  describe('principalWarning', () => {
    beforeEach(() => {
      offerSpy.and.returnValue(new BehaviorSubject(offerWca));
      spyOnProperty(supplierService, 'currentSupplierInformation', 'get').and.returnValue(new BehaviorSubject(null));
      spyOn(merchantService, 'getMerchant').and.returnValue(merchantDataFactory.build());
      spyOn(component, 'onPrincipalChange');
      fixture.detectChanges();
    });

    it('should be called whenever an amount is entered', fakeAsync(() => {
      component.loaded = true;
      component.loaded_invoice = true;
      spyOnProperty(component, 'directDebitEnabled', 'get').and.returnValue(true);
      spyOnProperty(component, 'isDirectDebit', 'get').and.returnValue(false);
      const x = spyOn(component, 'principalWarning');
      sendInput('150');
      tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME); // debounce time on principal change
      fixture.detectChanges();

      tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME); // debounce time on principal change
      expect(x).toHaveBeenCalled();
    }));
  });

  async function sendInput(text: string, submit = false): Promise<any> { // eslint-disable-line
    const inputElement = fixture.debugElement.query(By.css('#amount')).nativeElement;
    inputElement.value = text;
    inputElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    if (submit) {
      const keyPressEvent = new KeyboardEvent('keypress', {
        'key': 'Enter'
      });

      inputElement.dispatchEvent(keyPressEvent);
    }

    return fixture.whenStable();
  }
});
