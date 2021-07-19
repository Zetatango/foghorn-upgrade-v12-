import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GET_LENDING_OFFER_FEE } from 'app/constants';
import { OfferState } from 'app/models/api-entities/utility';
import { OfferApplyButtonComponent } from 'app/offer/offer-apply-button/offer-apply-button.component';
import { ZttCurrencyPipe } from 'app/pipes/ztt-currency.pipe';
import { BankAccountService } from 'app/services/bank-account.service';
import { BankingFlowService, BankingStatus } from 'app/services/banking-flow.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { ErrorService } from 'app/services/error.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { OfferService } from 'app/services/offer.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { UblService } from 'app/services/ubl.service';
import { UtilityService } from 'app/services/utility.service';
import { loadOffer$, offers$ } from 'app/test-stubs/factories/lending/offer-stubs';
import { offerFactory } from 'app/test-stubs/factories/lending/offers';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { CookieService } from 'ngx-cookie-service';
import { OfferWithdrawalComponent } from './offer-withdrawal.component';

describe('OfferWithdrawalComponent', () => {
  let component: OfferWithdrawalComponent;
  let fixture: ComponentFixture<OfferWithdrawalComponent>;

  /**
   * Configure: BankFlowService
   */
  let bankingFlowService: BankingFlowService;

  /**
   * Configure: OfferService
   */
  let offerService: OfferService;

  /**
   * Configure: MerchantService
   */
  let merchantService: MerchantService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        ReactiveFormsModule,
        RouterTestingModule,
        TranslateModule.forRoot(),
        TooltipModule.forRoot()
      ],
      declarations: [OfferWithdrawalComponent, OfferApplyButtonComponent, ZttCurrencyPipe],
      providers: [
        BankAccountService,
        TranslateService,
        OfferService,
        LoggingService,
        ConfigurationService,
        FormBuilder,
        UblService,
        MerchantService,
        // --- inherited
        CookieService,
        UtilityService,
        StateRoutingService,
        ErrorService
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OfferWithdrawalComponent);
    component = fixture.componentInstance;

    /**
     * Setup: BankingFLowService
     */
    // Inject:
    bankingFlowService = TestBed.inject(BankingFlowService);
    spyOnProperty(bankingFlowService, 'status').and.returnValue(BankingStatus.bank_status_optimal);

    /**
     * Setup: OfferService
     */
    // Inject:
    offerService = TestBed.inject(OfferService);

    // Set spies:
    spyOn(offerService, 'loadOffer$').and.returnValue(loadOffer$);
    spyOnProperty(offerService, 'offers$').and.returnValue(offers$);

    /**
     * Setup: MerchantService
     */
    // Inject:
    merchantService = TestBed.inject(MerchantService);

    // Set spies:
    spyOn(merchantService, 'getMerchantOutstandingBalance').and.returnValue(0);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should not set amount input to disabled if isOfferDisabled is false', () => {
      component.ngOnInit();

      expect(component.amount.disabled).toBeFalse();
    });

    it('should set amount input to disabled if isOfferDisabled is true', () => {
      const processingOffer = offerFactory.build({state: OfferState.processing});
      spyOnProperty(offerService, 'locOffer').and.returnValue(processingOffer);

      component.ngOnInit();

      expect(component.amount.disabled).toBeTrue();
    });
  }); // describe - ngOnInit

  describe('input: amount', () => {
    it('should have a placeholder equal to the min principal amount', () => {
      const translateService: TranslateService = TestBed.inject(TranslateService);

      fixture.detectChanges();

      const htmlElement = fixture.nativeElement;
      const amountInput = htmlElement.querySelector('input[formControlName="amount"]');


      expect(amountInput.placeholder).toContain(translateService.instant('WITHDRAWAL.FORM.AMOUNT.PLACEHOLDER', component.offerMinAmount));
    });
    describe('enter.keyup', () => {
      beforeEach(() => {
        fixture.detectChanges();
        spyOn(component.offerApplyButton, 'applyForOffer');
      });

      it('should submit the form if the form is valid', () => {
        fakeAsync(() => {
          sendInput('500', true);

          expect(component.amount.valid).toBeTrue();
          expect(component.offerApplyButton.applyForOffer).toHaveBeenCalledTimes(1);
        });
      });

      it('should not submit the form if the form is invalid', () => {
        fakeAsync(() => {
          sendInput('0', true);

          tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME + 1);
          expect(component.amount.valid).toBeFalse();
          expect(component.offerApplyButton.applyForOffer).not.toHaveBeenCalled();
        });
      });
    }); // describe - enter.keyup
  }); // describe - input: amount

  async function sendInput(amount: string, submit = false): Promise<any> { // eslint-disable-line
    const htmlElement = fixture.nativeElement;
    const amountInput = htmlElement.querySelector('input[formControlName="amount"]');

    amountInput.value = amount;
    amountInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();
    
    if (submit) {
      const keyPressEvent = new KeyboardEvent('keypress', {
        'key': 'Enter'
      });

      amountInput.dispatchEvent(keyPressEvent);
    }

    return fixture.whenStable();
  }

  describe('get requestedAmount()', () => {
    it('should return the amount value if it is valid', () => {
      fixture.detectChanges();

      component.withdrawalForm.patchValue({amount: 500});

      fixture.detectChanges();

      expect(component.requestedAmount).toEqual(component.amount.value);
    });

    it('should return null if the amount entered is invalid', () => {
      fixture.detectChanges();

      component.withdrawalForm.patchValue({amount: 1});

      fixture.detectChanges();

      expect(component.requestedAmount).toBeNull;
    });
  }); // describe - get requestedAmount()

  describe('@ViewChild offerApplyButton', () => {
    describe('isButtonDisabled', () => {
      it('should be true if no validation has been triggered', () => {
        fixture.detectChanges();

        expect(component.offerApplyButton.isButtonDisabled).toBeTrue();
      });

      it('should be false if validation has been run, and passed', () => {
        fixture.detectChanges();

        component.withdrawalForm.patchValue({amount: 500});

        fixture.detectChanges();

        expect(component.offerApplyButton.isButtonDisabled).toBeFalse();
      });

      it('should be true if validation has been run, and not passed', () => {
        fixture.detectChanges();

        component.withdrawalForm.patchValue({amount: 1});

        fixture.detectChanges();

        expect(component.offerApplyButton.isButtonDisabled).toBeTrue();
      });
    }); // describe - isButtonDisabled

    describe('requestedAmount', () => {
      it('should be null if no amount has been entered', () => {
        fixture.detectChanges();

        expect(component.offerApplyButton.requestedAmount).toBeNull();
      });

      it('should equal input amount if an amount has been entered', () => {
        fixture.detectChanges();

        component.withdrawalForm.patchValue({amount: 500});

        fixture.detectChanges();

        expect(component.offerApplyButton.requestedAmount).toEqual(component.amount.value);
      });

      it('should be null if amount entered is invalid', () => {
        fixture.detectChanges();

        component.withdrawalForm.patchValue({amount: 1});

        fixture.detectChanges();

        expect(component.offerApplyButton.requestedAmount).toBeNull();
      });
    }); // describe - isButtonDisabled
  }); // describe - @ViewChild offerApplyButton
});
