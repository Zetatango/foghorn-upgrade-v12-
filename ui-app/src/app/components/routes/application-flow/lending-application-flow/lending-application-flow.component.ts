import { Component, OnDestroy, OnInit } from '@angular/core';
import { Invoice } from 'app/models/api-entities/invoice';
import { LendingApplication } from 'app/models/api-entities/lending-application';
import { Offer } from 'app/models/api-entities/offer';
import { LogMessage, LogSeverity } from 'app/models/api-entities/log';
import { ApplicationState, OfferType } from 'app/models/api-entities/utility';
import { AppRoutes } from 'app/models/routes';
import { UiError } from 'app/models/ui-error';
import { AgreementService } from 'app/services/agreement.service';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { BorrowerInvoiceService } from 'app/services/borrower-invoice.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { DirectPaymentService } from 'app/services/direct-payment.service';
import { ErrorService } from 'app/services/error.service';
import { ApplicationProgress, LendingApplicationsService } from 'app/services/lending-applications.service';
import { OfferService } from 'app/services/offer.service';
import { LoadingService } from 'app/services/loading.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { SupplierService } from 'app/services/supplier.service';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { ErrorMessage, ErrorResponse } from 'app/models/error-response';
import Bugsnag from '@bugsnag/js';

@Component({
  selector: 'ztt-lending-application-flow',
  templateUrl: './lending-application-flow.component.html'
})
export class LendingApplicationFlowComponent implements OnInit, OnDestroy {
  unsubscribe$ = new Subject<void>();

  // imports
  application: LendingApplication;
  applications: LendingApplication[];
  invoice: Invoice;

  // component variables
  mainLoader: string;
  merchantHasBankAccount: boolean;

  get offer(): Offer | null {
    return this.offerService.offer$.value ?? this.determineOffer();
  }

  constructor(
    private agreementService: AgreementService,
    private lendingApplicationsService: LendingApplicationsService,
    private bankingFlowService: BankingFlowService,
    private borrowerInvoiceService: BorrowerInvoiceService,
    private configurationService: ConfigurationService,
    private directPaymentService: DirectPaymentService,
    private errorService: ErrorService,
    private loadingService: LoadingService,
    private loggingService: LoggingService,
    private merchantService: MerchantService,
    private offerService: OfferService,
    private stateRoutingService: StateRoutingService,
    private supplierService: SupplierService
  ) {
    this.mainLoader = this.loadingService.getMainLoader();
  }

