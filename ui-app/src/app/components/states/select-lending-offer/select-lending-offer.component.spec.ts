import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { KycCheckStatus, Merchant } from 'app/models/api-entities/merchant';
import { kycVerifiedFactory } from 'app/test-stubs/factories/kyc-verified';
import { BehaviorSubject, of } from 'rxjs';
import { throwError } from 'rxjs/internal/observable/throwError';
import { ApplicationState, OfferState, OfferType, RepaymentSchedule, TermUnit } from 'app/models/api-entities/utility';
import { SelectLendingOfferComponent } from './select-lending-offer.component';
import { ErrorModalContext } from 'app/components/utilities/error-modal/error-modal-context';
import { OfferService } from 'app/services/offer.service';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { SupplierService } from 'app/services/supplier.service';
import { UserSessionService } from 'app/services/user-session.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { ErrorService } from 'app/services/error.service';
import { MerchantService } from 'app/services/merchant.service';
import { BorrowerInvoiceService } from 'app/services/borrower-invoice.service';
import { UtilityService } from 'app/services/utility.service';
import { DirectPaymentService } from 'app/services/direct-payment.service';
import { TranslateModule } from '@ngx-translate/core';
import { AgreementService } from 'app/services/agreement.service';
import { ReauthService } from 'app/services/reauth.service';
import { emptyBorrowerInvoice, Invoice, InvoiceStatus } from 'app/models/api-entities/invoice';
import { userSessionFactory } from 'app/test-stubs/factories/user-session';
import {
  offerFactory,
  offer,
  offerNoPreapproval,
  offerUnsupportedOfferTypeApproved,
  offerWca
} from 'app/test-stubs/factories/lending/offers';
import { offerFee, offerFeeFactory } from 'app/test-stubs/factories/lending/offer-fee';
import {
  lendingApplicationApproved,
  lendingApplicationFactory,
  lendingApplicationPostFactory,
  lendingApplicationPostNoSupplierFactory
} from 'app/test-stubs/factories/lending-application';
import { supplierInfoBeerStore, supplierInfoLcbo } from 'app/test-stubs/factories/supplier';
import { GTMEvent, LoggingService } from 'app/services/logging.service';
import { GET_LENDING_OFFER_FEE, REAUTH } from 'app/constants';
import {
  directDebitTerm,
  lendingTerm10weeks,
  lendingTerm120Days,
  lendingTerm12months,
  lendingTerm14weeks,
  lendingTerm60Days,
  lendingTerm6months,
  lendingTerm6weeks,
  lendingTerm90Days,
  lendingTerm9months,
  lendingTermFactory
} from 'app/test-stubs/factories/lending-term';
import { UiError } from 'app/models/ui-error';
import { merchantDataFactory, passedIdentityAuthenticatedMerchant } from 'app/test-stubs/factories/merchant';
import { SupplierInformation } from 'app/models/api-entities/supplier';
import { LendingApplication, LendingApplicationFee } from 'app/models/api-entities/lending-application';
import { agreementFactory } from 'app/test-stubs/factories/agreement';
import { LogSeverity } from 'app/models/api-entities/log';
import { CookieService } from 'ngx-cookie-service';
import { lendingPayoutCra, lendingPayoutLandlord } from 'app/test-stubs/factories/lending-offline-payout';
import { blankBorrowerInvoice, borrowerInvoice, invoiceResponseFactory, invoiceResponseResponseFactory } from 'app/test-stubs/factories/invoice';
import { LendingTerm, LendingTermType } from 'app/models/api-entities/lending-term';
import { BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { AppRoutes } from 'app/models/routes';
import { Agreement, AgreementState, AgreementType } from 'app/models/agreement';
import { PaymentPlanState } from 'app/models/api-entities/payment_plan';
import { FriendlyDatePipe } from 'app/pipes/friendly-date.pipe';
import { PafTermsModalComponent } from 'app/components/utilities/paf-terms-modal/paf-terms-modal.component';
import { RouterTestingModule } from '@angular/router/testing';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { UiAssetService } from 'app/services/ui-asset.service';
import {
  offer$, offerFee$,
  offers$,
  loadOffer$,
  loadOfferFee$
} from 'app/test-stubs/factories/lending/offer-stubs';
import { LocalizeDatePipe } from 'app/pipes/localize-date.pipe';
import { ZttCurrencyPipe } from 'app/pipes/ztt-currency.pipe';
import Bugsnag from '@bugsnag/js';
import { ErrorResponse } from 'app/models/error-response';
import { paymentRequiredFactory } from 'app/test-stubs/factories/response';

describe('SelectLendingOfferComponent', () => {
  let component: SelectLendingOfferComponent;
  let fixture: ComponentFixture<SelectLendingOfferComponent>;

  /**
   * Configure: AgreementService
   */
  let agreementService: AgreementService;

  // Spies:
  let loadAgreementByTypeSpy: jasmine.Spy;
  let agreementSubjectSpy: jasmine.Spy;
  let optOutSpy: jasmine.Spy;

  // Stubs:
  const loadAgreementByType$ = of(null);

  const agreement$ = new BehaviorSubject<Agreement>(
    agreementFactory.build({
      type: AgreementType.pre_authorized_financing
    })
  );

  const optOut$ = of(null);

  /**
   * Configure: BankingFlowService
   */
  let bankingFlowService: BankingFlowService;

  /**
   * Configure: BorrowerInvoiceService
   */
  let borrowerInvoiceService: BorrowerInvoiceService;

  // Spies:
  let hasActiveInvoiceSetSpy: jasmine.Spy;
  let getActiveInvoiceSpy: jasmine.Spy;

  /**
   * Configure: ConfigurationService
   */
  let configurationService: ConfigurationService;

  // Spies:
  let directDebitEnabledSpy: jasmine.Spy;
  let weeklyRepaymentsEnabledSpy: jasmine.Spy;
  let disableInvoiceUiSpy: jasmine.Spy;

  /**
   * Configure: DirectPaymentService
   */
  let directPaymentService: DirectPaymentService;

  // Spies:
  let storeDirectPaymentInformationSpy: jasmine.Spy;

  // Stubs:
  const postDirectPayment$ = of(null);

  /**
   * Configure: ErrorService
   */
  let errorService: ErrorService;

  /**
   * Configure: LendingApplicationsService
   */
  let lendingApplicationsService: LendingApplicationsService;

  // Spies:
  let lendingApplicationPropertySpy: jasmine.Spy;
  let loadApplicationFeeSpy: jasmine.Spy;
  let postApplicationSpy: jasmine.Spy;
  let amendSpy: jasmine.Spy;

  // Stubs:
  const noLendingApplication$ = new BehaviorSubject<LendingApplication>(null);
  const loadApplicationFee$ = of(null);
  const lendingApplicationFee$ = new BehaviorSubject<LendingApplicationFee>(null);
  const lendingApplication$ = of(null);

  /**
   * Configure: OfferService
   */
  let offerService: OfferService;

  // Spies:
  let loadOfferSpy: jasmine.Spy;
  let offerSpy: jasmine.Spy;
  let loadOfferFeeSpy: jasmine.Spy;
  let offerFeeSpy: jasmine.Spy;

  /**
   * Configure: LoggingService
   */
  let loggingService: LoggingService;

  /**
   * Configure: MerchantService
   */
  let merchantService: MerchantService;

  // Spies:
  let getMerchantSpy: jasmine.Spy;
  let isKycFailedSpy: jasmine.Spy;
  let isDelegatedAccessModeSpy: jasmine.Spy;

  // Stubs:
  const merchant: Merchant = merchantDataFactory.build();

  /**
   * Configure: ReauthService
   */
  let reauthService: ReauthService;

  // Spies:
  let reauthServiceSpy: jasmine.Spy;

  // Stubs:
  const open$ = of({ status: REAUTH.SUCCESS });

  /**
   * Configure: StateRoutingService
   */
  let stateRoutingService: StateRoutingService;

  /**
   * Configure: SupplierService
   */
  let supplierService: SupplierService;

  // Spies:
  let currentSupplierInformationSpy: jasmine.Spy;

  // Stubs:
  const currentSupplierInformation$ = new BehaviorSubject<SupplierInformation>(supplierInfoBeerStore);

  /**
   * Configure: UserSessionService
   */
  let userSessionService: UserSessionService;


  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        SelectLendingOfferComponent,
        FriendlyDatePipe,
        PafTermsModalComponent,
        LocalizeDatePipe,
        ZttCurrencyPipe
      ],
      imports: [
        HttpClientTestingModule,
        ModalModule.forRoot(),
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        RouterTestingModule
      ],
      providers: [
        BsModalService,
        CookieService,
        ConfigurationService,
        OfferService,
        LendingApplicationsService,
        SupplierService,
        UserSessionService,
        ErrorService,
        UtilityService,
        MerchantService,
        BorrowerInvoiceService,
        LoggingService,
        AgreementService,
        ReauthService,
        StateRoutingService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    // Create component
    fixture = TestBed.createComponent(SelectLendingOfferComponent);
    component = fixture.componentInstance;

    /**
     * Setup: AgreementService
     */
    // Inject:
    agreementService = TestBed.inject(AgreementService);

    // Set spies:
    loadAgreementByTypeSpy = spyOn(agreementService, 'loadAgreementByType').and.returnValue(loadAgreementByType$);
    agreementSubjectSpy = spyOnProperty(agreementService, 'agreementSubject').and.returnValue(agreement$);
    optOutSpy = spyOn(agreementService, 'optOut').and.returnValue(optOut$);

    /**
     * Setup: BankingFLowService
     */
    // Inject:
    bankingFlowService = TestBed.inject(BankingFlowService);

    /**
     * Setup: BorrowerInvoiceService
     */
    // Inject:
    borrowerInvoiceService = TestBed.inject(BorrowerInvoiceService);

    // Set spies:
    hasActiveInvoiceSetSpy = spyOn(borrowerInvoiceService, 'hasActiveInvoiceSet').and.returnValue(false);
    getActiveInvoiceSpy = spyOn(borrowerInvoiceService, 'getActiveInvoice').and.returnValue(blankBorrowerInvoice);

    /**
     * Setup: ConfigurationService
     */
    // Inject:
    configurationService = TestBed.inject(ConfigurationService);

    // Set spies:
    directDebitEnabledSpy = spyOnProperty(configurationService, 'directDebitEnabled', 'get').and.returnValue(false);
    weeklyRepaymentsEnabledSpy = spyOnProperty(configurationService, 'weeklyRepaymentEnabled', 'get').and.returnValue(false);
    disableInvoiceUiSpy = spyOnProperty(configurationService, 'disableInvoiceUi', 'get').and.returnValue(false);

    /**
     * Setup: DirectPaymentService
     */
    // Inject:
    directPaymentService = TestBed.inject(DirectPaymentService);

    // Set spies:
    storeDirectPaymentInformationSpy = spyOn(directPaymentService, 'storeDirectPaymentInformation');
    spyOn(directPaymentService, 'postDirectPayment').and.returnValue(postDirectPayment$);

    /**
     * Setup: ErrorService
     */
    // Inject:
    errorService = TestBed.inject(ErrorService);

    /**
     * Setup: LendingApplicationsService
     */
    // Inject:
    lendingApplicationsService = TestBed.inject(LendingApplicationsService);

    // Set spies:
    lendingApplicationPropertySpy = spyOnProperty(lendingApplicationsService, 'lendingApplication$').and.returnValue(noLendingApplication$);
    loadApplicationFeeSpy = spyOn(lendingApplicationsService, 'loadApplicationFee').and.returnValue(loadApplicationFee$);
    spyOnProperty(lendingApplicationsService, 'lendingApplicationFee$').and.returnValue(lendingApplicationFee$);
    postApplicationSpy = spyOn(lendingApplicationsService, 'postApplication').and.returnValue(lendingApplication$);
    amendSpy = spyOn(lendingApplicationsService, 'amend').and.returnValue(lendingApplication$);

    /**
     * Setup: OfferService
     */
    // Inject:
    offerService = TestBed.inject(OfferService);
    spyOn(offerService, 'blockOnKycFailure').and.returnValue(true);

    // Set spies:
    loadOfferSpy = spyOn(offerService, 'loadOffer$').and.returnValue(loadOffer$);
    spyOnProperty(offerService, 'offers$').and.returnValue(offers$);
    offerSpy = spyOnProperty(offerService, 'offer$').and.returnValue(offer$);
    loadOfferFeeSpy = spyOn(offerService, 'loadOfferFee$').and.returnValue(loadOfferFee$);
    offerFeeSpy = spyOnProperty(offerService, 'offerFee$').and.returnValue(offerFee$);

    /**
     * Setup: LoggingService
     */
    // Inject:
    loggingService = TestBed.inject(LoggingService);

    /**
     * Setup: MerchantService
     */
    // Inject:
    merchantService = TestBed.inject(MerchantService);

    // Set spies:
    getMerchantSpy = spyOn(merchantService, 'getMerchant').and.returnValue(merchant);
    isKycFailedSpy = spyOn(merchantService, 'isKycFailed').and.returnValue(false);
    isDelegatedAccessModeSpy = spyOn(merchantService, 'isDelegatedAccessMode').and.returnValue(false);

    /**
     * Setup: ReauthService
     */
    // Inject:
    reauthService = TestBed.inject(ReauthService);

    // Set spies:
    reauthServiceSpy = spyOn(reauthService, 'open').and.returnValue(open$);

    /**
     * Setup: StateRoutingService
     */
    // Inject:
    stateRoutingService = TestBed.inject(StateRoutingService);

    // Set spies:
    spyOn(stateRoutingService, 'navigate');

    /**
     * Setup: SupplierService
     */
    // Inject:
    supplierService = TestBed.inject(SupplierService);

    // Set spies:
    currentSupplierInformationSpy = spyOnProperty(supplierService, 'currentSupplierInformation').and.returnValue(currentSupplierInformation$);

    /**
     * Setup: UserSessionService
     */
    userSessionService = TestBed.inject(UserSessionService);

    // Set spies:
    spyOnProperty(userSessionService, 'userSession').and.returnValue(userSessionFactory.build());

    spyOn(Bugsnag, 'notify');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit()', () => {
    it('should set merchant', () => {
      fixture.detectChanges();

      expect(component.merchant).toEqual(merchantDataFactory.build());
    });

    it('should set currentSupplierInformation', () => {
      fixture.detectChanges();

      expect(component.currentSupplierInformation).toEqual(supplierInfoBeerStore);
    });

    it('should set offer', () => {
      fixture.detectChanges();

      expect(component.offer).toEqual(offer);
    });

    it('should set lendingApplication', () => {
      lendingApplicationPropertySpy.and.returnValue(new BehaviorSubject(lendingApplicationApproved));
      fixture.detectChanges();

      expect(component.lendingApplication).toEqual(lendingApplicationApproved);
    });

    it('should eventually set loaded to true', () => {
      expect(component.loaded).toBeFalsy();

      fixture.detectChanges();

      expect(component.loaded).toBeTruthy();
    });

    describe('ATTRIBUTES', () => {
      const offer = offerFactory.build({ state: OfferState.approved, available_terms: [ lendingTerm120Days, lendingTerm90Days ] });
      const rejectedOffer = offerFactory.build({
        state: OfferState.rejected,
        available_terms: [ lendingTerm120Days, lendingTerm90Days ], max_principal_amount: 0
      });

      describe('when there is an offer but no application', () => {
        const offerNoTerms = offerFactory.build({ available_terms: [] });
        const offerNullTerms = offerFactory.build({ available_terms: null });

        it('should set all expected attributes', () => {
          offerSpy.and.returnValue(new BehaviorSubject(offer));
          fixture.detectChanges();

          expect(component.offer).toEqual(offer);
          expect(component.max_available).toEqual(offerService.getOfferAvailableAmount(offer));
          expect(component.min_available).toEqual(offer.min_principal_amount);
          expect(component.getTerms()).toEqual(offer.available_terms);
          // should be set to longest term
          expect(component.defaultLoanTerm).toEqual(lendingTerm120Days);
          expect(component.currentLoanTerm).toEqual(lendingTerm120Days);
        });

        it('should set empty terms and not set default term when available terms in offer is empty', () => {
          offerSpy.and.returnValue(new BehaviorSubject(offerNoTerms));
          directDebitEnabledSpy.and.returnValue(false);
          fixture.detectChanges();

          expect(component.offer).toEqual(offerNoTerms);
          expect(component.getTerms()).toEqual([]);
          expect(component.defaultLoanTerm).toBeFalsy();
          expect(component.currentLoanTerm).toBeFalsy();
          expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
        });

        it('should throw a bugsnag when available terms in offer is null', () => {
          offerSpy.and.returnValue(new BehaviorSubject(offerNullTerms));
          directDebitEnabledSpy.and.returnValue(false);
          fixture.detectChanges();

          expect(component.offer).toEqual(offerNullTerms);
          expect(component.getTerms()).toBeFalsy();
          expect(component.defaultLoanTerm).toBeFalsy();
          expect(component.currentLoanTerm).toBeFalsy();
          expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
        });

        it('should set default term to weekly and last term if weekly is present', () => {
          const offerWithMultiTerms = offerFactory.build({
            available_terms: [
              lendingTermFactory.build({ term_frequency: RepaymentSchedule.weekly, term_duration: 60 }),
              lendingTermFactory.build({ term_frequency: RepaymentSchedule.weekly, term_duration: 90 }),
              lendingTermFactory.build({ term_frequency: RepaymentSchedule.bi_weekly, term_duration: 60 }),
              lendingTermFactory.build({ term_frequency: RepaymentSchedule.bi_weekly, term_duration: 90 }),
              lendingTermFactory.build({ term_frequency: RepaymentSchedule.daily, term_duration: 60 }),
              lendingTermFactory.build({ term_frequency: RepaymentSchedule.daily, term_duration: 90 }),
              lendingTermFactory.build({ term_frequency: RepaymentSchedule.daily, term_duration: 120 }),
            ]
          });

          offerSpy.and.returnValue(new BehaviorSubject(offerWithMultiTerms));
          weeklyRepaymentsEnabledSpy.and.returnValue(true);
          fixture.detectChanges();

          expect(component.defaultLoanTerm.term_frequency).toEqual(RepaymentSchedule.weekly);
          expect(component.defaultLoanTerm.term_duration).toEqual(90);
          expect(component.frequency).toEqual('INVOICE.FREQUENCY_WEEKLY');
        });

        it('should set default term to daily and last term if weekly is NOT present and daily is present', () => {
          const offerWithMultiTerms = offerFactory.build({
            available_terms: [
              lendingTermFactory.build({ term_frequency: RepaymentSchedule.bi_weekly, term_duration: 60 }),
              lendingTermFactory.build({ term_frequency: RepaymentSchedule.bi_weekly, term_duration: 90 }),
              lendingTermFactory.build({ term_frequency: RepaymentSchedule.daily, term_duration: 60 }),
              lendingTermFactory.build({ term_frequency: RepaymentSchedule.daily, term_duration: 90 }),
              lendingTermFactory.build({ term_frequency: RepaymentSchedule.daily, term_duration: 120 }),
            ]
          });

          offerSpy.and.returnValue(new BehaviorSubject(offerWithMultiTerms));
          weeklyRepaymentsEnabledSpy.and.returnValue(true);
          fixture.detectChanges();

          expect(component.defaultLoanTerm.term_frequency).toEqual(RepaymentSchedule.daily);
          expect(component.defaultLoanTerm.term_duration).toEqual(120);
          expect(component.frequency).toEqual('INVOICE.FREQUENCY_DAILY');
        });

        it('should set default term to bi-weekly and last term if neither weekly nor daily are present and biweekly is present', () => {
          const offerWithMultiTerms = offerFactory.build({
            available_terms: [
              lendingTermFactory.build({ term_frequency: RepaymentSchedule.bi_weekly, term_duration: 60 }),
              lendingTermFactory.build({ term_frequency: RepaymentSchedule.bi_weekly, term_duration: 90 })
            ]
          });

          offerSpy.and.returnValue(new BehaviorSubject(offerWithMultiTerms));
          weeklyRepaymentsEnabledSpy.and.returnValue(true);
          fixture.detectChanges();

          expect(component.defaultLoanTerm.term_frequency).toEqual(RepaymentSchedule.bi_weekly);
          expect(component.defaultLoanTerm.term_duration).toEqual(90);
          expect(component.frequency).toEqual('INVOICE.FREQUENCY_BIWEEKLY');
        });
      });

      describe('when there is an offer and an approved application', () => {
        const applicationNoTerms = lendingApplicationFactory.build({ available_terms: [] });
        const applicationNullTerms = lendingApplicationFactory.build({ available_terms: null });
        const applicationMaxUndefined = lendingApplicationFactory.build({ max_principal_amount: undefined });

        it('should set all expected attributes when offer is approved', () => {
          offerSpy.and.returnValue(new BehaviorSubject(offer));
          const lendingApplication: LendingApplication = lendingApplicationFactory.build({
            available_terms: [ lendingTerm12months, lendingTerm9months ],
            term_unit: TermUnit.months,
            term_duration: 12
          });
          lendingApplicationPropertySpy.and.returnValue(new BehaviorSubject(lendingApplication));
          fixture.detectChanges();

          expect(component.offer).toEqual(offer);
          expect(component.lendingApplication).toEqual(lendingApplication);
          expect(component.principal).toEqual(lendingApplication.principal_amount);
          expect(component.max_available).toEqual(offerService.getOfferAvailableAmount(component.offer));
          expect(component.min_available).toEqual(offer.min_principal_amount);
          expect(component.getTerms()).toEqual(lendingApplication.available_terms);
          expect(component.dailyTerms).toEqual([ lendingTerm9months, lendingTerm12months ]);
          expect(component.weeklyTerms).toEqual([]);
          // should be set to longest term
          expect(component.defaultLoanTerm).toEqual(lendingTerm12months);
          expect(component.currentLoanTerm).toEqual(lendingTerm12months);
        });

        it('should set all expected attributes when offer is rejected', () => {
          offerSpy.and.returnValue(new BehaviorSubject(rejectedOffer));
          const lendingApplication: LendingApplication = lendingApplicationFactory.build({
            available_terms: [ lendingTerm12months, lendingTerm9months ],
            term_unit: TermUnit.months,
            term_duration: 12
          });
          lendingApplicationPropertySpy.and.returnValue(new BehaviorSubject(lendingApplication));
          fixture.detectChanges();

          expect(component.offer).toEqual(rejectedOffer);
          expect(component.lendingApplication).toEqual(lendingApplication);
          expect(component.principal).toEqual(lendingApplication.principal_amount);
          expect(component.max_available).toEqual(offerService.getOfferAvailableAmount(component.offer));
          expect(component.min_available).toEqual(rejectedOffer.min_principal_amount);
          expect(component.getTerms()).toEqual(lendingApplication.available_terms);
          expect(component.dailyTerms).toEqual([ lendingTerm9months, lendingTerm12months ]);
          expect(component.weeklyTerms).toEqual([]);
          // should be set to longest term
          expect(component.defaultLoanTerm).toEqual(lendingTerm12months);
          expect(component.currentLoanTerm).toEqual(lendingTerm12months);
        });

        it('should set all expected attributes when bi-weekly, daily, and weekly terms present (bi-weekly repayments)', () => {
          offerSpy.and.returnValue(new BehaviorSubject(offer));
          const weeklyTerm1: LendingTerm = lendingTermFactory.build({
            term_frequency: RepaymentSchedule.weekly,
            term_duration: 6,
            term_unit: TermUnit.months
          });
          const weeklyTerm2: LendingTerm = lendingTermFactory.build({
            term_frequency: RepaymentSchedule.weekly,
            term_duration: 10,
            term_unit: TermUnit.months
          });
          const biweeklyTerm1: LendingTerm = lendingTermFactory.build({
            term_frequency: RepaymentSchedule.bi_weekly,
            term_duration: 6,
            term_unit: TermUnit.months
          });
          const biweeklyTerm2: LendingTerm = lendingTermFactory.build({
            term_frequency: RepaymentSchedule.bi_weekly,
            term_duration: 10,
            term_unit: TermUnit.months
          });

          const lendingApplication = lendingApplicationFactory.build({
            available_terms: [ lendingTerm12months, lendingTerm9months, weeklyTerm1, weeklyTerm2, biweeklyTerm1, biweeklyTerm2 ],
            term_duration: 6,
            term_unit: TermUnit.months,
            repayment_schedule: RepaymentSchedule.bi_weekly
          });
          weeklyRepaymentsEnabledSpy.and.returnValue(true);
          lendingApplicationPropertySpy.and.returnValue(new BehaviorSubject(lendingApplication));
          fixture.detectChanges();

          expect(component.offer).toEqual(offer);
          expect(component.lendingApplication).toEqual(lendingApplication);
          expect(component.principal).toEqual(lendingApplication.principal_amount);
          expect(component.max_available).toEqual(offerService.getOfferAvailableAmount(component.offer));
          expect(component.min_available).toEqual(offer.min_principal_amount);
          expect(component.getTerms()).toEqual(lendingApplication.available_terms);
          expect(component.dailyTerms).toEqual([ lendingTerm9months, lendingTerm12months ]);
          expect(component.weeklyTerms).toEqual([ weeklyTerm1, weeklyTerm2 ]);
          expect(component.biweeklyTerms).toEqual([ biweeklyTerm1, biweeklyTerm2 ]);
          // should be set to longest term
          expect(component.defaultLoanTerm).toEqual(biweeklyTerm1);
          expect(component.currentLoanTerm).toEqual(biweeklyTerm1);
        });

        it('should set all expected attributes when bi-weekly, daily, and weekly terms present (daily repayments)', () => {
          offerSpy.and.returnValue(new BehaviorSubject(offer));
          const weeklyTerm1: LendingTerm = lendingTermFactory.build({
            term_frequency: RepaymentSchedule.weekly,
            term_duration: 6,
            term_unit: TermUnit.months
          });
          const weeklyTerm2: LendingTerm = lendingTermFactory.build({
            term_frequency: RepaymentSchedule.weekly,
            term_duration: 10,
            term_unit: TermUnit.months
          });
          const biweeklyTerm1: LendingTerm = lendingTermFactory.build({
            term_frequency: RepaymentSchedule.bi_weekly,
            term_duration: 6,
            term_unit: TermUnit.months
          });
          const biweeklyTerm2: LendingTerm = lendingTermFactory.build({
            term_frequency: RepaymentSchedule.bi_weekly,
            term_duration: 10,
            term_unit: TermUnit.months
          });

          const lendingApplication = lendingApplicationFactory.build({
            available_terms: [ lendingTerm12months, lendingTerm9months, weeklyTerm1, weeklyTerm2, biweeklyTerm1, biweeklyTerm2 ],
            term_duration: 9,
            term_unit: TermUnit.months,
            repayment_schedule: RepaymentSchedule.daily
          });
          weeklyRepaymentsEnabledSpy.and.returnValue(true);
          lendingApplicationPropertySpy.and.returnValue(new BehaviorSubject(lendingApplication));
          fixture.detectChanges();

          expect(component.offer).toEqual(offer);
          expect(component.lendingApplication).toEqual(lendingApplication);
          expect(component.max_available).toEqual(offerService.getOfferAvailableAmount(component.offer));
          expect(component.min_available).toEqual(offer.min_principal_amount);
          expect(component.getTerms()).toEqual(lendingApplication.available_terms);
          expect(component.dailyTerms).toEqual([ lendingTerm9months, lendingTerm12months ]);
          expect(component.weeklyTerms).toEqual([ weeklyTerm1, weeklyTerm2 ]);
          expect(component.biweeklyTerms).toEqual([ biweeklyTerm1, biweeklyTerm2 ]);
          // should be set to longest term
          expect(component.defaultLoanTerm).toEqual(lendingTerm9months);
          expect(component.currentLoanTerm).toEqual(lendingTerm9months);
        });

        it('should set all expected attributes when bi-weekly, daily, and weekly terms present (weekly repayments)', () => {
          offerSpy.and.returnValue(new BehaviorSubject(offer));
          const weeklyTerm1: LendingTerm = lendingTermFactory.build({
            term_frequency: RepaymentSchedule.weekly,
            term_duration: 6,
            term_unit: TermUnit.months
          });
          const weeklyTerm2: LendingTerm = lendingTermFactory.build({
            term_frequency: RepaymentSchedule.weekly,
            term_duration: 10,
            term_unit: TermUnit.months
          });
          const biweeklyTerm1: LendingTerm = lendingTermFactory.build({
            term_frequency: RepaymentSchedule.bi_weekly,
            term_duration: 6,
            term_unit: TermUnit.months
          });
          const biweeklyTerm2: LendingTerm = lendingTermFactory.build({
            term_frequency: RepaymentSchedule.bi_weekly,
            term_duration: 10,
            term_unit: TermUnit.months
          });

          const lendingApplication = lendingApplicationFactory.build({
            available_terms: [ lendingTerm12months, lendingTerm9months, weeklyTerm1, weeklyTerm2, biweeklyTerm1, biweeklyTerm2 ],
            term_duration: 6,
            term_unit: TermUnit.months,
            repayment_schedule: RepaymentSchedule.weekly
          });
          weeklyRepaymentsEnabledSpy.and.returnValue(true);
          lendingApplicationPropertySpy.and.returnValue(new BehaviorSubject(lendingApplication));
          fixture.detectChanges();

          expect(component.offer).toEqual(offer);
          expect(component.lendingApplication).toEqual(lendingApplication);
          expect(component.max_available).toEqual(offerService.getOfferAvailableAmount(component.offer));
          expect(component.min_available).toEqual(offer.min_principal_amount);
          expect(component.getTerms()).toEqual(lendingApplication.available_terms);
          expect(component.dailyTerms).toEqual([ lendingTerm9months, lendingTerm12months ]);
          expect(component.weeklyTerms).toEqual([ weeklyTerm1, weeklyTerm2 ]);
          expect(component.biweeklyTerms).toEqual([ biweeklyTerm1, biweeklyTerm2 ]);
          // should be set to longest term
          expect(component.defaultLoanTerm).toEqual(weeklyTerm1);
          expect(component.currentLoanTerm).toEqual(weeklyTerm1);
        });

        it('should set all expected attributes when bi-weekly, daily, and weekly terms present (unknown repayment frequency)', () => {
          offerSpy.and.returnValue(new BehaviorSubject(offer));

          const monthlyTerm: LendingTerm = lendingTermFactory.build({
            term_frequency: RepaymentSchedule.monthly,
            term_duration: 6,
            term_unit: TermUnit.months
          });

          const lendingApplication = lendingApplicationFactory.build({
            available_terms: [ lendingTerm12months, lendingTerm9months, monthlyTerm ],
            term_duration: 6,
            term_unit: TermUnit.months,
            repayment_schedule: RepaymentSchedule.monthly
          });
          weeklyRepaymentsEnabledSpy.and.returnValue(true);
          lendingApplicationPropertySpy.and.returnValue(new BehaviorSubject(lendingApplication));
          fixture.detectChanges();

          expect(component.offer).toEqual(offer);
          expect(component.lendingApplication).toEqual(lendingApplication);
          expect(component.max_available).toEqual(offerService.getOfferAvailableAmount(component.offer));
          expect(component.min_available).toEqual(offer.min_principal_amount);
          expect(component.getTerms()).toEqual(lendingApplication.available_terms);
          expect(component.dailyTerms).toEqual([ lendingTerm9months, lendingTerm12months ]);
          expect(component.weeklyTerms).toEqual([]);
          expect(component.biweeklyTerms).toEqual([]);
          // should be set to longest term
          expect(component.defaultLoanTerm).toEqual(lendingTerm12months);
          expect(component.currentLoanTerm).toEqual(lendingTerm12months);
          expect(lendingApplicationsService.loadApplicationFee).not.toHaveBeenCalled();
        });

        it('should set empty terms and not set default term when available terms in application is empty', () => {
          lendingApplicationPropertySpy.and.returnValue(new BehaviorSubject(applicationNoTerms));

          fixture.detectChanges();

          expect(component.lendingApplication).toEqual(applicationNoTerms);
          expect(component.getTerms()).toEqual([]);
          expect(component.defaultLoanTerm).toBeFalsy();
          expect(component.currentLoanTerm).toBeFalsy();
        });

        it('should set null terms and not set default term when available terms in application is null', () => {
          lendingApplicationPropertySpy.and.returnValue(new BehaviorSubject(applicationNullTerms));
          fixture.detectChanges();

          expect(component.lendingApplication).toEqual(applicationNullTerms);
          expect(component.getTerms()).toBeFalsy();
          expect(component.defaultLoanTerm).toBeFalsy();
          expect(component.currentLoanTerm).toBeFalsy();
        });

        it('should set max_available to max_principal_amount in offer if max_principal_amount in application is undefined', () => {
          lendingApplicationPropertySpy.and.returnValue(new BehaviorSubject(applicationMaxUndefined));
          fixture.detectChanges();

          expect(component.lendingApplication).toEqual(applicationMaxUndefined);
          expect(component.max_available).toEqual(offer.available_amount);
        });

        it('should set min_available to sum of payouts in application if application has payouts', () => {
          const lendingApplication: LendingApplication = lendingApplicationFactory.build({
            available_terms: [ lendingTerm12months, lendingTerm9months ],
            offline_payouts: [ lendingPayoutCra, lendingPayoutLandlord ],
            state: ApplicationState.approved,
            term_unit: TermUnit.months,
            term_duration: 9
          });
          lendingApplicationPropertySpy.and.returnValue(new BehaviorSubject(lendingApplication));
          const expectedMin = lendingPayoutCra.amount + lendingPayoutLandlord.amount;
          fixture.detectChanges();

          expect(component.lendingApplication).toEqual(lendingApplication);
          expect(component.min_available).toEqual(expectedMin);
        });
      });

      describe('when there is no offer', () => {
        beforeEach(() => {
          offerSpy.and.returnValue(new BehaviorSubject(null));
        });

        it('should trigger logging service and bugsnag with message about invalid state', () => {
          fixture.detectChanges();

          expect(Bugsnag.notify).toHaveBeenCalled();
        });
      });

      describe('when there is a supplier', () => {
        it('should call to load selected offer details for the chosen supplier', () => {
          // uses default stubs
          fixture.detectChanges();

          expect(offerService.loadOffer$).toHaveBeenCalledOnceWith(offer.id, supplierInfoBeerStore.id);
        });

        it('error service should call show if error loading offer for supplier', () => {
          loadOfferSpy.and.returnValue(throwError(new HttpErrorResponse({})));
          spyOn(errorService, 'show');

          fixture.detectChanges();

          expect(errorService.show).toHaveBeenCalledOnceWith(UiError.getOffers);
        });
      });

      describe('when there is no supplier', () => {
        it('should not call to load selected offer details', () => {
          currentSupplierInformationSpy.and.returnValue(new BehaviorSubject<SupplierInformation>(null));

          fixture.detectChanges();

          expect(offerService.loadOffer$).toHaveBeenCalledTimes(0);
        });
      });
    });

    describe('when there is no active invoice', () => {
      it('should mark invoice_loaded flag to true', () => {
        fixture.detectChanges();
        expect(component.loaded_invoice).toBeTruthy();
      });

      it('should not call fetchInvoice when no active invoice', () => {
        spyOn(borrowerInvoiceService, 'fetchInvoice');

        fixture.detectChanges();
        expect(component.loaded_invoice).toBeTruthy();
        expect(borrowerInvoiceService.fetchInvoice).toHaveBeenCalledTimes(0);
      });

      it('should return 0 for getInvoiceAmount', () => {
        getActiveInvoiceSpy.and.returnValue(null);
        fixture.detectChanges();
        const res = component.getInvoiceAmount();
        expect(res).toBe(0.00);
      });

      it('should return 0 for getInvoiceProcessingAmount', () => {
        getActiveInvoiceSpy.and.returnValue(null);
        fixture.detectChanges();
        const res = component.getInvoiceProcessingAmount();
        expect(res).toBe(0.00);
      });

      it( 'should return 0 for getInvoiceAmountDue', () => {
        getActiveInvoiceSpy.and.returnValue(null);
        fixture.detectChanges();
        const res = component.getInvoiceAmountDue();
        expect(res).toBe(0.00);
      });

      it('should show financing method by default', () => {
        getActiveInvoiceSpy.and.returnValue(null);
        fixture.detectChanges();

        expect(component.isFinancingAvailable).toBeTruthy();
        expect(component.paymentMethod).toEqual(LendingTermType.financing);
        expect(component.frequency).toEqual('INVOICE.FREQUENCY_DAILY');
      });
    }); // describe - when there is no active invoice

    describe('when there is an active invoice', () => {
      const fetchInvoice$ = of(invoiceResponseResponseFactory.build());
      const invoice$ = new BehaviorSubject(invoiceResponseFactory.build());

      let getBorrowerInvoiceSpy: jasmine.Spy;
      let fetchInvoiceSpy: jasmine.Spy;

      beforeEach(() => {
        hasActiveInvoiceSetSpy.and.returnValue(true);
        getActiveInvoiceSpy.and.returnValue(borrowerInvoice);
        fetchInvoiceSpy = spyOn(borrowerInvoiceService, 'fetchInvoice').and.returnValue(fetchInvoice$);
        getBorrowerInvoiceSpy = spyOn(borrowerInvoiceService, 'getBorrowerInvoice').and.returnValue(invoice$);


        currentSupplierInformationSpy.and.callThrough();
        spyOnProperty(configurationService, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      });

      it('should mark invoice_loaded flag to true', () => {
        fixture.detectChanges();

        expect(component.loaded_invoice).toBeTruthy();
      });

      it('should retrieve expected invoice info', () => {
        fixture.detectChanges();

        expect(component.getAccountNumber()).toEqual(borrowerInvoice.account_number);
        expect(component.getInvoiceNumber()).toEqual(borrowerInvoice.invoice_number);
        expect(component.getInvoiceAmount()).toEqual(borrowerInvoice.amount);
        expect(component.getInvoiceProcessingAmount()).toEqual(borrowerInvoice.processing_amount);
        expect(component.getInvoiceAmountDue()).toEqual(borrowerInvoice.amount - borrowerInvoice.amount_paid - borrowerInvoice.processing_amount);
      });

      it('should populate supplier information', () => {
        fixture.detectChanges();

        const suppInfo = component.currentSupplierInformation;

        expect(suppInfo.account_number).toEqual(borrowerInvoice.account_number);
        expect(suppInfo.invoice_number).toEqual(borrowerInvoice.invoice_number);
        expect(suppInfo.id).toEqual(borrowerInvoice.supplier_entity.id);
        expect(suppInfo.name).toEqual(borrowerInvoice.supplier_entity.name);
      });

      it('should display correct error modal if fails to load invoice', () => {
        fetchInvoiceSpy.and.returnValue(throwError(new HttpErrorResponse({})));
        spyOn(errorService, 'show');
        fixture.detectChanges();

        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.loadInvoiceError);
      });

      it('should redirect to dashboard if fails to load invoice', () => {
        fetchInvoiceSpy.and.returnValue(throwError(new HttpErrorResponse({})));
        fixture.detectChanges();

        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root);
      });

      it('should clear invoice if fails to load invoice', () => {
        fetchInvoiceSpy.and.returnValue(throwError(new HttpErrorResponse({})));

        hasActiveInvoiceSetSpy.and.callThrough();
        getActiveInvoiceSpy.and.callThrough();

        fixture.detectChanges();

        expect(borrowerInvoiceService.hasActiveInvoiceSet()).toBeFalsy();
        expect(borrowerInvoiceService.getActiveInvoice()).toEqual(emptyBorrowerInvoice);
      });

      it('should get the correct invoice amount', () => {
        fixture.detectChanges();
        const result = component.getInvoiceAmount();
        expect(result).toEqual(borrowerInvoice.amount);
      });

      it('should get the correct invoice amount processing', () => {
        fixture.detectChanges();
        const result = component.getInvoiceProcessingAmount();
        expect(result).toEqual(borrowerInvoice.processing_amount);
      });

      it('should get the correct invoice amount due', () => {
        fixture.detectChanges();
        const result = component.getInvoiceAmountDue();
        expect(result).toEqual(borrowerInvoice.amount - borrowerInvoice.amount_paid - borrowerInvoice.processing_amount);
      });

      it('should not set supplier information if no invoice is set', () => {
        getBorrowerInvoiceSpy.and.returnValue(new BehaviorSubject(null));
        spyOn(supplierService, 'setCurrentSupplierInformation');

        fixture.detectChanges();

        expect(supplierService.setCurrentSupplierInformation).not.toHaveBeenCalled();
      });

      it('should only show direct debit method by default if merchant is not certified and direct debit enabled', () => {
        offerSpy.and.returnValue(new BehaviorSubject(offerNoPreapproval));
        directDebitEnabledSpy.and.returnValue(true);
        fixture.detectChanges();

        expect(component.isFinancingAvailable).toBeFalsy(); // This will hide financing method from dropdown
        expect(component.paymentMethod).toEqual(LendingTermType.direct_debit);
        expect(component.frequency).toEqual('INVOICE.FREQUENCY_ONE_TIME');
      });

      it('should show financing method by default if merchant is not certified and direct debit disabled', () => {
        offerSpy.and.returnValue(new BehaviorSubject(offerNoPreapproval));
        directDebitEnabledSpy.and.returnValue(false);

        fixture.detectChanges();

        expect(component.isFinancingAvailable).toBeTruthy();
        expect(component.paymentMethod).toEqual(LendingTermType.financing);
        expect(component.frequency).toEqual('INVOICE.FREQUENCY_DAILY');
      });

      it('should only show direct debit method by default if min financing amount is higher than invoice amount and direct debit enabled', () => {
        const offer = offerFactory.build({
          application_prerequisites: {
            supplier_guid: 'su_5cEi8DdJ1RYN15EM',
            offer_type: OfferType.LineOfCredit,
          },
          max_principal_amount: 8000.00,
          min_principal_amount: 2000.00 // higher than borrowerInvoice
        });
        offerSpy.and.returnValue(new BehaviorSubject(offer));
        directDebitEnabledSpy.and.returnValue(true);

        fixture.detectChanges();

        expect(component.isFinancingAvailable).toBeFalsy(); // This will hide financing method from dropdown
        expect(component.paymentMethod).toEqual(LendingTermType.direct_debit);
        expect(component.frequency).toEqual('INVOICE.FREQUENCY_ONE_TIME');
      });

      it('should show financing method by default if min financing amount is higher than invoice amount and direct debit disabled', () => {
        const offer = offerFactory.build({
          application_prerequisites: {
            supplier_guid: 'su_5cEi8DdJ1RYN15EM',
            offer_type: OfferType.LineOfCredit,
          },
          max_principal_amount: 8000.00,
          min_principal_amount: 2000.00 // higher than borrowerInvoice
        });
        offerSpy.and.returnValue(new BehaviorSubject(offer));
        directDebitEnabledSpy.and.returnValue(false);

        fixture.detectChanges();

        expect(component.isFinancingAvailable).toBeTruthy();
        expect(component.paymentMethod).toEqual(LendingTermType.financing);
        expect(component.frequency).toEqual('INVOICE.FREQUENCY_DAILY');
      });

      it('should show financing method by default if min financing amount is lower than invoice amount', () => {
        const offer = offerFactory.build({
          application_prerequisites: {
            supplier_guid: 'su_5cEi8DdJ1RYN15EM',
            offer_type: OfferType.LineOfCredit,
          },
          max_principal_amount: 8000.00,
          min_principal_amount: 1000.00 // higher than borrowerInvoice
        });
        offerSpy.and.returnValue(new BehaviorSubject(offer));

        fixture.detectChanges();

        expect(component.isFinancingAvailable).toBeTruthy();
        expect(component.paymentMethod).toEqual(LendingTermType.financing);
        expect(component.frequency).toEqual('INVOICE.FREQUENCY_DAILY');
      });
    });

    it('should set pafAgreement if agreement type is PAF', () => {
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      hasActiveInvoiceSetSpy.and.returnValue(true);
      const agreement: Agreement = agreementFactory.build({ type: AgreementType.pre_authorized_financing });
      agreementSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(agreement));

      fixture.detectChanges();

      expect(component.pafAgreement).toEqual(agreement);
    });

    it('should not set pafAgreement if agreement type is not PAF', () => {
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      hasActiveInvoiceSetSpy.and.returnValue(true);
      agreementSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(agreementFactory.build()));

      fixture.detectChanges();

      expect(component.pafAgreement).toBeUndefined();
    });

    it('should not set pafAgreement if agreement is not present', () => {
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      hasActiveInvoiceSetSpy.and.returnValue(true);
      agreementSubjectSpy.and.returnValue(new BehaviorSubject<Agreement>(null));

      fixture.detectChanges();

      expect(component.pafAgreement).toBeUndefined();
    });

    it('should show error dialog and bugsnag if error occurs while loading PAF agreement', () => {
      spyOn(errorService, 'show');
      loadAgreementByTypeSpy.and.returnValue(throwError({ status: 500, message: 'Error loading PAF agreement' }));
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      hasActiveInvoiceSetSpy.and.returnValue(true);

      fixture.detectChanges();

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.getAgreement);
    });
  }); // describe - ngOnInit()

  describe('ngOnDestroy()', () => {
    beforeEach(() => {
      spyOn(component.unsubscribe$, 'next').and.callThrough();
      spyOn(component.unsubscribe$, 'complete').and.callThrough();
    });

    it('should call clearOfferFee in lending offer service', () => {
      spyOn(offerService, 'clearOfferFee');

      fixture.detectChanges();

      component.ngOnDestroy();
      expect(offerService.clearOfferFee).toHaveBeenCalledTimes(1);
    });

    it('should call clearLendingApplicationFee in lending application service', () => {
      spyOn(lendingApplicationsService, 'clearLendingApplicationFee');

      fixture.detectChanges();

      component.ngOnDestroy();
      expect(lendingApplicationsService.clearLendingApplicationFee).toHaveBeenCalledTimes(1);
    });

    it('should call clearLendingFee in lending offer service', () => {
      spyOn(supplierService, 'clearSupplierInformation');

      fixture.detectChanges();

      component.ngOnDestroy();
      expect(supplierService.clearSupplierInformation).toHaveBeenCalledTimes(1);
    });

    it('should call clearActiveInvoice in borrower invoice service', () => {
      spyOn(borrowerInvoiceService, 'clearActiveInvoice');

      fixture.detectChanges();

      component.ngOnDestroy();
      expect(borrowerInvoiceService.clearActiveInvoice).toHaveBeenCalledTimes(1);
    });

    it('should call clearAttributes in banking flow service', () => {
      spyOn(bankingFlowService, 'clearAttributes');

      fixture.detectChanges();

      component.ngOnDestroy();
      expect(bankingFlowService.clearAttributes).toHaveBeenCalledTimes(1);
    });

    it('should trigger the completion of observables', () => {
      component.ngOnDestroy();

      expect(component.unsubscribe$.next).toHaveBeenCalledOnceWith();
      expect(component.unsubscribe$.complete).toHaveBeenCalledOnceWith();
    });
  }); // describe - ngOnDestroy()

  describe('FORM', () => {
    it('should initialise form controls with null amount and default term', () => {
      offerSpy.and.returnValue(new BehaviorSubject(offer));

      fixture.detectChanges();

      expect(component.defaultLoanTerm).toBeTruthy();
      expect(component.selectLendingOfferFormGroup.controls.amount.value).toBeFalsy();
    });

    describe('should trigger fee call', () => {
      it('from offers service if there is no approved application', fakeAsync(() => {
        // use default stubs
        fixture.detectChanges();
        component.selectLendingOfferFormGroup.controls.amount.setValue(2000); // trigger fee call
        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME); // debounce time on principal change

        expect(lendingApplicationsService.loadApplicationFee).not.toHaveBeenCalled();
        expect(offerService.loadOfferFee$).toHaveBeenCalledTimes(1);
      }));

      it('from offers service and show specific error if loading offer fee throws error', fakeAsync(() => {
        loadOfferFeeSpy.and.returnValue(throwError({}));
        spyOn(errorService, 'show');

        fixture.detectChanges();
        component.selectLendingOfferFormGroup.controls.amount.setValue(1000); // trigger fee call
        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME); // debounce time on principal change

        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.getOfferFee);
        expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
      }));

      it('from lending applications service if there is an approved application', fakeAsync(() => {
        lendingApplicationPropertySpy.and.returnValue(new BehaviorSubject(lendingApplicationApproved));

        fixture.detectChanges();
        // Set Fee
        component.selectLendingOfferFormGroup.controls.amount.setValue(500);
        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME); // debounce time on principal change
        expect(lendingApplicationsService.loadApplicationFee).toHaveBeenCalledTimes(1);

        component.selectLendingOfferFormGroup.controls.amount.setValue(2000); // trigger fee call
        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME); // debounce time on principal change

        // Fee call triggered again with new amount
        expect(lendingApplicationsService.loadApplicationFee).toHaveBeenCalledTimes(2);
        expect(offerService.loadOfferFee$).not.toHaveBeenCalled();
      }));

      it('from lending applications service and show specific error if loading application fee throws error', fakeAsync(() => {
        const lendingApplication: LendingApplication = lendingApplicationFactory.build({
          available_terms: [ lendingTerm120Days, lendingTerm90Days, lendingTerm60Days ],
          state: ApplicationState.approved,
          term_unit: TermUnit.days,
          term_duration: 90
        });
        lendingApplicationPropertySpy.and.returnValue(new BehaviorSubject(lendingApplication));
        loadApplicationFeeSpy.and.returnValue(throwError({}));
        spyOn(errorService, 'show');

        fixture.detectChanges();
        // Set Fee
        component.selectLendingOfferFormGroup.controls.amount.setValue(500);
        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME); // debounce time on principal change

        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.getLendingApplicationFee);
        expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
      }));
    });

    describe('should set default loan to longest term and pre-select it in form', () => {
      const offerTerms = [ lendingTerm12months, lendingTerm9months, lendingTerm6months ]; // all in months
      const applicationTerms = [ lendingTerm120Days, lendingTerm90Days, lendingTerm60Days ]; // all in days
      const offer = offerFactory.build({ available_terms: offerTerms });

      it('based on terms from lending offer if there is no approved application', () => {
        offerSpy.and.returnValue(new BehaviorSubject(offer));

        fixture.detectChanges();

        // expect longest term in months (from offer)
        expect(component.defaultLoanTerm).toEqual(lendingTerm12months);
        expect(component.currentLoanTerm).toEqual(lendingTerm12months);
      });

      it('based on terms from lending application if there is an approved application', () => {
        const lendingApplication: LendingApplication = lendingApplicationFactory.build({ available_terms: applicationTerms, state: ApplicationState.pending });
        lendingApplicationPropertySpy.and.returnValue(new BehaviorSubject(lendingApplication));
        offerSpy.and.returnValue(new BehaviorSubject(offer));

        fixture.detectChanges();


        // expect longest term in days (from application)
        expect(component.defaultLoanTerm).toEqual(lendingTerm12months);
        expect(component.currentLoanTerm).toEqual(lendingTerm12months);
      });
    });

    // Remaining tests do not rely on whether there is an application so have defaulted to using lending offer fee call
    it('should trigger fee call and process values from the fee when principal changes', fakeAsync(() => {
      const newPrincipal = 1000;
      const newFee = offerFeeFactory.build({ principal_amount: newPrincipal });
      offerFeeSpy.and.returnValue(new BehaviorSubject(newFee));

      fixture.detectChanges();
      component.selectLendingOfferFormGroup.controls.amount.setValue(newPrincipal); // trigger fee call
      tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME); // debounce time on principal change

      expect(offerService.loadOfferFee$).toHaveBeenCalledTimes(1);
      expect(component.lendingFee).toBeTruthy();
      expect(component.lendingFee).toEqual(newFee);
      expect(component.total_repayment).not.toEqual(0);
      expect(component.total_repayment).toEqual(offerFee.fee + newPrincipal);
    }));

    it('should reset values if fee is null', fakeAsync(() => {
      const newPrincipal = 1000;
      offerFeeSpy.and.returnValue(new BehaviorSubject(null));

      fixture.detectChanges();
      component.selectLendingOfferFormGroup.controls.amount.setValue(newPrincipal); // trigger fee call
      tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME); // debounce time on principal change

      expect(offerService.loadOfferFee$).toHaveBeenCalledTimes(1);
      expect(component.lendingFee).toBeFalsy();
      expect(component.total_repayment).toEqual(0);
    }));

    it('should set calculatingFee flag to false when receive new fee', () => {
      const newPrincipal = 1000;
      const newFee = offerFeeFactory.build({ principal_amount: newPrincipal });
      offerFeeSpy.and.returnValue(new BehaviorSubject(newFee));

      fixture.detectChanges();

      expect(component.calculatingFee).toBeFalsy();
    });

    it(`should not reload fee on input change under ${GET_LENDING_OFFER_FEE.DEBOUNCE_TIME}ms`, fakeAsync(() => {
      fixture.detectChanges();
      component.selectLendingOfferFormGroup.controls.amount.setValue(1000); // trigger fee call
      tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME - 1);

      expect(offerService.loadOfferFee$).toHaveBeenCalledTimes(0);

      tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME + 1); // Flush pending API call with remaining debounce

      expect(offerService.loadOfferFee$).toHaveBeenCalledTimes(1);
    }));

    it(`should reload fee only once input change at ${GET_LENDING_OFFER_FEE.DEBOUNCE_TIME}ms exactly`, fakeAsync(() => {
      fixture.detectChanges();
      component.selectLendingOfferFormGroup.controls.amount.setValue(1000); // trigger fee call
      tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME); // debounce time on principal change

      expect(offerService.loadOfferFee$).toHaveBeenCalledTimes(1);
    }));

    it(`should not reload fee on input change if new principal is the same as current principal`, fakeAsync(() => {
      fixture.detectChanges();
      component.principal = 1000;
      component.selectLendingOfferFormGroup.controls.amount.setValue(1000); // trigger fee call
      tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME); // debounce time on principal change

      expect(offerService.loadOfferFee$).toHaveBeenCalledTimes(0);
    }));

    it('should have valid form and trigger fee call if the amount is less than available amount', fakeAsync(() => {
      spyOn(offerService, 'getOfferAvailableAmount').and.returnValue(offer.available_amount);

      fixture.detectChanges();

      component.selectLendingOfferFormGroup.controls.amount.setValue(offer.available_amount - 1);
      tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME);

      expect(offerService.getOfferAvailableAmount).toHaveBeenCalled();
      expect(component.selectLendingOfferFormGroup.valid).toBeTruthy();
      expect(offerService.loadOfferFee$).toHaveBeenCalledTimes(1);
    }));

    it('should have valid form and trigger fee call if the amount is equal to available principal', fakeAsync(() => {
      spyOn(offerService, 'getOfferAvailableAmount').and.returnValue(offer.available_amount);

      fixture.detectChanges();

      component.selectLendingOfferFormGroup.controls.amount.setValue(offer.available_amount);
      tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME); // debounce time on principal change

      expect(offerService.getOfferAvailableAmount).toHaveBeenCalled();
      expect(component.selectLendingOfferFormGroup.valid).toBeTruthy();
      expect(offerService.loadOfferFee$).toHaveBeenCalledTimes(1);
      }));

    it('should have invalid form, not trigger fee call, and set fee to 0 if the amount is greater than available amount', fakeAsync(() => {
      spyOn(offerService, 'getOfferAvailableAmount').and.returnValue(offer.available_amount);

      fixture.detectChanges();

      component.selectLendingOfferFormGroup.controls.amount.setValue(offer.available_amount + 1); // trigger fee call
      tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME);

      expect(offerService.getOfferAvailableAmount).toHaveBeenCalled();
      expect(component.selectLendingOfferFormGroup.valid).toBeFalsy();
      expect(offerService.loadOfferFee$).toHaveBeenCalledTimes(0);
      expect(component.lendingFee.fee).toEqual(0);
    }));

    it('should set principal after initial amount was marked invalid', fakeAsync(() => {
        const offer = offerFactory.build({ available_amount: 3000, min_principal_amount: 50 });
        offerSpy.and.returnValue(new BehaviorSubject(offer));
        directDebitEnabledSpy.and.returnValue(true);
        component.currentLoanTerm = offer.available_terms[ 0 ];
        const invoice = invoiceResponseFactory.build({ amount: 20.00 });
        spyOnProperty(component, 'invoice').and.returnValue(invoice);
        spyOnProperty(configurationService, 'preAuthorizedFinancingEnabled').and.returnValue(false);
        fixture.detectChanges();

        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME); // debounce time on principal change
        expect(component.selectLendingOfferFormGroup.valid).toBeFalsy();
        component.selectLendingOfferFormGroup.controls.amount.setValue(20);
        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME); // debounce time on principal change
        expect(component.selectLendingOfferFormGroup.valid).toBeFalsy();

        // fake this out to be null
        component.lendingFee = null;

        component.getTerms();
        const event = {
          target: {
            value: LendingTermType.direct_debit
          }
        };
        component.onPaymentMethodChange(event);
        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME); // debounce time on principal change

        expect(component.selectLendingOfferFormGroup.valid).toBeTruthy();
        expect(component.lendingFee.repayment_amount).toEqual(20);
        expect(component.lendingFee.principal_amount).toEqual(20);
        expect(component.lendingFee.fee).toEqual(2);
        expect(component.directDebitPromoFee).toEqual(-component.lendingFee.fee);
        expect(offerService.loadOfferFee$).toHaveBeenCalledTimes(0);
      }));

    it('should not attempt to initialize the form group if it has been marked initialized', () => {
        const offer = offerFactory.build({ available_amount: 3000, min_principal_amount: 50 });
        offerSpy.and.returnValue(new BehaviorSubject(offer));
        directDebitEnabledSpy.and.returnValue(true);
        component.currentLoanTerm = offer.available_terms[ 0 ];
        const invoice = invoiceResponseFactory.build({ amount: 20.00 });
        spyOnProperty(component, 'invoice').and.returnValue(invoice);
        spyOnProperty(configurationService, 'preAuthorizedFinancingEnabled').and.returnValue(false);
        component.isFormGroupInitialized = true;
        component.ngOnInit();

        expect(component.selectLendingOfferFormGroup).toBeFalsy();
      });

    it('should initialize the form group if it has been marked initialized', () => {
        const offer = offerFactory.build({ available_amount: 3000, min_principal_amount: 50 });
        offerSpy.and.returnValue(new BehaviorSubject(offer));
        directDebitEnabledSpy.and.returnValue(true);
        component.currentLoanTerm = offer.available_terms[ 0 ];
        const invoice = invoiceResponseFactory.build({ amount: 20.00 });
        spyOnProperty(component, 'invoice').and.returnValue(invoice);
        spyOnProperty(configurationService, 'preAuthorizedFinancingEnabled').and.returnValue(false);

        fixture.detectChanges();
        expect(component.isFormGroupInitialized).toBeTruthy();
        expect(component.selectLendingOfferFormGroup).toBeTruthy();
      });
  }); // describe - FORM

  // -------------------------------------------------------------------------------- onTermClick()
  describe('onTermClick()', () => {
    const mockLendingOffer = offer;
    const mockLendingTerm = mockLendingOffer.available_terms[ 0 ];
    const mockLendingTerm2 = mockLendingOffer.available_terms[ 1 ];

    it('should load fee when new term is selected', () => {
      offerSpy.and.returnValue(new BehaviorSubject(mockLendingOffer));
      spyOn(component, 'getTerms').and.returnValue(mockLendingOffer.available_terms);
      component.currentLoanTerm = mockLendingTerm;
      component.principal = 1000;

      fixture.detectChanges();
      const mockedInput = {
        amount: 1000,
        paymentMethod: LendingTermType.financing,
        paymentTerm: mockLendingOffer.available_terms,
        paymentFrequency: RepaymentSchedule.daily
      };
      component.selectLendingOfferFormGroup.setValue(mockedInput); // set initial values before click
      const event = {
        target: {
          value: mockLendingTerm2.id
        }
      };
      component.onTermClick(event);

      expect(offerService.loadOfferFee$).toHaveBeenCalledTimes(1);
    });

    it('does not load fee when amount is not set', () => {
      offerSpy.and.returnValue(new BehaviorSubject(mockLendingOffer));
      spyOn(component, 'getTerms').and.returnValue(mockLendingOffer.available_terms);
      component.currentLoanTerm = mockLendingTerm;
      component.principal = 1000;

      fixture.detectChanges();
      const mockedInput = {
        amount: null,
        paymentMethod: LendingTermType.financing,
        paymentTerm: mockLendingOffer.available_terms,
        paymentFrequency: RepaymentSchedule.daily
      };
      component.selectLendingOfferFormGroup.setValue(mockedInput); // set initial values before click
      const event = {
        target: {
          value: mockLendingTerm2.id
        }
      };
      component.onTermClick(event);

      expect(offerService.loadOfferFee$).toHaveBeenCalledTimes(0);
    });

    it('does not load fee when new term is same as old', fakeAsync(() => {
      offerSpy.and.returnValue(new BehaviorSubject(mockLendingOffer));
      spyOn(component, 'getTerms').and.returnValue(mockLendingOffer.available_terms);

      component.currentLoanTerm = mockLendingTerm;

      component.principal = 1000;

      const elem = document.createElement('label');
      elem.id = mockLendingTerm.id;
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: elem });

      fixture.detectChanges();
      component.onTermClick(event);
      tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME);

      expect(offerService.loadOfferFee$).toHaveBeenCalledTimes(0);
    }));

    it('should not load fee if term selected is not among terms', fakeAsync(() => {
      offerSpy.and.returnValue(new BehaviorSubject(mockLendingOffer));
      spyOn(component, 'getTerms').and.returnValue(mockLendingOffer.available_terms);
      component.currentLoanTerm = mockLendingTerm;
      component.principal = 1000;

      const elem = document.createElement('label');
      elem.id = 'some_id';
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: elem });

      fixture.detectChanges();
      component.onTermClick(event);
      tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME);

      expect(offerService.loadOfferFee$).toHaveBeenCalledTimes(0);
    }));

    it('should call loggingService.GTMUpdate with loan term duration if new term exists', () => {
      spyOn(component, 'getTerms').and.returnValue(mockLendingOffer.available_terms);
      spyOn(loggingService, 'GTMUpdate');
      component.currentLoanTerm = mockLendingTerm;
      component.principal = 1000;

      fixture.detectChanges();
      const event = {
        target: {
          value: mockLendingTerm2.id
        }
      };
      component.onTermClick(event);

      const expectedTerms = `${component.currentLoanTerm.term_duration} ${component.currentLoanTerm.term_unit}`;

      expect(loggingService.GTMUpdate).toHaveBeenCalledOnceWith(GTMEvent.BUTTON_CLICKED, expectedTerms);
    });

    it('should not call loggingService.GTMUpdate if no new term is found', fakeAsync(() => {
      spyOn(component, 'getTerms').and.returnValue(mockLendingOffer.available_terms);
      spyOn(loggingService, 'GTMUpdate');

      component.currentLoanTerm = mockLendingTerm;
      component.principal = 1000;

      const elem = document.createElement('label');
      elem.id = mockLendingTerm.id + Math.floor(Math.random() * 1000) + 1;
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: elem });

      fixture.detectChanges();
      component.onTermClick(event);
      tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME);

      expect(loggingService.GTMUpdate).not.toHaveBeenCalled();
    }));
  });

  // ------------------------------------------------------------------ processLendingApplication()
  describe('processLendingApplication()', () => {
    const mockPrincipal = 2500;
    const mockMerchant = passedIdentityAuthenticatedMerchant;
    const mockFee = offerFee;
    const mockTerm = lendingTerm6weeks;
    const mockSupplierInfo = supplierInfoLcbo;

    describe('when there is no approved application', () => {
      beforeEach(() => {
        fixture.detectChanges();

        offerService.setOffer(offer);

        component.principal = mockPrincipal;
        component.currentLoanTerm = mockTerm;
        component.currentSupplierInformation = mockSupplierInfo;
        component.lendingFee = mockFee;
        component.merchant = mockMerchant;
      });

      describe('should post application with correct payload', () => {
        it('when there is supplier information', () => {
          component.currentSupplierInformation = mockSupplierInfo;

          const userSession = userSessionFactory.build();
          const expectedPayload = lendingApplicationPostFactory.build({
            offer_id: offer.id,
            principal_amount: mockPrincipal,
            merchant_user_email: userSession.email,
            merchant_user_id: userSession.id,
            interest_amount: mockFee.fee,
            repayment_amount: mockFee.repayment_amount,
            loan_term_id: mockTerm.id,
            payee_account_num: mockSupplierInfo.account_number,
            payee_invoice_num: mockSupplierInfo.invoice_number,
            payee_id: mockSupplierInfo.id
          });

          component.processLendingApplication();

          expect(lendingApplicationsService.postApplication).toHaveBeenCalledOnceWith(expectedPayload);
        });

        it('when there is no supplier information', () => {
          component.currentSupplierInformation = undefined;

          const userSession = userSessionFactory.build();
          const expectedPayload = lendingApplicationPostNoSupplierFactory.build({
            offer_id: offer.id,
            principal_amount: mockPrincipal,
            merchant_user_email: userSession.email,
            merchant_user_id: userSession.id,
            interest_amount: mockFee.fee,
            repayment_amount: mockFee.repayment_amount,
            loan_term_id: mockTerm.id,
            payee_id: mockMerchant.id
          });

          component.processLendingApplication();

          expect(lendingApplicationsService.postApplication).toHaveBeenCalledOnceWith(expectedPayload);
        });

        it('should call next when current selected loan term is direct debit', () => {
          offerService.setOffer(offerUnsupportedOfferTypeApproved); // overwrite from beforeEach
          component.currentLoanTerm = {
            term_unit: TermUnit.one_time,
            id: 'direct_debit',
            term_duration: 0,
            term_type: LendingTermType.direct_debit,
            term_frequency: RepaymentSchedule.none
          };
          const invoice = invoiceResponseFactory.build({ amount: 1000.00 });
          component.principal = mockPrincipal;
          component.merchant = merchantDataFactory.build();
          component.invoice = invoice;

          component.processLendingApplication();

          const expectedPost = { merchant_id: merchantDataFactory.build().id, amount: mockPrincipal, invoice_id: invoice.id};
          expect(storeDirectPaymentInformationSpy).toHaveBeenCalledWith(expectedPost, component.currentSupplierInformation);
          expect(lendingApplicationsService.postApplication).not.toHaveBeenCalled();
        });

        it('should call storeDirectPaymentInformation with invoice info for Pay a Supplier flow', () => {
          offerService.setOffer(offerUnsupportedOfferTypeApproved); // overwrite from beforeEach
          component.currentLoanTerm = {
            term_unit: TermUnit.one_time,
            id: 'direct_debit',
            term_duration: 0,
            term_type: LendingTermType.direct_debit,
            term_frequency: RepaymentSchedule.none
          };
          component.principal = mockPrincipal;
          component.merchant = merchantDataFactory.build();
          component.invoice = null;
          component.currentSupplierInformation = {
            name: 'Supplier1',
            id: 'su_123',
            account_number: '123',
            invoice_number: '456',
            is_business_partner: true
          };

          component.processLendingApplication();
          const expectedPost = { merchant_id: merchantDataFactory.build().id, amount: mockPrincipal, invoice_number: '456',
            account_number: '123', payee_id: 'su_123' };
          expect(storeDirectPaymentInformationSpy).toHaveBeenCalledWith(expectedPost, component.currentSupplierInformation);
          expect(lendingApplicationsService.postApplication).not.toHaveBeenCalled();
        });

        it('should display an error if merchant KYC is unverified', () => {
          offerService.setOffer(offerUnsupportedOfferTypeApproved); // overwrite from beforeEach
          component.currentLoanTerm = {
            term_frequency: RepaymentSchedule.none,
            term_unit: TermUnit.one_time,
            id: 'direct_debit',
            term_duration: 0,
            term_type: LendingTermType.direct_debit
          };
          const invoice = invoiceResponseFactory.build({ amount: 1000.00 });
          const merchantUnverified = merchantDataFactory.build({ kyc_verified: kycVerifiedFactory.build({ status: KycCheckStatus.unverified }) });
          getMerchantSpy.and.returnValue(merchantUnverified);
          component.principal = mockPrincipal;
          component.merchant = merchantUnverified;
          component.invoice = invoice;
          spyOn(errorService, 'show');

          component.processLendingApplication();

          const expected_context: ErrorModalContext = new ErrorModalContext(
            'KYC_IN_PROGRESS.TITLE',
            [ 'KYC_IN_PROGRESS.BODY' ]
          );

          expect(lendingApplicationsService.postApplication).not.toHaveBeenCalled();
          expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general, expected_context);
        });
      });

      it('should not try to post a lending application if already posting one', () => {
        postApplicationSpy.and.returnValue(of(null));
        // Attempt double create
        component.processingOperation = true;
        component.processLendingApplication();

        expect(lendingApplicationsService.postApplication).not.toHaveBeenCalled();
      });

      it('should show a specific error if failed posting the lending application but not bugsnag if not primary applicant', () => {
        postApplicationSpy.and.returnValue(throwError(new ErrorResponse(paymentRequiredFactory.build())));
        spyOn(errorService, 'show');

        component.processLendingApplication();

        expect(lendingApplicationsService.postApplication).toHaveBeenCalledTimes(1);
        expect(Bugsnag.notify).toHaveBeenCalledTimes(0);
        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.postLendingApplication);
      });

      it('should show a specific error if failed posting the lending application and bugsnag if not a 402', () => {
        postApplicationSpy.and.returnValue(throwError({}));
        spyOn(errorService, 'show');

        component.processLendingApplication();

        expect(lendingApplicationsService.postApplication).toHaveBeenCalledTimes(1);
        expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.postLendingApplication);
      });
    });

    describe('when there is an approved application', () => {
      beforeEach(() => {
        lendingApplicationPropertySpy.and.returnValue(new BehaviorSubject(lendingApplicationApproved));
        fixture.detectChanges();
        component.principal = mockPrincipal;
        component.currentLoanTerm = mockTerm;
      });

      it('should amend application with correct application, principal, and term', () => {
        component.processLendingApplication();

        expect(lendingApplicationsService.amend).toHaveBeenCalledOnceWith(lendingApplicationApproved.id, mockPrincipal, mockTerm);
      });

      it('should not try to amend a lending application if already posting one', () => {
        amendSpy.and.returnValue(of(null));
        // Attempt double create
        component.processingOperation = true;
        component.processLendingApplication();

        expect(lendingApplicationsService.amend).not.toHaveBeenCalled();
      });

      it('should show a specific error if failed amending the lending application', () => {
        amendSpy.and.returnValue(throwError({}));
        spyOn(errorService, 'show');

        component.processLendingApplication();

        expect(lendingApplicationsService.amend).toHaveBeenCalledTimes(1);
        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.amendLendingApplication);
      });
    });

    describe('regardless of application', () => {
      beforeEach(() => {
        offerService.setOffer(offer);

        fixture.detectChanges();

        component.lendingFee = mockFee;
        component.principal = mockPrincipal;
        component.currentLoanTerm = mockTerm;
      });

      it('should not try to process st a lending application if user is in delegated access mode', () => {
        isDelegatedAccessModeSpy.and.returnValue(true);

        component.processLendingApplication();

        expect(lendingApplicationsService.postApplication).not.toHaveBeenCalled();
        expect(lendingApplicationsService.amend).not.toHaveBeenCalled();
      });

      it('should trigger delegated mode modal if user in delegated access mode', () => {
        isDelegatedAccessModeSpy.and.returnValue(true);
        spyOn(errorService, 'show');

        component.processLendingApplication();

        expect(errorService.show).toHaveBeenCalledOnceWith(UiError.delegatedMode);
      });

      it('should call next() on success', () => {
        spyOn(component, 'next');

        component.processLendingApplication();

        expect(component.next).toHaveBeenCalledTimes(1);
      });
    });
  }); // describe - processLendingApplication()

  // NAVIGATION

  // -------------------------------------------------------------------------------------- next()
  describe('next()', () => {
    it('should state-route to approval_prerequisites', () => {
      component.next();

      expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.application.approval_prerequisites, true);
    });

    it('should go to direct debit prerequisites if direct debit is selected', () => {
      component.currentLoanTerm = {
        term_unit: TermUnit.one_time,
        id: 'direct_debit',
        term_duration: 0,
        term_type: LendingTermType.direct_debit,
        term_frequency: RepaymentSchedule.none
      };

      component.next();
      expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.application.direct_debit_prerequisites, true);
    });

    it('should go to pre authorized financing prerequisites if setting_up_paf is true', () => {
      spyOnProperty(component, 'settingUpPaf').and.returnValue(true);
      spyOnProperty(component, 'currentSupplierInformation').and.returnValue(supplierInfoBeerStore);
      spyOnProperty(component, 'merchant').and.returnValue(merchantDataFactory.build());

      component.next();

      expect(stateRoutingService.navigate).toHaveBeenCalledWith(AppRoutes.application.pre_authorized_financing_prerequisites, true);
    });
  }); // describe - next()

  // -------------------------------------------------------------------------------------- back()
  describe('back()', () => {
    it('if there is a lendingApplication in approved state, go to approval-post', () => {
      component.lendingApplication = lendingApplicationApproved;

      component.back();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.approval_post, true);
    });

    describe('if the current lending offer is a WCA offer', () => {
      it('should route to /dashboard', () => {
        spyOn(offerService, 'isOfferWca').and.returnValue(true);
        component.back();

        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root);
      });


    }); // describe - 'if the current lending offer is a WCA offer'

    describe('if the current lending offer is anything but WCA offer', () => {
      beforeEach(() => {
        component.offer = offer;
      });

      it('should state-route to select_payee', () => {
        component.back();

        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.select_payee, true);
      });

      it('should state-route to dashboard if coming from an invoice flow', () => {
        hasActiveInvoiceSetSpy.and.returnValue(true);
        getActiveInvoiceSpy.and.returnValue(borrowerInvoice);
        spyOn(borrowerInvoiceService, 'clearActiveInvoice');

        component.back();

        expect(borrowerInvoiceService.clearActiveInvoice).toHaveBeenCalledTimes(1);
        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root);
      });

      it('should state-route to select_payee if coming from a LOC flow', () => {
        component.back();

        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.application.select_payee, true);
      });

      it('should state-route to dashboard if coming from a LOC flow with invoice UI disabled', () => {
        spyOn(offerService, 'isOfferLoc').and.returnValue(true);
        disableInvoiceUiSpy.and.returnValue(true);

        component.back();

        expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.dashboard.root);
      });
    }); // describe - 'if the current lending offer is anything but WCA offer'
  }); // describe - back()

  describe('getTerms()', () => {
    describe('should return sorted lending terms in ascending order of term_duration + term_unit', () => {
      beforeEach(() => {
        // default to true for most of these tests
        directDebitEnabledSpy.and.returnValue(true);
      });

      it('with only day terms', () => {
        const unsortedTerms = [ lendingTerm60Days, lendingTerm120Days, lendingTerm90Days ];
        const sortedTerms = [ lendingTerm60Days, lendingTerm90Days, lendingTerm120Days ];
        const offer = offerFactory.build({ available_terms: unsortedTerms });
        offerSpy.and.returnValue(new BehaviorSubject(offer));

        sortedTerms.unshift(directDebitTerm);

        fixture.detectChanges();
        const result = component.getTerms();

        expect(result).toEqual(sortedTerms);
      });

      it('with only week terms', () => {
        const unsortedTerms = [ lendingTerm10weeks, lendingTerm6weeks, lendingTerm14weeks ];
        const sortedTerms = [ lendingTerm6weeks, lendingTerm10weeks, lendingTerm14weeks ];
        const offer = offerFactory.build({ available_terms: unsortedTerms });
        offerSpy.and.returnValue(new BehaviorSubject(offer));

        sortedTerms.unshift(directDebitTerm);

        fixture.detectChanges();
        const result = component.getTerms();

        expect(result).toEqual(sortedTerms);
      });

      it('with only month terms', () => {
        const unsortedTerms = [ lendingTerm9months, lendingTerm6months, lendingTerm12months ];
        const sortedTerms = [ lendingTerm6months, lendingTerm9months, lendingTerm12months ];
        const offer = offerFactory.build({ available_terms: unsortedTerms });
        offerSpy.and.returnValue(new BehaviorSubject(offer));

        sortedTerms.unshift(directDebitTerm);

        fixture.detectChanges();
        const result = component.getTerms();

        expect(result).toEqual(sortedTerms);
      });

      it('with mix of day, week, and month terms', () => {
        const unsortedTerms = [ lendingTerm6months, lendingTerm60Days, lendingTerm9months,
          lendingTerm12months, lendingTerm120Days, lendingTerm90Days,
          lendingTerm6weeks, lendingTerm10weeks, lendingTerm14weeks ];
        const sortedTerms = [ lendingTerm6weeks, lendingTerm60Days, lendingTerm10weeks,
          lendingTerm90Days, lendingTerm14weeks, lendingTerm120Days,
          lendingTerm6months, lendingTerm9months, lendingTerm12months ];
        const offer = offerFactory.build({ available_terms: unsortedTerms });
        offerSpy.and.returnValue(new BehaviorSubject(offer));

        sortedTerms.unshift(directDebitTerm);

        fixture.detectChanges();
        const result = component.getTerms();
        expect(result).toEqual(sortedTerms);
      });

      it('with mix of day, week, and month terms with direct debit disabled', () => {
        const unsortedTerms = [ lendingTerm6months, lendingTerm60Days, lendingTerm9months,
          lendingTerm12months, lendingTerm120Days, lendingTerm90Days,
          lendingTerm6weeks, lendingTerm10weeks, lendingTerm14weeks];
        const sortedTerms = [ lendingTerm6weeks, lendingTerm60Days, lendingTerm10weeks,
          lendingTerm90Days, lendingTerm14weeks, lendingTerm120Days,
          lendingTerm6months, lendingTerm9months, lendingTerm12months ];

        const offer = offerFactory.build({ available_terms: unsortedTerms });
        offerSpy.and.returnValue(new BehaviorSubject(offer));

        directDebitEnabledSpy.and.returnValue(false);
        fixture.detectChanges();

        const result = component.getTerms();
        expect(result).toEqual(sortedTerms);
      });

      it('should set daily, bi-weekly, and weekly terms correctly', () => {
        const biweeklyTerms: LendingTerm[] = [];
        biweeklyTerms.push(lendingTermFactory.build({ term_frequency: RepaymentSchedule.bi_weekly, term_duration: 6, term_unit: TermUnit.months }));
        biweeklyTerms.push(lendingTermFactory.build({ term_frequency: RepaymentSchedule.bi_weekly, term_duration: 9, term_unit: TermUnit.months }));
        biweeklyTerms.push(lendingTermFactory.build({ term_frequency: RepaymentSchedule.bi_weekly, term_duration: 12, term_unit: TermUnit.months }));

        const dailyTerms: LendingTerm[] = [];
        dailyTerms.push(lendingTermFactory.build({ term_frequency: RepaymentSchedule.daily, term_duration: 6, term_unit: TermUnit.months }));
        dailyTerms.push(lendingTermFactory.build({ term_frequency: RepaymentSchedule.daily, term_duration: 9, term_unit: TermUnit.months }));
        dailyTerms.push(lendingTermFactory.build({ term_frequency: RepaymentSchedule.daily, term_duration: 12, term_unit: TermUnit.months }));

        const weeklyTerms: LendingTerm[] = [];
        weeklyTerms.push(lendingTermFactory.build({ term_frequency: RepaymentSchedule.weekly, term_duration: 6, term_unit: TermUnit.months }));
        weeklyTerms.push(lendingTermFactory.build({ term_frequency: RepaymentSchedule.weekly, term_duration: 9, term_unit: TermUnit.months }));
        weeklyTerms.push(lendingTermFactory.build({ term_frequency: RepaymentSchedule.weekly, term_duration: 12, term_unit: TermUnit.months }));

        const offer = offerFactory.build({ available_terms: [].concat(biweeklyTerms).concat(dailyTerms).concat(weeklyTerms) });
        offerSpy.and.returnValue(new BehaviorSubject(offer));

        directDebitEnabledSpy.and.returnValue(false);
        spyOnProperty(component, 'weeklyRepaymentEnabled').and.returnValue(true);
        fixture.detectChanges();

        component.getTerms();

        expect(component.biweeklyTerms).toEqual(biweeklyTerms);
        expect(component.dailyTerms).toEqual(dailyTerms);
        expect(component.weeklyTerms).toEqual(weeklyTerms);
      });
    });

    describe('should set correct localised unit label on a given term', () => {
      it('when unit is days plural', () => {
        const term = lendingTermFactory.build({ term_unit: TermUnit.days, term_duration: 10 });
        const offer = offerFactory.build({ available_terms: [ term ] });
        offerSpy.and.returnValue(new BehaviorSubject(offer));

        fixture.detectChanges();
        const result = component.getTerms()[ 0 ].localised_unit_label;

        expect(result).toEqual('PAY_TERMS.LABEL_DAYS');
      });

      it('when unit is days singular', () => {
        const term = lendingTermFactory.build({ term_unit: TermUnit.days, term_duration: 1, localised_unit_label: null });
        const offer = offerFactory.build({ available_terms: [ term ] });
        offerSpy.and.returnValue(new BehaviorSubject(offer));

        fixture.detectChanges();
        const terms = component.getTerms();

        // Direct debit term is prepended so that the list is in alphabetical order
        const result = terms[terms.length - 1].localised_unit_label;

        expect(result).toEqual('PAY_TERMS.LABEL_DAY');
      });

      it('when unit is months plural', () => {
        const term = lendingTermFactory.build({ term_unit: TermUnit.months, term_duration: 10, localised_unit_label: null });
        const offer = offerFactory.build({ available_terms: [ term ] });
        offerSpy.and.returnValue(new BehaviorSubject(offer));

        fixture.detectChanges();
        const terms = component.getTerms();

        // Direct debit term is prepended so that the list is in alphabetical order
        const result = terms[terms.length - 1].localised_unit_label;

        expect(result).toEqual('PAY_TERMS.LABEL_MONTHS');
      });

      it('when unit is months singular', () => {
        const term = lendingTermFactory.build({ term_unit: TermUnit.months, term_duration: 1, localised_unit_label: null });
        const offer = offerFactory.build({ available_terms: [ term ] });
        offerSpy.and.returnValue(new BehaviorSubject(offer));

        fixture.detectChanges();
        const terms = component.getTerms();

        // Direct debit term is prepended so that the list is in alphabetical order
        const result = terms[terms.length - 1].localised_unit_label;

        expect(result).toEqual('PAY_TERMS.LABEL_MONTH');
      });

      it('when unit is weeks plural', () => {
        const term = lendingTermFactory.build({ term_unit: TermUnit.weeks, term_duration: 10, localised_unit_label: null });
        const offer = offerFactory.build({ available_terms: [ term ] });
        offerSpy.and.returnValue(new BehaviorSubject(offer));

        fixture.detectChanges();
        const terms = component.getTerms();

        // Direct debit term is prepended so that the list is in alphabetical order
        const result = terms[terms.length - 1].localised_unit_label;

        expect(result).toEqual('PAY_TERMS.LABEL_WEEKS');
      });

      it('when unit is weeks singular', () => {
        const term = lendingTermFactory.build({ term_unit: TermUnit.weeks, term_duration: 1, localised_unit_label: null });
        const offer = offerFactory.build({ available_terms: [ term ] });
        offerSpy.and.returnValue(new BehaviorSubject(offer));

        fixture.detectChanges();
        const terms = component.getTerms();

        // Direct debit term is prepended so that the list is in alphabetical order
        const result = terms[terms.length - 1].localised_unit_label;

        expect(result).toEqual('PAY_TERMS.LABEL_WEEK');
      });
    });

    describe('should get correct account number', () => {
      it('when it is set in the supplier info', () => {
        currentSupplierInformationSpy.and.returnValue(new BehaviorSubject<SupplierInformation>(supplierInfoBeerStore));
        fixture.detectChanges();

        const result = component.getAccountNumber();
        expect(result).toEqual(supplierInfoBeerStore.account_number);
      });

      it('when it is not set in the supplier info', () => {
        currentSupplierInformationSpy.and.returnValue(new BehaviorSubject<SupplierInformation>(null));
        fixture.detectChanges();

        const result = component.getAccountNumber();
        expect(result).toEqual('');
      });
    });

    describe('should get correct invoice number', () => {
      it('when it is set in the supplier info', () => {
        currentSupplierInformationSpy.and.returnValue(new BehaviorSubject<SupplierInformation>(supplierInfoBeerStore));
        fixture.detectChanges();

        const result = component.getInvoiceNumber();
        expect(result).toEqual(supplierInfoBeerStore.invoice_number);
      });

      it('when it is not set in the supplier info', () => {
        currentSupplierInformationSpy.and.returnValue(new BehaviorSubject<SupplierInformation>(null));
        fixture.detectChanges();

        const result = component.getInvoiceNumber();
        expect(result).toEqual('');
      });
    });


    describe('should get correct supplier name', () => {
      it('when it is set in the supplier info', () => {
        currentSupplierInformationSpy.and.returnValue(new BehaviorSubject<SupplierInformation>(supplierInfoBeerStore));
        fixture.detectChanges();

        const result = component.getSupplierName();
        expect(result).toEqual(supplierInfoBeerStore.name);
      });

      it('when it is not set in the supplier info', () => {
        currentSupplierInformationSpy.and.returnValue(new BehaviorSubject<SupplierInformation>(null));
        fixture.detectChanges();

        const result = component.getSupplierName();
        expect(result).toEqual('');
      });
    });

    describe('debouncing', () => {
      it('Should return false if principal amount and form amount are equal', fakeAsync(() => {
        const newPrincipal = 1000;
        const newFee = offerFeeFactory.build({ principal_amount: newPrincipal });
        offerFeeSpy.and.returnValue(new BehaviorSubject(newFee));
        component.principal = 1000;

        fixture.detectChanges();
        component.selectLendingOfferFormGroup.controls.amount.setValue(newPrincipal);
        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME); // debounce time on principal change

        expect(component.debouncing).toBeFalsy();
        expect(component.principal).toEqual(newPrincipal);
      }));

      it('Should return false when new principal is submitted after debouncing', fakeAsync(() => {
        const newPrincipal = 1000;
        const newFee = offerFeeFactory.build({ principal_amount: newPrincipal });
        offerFeeSpy.and.returnValue(new BehaviorSubject(newFee));
        component.principal = 500;

        fixture.detectChanges();
        component.selectLendingOfferFormGroup.controls.amount.setValue(newPrincipal);
        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME); // debounce time on principal change

        expect(component.debouncing).toBeFalsy();
        expect(component.principal).toEqual(newPrincipal);
      }));

      it('Should return true before debounce is completed', fakeAsync(() => {
        const newPrincipal = 1000;
        const shortDebounceTime = 50;
        const newFee = offerFeeFactory.build({ principal_amount: newPrincipal });
        offerFeeSpy.and.returnValue(new BehaviorSubject(newFee));
        component.principal = 500;

        fixture.detectChanges();
        component.selectLendingOfferFormGroup.controls.amount.setValue(newPrincipal);
        tick(shortDebounceTime); // debounce time on principal change

        expect(component.debouncing).toBeTruthy();
        expect(component.principal).not.toEqual(newPrincipal);
        tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME - shortDebounceTime);
      }));
    });

    describe('should get correct invoice amount', () => {
      it('0 when there is no invoice', () => {
        fixture.detectChanges();

        const result = component.getInvoiceAmount();
        expect(result).toEqual(0.0);
      });
    });
  });

  describe('should validate amount form', () => {
    it('before touching if amount exists', () => {
      fixture.detectChanges();
      spyOn(component, 'invoiceAmountExists').and.returnValue(true);

      const result = component.formValidateExistingAmount();
      expect(result).toBeTruthy();
    });

    it('after touching if amount does not exist', () => {
      fixture.detectChanges();

      spyOn(component, 'invoiceAmountExists').and.returnValue(false);
      const result = component.formValidateExistingAmount();

      expect(result).toBeFalsy();
    });
  });

  describe('should check if merchant failed kyc', () => {
    it('should go to kyc failed page if failed kyc and offer is not WCA offer', () => {
      isKycFailedSpy.and.returnValue(true);
      offerSpy.and.returnValue(new BehaviorSubject(offer));

      fixture.detectChanges();

      expect(stateRoutingService.navigate).toHaveBeenCalledOnceWith(AppRoutes.error.kyc_failed, true);
    });

    it('should not go to failed page if failed kyc and offer is a WCA offer', () => {
      isKycFailedSpy.and.returnValue(true);
      offerSpy.and.returnValue(new BehaviorSubject(offerWca));

      fixture.detectChanges();

      expect(stateRoutingService.navigate).toHaveBeenCalledTimes(0);
    });

    it('should clear invoices if failed kyc', () => {
      isKycFailedSpy.and.returnValue(true);

      hasActiveInvoiceSetSpy.and.callThrough();
      getActiveInvoiceSpy.and.callThrough();

      fixture.detectChanges();

      expect(borrowerInvoiceService.hasActiveInvoiceSet()).toBeFalsy();
      expect(borrowerInvoiceService.getActiveInvoice()).toEqual(emptyBorrowerInvoice);
    });

    it('should trigger logging service about attempting to pay invoice if failed kyc', () => {
      isKycFailedSpy.and.returnValue(true);
      spyOn(loggingService, 'log');
      const expectedMessage = 'Borrower attempted to pay an invoice and failed KYC - in select_lending_offer component.';

      fixture.detectChanges();

      expect(loggingService.log).toHaveBeenCalledWith({ message: expectedMessage, severity: LogSeverity.warn });
    });
  });

  describe('directDebit enable disable configuration', () => {
    it('should not augment terms with direct debit when not enabled', () => {
      const offer = offerFactory.build({ available_terms: [ lendingTerm120Days, lendingTerm90Days ] });
      offerSpy.and.returnValue(new BehaviorSubject(offer));
      fixture.detectChanges();

      expect(!component.getTerms().includes(directDebitTerm)); // Note: there is no expectation here.
    });

    it('should augment terms with direct debit when enabled', () => {
      const offer = offerFactory.build({ available_terms: [ lendingTerm120Days, lendingTerm90Days ] });
      offerSpy.and.returnValue(new BehaviorSubject(offer));
      fixture.detectChanges();

      expect(component.getTerms().includes(directDebitTerm));
    });
  });

  describe('onPrincipalChange()', () => {
    beforeEach(() => {
      spyOn(component, 'minAvailableForChosenTerm').and.returnValue(500);
      spyOn(component, 'onPrincipalChange').and.callThrough();
    });

    afterEach(fakeAsync(() => {
      component.selectLendingOfferFormGroup.reset();
      tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME);
    }));

    it('should clearLendingFee() if the FormGroup is invalid', fakeAsync(() => {
      fixture.detectChanges();

      component.selectLendingOfferFormGroup
        .setValue({
          amount: '400',
          paymentMethod: 'financing',
          paymentTerm: lendingTerm60Days.id,
          paymentFrequency: lendingTerm60Days.term_frequency
        });

      tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME);

      fixture.detectChanges();

      expect(component.onPrincipalChange).toHaveBeenCalledTimes(1);
      expect(component.selectLendingOfferFormGroup.valid).toBeFalse();
      expect(component.lendingFee.fee).toEqual(0);
    }));

    it('should call loadOfferFee if the FormGroup is valid, and term_type is not direct_debit', fakeAsync(() => {
      fixture.detectChanges();

      component.selectLendingOfferFormGroup
        .setValue({
          amount: '500',
          paymentMethod: 'financing',
          paymentTerm: lendingTerm60Days.id,
          paymentFrequency: lendingTerm60Days.term_frequency
        });

      tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME);

      fixture.detectChanges();

      expect(component.onPrincipalChange).toHaveBeenCalledTimes(1);
      expect(component.selectLendingOfferFormGroup.valid).toBeTrue();
      expect(offerService.loadOfferFee$).toHaveBeenCalledTimes(1);
    }));

    it('should setDirectDebitFee if the form is valid, and the term_type is direct_debit', fakeAsync(() => {
      const directDebitFeePropertySpy = spyOnProperty(directPaymentService, 'directDebitFee');
      spyOnProperty(component, 'currentLoanTerm').and.returnValue(directDebitTerm); // this is related to the double call.

      fixture.detectChanges();

      component.selectLendingOfferFormGroup
        .setValue({
          amount: '500',
          paymentMethod: 'direct_debit',
          paymentTerm: directDebitTerm.id,
          paymentFrequency: directDebitTerm.term_frequency
        });

      tick(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME * 2);

      fixture.detectChanges();

      // for some reason this is triggered twice, which is why we use debounce * 2
      expect(component.onPrincipalChange).toHaveBeenCalledTimes(2);
      expect(component.selectLendingOfferFormGroup.valid).toBeTrue();
      expect(directDebitFeePropertySpy).toHaveBeenCalledTimes(1);
    }));
  }); // describe - onPrincipalChange()

  describe('maxAvailableForChosenTerm', () => {
    it('should return the min amount defined by direct debit config', () => {
      const offer = offerFactory.build({ available_terms: [ directDebitTerm ] });
      offerSpy.and.returnValue(new BehaviorSubject(offer));
      const invoice = invoiceResponseFactory.build({ amount: configurationService.directDebitMaxAmount });
      spyOnProperty(component, 'invoice').and.returnValue(invoice);
      spyOnProperty(configurationService, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      fixture.detectChanges();

      expect(component.minAvailableForChosenTerm()).toEqual(configurationService.directDebitMinAmount);
    });
  });

  describe('maxAvailableForChosenTerm', () => {
    beforeEach(() => {
      spyOnProperty(configurationService, 'preAuthorizedFinancingEnabled').and.returnValue(true);
    });

    it('should return the max amount defined by the offer if no invoice present', () => {
      const offer = offerFactory.build({ available_terms: [ lendingTerm120Days, lendingTerm90Days ] });
      offerSpy.and.returnValue(new BehaviorSubject(offer));
      fixture.detectChanges();

      expect(component.maxAvailableForChosenTerm()).toEqual(offer.available_amount);
    });

    it('should return the max amount defined by direct_debit if no invoice present', () => {
      const offer = offerFactory.build({ available_terms: [ directDebitTerm ] });
      offerSpy.and.returnValue(new BehaviorSubject(offer));
      fixture.detectChanges();

      expect(component.maxAvailableForChosenTerm()).toEqual(configurationService.directDebitMaxAmount);
    });

    it('should return the max amount defined by the offer if invoice amount due is greater than offer max amount', () => {
      const offer = offerFactory.build({ available_terms: [ lendingTerm120Days, lendingTerm90Days ] });
      offerSpy.and.returnValue(new BehaviorSubject(offer));
      fixture.detectChanges();

      expect(component.maxAvailableForChosenTerm()).toEqual(offer.available_amount);
    });

    it('should return the max amount defined by direct_debit if invoice is greater than max', () => {
      const offer = offerFactory.build({ available_terms: [ directDebitTerm ] });
      offerSpy.and.returnValue(new BehaviorSubject(offer));
      const invoice = invoiceResponseFactory.build({ amount: configurationService.directDebitMaxAmount + 1 });
      spyOnProperty(component, 'invoice').and.returnValue(invoice);
      fixture.detectChanges();

      expect(component.maxAvailableForChosenTerm()).toEqual(configurationService.directDebitMaxAmount);
    });

    it('should return the invoice amount due if less than the max amount defined by the offer', () => {
      const offer = offerFactory.build({ available_terms: [ lendingTerm120Days, lendingTerm90Days ] });
      offerSpy.and.returnValue(new BehaviorSubject(offer));
      const invoice = invoiceResponseFactory.build({ amount: 1234.56 });
      spyOnProperty(component, 'invoice').and.returnValue(invoice);
      fixture.detectChanges();

      expect(component.maxAvailableForChosenTerm()).toEqual(invoice.amount);
    });

    it('should return the invoice amount due if less than max direct debit amount', () => {
      const offer = offerFactory.build({ available_terms: [ directDebitTerm ] });
      offerSpy.and.returnValue(new BehaviorSubject(offer));
      const invoice = invoiceResponseFactory.build({ amount: configurationService.directDebitMaxAmount  - 1 });
      spyOnProperty(component, 'invoice').and.returnValue(invoice);
      fixture.detectChanges();

      expect(component.maxAvailableForChosenTerm()).toEqual(configurationService.directDebitMaxAmount - 1);
    });

    it('should return the invoice amount due if partially paid and less than the max amount defined by the offer', () => {
      const offer = offerFactory.build({ available_terms: [ lendingTerm120Days, lendingTerm90Days ] });
      offerSpy.and.returnValue(new BehaviorSubject(offer));
      const invoice = invoiceResponseFactory.build({ amount: 5500.00, amount_paid: 600.00 });
      spyOnProperty(component, 'invoice').and.returnValue(invoice);
      fixture.detectChanges();

      expect(component.maxAvailableForChosenTerm()).toEqual(invoice.amount - invoice.amount_paid);
    });

    it('should return the invoice amount due if partially paid and less than max direct debit amount', () => {
      const offer = offerFactory.build({ available_terms: [ directDebitTerm ] });
      offerSpy.and.returnValue(new BehaviorSubject(offer));
      const invoice = invoiceResponseFactory.build({ amount: configurationService.directDebitMaxAmount, amount_paid: 600.00 });
      spyOnProperty(component, 'invoice').and.returnValue(invoice);
      fixture.detectChanges();

      expect(component.maxAvailableForChosenTerm()).toEqual(configurationService.directDebitMaxAmount - 600.00);
    });
  });

  describe('showPafModal', () => {
    let modalService: BsModalService;

    beforeEach(() => {
      modalService = TestBed.inject(BsModalService);

      spyOn(modalService, 'show');
    });

    it('should open the PAF modal', () => {
      component.showPafModal();

      expect(modalService.show).toHaveBeenCalledTimes(1);
      expect(component.modalRef).not.toBeNull();
    });
  });

  describe('get preAuthorizedFinancingEnabled', () => {
    it('should return value from config service (true)', () => {
      spyOnProperty(configurationService, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      expect(component.preAuthorizedFinancingEnabled).toBeTruthy();
    });

    it('should return value from config service (false)', () => {
      spyOnProperty(configurationService, 'preAuthorizedFinancingEnabled').and.returnValue(false);
      expect(component.preAuthorizedFinancingEnabled).toBeFalsy();
    });

    it('should return false if config service value not set', () => {
      spyOnProperty(configurationService, 'preAuthorizedFinancingEnabled').and.returnValue(null);
      expect(component.preAuthorizedFinancingEnabled).toBeFalsy();
    });
  });

  describe('onPaymentMethodChange', () => {
    const mockLendingTerm = offer.available_terms[0];

    beforeEach(() => {
      spyOn(loggingService, 'GTMUpdate');

      const unsortedTerms = [ lendingTerm60Days, lendingTerm120Days, lendingTerm90Days ];
      const offer = offerFactory.build({ available_terms: unsortedTerms });
      offerSpy.and.returnValue(new BehaviorSubject(offer));
      offerFeeSpy.and.returnValue(new BehaviorSubject(offerFee));
      component.currentLoanTerm = mockLendingTerm;
      component.principal = 1000;
      directDebitEnabledSpy.and.returnValue(true);
    });

    it('should set frequency to one time and fee to 0 if Pay now selected', () => {
      fixture.detectChanges();
      component.getTerms();
      const event = {
        target: {
          value: LendingTermType.direct_debit
        }
      };
      component.onPaymentMethodChange(event);

      // Lending fee is $2 but currently discounted
      expect(component.lendingFee.fee).toEqual(2);
      expect(component.frequency).toEqual('INVOICE.FREQUENCY_ONE_TIME');
    });

    it('should call GTMUpdate with direct_debit when option selected', () => {
      fixture.detectChanges();
      component.getTerms();
      const event = {
        target: {
          value: LendingTermType.direct_debit
        }
      };
      component.onPaymentMethodChange(event);

      const expectedTerms = 'direct_debit';

      expect(loggingService.GTMUpdate).toHaveBeenCalledOnceWith(GTMEvent.BUTTON_CLICKED, expectedTerms);
    });

    it('should call GTMUpdate with financing when option selected', () => {
      fixture.detectChanges();
      component.getTerms();
      const event = {
        target: {
          value: LendingTermType.financing
        }
      };
      component.onPaymentMethodChange(event);

      const expectedTerms = 'financing';

      expect(loggingService.GTMUpdate).toHaveBeenCalledOnceWith(GTMEvent.BUTTON_CLICKED, expectedTerms);
    });

    it('should load fee when new payment method is selected', () => {
      offerSpy.and.returnValue(new BehaviorSubject(offer));
      spyOn(component, 'getTerms').and.returnValue(offer.available_terms);
      component.currentLoanTerm = mockLendingTerm;
      component.principal = 1000;

      fixture.detectChanges();
      const mockedInput = {
        amount: 1000,
        paymentMethod: LendingTermType.financing,
        paymentTerm: offer.available_terms,
        paymentFrequency: RepaymentSchedule.daily
      };
      component.selectLendingOfferFormGroup.setValue(mockedInput); // set initial values before click

      const event = {
        target: {
          value: LendingTermType.financing
        }
      };
      component.onPaymentMethodChange(event);

      expect(offerService.loadOfferFee$).toHaveBeenCalledTimes(1);
    });
  });

  describe('onPaymentFrequencyChange', () => {
    let weekly10MonthsTerm: LendingTerm;
    let weekly12MonthsTerm: LendingTerm;
    let daily14MonthsTerm: LendingTerm;
    let biweekly10MonthsTerm: LendingTerm;
    let biweekly12MonthsTerm: LendingTerm;

    beforeEach(() => {
      weekly10MonthsTerm = lendingTermFactory.build({
        term_frequency: RepaymentSchedule.weekly,
        term_duration: 10,
        term_unit: TermUnit.months
      });
      weekly12MonthsTerm = lendingTermFactory.build({
        term_frequency: RepaymentSchedule.weekly,
        term_duration: 12,
        term_unit: TermUnit.months
      });
      daily14MonthsTerm = lendingTermFactory.build({
        term_frequency: RepaymentSchedule.daily,
        term_duration: 14,
        term_unit: TermUnit.months
      });
      biweekly10MonthsTerm = lendingTermFactory.build({
        term_frequency: RepaymentSchedule.bi_weekly,
        term_duration: 10,
        term_unit: TermUnit.months
      });
      biweekly12MonthsTerm = lendingTermFactory.build({
        term_frequency: RepaymentSchedule.bi_weekly,
        term_duration: 12,
        term_unit: TermUnit.months
      });

      spyOnProperty(component, 'dailyTerms').and.returnValue([ lendingTerm9months, lendingTerm12months, daily14MonthsTerm ]);
      spyOnProperty(component, 'weeklyTerms').and.returnValue([ weekly10MonthsTerm, weekly12MonthsTerm ]);
      spyOnProperty(component, 'biweeklyTerms').and.returnValue([ biweekly10MonthsTerm, biweekly12MonthsTerm ]);

      lendingApplicationPropertySpy.and.returnValue(new BehaviorSubject(lendingApplicationApproved));
      offerSpy.and.returnValue(new BehaviorSubject(offer));

      component.principal = 1000;

      fixture.detectChanges();
      const mockedInput = {
        amount: 1000,
        paymentMethod: LendingTermType.financing,
        paymentTerm: offer.available_terms,
        paymentFrequency: RepaymentSchedule.daily
      };
      component.selectLendingOfferFormGroup.setValue(mockedInput); // set initial values before click
    });

    it('should set frequency to daily if daily selected', () => {
      const event = {
        target: {
          value: RepaymentSchedule.daily
        }
      };
      component.onPaymentFrequencyChange(event);

      expect(component.frequency).toEqual('INVOICE.FREQUENCY_DAILY');
    });

    it('should set the current loan term to a default daily terms when selecting daily frequency', () => {
      const event = {
        target: {
          value: RepaymentSchedule.daily
        }
      };
      component.onPaymentFrequencyChange(event);

      expect(component.terms).toEqual(component.dailyTerms);
      expect(component.currentLoanTerm).toEqual(daily14MonthsTerm);
    });

    it('should set frequency to weekly if weekly selected', () => {
      const event = {
        target: {
          value: RepaymentSchedule.weekly
        }
      };
      component.onPaymentFrequencyChange(event);

      expect(component.frequency).toEqual('INVOICE.FREQUENCY_WEEKLY');
    });

    it('should set the current loan term with a default weekly term if there is no weekly term matching the previous selected term duration and unit', () => {
      const event = {
        target: {
          value: RepaymentSchedule.weekly
        }
      };
      component.onPaymentFrequencyChange(event);

      expect(component.terms).toEqual(component.weeklyTerms);
      expect(component.currentLoanTerm).toEqual(weekly12MonthsTerm);
    });

    it('should set the current loan term with a weekly term that has the same duration and unit as the previous selected bi-weekly term' , () => {
      const event1 = {
        target: {
          value: RepaymentSchedule.bi_weekly
        }
      };
      component.onPaymentFrequencyChange(event1);

      expect(component.terms).toEqual(component.biweeklyTerms);
      expect(component.currentLoanTerm).toEqual(biweekly12MonthsTerm);

      const event2 = {
        target: {
          value: RepaymentSchedule.weekly
        }
      };
      component.onPaymentFrequencyChange(event2);

      expect(component.terms).toEqual(component.weeklyTerms);
      expect(component.currentLoanTerm.term_duration).toEqual(biweekly12MonthsTerm.term_duration);
      expect(component.currentLoanTerm.term_unit).toEqual(biweekly12MonthsTerm.term_unit);
      expect(component.currentLoanTerm).toEqual(weekly12MonthsTerm);
    });

    it('should set frequency to bi-weekly if bi-weekly selected', () => {
      const event = {
        target: {
          value: RepaymentSchedule.bi_weekly
        }
      };
      component.onPaymentFrequencyChange(event);

      expect(component.frequency).toEqual('INVOICE.FREQUENCY_BIWEEKLY');
    });

    it('should set the current loan term to the default bi-weekly term if no term was previously selected', () => {
      const event = {
        target: {
          value: RepaymentSchedule.bi_weekly
        }
      };
      component.onPaymentFrequencyChange(event);

      expect(component.terms).toEqual(component.biweeklyTerms);
      expect(component.currentLoanTerm).toEqual(biweekly12MonthsTerm);
    });

    it('should set the current loan term to the default bi-weekly terms if there is no bi-weekly terms with a duration and unit matching the previously selected daily term' , () => {
      const event1 = {
        target: {
          value: RepaymentSchedule.daily
        }
      };
      component.onPaymentFrequencyChange(event1);

      expect(component.terms).toEqual(component.dailyTerms);
      expect(component.currentLoanTerm).toEqual(daily14MonthsTerm);

      const event2 = {
        target: {
          value: RepaymentSchedule.bi_weekly
        }
      };
      component.onPaymentFrequencyChange(event2);

      expect(component.terms).toEqual(component.biweeklyTerms);
      expect(component.currentLoanTerm.term_duration).not.toEqual(daily14MonthsTerm.term_duration);
      expect(component.currentLoanTerm).toEqual(biweekly12MonthsTerm);
    });

    it('should update financing fee on change', () => {
      const event = {
        target: {
          value: RepaymentSchedule.weekly
        }
      };
      component.onPaymentFrequencyChange(event);

      expect(lendingApplicationsService.loadApplicationFee).toHaveBeenCalled();
    });

    it('should call GTMUpdate when payment frequency changes', () => {
      spyOn(loggingService, 'GTMUpdate');

      const event = {
        target: {
          value: RepaymentSchedule.weekly
        }
      };
      component.onPaymentFrequencyChange(event);

      const expectedTerms = `${component.currentLoanTerm.term_frequency}`;

      expect(loggingService.GTMUpdate).toHaveBeenCalledOnceWith(GTMEvent.BUTTON_CLICKED, expectedTerms);
    });
  });

  describe('isSupplierPayment', () => {
    it('should return true if invoice number is present', () => {
      const invoice: Invoice = invoiceResponseFactory.build();
      component.currentSupplierInformation = {
        name: 'Supplier1',
        id: 'su_123',
        account_number: invoice.account_number,
        invoice_number: invoice.invoice_number,
        is_business_partner: false
      };
      expect(component.isSupplierPayment).toBeTruthy();
    });

    it('should return true if account number is present', () => {
      const invoice: Invoice = invoiceResponseFactory.build({ invoice_number: null });
      component.currentSupplierInformation = {
        name: 'Supplier1',
        id: 'su_123',
        account_number: invoice.account_number,
        invoice_number: invoice.invoice_number,
        is_business_partner: false
      };
      expect(component.isSupplierPayment).toBeTruthy();
    });

    it('should return false if neither invoice number nor account number are present', () => {
      const invoice: Invoice = invoiceResponseFactory.build({ invoice_number: null, account_number: null });
      component.currentSupplierInformation = {
        name: 'Supplier1',
        id: 'su_123',
        account_number: invoice.account_number,
        invoice_number: invoice.invoice_number,
        is_business_partner: false
      };
      expect(component.isSupplierPayment).toBeFalsy();
    });

    it('should return false if current supplier information is not set', () => {
      expect(component.isSupplierPayment).toBeFalsy();
    });
  });

  describe('isSupplierBusinessPartner', () => {
    it('should return true if the supplier is a business partner', () => {
      component.currentSupplierInformation = {
        name: 'Supplier1',
        id: 'su_123',
        account_number: 'ABC123',
        invoice_number: 'ABC123',
        is_business_partner: true
      };
      expect(component.isSupplierBusinessPartner).toBeTruthy();
    });

    it('should return false if the supplier is a business partner', () => {
      component.currentSupplierInformation = {
        name: 'Supplier1',
        id: 'su_123',
        account_number: 'ABC123',
        invoice_number: 'ABC123',
        is_business_partner: false
      };
      expect(component.isSupplierBusinessPartner).toBeFalsy();
    });

    it('should return false if is_business_partner is not present', () => {
      component.currentSupplierInformation = {
        name: 'Supplier1',
        id: 'su_123',
        account_number: 'ABC123',
        invoice_number: 'ABC123',
        is_business_partner: null
      };
      expect(component.isSupplierBusinessPartner).toBeFalsy();
    });

    it('should return false if current supplier information is not set', () => {
      expect(component.isSupplierBusinessPartner).toBeFalsy();
    });
  });

  describe('isWca', () => {
    it('should return false if invoice number is present', () => {
      const invoice: Invoice = invoiceResponseFactory.build();
      component.currentSupplierInformation = {
        name: 'Supplier1',
        id: 'su_123',
        account_number: invoice.account_number,
        invoice_number: invoice.invoice_number,
        is_business_partner: false
      };
      expect(component.isWca).toBeFalsy();
    });

    it('should return false if account number is present', () => {
      const invoice: Invoice = invoiceResponseFactory.build({ invoice_number: null });
      component.currentSupplierInformation = {
        name: 'Supplier1',
        id: 'su_123',
        account_number: invoice.account_number,
        invoice_number: invoice.invoice_number,
        is_business_partner: false
      };
      expect(component.isWca).toBeFalsy();
    });

    it('should return true if neither invoice number nor account number are present', () => {
      const invoice: Invoice = invoiceResponseFactory.build({ invoice_number: null, account_number: null });
      component.currentSupplierInformation = {
        name: 'Supplier1',
        id: 'su_123',
        account_number: invoice.account_number,
        invoice_number: invoice.invoice_number,
        is_business_partner: false
      };
      expect(component.isWca).toBeTruthy();
    });

    it('should return true if current supplier information is not set', () => {
      expect(component.isWca).toBeTruthy();
    });
  });

  describe('setupPaf', () => {
    it('should call next() if agreement not opted out', () => {
      fixture.detectChanges();
      component.showPafModal();

      spyOn(component, 'next');
      spyOn(component.modalRef, 'hide');
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build({ opt_out_at: null }));

      component.setupPaf();

      expect(component.next).toHaveBeenCalledTimes(1);
      expect(component.modalRef.hide).toHaveBeenCalledTimes(1);
    });

    it('should load new PAF agreement if opt_out_at is set before calling next()', () => {
      hasActiveInvoiceSetSpy.and.returnValue(true);
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      const agreementBehaviorSubject: BehaviorSubject<Agreement> = new BehaviorSubject<Agreement>(agreementFactory.build());
      agreementSubjectSpy.and.returnValue(agreementBehaviorSubject);
      fixture.detectChanges();
      loadAgreementByTypeSpy.calls.reset();

      component.showPafModal();

      spyOn(component, 'next');
      spyOn(component.modalRef, 'hide');
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build());

      component.setupPaf();
      agreementBehaviorSubject.next(agreementFactory.build({ opt_out_at: null, type: AgreementType.pre_authorized_financing }));

      expect(component.modalRef.hide).toHaveBeenCalledTimes(1);
      expect(agreementService.loadAgreementByType).toHaveBeenCalledTimes(1);
      expect(component.next).toHaveBeenCalledTimes(1);
    });

    it('should load new PAF agreement if state is opted_out before calling next()', () => {
      hasActiveInvoiceSetSpy.and.returnValue(true);
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      const agreementBehaviorSubject: BehaviorSubject<Agreement> = new BehaviorSubject<Agreement>(agreementFactory.build({ state: AgreementState.opted_out }));
      agreementSubjectSpy.and.returnValue(agreementBehaviorSubject);
      fixture.detectChanges();
      loadAgreementByTypeSpy.calls.reset();

      component.showPafModal();

      spyOn(component, 'next');
      spyOn(component.modalRef, 'hide');
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build());

      component.setupPaf();
      agreementBehaviorSubject.next(agreementFactory.build({ opt_out_at: null, type: AgreementType.pre_authorized_financing }));

      expect(component.modalRef.hide).toHaveBeenCalledTimes(1);
      expect(agreementService.loadAgreementByType).toHaveBeenCalledTimes(1);
      expect(component.next).toHaveBeenCalledTimes(1);
    });
  });

  describe('getInvoiceProcessingAmount', () => {
    it('should return amount processing when no processing amount set on the invoice', () => {
      hasActiveInvoiceSetSpy.and.returnValue(true);
      const noAmountInvoice = borrowerInvoice;
      getActiveInvoiceSpy.and.returnValue(noAmountInvoice);
      spyOn(borrowerInvoiceService, 'getBorrowerInvoice').and.returnValue(new BehaviorSubject<Invoice>(noAmountInvoice));

      spyOn(borrowerInvoiceService, 'fetchInvoice').and.returnValue(of(invoiceResponseResponseFactory.build()));
      currentSupplierInformationSpy.and.callThrough();
      expect(component.getInvoiceProcessingAmount()).toBe(noAmountInvoice.processing_amount);
    });

    it('should return amount processing when no processing amount set on the invoice', () => {
      hasActiveInvoiceSetSpy.and.returnValue(true);
      const noAmountInvoice = invoiceResponseFactory.build({processing_amount: 100.00});
      getActiveInvoiceSpy.and.returnValue(noAmountInvoice);
      spyOn(borrowerInvoiceService, 'getBorrowerInvoice').and.returnValue(new BehaviorSubject<Invoice>(noAmountInvoice));
      spyOn(borrowerInvoiceService, 'fetchInvoice').and.returnValue(of(invoiceResponseResponseFactory.build()));
      currentSupplierInformationSpy.and.callThrough();
      expect(component.getInvoiceProcessingAmount()).toBe(noAmountInvoice.processing_amount);
    });
  });

  describe('isPaidByPaf', () => {
    it('should be falsy if no pafAgreement is set', () => {
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build());
      spyOnProperty(component, 'pafAgreement').and.returnValue(null);
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);

      expect(component.isPaidByPaf).toBeFalsy();
    });

    it('should be falsy if pafAgreement is not a PAF agreement type', () => {
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build());
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build({ type: AgreementType.pre_authorized_debit }));
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);

      expect(component.isPaidByPaf).toBeFalsy();
    });

    it('should be falsy if pafAgreement state is not completed', () => {
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build());
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build({ type: AgreementType.pre_authorized_financing,
        opt_out_at: null,
        state: AgreementState.pending }));
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);

      expect(component.isPaidByPaf).toBeFalsy();
    });

    it('should be falsy if pafAgreement accepted_at is not set', () => {
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build());
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build({ type: AgreementType.pre_authorized_financing,
        state: AgreementState.completed,
        opt_out_at: null,
        accepted_at: null }));
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);

      expect(component.isPaidByPaf).toBeFalsy();
    });

    it('should be falsy if pafAgreement opt_out_at is set', () => {
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build());
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build({ type: AgreementType.pre_authorized_financing,
        state: AgreementState.completed }));
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);

      expect(component.isPaidByPaf).toBeFalsy();
    });

    it('should be falsy if invoice is not set', () => {
      spyOnProperty(component, 'invoice').and.returnValue(null);
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build({ type: AgreementType.pre_authorized_financing,
        opt_out_at: null,
        state: AgreementState.completed }));
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);

      expect(component.isPaidByPaf).toBeFalsy();
    });

    it('should be falsy if invoice paf_activation_date is not set', () => {
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build());
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build({ type: AgreementType.pre_authorized_financing,
        opt_out_at: null,
        state: AgreementState.completed }));
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);

      expect(component.isPaidByPaf).toBeFalsy();
    });

    it('should be falsy if invoice payment plan state is cancelled', () => {
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build({ paf_activation_date: '2019-01-01',
        payment_plan_entity: { state: PaymentPlanState.cancelled } }));
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build({ type: AgreementType.pre_authorized_financing,
        opt_out_at: null,
        state: AgreementState.completed }));
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);

      expect(component.isPaidByPaf).toBeFalsy();
    });

    it('should be falsy if preAuthorizedFinancing is not enabled', () => {
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build({
        paf_activation_date: '2019-01-01',
        payment_plan_entity: { state: PaymentPlanState.pending }
      }));

      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build({ type: AgreementType.pre_authorized_financing,
        opt_out_at: null,
        state: AgreementState.completed }));
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(false);

      expect(component.isPaidByPaf).toBeFalsy();
    });

    it('should be truthy if all prerequisites are met', () => {
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build({
        paf_activation_date: '2019-01-01',
        payment_plan_entity: { state: PaymentPlanState.pending }
      }));
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build({ type: AgreementType.pre_authorized_financing,
        opt_out_at: null,
        state: AgreementState.completed }));
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);

      expect(component.isPaidByPaf).toBeTruthy();
    });
  });

  describe('showPafSignup', () => {
    it('should be falsy if preAuthorizedFinancing is not enabled', () => {
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(false);
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build());
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build());

      expect(component.showPafSignup).toBeFalsy();
    });

    it('should be falsy if pafAgreement is not present', () => {
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build());
      spyOnProperty(component, 'pafAgreement').and.returnValue(null);

      expect(component.showPafSignup).toBeFalsy();
    });

    it('should be falsy if pafAgreement type is not pre_authorized_financing', () => {
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build());
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build());

      expect(component.showPafSignup).toBeFalsy();
    });

    it('should be falsy if pafAgreement state is completed', () => {
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build());
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build({ type: AgreementType.pre_authorized_financing,
        state: AgreementState.completed,
        accepted_at: null }));

      expect(component.showPafSignup).toBeFalsy();
    });

    it('should be falsy if invoice is not present', () => {
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      spyOnProperty(component, 'invoice').and.returnValue(null);
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build({ type: AgreementType.pre_authorized_financing,
        accepted_at: null }));

      expect(component.showPafSignup).toBeFalsy();
    });

    it('should be falsy if invoice paf_activation_date is set', () => {
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build({ paf_activation_date: '2019-01-01' }));
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build({ type: AgreementType.pre_authorized_financing,
        accepted_at: null }));

      expect(component.showPafSignup).toBeFalsy();
    });

    it('should be truthy if all prerequisites are met', () => {
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build());
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build({ type: AgreementType.pre_authorized_financing,
        accepted_at: null }));

      expect(component.showPafSignup).toBeTruthy();
    });
  });

  describe('showPafOptOut', () => {
    it('should be falsy if preAuthorizedFinancing is not enabled', () => {
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(false);
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build());
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build());

      expect(component.showPafOptOut).toBeFalsy();
    });

    it('should be falsy if pafAgreement is not set', () => {
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build());
      spyOnProperty(component, 'pafAgreement').and.returnValue(null);

      expect(component.showPafOptOut).toBeFalsy();
    });

    it('should be falsy if pafAgreement type is not pre_authorized_financing', () => {
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build());
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build());

      expect(component.showPafOptOut).toBeFalsy();
    });

    it('should be falsy if pafAgreement accepted_at is not set', () => {
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build());
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build({ type: AgreementType.pre_authorized_financing,
        accepted_at: null}));

      expect(component.showPafOptOut).toBeFalsy();
    });

    it('should be falsy if pafAgreement state is not completed', () => {
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build());
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build({ type: AgreementType.pre_authorized_financing }));

      expect(component.showPafOptOut).toBeFalsy();
    });

    it('should be falsy if invoice is not set', () => {
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      spyOnProperty(component, 'invoice').and.returnValue(null);
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build({ type: AgreementType.pre_authorized_financing,
        state: AgreementState.completed }));

      expect(component.showPafOptOut).toBeFalsy();
    });

    it('should be falsy if invoice paf_activation_date is not set', () => {
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build());
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build({ type: AgreementType.pre_authorized_financing,
        state: AgreementState.completed }));

      expect(component.showPafOptOut).toBeFalsy();
    });

    it('should be falsy if invoice payment plan state is cancelled', () => {
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build({ paf_activation_date: '2019-01-01',
        payment_plan_entity: { state: PaymentPlanState.cancelled } }));
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build({ type: AgreementType.pre_authorized_financing,
        state: AgreementState.completed }));

      expect(component.showPafOptOut).toBeFalsy();
    });

    it('should be truthy if all prerequisites are met', () => {
      spyOnProperty(component, 'preAuthorizedFinancingEnabled').and.returnValue(true);
      spyOnProperty(component, 'invoice').and.returnValue(invoiceResponseFactory.build({
        paf_activation_date: '2019-01-01',
        payment_plan_entity: { state: PaymentPlanState.pending }
      }));
      spyOnProperty(component, 'pafAgreement').and.returnValue(agreementFactory.build({ type: AgreementType.pre_authorized_financing,
        state: AgreementState.completed }));

      expect(component.showPafOptOut).toBeTruthy();
    });
  });

  describe('showPafOptOutModal', () => {
    let modalService: BsModalService;

    beforeEach(() => {
      modalService = TestBed.inject(BsModalService);

      spyOn(modalService, 'show');
    });

    it('should open the PAF modal', () => {
      component.showPafOptOutModal();

      expect(modalService.show).toHaveBeenCalledTimes(1);
      expect(component.modalRef).not.toBeNull();
    });
  });

  describe('disablePaf', () => {
    it('should hide modal and open re-auth window', () => {
      fixture.detectChanges();
      component.showPafOptOutModal();

      spyOn(component.modalRef, 'hide');

      component.disablePaf();

      expect(reauthService.open).toHaveBeenCalledTimes(1);
      expect(component.modalRef.hide).toHaveBeenCalledTimes(1);
    });

    it('should call opt out agreement API on successful re-auth', () => {
      fixture.detectChanges();
      component.showPafOptOutModal();

      spyOn(component.modalRef, 'hide');

      component.disablePaf();

      expect(agreementService.optOut).toHaveBeenCalledOnceWith(component.pafAgreement.id);
    });

    it('should display error dialog and bugsnag if opt out fails', () => {
      fixture.detectChanges();
      component.showPafOptOutModal();
      optOutSpy.and.returnValue(throwError({ status: 500, message: 'Error opting out of PAF agreement' }));
      spyOn(errorService, 'show');

      spyOn(component.modalRef, 'hide');

      component.disablePaf();

      expect(Bugsnag.notify).toHaveBeenCalledTimes(1);
      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.general);
    });

    it('should not call opt out agreement API on unsuccessful re-auth', () => {
      fixture.detectChanges();
      component.showPafOptOutModal();

      spyOn(component.modalRef, 'hide');
      reauthServiceSpy.and.returnValue(of({ status: reauthService.FAIL }));

      component.disablePaf();

      expect(agreementService.optOut).not.toHaveBeenCalled();
    });

    it('should display error modal on re-auth error', () => {
      fixture.detectChanges();
      component.showPafOptOutModal();

      spyOn(component.modalRef, 'hide');
      reauthServiceSpy.and.returnValue(throwError({}));
      spyOn(errorService, 'show');

      component.disablePaf();

      expect(agreementService.optOut).not.toHaveBeenCalled();
      expect(errorService.show).toHaveBeenCalledOnceWith(UiError.signByReauth);
    });
  });

  describe('showPaymentPlanReview', () => {
    it('should open the PAF Term modal', () => {
      const invoice = invoiceResponseFactory.build({status: InvoiceStatus.unpaid});
      spyOnProperty(component, 'invoice').and.returnValue(invoice);
      spyOn(component.pafTermsModalComponent, 'show').withArgs(invoice);
      component.showPaymentPlanReview();

      expect(component.pafTermsModalComponent.show).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPaymentFrequencyLabel', () => {
    it('should return value from service', () => {
      const uiAssetService: UiAssetService = TestBed.inject(UiAssetService);

      spyOn(uiAssetService, 'getPaymentFrequencyLabel');

      component.getPaymentFrequencyLabel(RepaymentSchedule.daily);
      expect(uiAssetService.getPaymentFrequencyLabel).toHaveBeenCalledWith(RepaymentSchedule.daily);
    });
  });

  describe('amountAboveMaximum', () => {
    it('should return true/false depending on if amount is above the max amount available', () => {
      component.ngOnInit();
      component.selectLendingOfferFormGroup.controls.amount.setValue(component.maxAvailableForChosenTerm() + 1);
      expect(component.amountAboveMaximum()).toBeTrue();

      component.selectLendingOfferFormGroup.controls.amount.setValue(component.maxAvailableForChosenTerm() - 1);
      expect(component.amountAboveMaximum()).toBeFalse();
    });
  });

  describe('amountBelowMinimum', () => {
    it('should return true/false depending on if amount is below the min amount', () => {
      component.ngOnInit();
      component.selectLendingOfferFormGroup.controls.amount.setValue(component.minAvailableForChosenTerm() - 1);
      expect(component.amountBelowMinimum()).toBeTrue();

      component.selectLendingOfferFormGroup.controls.amount.setValue(component.minAvailableForChosenTerm() + 1);
      expect(component.amountBelowMinimum()).toBeFalse();
    });
  });
});
