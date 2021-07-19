import { ChangeDetectorRef, Component, ComponentRef, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, finalize, take, takeUntil, tap } from 'rxjs/operators';
import { OfferService } from 'app/services/offer.service';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { SupplierService } from 'app/services/supplier.service';
import { UserSessionService } from 'app/services/user-session.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { ErrorService } from 'app/services/error.service';
import { MerchantService } from 'app/services/merchant.service';
import { BorrowerInvoiceService } from 'app/services/borrower-invoice.service';
import { DirectPaymentService } from 'app/services/direct-payment.service';
import { DirectPaymentPost } from 'app/models/api-entities/direct-payment-post';
import { Invoice } from 'app/models/api-entities/invoice';
import { ConfigurationService } from 'app/services/configuration.service';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { AgreementService } from 'app/services/agreement.service';
import { ReauthService } from 'app/services/reauth.service';
import { ErrorModalContext } from 'app/components/utilities/error-modal/error-modal-context';
import { CLEAR_LENDING_FEE, Offer, OfferFee } from 'app/models/api-entities/offer';
import { LendingApplicationPost } from 'app/models/api-entities/lending-application-post';
import { SupplierInformation } from 'app/models/api-entities/supplier';
import { AppRoutes } from 'app/models/routes';
import { UiError } from 'app/models/ui-error';
import { ApplicationState, RepaymentSchedule, TermUnit } from 'app/models/api-entities/utility';
import { LendingTerm, LendingTermType } from 'app/models/api-entities/lending-term';
import { GET_LENDING_OFFER_FEE } from 'app/constants';
import { Merchant } from 'app/models/api-entities/merchant';
import { LendingApplication, LendingApplicationFee } from 'app/models/api-entities/lending-application';
import { GTMEvent, LoggingService } from 'app/services/logging.service';
import { LogSeverity } from 'app/models/api-entities/log';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { Agreement, AgreementState, AgreementType } from 'app/models/agreement';
import { PaymentPlanState } from 'app/models/api-entities/payment_plan';
import { PafTermsModalComponent } from 'app/components/utilities/paf-terms-modal/paf-terms-modal.component';
import { UiAssetService } from 'app/services/ui-asset.service';
import { CURRENCY_CLEAVE_CONFIG } from 'app/constants/formatting.constants';
import Bugsnag from '@bugsnag/js';
import { ErrorMessage, ErrorResponse } from "app/models/error-response";

const BIWEEKLY_FREQUENCY = 'INVOICE.FREQUENCY_BIWEEKLY';
const DAILY_FREQUENCY = 'INVOICE.FREQUENCY_DAILY';
const WEEKLY_FREQUENCY = 'INVOICE.FREQUENCY_WEEKLY';

@Component({
  selector: 'ztt-select-lending-offer',
  templateUrl: './select-lending-offer.component.html'
})
export class SelectLendingOfferComponent implements OnInit, OnDestroy {
  unsubscribe$ = new Subject<void>();

  // Form group
  selectLendingOfferFormGroup: FormGroup;

  // Payment attributes
  private termOptionsFromOffer: LendingTerm[] = [];
  private termOptionsFromApplication: LendingTerm[] = [];
  max_available: number;
  min_available: number;
  defaultLoanTerm: LendingTerm;
  principal = 0;
  frequency: string;
  total_repayment: number;
  frequencyList: RepaymentSchedule[] = [];
  private _settingUpPaf = false;

  // Display booleans
  isButtonDisabled = false;
  processingOperation = false;
  calculatingFee = false;
  loaded = false; // used as flag to display template
  loaded_invoice = false;
  isFinancingAvailable = true;
  isFormGroupInitialized = false;
  readonly currencyCleaveConfig = CURRENCY_CLEAVE_CONFIG;

  // Template variables
  private BASE_TERM_UNIT_LABEL = 'PAY_TERMS.LABEL_';

  // API entities
  offer: Offer;
  lendingFee: OfferFee | LendingApplicationFee;
  lendingApplication: LendingApplication;

  private _merchant: Merchant;
  private _currentSupplierInformation: SupplierInformation;
  private _invoice: Invoice;

  // Subscriptions
  private lendingOfferSubscription$: Subscription;
  private lendingFeeSubscription$: Subscription;
  private currentInvoiceSubscription$: Subscription;
  private currentSupplierInformationSubscription$: Subscription;
  private lendingApplicationSubscription$: Subscription;

  // Generic variables
  private feeObservable: Observable<LendingApplicationFee | OfferFee> = EMPTY;
  private loadFeeFn;
  private processApplicationFn;
  private getTermsFn;
  private _modalRef: BsModalRef;
  private _paymentMethod: LendingTermType = LendingTermType.financing; // Default to financing
  private _biweeklyTerms: LendingTerm[] = [];
  private _dailyTerms: LendingTerm[] = [];
  private _weeklyTerms: LendingTerm[] = [];
  private _allTerms: LendingTerm[] = [];
  private _terms: LendingTerm[];
  private _pafAgreement: Agreement;
  private _currentLoanTerm: LendingTerm;

  @ViewChild('pafInfoModal', { static: true })
  pafInfoModal: TemplateRef<any>; // eslint-disable-line
  @ViewChild('pafOptOutModal', { static: true })
  pafOptOutModal: TemplateRef<any>; // eslint-disable-line
  @ViewChild(PafTermsModalComponent, {static: true }) pafTermsModalComponent: PafTermsModalComponent;

  componentRef: ComponentRef<any>; // eslint-disable-line