  ngOnInit(): void {
    this.merchantHasBankAccount = this.merchantService.merchantHasSelectedBankAccount();
    this.loadingService.showMainLoader();
    this.initGetBorrowerInvoiceSubscription();
    this.initLoadApplicationsSubscription();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private initGetBorrowerInvoiceSubscription(): void {
    // Note: [Graham] this seems cyclical. We my already have the borrowerInvoice once this resolves. Is fetchInvoice needed?
    this.borrowerInvoiceService.getBorrowerInvoice()
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe(
        (borrowerInvoice: Invoice) => {
          this.invoice = borrowerInvoice;

          if (this.invoice) {
            this.initFetchInvoiceSubscription();
          }
        }
      );
  }

  private initFetchInvoiceSubscription(): void {
    this.borrowerInvoiceService.fetchInvoice()
      .pipe(
        take(1)
      )
      .subscribe({
        error: (e: ErrorResponse | ErrorMessage) => {
          Bugsnag.notify(e);
          this.errorService.show(UiError.loadInvoiceError);
        }
      });
  }

  private initLoadApplicationsSubscription(): void {
    if (!this.offer) {
      const logMessage: LogMessage = { message: `Selecting an offer for application has failed.`, severity: LogSeverity.error };
      this.loggingService.log(logMessage);
      this.errorService.show(UiError.getOffers);

      return;
    }

    this.lendingApplicationsService.loadApplications()
      .pipe(
        take(1)
      )
      .subscribe(
        () => {
          this.initGetLendingApplicationsSubscription();
          this.initGetLendingApplicationSubscription();
          this.redirect();
        },
        () => {
          this.loadingService.hideMainLoader();
          this.errorService.show(UiError.loadLendingApplications);
        }
      );
  }

  // SUBSCRIPTIONS
  private initGetLendingApplicationsSubscription(): void {
    this.lendingApplicationsService.lendingApplications$
      .pipe(
        take(1)
      )
      .subscribe(
        (applications: LendingApplication[]) => {
          this.applications = applications;

          if (this.applications) {
            this.lendingApplicationsService.setProcessingApplicationForOffer(this.applications, this.offer.id);
          }
        }
      );
  }

  private initGetLendingApplicationSubscription(): void {
    this.lendingApplicationsService.lendingApplication$
      .pipe(
        take(1)
      )
      .subscribe(
        (application: LendingApplication) => this.application = application
      );
  }

  /** If there is a direct debit in progress, resume it.
   * If there is an PAF agreement in progress, resume it.
   * Otherwise, if there is an application currently being processed, attempt to resume it.
   * Else apply for the current offer.
   */
  private redirect(): void {
    if (this.directPaymentService.hasActiveDirectDebitSet) {
      return this.stateRoutingService.navigate(AppRoutes.application.direct_debit_prerequisites, true);
    }

    if (this.agreementService.hasActivePafAgreementForMerchant(this.merchantService.getMerchant().id)) {
      return this.stateRoutingService.navigate(AppRoutes.application.pre_authorized_financing_prerequisites, true);
    }

    if (this.application) {
      // Note: [Graham] test to see if this modal stays once navigate is completed.
      if (this.borrowerInvoiceService.hasActiveInvoiceSet()) {
        // Check if invoice number is the same - if it is not, show an error and continue with the current application
        const activeInvoice = this.borrowerInvoiceService.getActiveInvoice();
        if (activeInvoice.invoice_number !== this.application.payee_invoice_num) {
          this.errorService.show(UiError.appInProgressError);
        }
      }

      this.handleCurrentApplication(this.application, this.offer);
    } else {
      this.applyForOffer(this.offer);
    }
  }

  /**
   * Navigation logic helper for redirect()
   *
   * If the current application belongs to the currently user-selected lending offer & is in progress
   *   -> Resume it if possible.
   *   -> Else start a fresh application for user-selected lending offer.
   */
  private handleCurrentApplication(application: Readonly<LendingApplication>, offer: Readonly<Offer>): void {
    if (this.belongsToSelectedOffer(application, offer) && this.lendingApplicationsService.isApplicationInProgress(application.state)) {
      this.handleInProgressApplication(application.state);
    } else {
      this.applyForOffer(offer);
    }
  }

  /**
   * Returns true if the provided lendingApplication was created from the provided offer.
   */
  private belongsToSelectedOffer(application: Readonly<LendingApplication>, offer: Readonly<Offer>): boolean {
    return application.offer_id === offer.id;
  }

  /**
   * Navigation logic helper for handleCurrentApplication()
   * Resume application in progress with more granularity.
   *
   * @param applicationState: ApplicationState
   */
  private handleInProgressApplication(applicationState: Readonly<ApplicationState>): void {
    switch(this.lendingApplicationsService.getApplicationProgress(applicationState)) {
      case ApplicationProgress.before_approved:
        this.stateRoutingService.navigate(AppRoutes.application.approval_prerequisites, true);
        break;
      case ApplicationProgress.approved:
        this.stateRoutingService.navigate(AppRoutes.application.approval_post, true);
        break;
      case ApplicationProgress.completing:
        this.stateRoutingService.navigate(AppRoutes.application.completing_lending_application, true);
        break;
      case ApplicationProgress.invalid:
      default:
        const logMessage: LogMessage = { message: `In progress application did not match any in progress states.`, severity: LogSeverity.error };
        this.loggingService.log(logMessage);
        this.errorService.show(UiError.appInProgressError);
    }
  }

  private applyForOffer(offer: Readonly<Offer>): void {
    this.logApplyForOffer(offer);

    switch (offer.application_prerequisites.offer_type) {
      case (OfferType.LineOfCredit):
        this.applyForLocOffer(offer);
        break;
      case (OfferType.WorkingCapitalAdvance):
        this.applyForWcaOffer();
        break;
      default: this.errorService.show(UiError.general);
    }
  }

  private logApplyForOffer(offer: Readonly<Offer>): void {
    const merchant = this.merchantService.getMerchant();
    const tag = (offer.application_prerequisites.offer_type === OfferType.WorkingCapitalAdvance) ? 'MERCHANT_INITIATING_WCA_APPLICATION' : 'MERCHANT_INITIATING_LOC_APPLICATION';
    const appType = (offer.application_prerequisites.offer_type === OfferType.WorkingCapitalAdvance) ? 'Working Capital Advance' : 'Line of Credit';
    const message = `[${ tag },${ merchant.id },${ offer.id }] Merchant ${ merchant.name } is initiating a new ${ appType } application`;
    const logMessage: LogMessage = { message: message, severity: LogSeverity.info };

    this.loggingService.log(logMessage);
  }

  private applyForLocOffer(offer): void {
    if (this.borrowerInvoiceService.hasActiveInvoiceSet()) {
      this.supplierService.setCurrentSupplierInformation(this.borrowerInvoiceService.invoiceAsSupplierInformation());
      return this.stateRoutingService.navigate(AppRoutes.application.select_lending_offer, true);
    }

    if (this.merchantService.isKycFailed() && this.offerService.blockOnKycFailure(offer)) {
      return this.stateRoutingService.navigate(AppRoutes.error.kyc_failed, true);
    }

    if (!this.configurationService.disableInvoiceUi) {
      return this.stateRoutingService.navigate(AppRoutes.application.select_payee, true);
    }

    return this.stateRoutingService.navigate(AppRoutes.application.select_lending_offer, true);
  }

  /**
   * Return priority:
   * 1. Locally stored Offer.
   * 2. First LoC Offer.
   * 3. undefined.
   */
  private determineOffer(): Offer | undefined {
    return (() => {
      if (this.offerService.selectedOffer) {
        this.offerService.loadSelectedOffer(); // Note: [Graham] potentially return the offer.
        return this.offerService.offer$.value
      } else {
        const locOffer = this.offerService.locOffer;
        this.offerService.setOffer(locOffer);
        return locOffer;
      }
    })();
  }

  /** ====================================================================== **/
  /** ======================= LEGACY WCA FUNCTIONALITY ===================== **/
  /** ====================================================================== **/

  private applyForWcaOffer(): void {
    if (!this.merchantService.merchantHasSelectedBankAccount()) {
      this.setBankingFlowSubscriptions();
      return this.stateRoutingService.navigate(AppRoutes.application.set_up_bank, true);
    }

    return this.stateRoutingService.navigate(AppRoutes.application.select_lending_offer, true);
  }

  /**
   * Sets required parameters to invoke the banking flow
   */
  private setBankingFlowSubscriptions(): void {
    this.bankingFlowService.setAttributes(false);

    this.bankingFlowService.cancelEvent
      .pipe(
        take(1)
      )
      .subscribe(
        () => this.stateRoutingService.navigate(AppRoutes.dashboard.root)
      );

    this.bankingFlowService.completeEvent
      .pipe(
        take(1)
      )
      .subscribe(
        () => this.stateRoutingService.navigate(AppRoutes.application.select_lending_offer, true)
      );
  }
}
