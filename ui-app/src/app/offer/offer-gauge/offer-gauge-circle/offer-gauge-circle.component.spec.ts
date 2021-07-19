import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OfferState } from 'app/models/api-entities/utility';
import { SupportedLanguage } from 'app/models/languages';
import { OfferGaugeCircleComponent } from 'app/offer/offer-gauge/offer-gauge-circle/offer-gauge-circle.component';
import { ZttCurrencyPipe } from 'app/pipes/ztt-currency.pipe';
import { BankAccountService } from 'app/services/bank-account.service';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { ErrorService } from 'app/services/error.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { OfferService } from 'app/services/offer.service';
import { UblService } from 'app/services/ubl.service';
import { UtilityService } from 'app/services/utility.service';
import { offers$ } from 'app/test-stubs/factories/lending/offer-stubs';
import { offer, offerFactory } from 'app/test-stubs/factories/lending/offers';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { CookieService } from 'ngx-cookie-service';

describe('OfferGaugeCircleComponent', () => {
  let component: OfferGaugeCircleComponent;
  let fixture: ComponentFixture<OfferGaugeCircleComponent>;
  let htmlElement: HTMLElement;

  /**
   * Configure: OfferService
   */
  let offerService: OfferService;

  // Spies:
  let locOfferSpy: jasmine.Spy;

  /**
   * Configure: MerchantService
   */
  let merchantService: MerchantService;

  /**
   * Configure: TranslateService
   */
  let translateService: TranslateService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        NgCircleProgressModule.forRoot({
          'animateTitle': false,
          'animation': false,
          'backgroundPadding': 0,
          'clockwise': false,
          'innerStrokeColor': '#efeeef',
          'innerStrokeWidth': 12,
          'maxPercent': 100,
          'outerStrokeColor': '#692670',
          'outerStrokeGradientStopColor': '#B72CC7',
          'outerStrokeGradient': true,
          'outerStrokeLinecap': 'butt',
          'outerStrokeWidth': 12,
          'radius': 100,
          'renderOnClick': false,
          'responsive': true,
          'showBackground': false,
          'showSubtitle': false,
          'showUnits': false,
          'showZeroOuterStroke': false,
          'space': -12,
          'titleColor': '#001226', // $black
          'titleFontSize': '24',
          'titleFontWeight': '700'
        }),
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        TooltipModule.forRoot()
      ],
      declarations: [
        OfferGaugeCircleComponent,
        ZttCurrencyPipe
      ],
      providers: [
        BankAccountService,
        BankingFlowService,
        ConfigurationService,
        LoggingService,
        MerchantService,
        OfferService,
        TranslateService,
        UblService,
        // --- inherited
        CookieService,
        UtilityService,
        ErrorService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OfferGaugeCircleComponent);
    component = fixture.componentInstance;
    htmlElement = fixture.nativeElement;

    /**
     * Setup: OfferService
     */
    // Inject:
    offerService = TestBed.inject(OfferService);

    // Set spies:
    spyOnProperty(offerService, 'offers$').and.returnValue(offers$);
    locOfferSpy = spyOnProperty(offerService, 'locOffer').and.returnValue(offer);

    /**
     * Setup: MerchantService
     */
    // Inject:
    merchantService = TestBed.inject(MerchantService);
    spyOn(merchantService, 'getMerchantOutstandingBalance').and.returnValue(0);

    /**
     * Setup: TranslateService
     */
    // Inject:
    translateService = TestBed.inject(TranslateService);

    spyOnProperty(translateService, 'currentLang').and.returnValue(SupportedLanguage.en);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('circle-progress component', () => {
    let circleGauge: DebugElement['nativeElement'];
    let subtitle: DebugElement['nativeElement'];
    const pipe = new ZttCurrencyPipe();

    beforeEach(() => {
      circleGauge = htmlElement.querySelector('.gauge-circle');
    });

    afterEach(() => {
      const actualPercent = circleGauge.getAttribute('ng-reflect-percent');
      expect(actualPercent).toEqual(component.offerCapacity.toString());
    });

    describe('when showOffer is true', () => {
      function checkSubtitleValid(key: string) {
        const expectedSubTitle = translateService.instant(key);
        subtitle = htmlElement.querySelector('.gauge-circle-subtitle');

        expect(subtitle.innerText).toEqual(expectedSubTitle);
      }

      afterEach(() => {
        // show title check
        const showTitle = circleGauge.getAttribute('ng-reflect-show-title');
        expect(showTitle).toEqual('true');

        // title check
        const expectedTitle = pipe.transform(component.offerAvailableAmount, SupportedLanguage.en);
        const actualTitle = circleGauge.getAttribute('ng-reflect-title');

        expect(actualTitle).toEqual(expectedTitle);
      });

      describe('when offerAvailableAmount is 100%', () => {
        it('should properly adjust its values based on the Offer metrics', () => {
          fixture.detectChanges();

          checkSubtitleValid('OFFER_GAUGE.AVAILABLE_TITLE');
        });
      }); // describe - when offerAvailableAmount is 100%

      describe('when offerAvailableAmount is 50%', () => {
        it('should properly adjust its values based on the Offer metrics', () => {
          spyOn(offerService, 'getOfferAvailableAmount').and.returnValue(offer.max_principal_amount / 2);

          fixture.detectChanges();

          expect(component.offerCapacity).toEqual(50);
          checkSubtitleValid('OFFER_GAUGE.AVAILABLE_TITLE');
        });
      }); // describe - when offerAvailableAmount is 50%

      describe('when offerFundsAccessible is false', () => {
        it('should properly adjust its values based on the Offer metrics', () => {
          spyOn(offerService, 'getOfferAvailableAmount').and.returnValue(offer.min_principal_amount - 1);

          fixture.detectChanges();

          checkSubtitleValid('OFFER_GAUGE.BELOW_MINIMUM_FUNDS');
        });
      }); // describe - when offerAvailableAmount is less than offerMinAmount

      describe('when offerAvailableAmount is 0%', () => {
        it('should properly adjust its values based on the Offer metrics', () => {
          spyOn(offerService, 'getOfferAvailableAmount').and.returnValue(0);

          fixture.detectChanges();

          expect(component.offerCapacity).toEqual(0);
          checkSubtitleValid('OFFER_GAUGE.NO_FUNDS_AVAILABLE');
        });
      }); // describe - when offerAvailableAmount is 0%
    }); // describe - when showOffer is true

    describe('when showOffer is false', () => {
      beforeEach(() => {
        const expiredOffer = offerFactory.build({state: OfferState.expired});
        locOfferSpy.and.returnValue(expiredOffer);
      });

      afterEach(() => {
        expect(component.availabilityTitle).toBeUndefined();

        // show title check
        const showTitle = circleGauge.getAttribute('ng-reflect-show-title');
        expect(showTitle).toEqual('false');

        // title check
        const expectedTitle = pipe.transform(component.offerAvailableAmount, SupportedLanguage.en);
        const actualTitle = circleGauge.getAttribute('ng-reflect-title');
        expect(actualTitle).toEqual(expectedTitle);

        // subtitle check
        subtitle = htmlElement.querySelector('.gauge-circle-subtitle');
        expect(subtitle).toBeNull();
      });

      it('should set the offer capacity to 0, and not display title or subtitle', () => {
        spyOn(offerService, 'getOfferAvailableAmount').and.returnValue(offer.max_principal_amount / 2);

        fixture.detectChanges();

        expect(component.offerAvailableAmount).toEqual(0);
        expect(component.offerCapacity).toEqual(0);
      });
    }); // describe - when showOffer is false
  }); // describe - circle-progress component
});