  constructor(
    public translateService: TranslateService,
    private offerService: OfferService,
    private lendingApplicationsService: LendingApplicationsService,
    private supplierService: SupplierService,
    private userSessionService: UserSessionService,
    private errorService: ErrorService,
    private stateRoutingService: StateRoutingService,
    private merchantService: MerchantService,
    private borrowerInvoiceService: BorrowerInvoiceService,
    private directPaymentService: DirectPaymentService,
    private loggingService: LoggingService,
    private configurationService: ConfigurationService,
    private formBuilder: FormBuilder,
    private bsModalService: BsModalService,
    private bankingFlowService: BankingFlowService,
    private agreementService: AgreementService,
    private reauthService: ReauthService,
    private changeDetectorRef: ChangeDetectorRef,
    private uiAssetService: UiAssetService
  ) {}

  /**
   * Sequence of calls:
   * - Set merchant entity which might be used in application create
   * - Set subscription to offer
   * - Set subscription to application
   * - Set subscription to invoice
   * - Set subscription to supplier
   * - Set localised frequency for display label
   * - Initialise generic variables (feeObservable, loadFeeFn, processApplicationFn, getTermsFn)
   * - Set lending fee subscription (depends on generic variables)
   * - Initialise form group (amount, repaymentTerms)
   */
  ngOnInit(): void {
    this.setMerchant();
    this.initLendingOffersSubscription();
    this.setLendingApplicationSubscription();
    this.setAgreementSubscription();
    // Sets min and max - and assumes offer and/or application is already loaded
    this.initializeGenericVariables();
    this.guardForKycFailed();
    this.loadInvoice();
    this.setCurrentSupplierSubscription();
    this.setCurrentInvoiceSubscription();
    this.setLendingFeeSubscription();

    // initializeFormGroup relies on invoice being loaded as it loads and runs validators
    if (this.loaded_invoice) {
      this.initializeFormGroup();
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();

    // Note: [Graham] these can be removed with takeUntil.
    if (this.currentSupplierInformationSubscription$ && !this.currentSupplierInformationSubscription$.closed) {
      this.currentSupplierInformationSubscription$.unsubscribe();
    }
    if (this.currentInvoiceSubscription$ && !this.currentInvoiceSubscription$.closed) {
      this.currentInvoiceSubscription$.unsubscribe();
    }
    if (this.lendingApplicationSubscription$ && !this.lendingApplicationSubscription$.closed) {
      this.lendingApplicationSubscription$.unsubscribe();
    }
    if (this.lendingFeeSubscription$ && !this.lendingFeeSubscription$.closed) {
      this.lendingFeeSubscription$.unsubscribe();
    }
    this.offerService.clearOfferFee();
    this.lendingApplicationsService.clearLendingApplicationFee();
    this.supplierService.clearSupplierInformation();
    this.borrowerInvoiceService.clearActiveInvoice();
    this.bankingFlowService.clearAttributes();
  }

  private onInvoiceLoadComplete(): void {
    this.initializeFormGroup();
  }

  // INITIALISE

  private initializeGenericVariables(): void {
    if (!this.offer) {
      Bugsnag.notify(new ErrorMessage(`Received invalid value (${this.offer}) in offer subscription for select_lending_offer component.`));
      this.errorService.show(UiError.general);

      return;
    }

    this.max_available = this.offerService.isOfferLoc(this.offer) ? this.offerService.getOfferAvailableAmount(this.offer) : this.offerService.getOfferWcaAvailableAmount(this.offer);

    if (this.lendingApplication && this.lendingApplicationsService.applicationApproved(this.lendingApplication)) {
      this.feeObservable = this.getLendingApplicationFee();
      this.loadFeeFn = this.loadLendingApplicationFee;
      this.processApplicationFn = this.amendLendingApplication;
      this.getTermsFn = () => this.termOptionsFromApplication;
      this.min_available = this.lendingApplicationsService.hasPayouts(this.lendingApplication) ?
        this.lendingApplicationsService.getPayoutsSum(this.lendingApplication.offline_payouts) : this.offer.min_principal_amount;
    } else {
      this.feeObservable = this.offerService.offerFee$;
      this.loadFeeFn = this.loadOfferFee;
      this.processApplicationFn = this.createLendingApplication;
      this.getTermsFn = () => this.termOptionsFromOffer;
      this.min_available = this.offer.min_principal_amount;
    }
  }

  /**
   * Sets up subscription to set local data when offers have been updated.
   */
  private initLendingOffersSubscription(): void {
    this.offerService.offer$
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe(
        (offer: Offer) => {
          if (!offer) { return; }

          this.offer = offer;
          this.getDefaultLoanTerm(offer);
        }
      );
  }

  private getDefaultLoanTerm(offer: Offer): void {
    this.termOptionsFromOffer = this.augmentLendingTerms(offer.available_terms);
    this.defaultLoanTerm = this.getLastTerm(this.termOptionsFromOffer);
  }

  private initializeFormGroup(): void {
    if (this.isFormGroupInitialized) {
      return;
    }

    this.allTerms = this.getTerms();
    this.populateFrequencyList();
    // Default repayment frequency to weekly for WCA, otherwise default to daily
    if (this.weeklyRepaymentEnabled && this.weeklyTerms.length > 0) {
      this.frequency = WEEKLY_FREQUENCY;
      this.terms = this.weeklyTerms;
      this.defaultLoanTerm = this.getLastTerm(this.weeklyTerms);
    } else if (this.dailyTerms.length > 0) {
      this.frequency = DAILY_FREQUENCY;
      this.terms = this.dailyTerms;
      this.defaultLoanTerm = this.getLastTerm(this.dailyTerms);
    } else if (this.biweeklyTerms.length > 0) {
      this.frequency = BIWEEKLY_FREQUENCY;
      this.terms = this.biweeklyTerms;
      this.defaultLoanTerm = this.getLastTerm(this.biweeklyTerms);
    } else {
      Bugsnag.notify(new ErrorMessage('Error setting default loan term'));
    }

    this.isFormGroupInitialized = true;
    const amountDue = this.invoiceAmountExists() ? this.getInvoiceAmountDue() : this.offerService.requestedAmount;
    const defaultPaymentFrequency = this.defaultLoanTerm ? this.defaultLoanTerm.term_frequency : null;
    const defaultPaymentTerm = this.defaultLoanTerm ? this.defaultLoanTerm.id : null;
    this.selectLendingOfferFormGroup = this.formBuilder.group({
      amount: [amountDue, [Validators.max(this.maxAvailableForChosenTerm()), Validators.min(this.minAvailableForChosenTerm())]],
      paymentMethod: [null, null],
      paymentTerm: [defaultPaymentTerm, null],
      paymentFrequency: [defaultPaymentFrequency, null]
    });

    this.selectLendingOfferFormGroup.get('amount').valueChanges
      .pipe(
        debounceTime(GET_LENDING_OFFER_FEE.DEBOUNCE_TIME),
        takeUntil(this.unsubscribe$)
      )
      .subscribe((principalValue: string) => this.onPrincipalChange(Number(principalValue)));

    this.currentLoanTerm = this.defaultLoanTerm; // initialise to pre-selected term

    if (this.lendingApplication && this.lendingApplication.state === ApplicationState.approved) {
      this.setDefaultValuesForApprovedWcaApplication();
      return;
    }

    // TODO : Remove this when released
    if (this.directDebitEnabled) {
      // Only allow direct-debit payment method if the offer is 0.0 or the amount is below the minimum finance-able limit
      if (this.offer
        && ((amountDue && (amountDue < this.offer.min_principal_amount))
          || !(this.offer.max_principal_amount > 0.0))) {
        this.setDirectDebitDefaultValues();
      }
    }
  }

  // COMPONENT METHODS

  amountBelowMinimum(): boolean {
    const amountValue = this.selectLendingOfferFormGroup.controls['amount'].value;
    // if no amount set, it is not an error
    if (amountValue == null) {
      return false;
    }
    return (amountValue < this.minAvailableForChosenTerm());
  }

  amountAboveMaximum(): boolean {
    const amountValue = this.selectLendingOfferFormGroup.controls['amount'].value;
    // if no amount set, it is not an error
    if (amountValue == null) {
      return false;
    }
    return (amountValue > this.maxAvailableForChosenTerm());
  }

  principalWarning(): boolean {
    return !!this.principal && this.amountAboveMaximum();
  }

  onPrincipalChange(principal: number): void {
    // only re-load if principal is different from previous one
    if (principal !== this.principal) {
      this.principal = principal;
      if (!this.selectLendingOfferFormGroup.valid) {
        this.clearLendingFee();
      } else if (this.currentLoanTerm.term_type !== LendingTermType.direct_debit) {
        this.calculatingFee = true; // redundant
        this.loadFeeFn();
      } else {
        this.setDirectDebitFee(this.currentLoanTerm);
      }
    }
  }

  maxAvailableForChosenTerm(): number {
    let maxAmountForTerm = 0.0;
    if (this.currentLoanTerm && this.currentLoanTerm.term_type === LendingTermType.direct_debit) {
      maxAmountForTerm = this.configurationService.directDebitMaxAmount;
    } else {
      maxAmountForTerm = this.max_available;
    }

    // Prevent users from overpaying invoices
    const invoiceAmountDue = this.invoice ? this.invoice.amount - this.invoice.amount_paid : maxAmountForTerm;
    return invoiceAmountDue < maxAmountForTerm ? invoiceAmountDue : maxAmountForTerm;
  }

  minAvailableForChosenTerm(): number {
    if (this.currentLoanTerm && this.currentLoanTerm.term_type === LendingTermType.direct_debit) {
      return this.configurationService.directDebitMinAmount;
    }
    return this.min_available;
  }

  private onTermChange(term: LendingTerm): void {
    // Only load the new fee if the form is valid and the principal is set
    if (term && term === this.currentLoanTerm && this.selectLendingOfferFormGroup.valid && this.principal) {
      this.loadFeeFn();
    } else {
      this.clearLendingFee();
    }
  }

  onTermClick(event: any): void { // eslint-disable-line
    const termId: string = event.target.value;
    const newLoanTerm: LendingTerm = this.allTerms.find((term: LendingTerm) => term.id === termId) || null;

    // only set term if different from previous one
    if (newLoanTerm && newLoanTerm.term_type !== LendingTermType.direct_debit && newLoanTerm !== this.currentLoanTerm) {
      this.loggingService.GTMUpdate(GTMEvent.BUTTON_CLICKED, `${newLoanTerm.term_duration} ${newLoanTerm.term_unit}`);
      this.setFinancingFee(newLoanTerm);
    }
  }

  onPaymentMethodChange(event: any): void { // eslint-disable-line
    this.paymentMethod = event.target.value;
    this.loggingService.GTMUpdate(GTMEvent.BUTTON_CLICKED, this.paymentMethod);


    if (this.paymentMethod === LendingTermType.direct_debit) {
      const directDebitTerm = this.allTerms.find((term: LendingTerm) => term.term_type === LendingTermType.direct_debit);
      this.setDirectDebitFee(directDebitTerm);
    } else {
      this.frequency = DAILY_FREQUENCY;
      this.setFinancingFee(this.defaultLoanTerm);
    }
  }

  onPaymentFrequencyChange(event: any): void { // eslint-disable-line
    if (event.target.value === RepaymentSchedule.daily) {
      this.frequency = DAILY_FREQUENCY;
      this.terms = this.dailyTerms;
    } else if (event.target.value === RepaymentSchedule.bi_weekly) {
      this.frequency = BIWEEKLY_FREQUENCY;
      this.terms = this.biweeklyTerms;
    } else {
      this.frequency = WEEKLY_FREQUENCY;
      this.terms = this.weeklyTerms;
    }

    // Attempt to find terms with the same duration and unit as the previous for the new frequency
    const matchingLoanTerm = this.terms.find((term: LendingTerm) => {
      return term.term_duration ===  this.currentLoanTerm.term_duration &&
        term.term_unit === this.currentLoanTerm.term_unit;
    });

    this.currentLoanTerm = (!!matchingLoanTerm) ? matchingLoanTerm : this.getLastTerm(this.terms);
    this.selectLendingOfferFormGroup.controls['paymentTerm'].setValue(this.currentLoanTerm.id);
    this.loggingService.GTMUpdate(GTMEvent.BUTTON_CLICKED, this.currentLoanTerm.term_frequency);
    this.setFinancingFee(this.currentLoanTerm);
  }

  showPaymentPlanReview(): void {
    this.pafTermsModalComponent.show(this.invoice);
  }

  private setFinancingFee(loanTerm: LendingTerm): void {
    this.calculatingFee = true;
    this.currentLoanTerm = loanTerm;
    this.selectLendingOfferFormGroup.controls.amount.setValidators([Validators.max(this.maxAvailableForChosenTerm()),
      Validators.min(this.minAvailableForChosenTerm()),
      Validators.required]);
    this.selectLendingOfferFormGroup.controls['amount'].updateValueAndValidity();
    this.onTermChange(this.currentLoanTerm);
  }

  private setDirectDebitFee(loanTerm: LendingTerm): void {
    if (!this.lendingFee) {
      this.lendingFee = CLEAR_LENDING_FEE;
    }
    // lending fee for direct debit set to $2 but its actually discounted and we just want to show the user
    this.lendingFee.fee = this.directPaymentService.directDebitFee;
    this.lendingFee.repayment_amount = this.selectLendingOfferFormGroup.controls['amount'].value;
    this.lendingFee.principal_amount = this.selectLendingOfferFormGroup.controls['amount'].value;

    this.total_repayment = this.selectLendingOfferFormGroup.controls['amount'].value;
    this.currentLoanTerm = loanTerm; // Note: [Graham] this is redundant.
    this.frequency = 'INVOICE.FREQUENCY_ONE_TIME';
    this.selectLendingOfferFormGroup.controls.amount.setValidators([Validators.max(this.maxAvailableForChosenTerm()),
      Validators.min(this.minAvailableForChosenTerm()),
      Validators.required]);
    this.selectLendingOfferFormGroup.controls['amount'].updateValueAndValidity();
  }

  private processTotalRepayment(): void {
    if (this.lendingFee) {
      this.total_repayment = this.lendingFee.fee + this.lendingFee.principal_amount;
    } else {
      this.total_repayment = 0;
    }
  }

  private clearLendingFee(): void {
    if (!this.lendingFee) {
      this.lendingFee = CLEAR_LENDING_FEE;
    }
    this.lendingFee.fee = 0.0;
    this.lendingFee.principal_amount = 0.0;
    this.lendingFee.loan_term = null;
    this.lendingFee.repayment_amount = 0.0;
    this.total_repayment = 0.0;
    this.calculatingFee = false;
  }

  /**
   *  promo fee for direct debit is currently the negative of
   *  lendingFee.fee
   */
  get directDebitPromoFee(): number {
    return this.directPaymentService.directDebitPromoFee;
  }

  get isDirectDebit(): boolean {
    return this.paymentMethod === LendingTermType.direct_debit;
  }

  processLendingApplication(): void {
    if (this.isDelegatedAccessMode()) {
      this.errorService.show(UiError.delegatedMode);
      this.isButtonDisabled = true;
    } else {
      if (!this.processingOperation) {
        this.processingOperation = true;

        if (this.currentLoanTerm.term_type === LendingTermType.direct_debit) {
          if (this.merchantService.isKycUnverified()) {
            const context: ErrorModalContext = new ErrorModalContext(
              'KYC_IN_PROGRESS.TITLE',
              [
                this.translateService.instant('KYC_IN_PROGRESS.BODY')
              ]
            );
            this.isButtonDisabled = false;
            this.processingOperation = false;
            this.errorService.show(UiError.general, context);
          } else {
            this.processDirectDebit();
          }
        } else {
          this.processApplicationFn();
        }
      }
    }
  }

  setupPaf(): void {
    this.modalRef.hide();
    this.settingUpPaf = true;

    if (this.pafAgreement.opt_out_at || this.pafAgreement.state === AgreementState.opted_out) {
      this.loadPafAgreementForMerchant();
    } else {
      this.next();
    }
  }

  disablePaf(): void {
    this.modalRef.hide();

    const locale: string = this.translateService.currentLang;
    this.reauthService.open(locale).pipe(takeUntil(this.unsubscribe$)).subscribe((data: any) => { // eslint-disable-line
        if (data.status === this.reauthService.SUCCESS) {
          this.optOutPafAgreement();
        }
      },
      () => {
        this.errorService.show(UiError.signByReauth);
      });
  }

  // SERVICE CALLS

  private loadOfferFee(): void {
    this.calculatingFee = true;
    this.offerService.loadOfferFee$(this.offer.id, this.principal, this.currentLoanTerm)
      .pipe(take(1))
      .subscribe({
        error: (e: ErrorResponse) => {
          Bugsnag.notify(e);

          this.calculatingFee = false;
          this.errorService.show(UiError.getOfferFee);
        }
      });
  }

  private loadLendingApplicationFee(): void {
    this.calculatingFee = true;
    this.lendingApplicationsService.loadApplicationFee(this.lendingApplication.id, this.principal, this.currentLoanTerm)
      .pipe(take(1))
      .subscribe({
        error: (e: ErrorResponse) => {
          Bugsnag.notify(e);

          this.calculatingFee = false;
          this.errorService.show(UiError.getLendingApplicationFee);
        }
      });
  }

  private createLendingApplication(): void {
    const applicationPostEntity: LendingApplicationPost = this.buildApplicationPostEntity();
    this.lendingApplicationsService.postApplication(applicationPostEntity)
      .pipe(take(1), finalize(() => this.processingOperation = false))
      .subscribe(
        () => this.next(),
        (e: ErrorResponse) => {
          // 402 is returned for non-primary applicant - no need to bugsnag
          if (e.statusCode != 402) {
            Bugsnag.notify(e);
          }
          this.errorService.show(UiError.postLendingApplication);
        }
      );
  }

  private amendLendingApplication(): void {
    this.lendingApplicationsService.amend(this.lendingApplication.id, this.principal, this.currentLoanTerm)
      .pipe(take(1), finalize(() => this.processingOperation = false))
      .subscribe(
        () => this.next(),
        (e: ErrorResponse) => {
          Bugsnag.notify(e);

          this.errorService.show(UiError.amendLendingApplication);
        }
      );
  }

  private loadOfferForSupplier(offerId: string, supplierId: string): void {
    this.offerService.loadOffer$(offerId, supplierId)
      .pipe(take(1), finalize(() => this.loaded = true))
      .subscribe({
        error: (e: ErrorResponse) => {
          Bugsnag.notify(e);

          this.errorService.show(UiError.getOffers);
        }
      });
  }

  private loadInvoice(): void {
    if (this.borrowerInvoiceService.hasActiveInvoiceSet()) {
      this.borrowerInvoiceService.fetchInvoice()
        .pipe(take(1))
        .subscribe({
          error: (e: ErrorResponse | ErrorMessage) => {
            Bugsnag.notify(e);

            this.errorService.show(UiError.loadInvoiceError);
            this.borrowerInvoiceService.clearActiveInvoice();
            this.stateRoutingService.navigate(AppRoutes.dashboard.root);
          }
        });
    } else {
      // There is no invoice to load since there isn't one active
      this.loaded_invoice = true;
    }
  }

  private loadPafAgreementForMerchant(): void {
    if (this.borrowerInvoiceService.hasActiveInvoiceSet() && this.preAuthorizedFinancingEnabled && this.currentSupplierInformation &&
      this.currentSupplierInformation.id) {
      this.agreementService.loadAgreementByType(this.merchant.id, AgreementType.pre_authorized_financing, false, this.currentSupplierInformation.id)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe({
          error: (e: ErrorResponse) => {
            Bugsnag.notify(e);

            this.errorService.show(UiError.getAgreement);
          }
        });
    }
  }

  private processDirectDebit(): void {
    const directPaymentPost: DirectPaymentPost = {
      merchant_id: this.merchant.id,
      amount: this.principal
    };
    // Pay a Supplier flow will not have an invoice
    if (!this.invoice) {
      directPaymentPost.invoice_number = this.currentSupplierInformation.invoice_number;
      directPaymentPost.account_number = this.currentSupplierInformation.account_number;
      directPaymentPost.payee_id = this.currentSupplierInformation.id;
    } else {
      directPaymentPost.invoice_id = this.invoice.id;
    }

    this.directPaymentService.storeDirectPaymentInformation(directPaymentPost, this.currentSupplierInformation);
    this.next();
  }

  private optOutPafAgreement(): void {
    this.agreementService.optOut(this.pafAgreement.id)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        error: (e: ErrorResponse) => {
          Bugsnag.notify(e);

          this.errorService.show(UiError.general);
        }
      });
  }

  private setMerchant(): void {
    // TODO: This should be an actual subscription once merchantData is refactored to be a BS.
    this.merchant = this.merchantService.getMerchant();
  }

  // SERVICE CALLS HELPERS

  private buildApplicationPostEntity(): LendingApplicationPost {
    const application: LendingApplicationPost = {
      offer_id: this.offer.id,
      principal_amount: this.principal,
      apr: 0,                                                         // TODO: I don't think we should have to provide this.
      repayment_schedule: RepaymentSchedule.daily,                    // TODO: We don't support anything else so this is hard-coded for now.
      merchant_user_email: this.userSessionService.userSession.email,
      merchant_user_id: this.userSessionService.userSession.id,
      interest_amount: this.lendingFee.fee, // Note: [Graham] this has the potential to cause bugsnags.
      repayment_amount: this.lendingFee.repayment_amount,        // TODO: I don't think we should have to provide this.
      loan_term_id: this.currentLoanTerm.id,
    };

    const payeeAttributes = this.getPayeeAttributes();

    // payor_account_id: ''                   // TODO: [Refactor] To be provided if available

    return {...application, ...payeeAttributes};
  }

  /**
   * Return only the payee attributes based on whether or not there is an invoice.
   */
  private getPayeeAttributes(): { payee_id: string; payee_account_num?: string; payee_invoice_num?: string } {
    if (this.currentSupplierInformation) {
      return { payee_id: this.currentSupplierInformation.id,
        payee_account_num: this.currentSupplierInformation.account_number,
        payee_invoice_num: this.currentSupplierInformation.invoice_number };
    } else {
      return { payee_id: this.merchant.id };
    }
  }

  // SUBSCRIPTIONS
  // TODO: [Graham] remove/refactor this subscription/service.
  private setLendingFeeSubscription(): void {
    this.lendingFeeSubscription$ = this.feeObservable
      .pipe(
        tap(() => this.calculatingFee = false)
      )
      .subscribe(
    (fee: OfferFee | LendingApplicationFee) => {
            this.lendingFee = fee;
            this.processTotalRepayment();
        }
      );
  }
  // TODO: [Graham] remove/refactor this subscription/service.
  private setCurrentSupplierSubscription(): void {
    // Note: [Graham] there could be a race condition here with offers subscription.
    this.currentSupplierInformationSubscription$ = this.supplierService.currentSupplierInformation
      .subscribe((supplier: SupplierInformation) => {
        this.currentSupplierInformation = supplier;
        // If supplier is found, re-load the offer with additional supplier information
        if (this.currentSupplierInformation && this.offer) {
          this.loadOfferForSupplier(this.offer.id, this.currentSupplierInformation.id);
          this.loadPafAgreementForMerchant();
        } else {
          this.loaded = true;
        }
      });
  }
  // TODO: [Graham] remove/refactor this subscription/service.
  private setCurrentInvoiceSubscription(): void {
    if (!this.borrowerInvoiceService.hasActiveInvoiceSet()) {
      this.loaded_invoice = true;
      return;
    }
    this.currentInvoiceSubscription$ = this.borrowerInvoiceService.getBorrowerInvoice()
      .subscribe((borrowerInvoice: Invoice) => {
        this.invoice = borrowerInvoice;
        if (borrowerInvoice) {
          this.supplierService.setCurrentSupplierInformation(this.borrowerInvoiceService.invoiceAsSupplierInformation());
          this.loaded_invoice = true;
          this.onInvoiceLoadComplete();
        }
      });
  }

  // TODO: [Graham] remove/refactor this subscription/service.
  private setLendingApplicationSubscription(): void {
    this.lendingApplicationSubscription$ = this.lendingApplicationsService.lendingApplication$
      .subscribe((application: LendingApplication) => {
        if (application) {
          this.lendingApplication = application;
          this.termOptionsFromApplication = this.augmentLendingTerms(this.lendingApplication.available_terms);
          this.defaultLoanTerm = this.getLastTerm(this.termOptionsFromApplication);
        }
      });
  }
  // TODO: [Graham] remove/refactor this subscription/service.
  private setAgreementSubscription(): void {
    this.agreementService.agreementSubject.pipe(takeUntil(this.unsubscribe$)).subscribe((agreement: Agreement) => {
      if (agreement && agreement.type === AgreementType.pre_authorized_financing) {
        this.pafAgreement = agreement;
        this.changeDetectorRef.detectChanges();
        if (this.settingUpPaf) {
          this.next();
        }
      }
    });
  }

  // NAVIGATION

  next(): void {
    if (this.settingUpPaf) {
      this.supplierService.setSelectedSupplierIdForMerchant(this.merchant.id, this.currentSupplierInformation.id);
      this.agreementService.setHasActivePafAgreementForMerchant(this.merchant.id);
      this.stateRoutingService.navigate(AppRoutes.application.pre_authorized_financing_prerequisites, true);
    } else if (this.currentLoanTerm && this.currentLoanTerm.term_type === LendingTermType.direct_debit) {
      this.stateRoutingService.navigate(AppRoutes.application.direct_debit_prerequisites, true);
    } else {
      this.stateRoutingService.navigate(AppRoutes.application.approval_prerequisites, true);
    }
  }

  /**
   * If there is an application in progress, go back to approval-post
   * Else, go to dashboard if offer is WCA offer, or go to select payee otherwise.
   */
  back(): void {
    if (this.lendingApplication && this.lendingApplicationsService.applicationApproved(this.lendingApplication)) {
      this.stateRoutingService.navigate(AppRoutes.application.approval_post, true);
    } else {
      if (this.offerService.isOfferWca(this.offer)) {
        this.stateRoutingService.navigate(AppRoutes.dashboard.root);
      } else {
        if (this.borrowerInvoiceService.hasActiveInvoiceSet()) {
          this.borrowerInvoiceService.clearActiveInvoice();
          this.stateRoutingService.navigate(AppRoutes.dashboard.root);
        } else {
          this.configurationService.disableInvoiceUi ?
            this.stateRoutingService.navigate(AppRoutes.dashboard.root) :
            this.stateRoutingService.navigate(AppRoutes.application.select_payee, true);
        }
      }
    }
  }

  //  HELPERS

  private isDelegatedAccessMode(): boolean {
    return this.merchantService.isDelegatedAccessMode();
  }

  private guardForKycFailed(): void {
    if (!this.offerService.isOfferLoc(this.offer)) {
      return;
    }

    if (this.offerService.blockOnKycFailure(this.offer) && this.merchantService.isKycFailed()) {
      const msg = 'Borrower attempted to pay an invoice and failed KYC - in select_lending_offer component.';
      this.loggingService.log({ message: msg, severity: LogSeverity.warn });
      this.borrowerInvoiceService.clearActiveInvoice();
      this.stateRoutingService.navigate(AppRoutes.error.kyc_failed, true);
    }
  }

  /**
   * Augment each term in the terms array but assigning localised_unit_label to correct value.
   */
  private augmentLendingTerms(terms: LendingTerm[]): LendingTerm[] {
    const sortedTerms: LendingTerm[] = terms ? this.sortLendingTerms(terms) : null;
    const augmentedTerms: LendingTerm[] = sortedTerms ? sortedTerms.map((term) => {
      term.localised_unit_label = this.getLocalisedTermUnitLabel(term.term_duration, term.term_unit);
      return term;
    }) : null;

    if (!this.offerService.isOfferWca(this.offer)) {
      // TODO : Remove feature flag when released
      if (this.directDebitEnabled) {
        const directDebitTerm: LendingTerm = {
          term_unit: TermUnit.one_time,
          id: 'direct_debit',
          term_duration: 0,
          term_type: LendingTermType.direct_debit,
          localised_unit_label: 'PAY_TERMS.LABEL_DAYS',
          term_frequency: RepaymentSchedule.none
        };
        augmentedTerms.unshift(directDebitTerm);
      }
    }
    return augmentedTerms;
  }

  /**
   * Sorts the objects in the terms array in ascending order based on number of days (as indicated by term_duration and term_unit).
   */
  private sortLendingTerms(terms: LendingTerm[]): LendingTerm[] {
    return terms.sort((a, b) => {
      return a.term_duration * this.termUnitToDays(a.term_unit) - b.term_duration * this.termUnitToDays(b.term_unit);
    });
  }

  getAccountNumber(): string {
    if (this.currentSupplierInformation) {
      return this.currentSupplierInformation.account_number;
    } else {
      return '';
    }
  }

  displayHeader(): boolean {
    if (this.currentSupplierInformation) {
      return true;
    }
    return false;
  }

  getInvoiceNumber(): string {
    if (this.currentSupplierInformation) {
      return this.currentSupplierInformation.invoice_number;
    } else {
      return '';
    }
  }

  getSupplierName(): string {
    if (this.currentSupplierInformation) {
      return this.currentSupplierInformation.name;
    } else {
      return '';
    }
  }

  get debouncing(): boolean {
    return (Number(this.selectLendingOfferFormGroup.controls['amount'].value) !== this.principal);
  }

  // Note: [Graham] move this to invoice service.
  invoiceAmountExists(): boolean {
    const invoice: Invoice = this.borrowerInvoiceService.getActiveInvoice();
    return (invoice && invoice.amount > 0);
  }

  getInvoiceAmount(): number {
    const invoice: Invoice = this.borrowerInvoiceService.getActiveInvoice();
    return invoice ? invoice.amount : 0.0;
  }

  getInvoiceProcessingAmount(): number {
    const invoice: Invoice = this.borrowerInvoiceService.getActiveInvoice();
    return invoice ? invoice.processing_amount : 0.00;
  }

  getInvoiceAmountDue(): number {
    const invoice: Invoice = this.borrowerInvoiceService.getActiveInvoice();
    return invoice ? (invoice.amount - invoice.amount_paid - invoice.processing_amount) : 0.00;
  }

  showPafModal(): void {
    const config: ModalOptions = { class: 'modal-lg' };
    this.modalRef = this.bsModalService.show(this.pafInfoModal, config);
  }

  showPafOptOutModal(): void {
    const config: ModalOptions = { class: 'modal-lg' };
    this.modalRef = this.bsModalService.show(this.pafOptOutModal, config);
  }

  /**
   * Return correct terms to display.
   *
   * @return terms
   */
  getTerms(): LendingTerm[] {
    let allTerms: LendingTerm[] = [];

    if (typeof this.getTermsFn === 'function') {
      allTerms = this.getTermsFn();
    }

    if (allTerms && allTerms.length > 0) {
      this.getDailyTerms(allTerms);

      if (this.weeklyRepaymentEnabled) {
        this.getWeeklyTerms(allTerms);
        this.getBiweeklyTerms(allTerms);
      }
    }

    return allTerms;
  }

  private getBiweeklyTerms(allTerms: LendingTerm[]): void {
    this.biweeklyTerms = allTerms.filter((term) => {
      return term.term_frequency === RepaymentSchedule.bi_weekly;
    });
  }

  private getDailyTerms(allTerms: LendingTerm[]): void {
    this.dailyTerms = allTerms.filter((term) => {
      return term.term_frequency === RepaymentSchedule.daily;
    });
  }

  private getWeeklyTerms(allTerms: LendingTerm[]): void {
    this.weeklyTerms = allTerms.filter((term) => {
      return term.term_frequency === RepaymentSchedule.weekly;
    });
  }

  private populateFrequencyList(): void {
    if (this.biweeklyTerms.length > 0) {
      this.frequencyList.push(RepaymentSchedule.bi_weekly);
    }

    if (this.weeklyTerms.length > 0) {
      this.frequencyList.push(RepaymentSchedule.weekly);
    }

    if (this.dailyTerms.length > 0) {
      this.frequencyList.push(RepaymentSchedule.daily);
    }
  }

  private setDirectDebitDefaultValues(): void {
    this.isFinancingAvailable = false;
    this._paymentMethod = LendingTermType.direct_debit;
    const directDebitTerm = this.allTerms.find((term: LendingTerm) => term.term_type === LendingTermType.direct_debit);
    this.setDirectDebitFee(directDebitTerm);
  }

  private setDefaultValuesForApprovedWcaApplication(): void {
    if (!this.allTerms || this.allTerms.length === 0) {
      return;
    }

    this.principal = this.lendingApplication.principal_amount;
    const term: LendingTerm = this.allTerms.find((productTerm: LendingTerm) => {
      return productTerm.term_duration === this.lendingApplication.term_duration && productTerm.term_unit === this.lendingApplication.term_unit &&
        productTerm.term_frequency === this.lendingApplication.repayment_schedule;
    });

    if (term.term_frequency === RepaymentSchedule.daily) {
      this.setLoanTermAndFinancingFeeForApprovedWcaApplication(term);
      this.frequency = DAILY_FREQUENCY;
      this.terms = this.dailyTerms;
    } else if (term.term_frequency === RepaymentSchedule.weekly) {
      this.setLoanTermAndFinancingFeeForApprovedWcaApplication(term);
      this.frequency = WEEKLY_FREQUENCY;
      this.terms = this.weeklyTerms;
    } else if (term.term_frequency === RepaymentSchedule.bi_weekly) {
      this.setLoanTermAndFinancingFeeForApprovedWcaApplication(term);
      this.frequency = BIWEEKLY_FREQUENCY;
      this.terms = this.biweeklyTerms;
    }
  }

  private setLoanTermAndFinancingFeeForApprovedWcaApplication(term: LendingTerm): void {
    this.defaultLoanTerm = term;
    this.currentLoanTerm = this.defaultLoanTerm;
    this.selectLendingOfferFormGroup.get('paymentTerm').setValue(this.currentLoanTerm.id);
    this.selectLendingOfferFormGroup.get('paymentFrequency').setValue(this.currentLoanTerm.term_frequency);
    this.setFinancingFee(this.currentLoanTerm);
  }

  /**
   * Returns last term in the list of terms.
   */
  private getLastTerm(terms: LendingTerm[]): LendingTerm {
    return terms ? terms[ terms.length - 1 ] : null; // TODO get this from backend
  }

  // If there's no existing amount, don't check if the form was touched
  formValidateExistingAmount(): boolean {
    return (this.invoiceAmountExists() ? true : this.selectLendingOfferFormGroup.get('amount').touched);
  }

  /**
   * Get lending fee observable from application service.
   */
  private getLendingApplicationFee(): Observable<LendingApplicationFee> {
    return this.lendingApplicationsService.lendingApplicationFee$;
  }

  /**
   * Returns the localisation variable for the term unit label based on whether duration is plural or singular
   * and if unit is among the defined TermUnit values.
   */
  private getLocalisedTermUnitLabel(duration: number, unit: string): string {
    let unit_str = this.BASE_TERM_UNIT_LABEL;
    // ensure unit corresponds to valid TermUnit
    Object.keys(TermUnit).map((k) => {
      if (TermUnit[ k ] === unit) {
        unit_str = unit_str + TermUnit[ k ];
      }
    });
    // remove trailing S to change to singular
    unit_str = (duration === 1) ? unit_str.replace(/s$/, '') : unit_str;

    return unit_str.toUpperCase();
  }

  // TODO move to ui-asset.service
  private termUnitToDays(termUnit: TermUnit): number {
    switch (termUnit) {
      case TermUnit.days: return 1;
      case TermUnit.weeks: return 7;
      case TermUnit.months: return 30;
    }
  }

  get invoice(): Invoice {
    return this._invoice;
  }

  set invoice(value: Invoice) {
    this._invoice = value;
  }

  get modalRef(): BsModalRef {
    return this._modalRef;
  }

  set modalRef(value: BsModalRef) {
    this._modalRef = value;
  }

  get preAuthorizedFinancingEnabled(): boolean {
    return this.configurationService.preAuthorizedFinancingEnabled;
  }

  get directDebitEnabled(): boolean {
    return this.configurationService.directDebitEnabled;
  }

  get paymentMethod(): LendingTermType {
    return this._paymentMethod;
  }

  set paymentMethod(value: LendingTermType) {
    this._paymentMethod = value;
  }

  get isWca(): boolean {
    return !this.isSupplierPayment;
  }

  get isSupplierPayment(): boolean {
    return (this.getInvoiceNumber() && this.getInvoiceNumber() !== null) || (this.getAccountNumber() && this.getAccountNumber() !== null);
  }

  get isSupplierBusinessPartner(): boolean {
    if (this.currentSupplierInformation) {
      return this.currentSupplierInformation.is_business_partner;
    } else {
      return false;
    }
  }

  get biweeklyTerms(): LendingTerm[] {
    return this._biweeklyTerms;
  }

  set biweeklyTerms(value: LendingTerm[]) {
    this._biweeklyTerms = value;
  }

  get dailyTerms(): LendingTerm[] {
    return this._dailyTerms;
  }

  set dailyTerms(value: LendingTerm[]) {
    this._dailyTerms = value;
  }

  get weeklyTerms(): LendingTerm[] {
    return this._weeklyTerms;
  }

  set weeklyTerms(value: LendingTerm[]) {
    this._weeklyTerms = value;
  }

  get allTerms(): LendingTerm[] {
    return this._allTerms;
  }

  set allTerms(value: LendingTerm[]) {
    this._allTerms = value;
  }

  get terms(): LendingTerm[] {
    return this._terms;
  }

  set terms(value: LendingTerm[]) {
    this._terms = value;
  }

  get weeklyRepaymentEnabled(): boolean {
    return this.configurationService.weeklyRepaymentEnabled;
  }

  get settingUpPaf(): boolean {
    return this._settingUpPaf;
  }

  set settingUpPaf(value: boolean) {
    this._settingUpPaf = value;
  }

  get isPaidByPaf(): boolean {
    return this.pafAgreement && this.pafAgreement.type === AgreementType.pre_authorized_financing && this.pafAgreement.state === AgreementState.completed &&
      this.pafAgreement.accepted_at && !this.pafAgreement.opt_out_at && this.invoice && this.invoice.paf_activation_date &&
      this.preAuthorizedFinancingEnabled && this.invoice.payment_plan_entity.state !== PaymentPlanState.cancelled;
  }

  get showPafSignup(): boolean {
    return this.preAuthorizedFinancingEnabled && this.pafAgreement && this.pafAgreement.type === AgreementType.pre_authorized_financing &&
      this.pafAgreement.state !== AgreementState.completed && this.invoice &&
      (!this.invoice.paf_activation_date || this.pafAgreement.state === AgreementState.opted_out);
  }

  get showPafOptOut(): boolean {
    return this.preAuthorizedFinancingEnabled && this.pafAgreement && this.pafAgreement.type === AgreementType.pre_authorized_financing &&
      this.pafAgreement.accepted_at && this.pafAgreement.state === AgreementState.completed && this.invoice && this.invoice.paf_activation_date &&
      this.invoice.payment_plan_entity.state !== PaymentPlanState.cancelled;
  }

  get pafAgreement(): Agreement {
    return this._pafAgreement;
  }

  set pafAgreement(value: Agreement) {
    this._pafAgreement = value;
  }

  get currentLoanTerm(): LendingTerm {
    return this._currentLoanTerm;
  }
  // Note: [Graham] these can just be class variables.
  set currentLoanTerm (value: LendingTerm) {
    this._currentLoanTerm = value;
  }

  get merchant(): Merchant {
    return this._merchant;
  }

  set merchant(value: Merchant) {
    this._merchant = value;
  }

  get currentSupplierInformation(): SupplierInformation {
    return this._currentSupplierInformation;
  }

  set currentSupplierInformation(value: SupplierInformation) {
    this._currentSupplierInformation = value;
  }

  getPaymentFrequencyLabel(frequency: RepaymentSchedule): string {
    return this.uiAssetService.getPaymentFrequencyLabel(frequency);
  }
}
