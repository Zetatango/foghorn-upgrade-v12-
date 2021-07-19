import { Component, OnInit, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { Router } from '@angular/router';
import { ErrorModalContext } from 'app/components/utilities/error-modal/error-modal-context';
import { Offer } from 'app/models/api-entities/offer';
import { LogSeverity } from 'app/models/api-entities/log';
import { ZttResponse } from 'app/models/api-entities/response';
import { ErrorResponse } from 'app/models/error-response';
import { BankAccount } from 'app/models/bank-account';
import { AppRoutes } from 'app/models/routes';
import { UiError } from 'app/models/ui-error';
import { BankAccountLoadingState, BankAccountService } from 'app/services/bank-account.service';
import { BankingFlowService, BankingContext } from 'app/services/banking-flow.service';
import { ErrorService } from 'app/services/error.service';
import { OfferService } from 'app/services/offer.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { UserSessionService } from 'app/services/user-session.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { CONSTANTS } from 'app/constants';
import Bugsnag from '@bugsnag/js';
import { take } from 'rxjs/operators';

@Component({
  selector: 'ztt-bank-accounts-picker',
  templateUrl: './bank-accounts-picker.component.html'
})
export class BankAccountsPickerComponent implements OnInit {

  @ViewChild(NgModel, { static: false }) accountSelector!: NgModel;
  bankAccounts: BankAccount[];
  insightsOptIn = true;
  processingAccount = false;
  selectedBankAccount: BankAccount | null = null
  selectedBankAccounts: BankAccount[] = [];

  get allowMultipleSelection(): boolean {
    return this.bankingFlowService.context === BankingContext.insights;
  }

  get description(): string {
    return this.bankingFlowService.pickerDescription;
  }

  get isChooseDisabled(): boolean {
    return !this.accountSelector || this.accountSelector.invalid || this.processingAccount;
  }

  get requiresInsightPreference(): boolean {
    return this.userSessionService.insightsPreference === null;
  }

  private get delegatedAccess(): boolean {
    return this.merchantService.isDelegatedAccessMode();
  }

  constructor(
    private bankAccountService: BankAccountService,
    private errorService: ErrorService,
    private offerService: OfferService,
    private loggingService: LoggingService,
    private merchantService: MerchantService,
    private bankingFlowService: BankingFlowService,
    private userSessionService: UserSessionService,
    private stateRoutingService: StateRoutingService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.bankAccounts = this.bankAccountService.bankAccounts;
  }

  addNewBank(): void {
    this.bankAccountService.setBankAccountLoadingState(BankAccountLoadingState.READY);
  }

  next(): void {
    this.bankingFlowService.triggerCompleteEvent();
  }

  choose(): void {
    if (this.delegatedAccess) return this.errorService.show(UiError.delegatedMode);

    this.processingAccount = true;

    this.allowMultipleSelection ? this.selectInsightsBankAccounts() : this.selectBankAccount();
  }
  private selectBankAccount(): void {
    if (!this.selectedBankAccount) {
      return this.errorService.show(UiError.createBankAccount);
    }

    this.bankAccountService.setSelectedBankAccount(this.selectedBankAccount)
      .pipe(take(1))
      .subscribe(
        () => this.postChoose(),
        (e: ErrorResponse) => {
          this.handleError(e);
        }
      );
  }

  private selectInsightsBankAccounts(): void {
    this.bankAccountService.setSelectedInsightsBankAccounts(this.selectedBankAccounts)
      .pipe(take(1))
      .subscribe(
        () => this.next(),
        (e: ErrorResponse) => {
          this.handleError(e);
        }
      );
  }

  /**
   * After selecting bank account, run through following steps:
   *
   * 1. POST to increase limit endpoint if increaseLimit flag is set (for hard hit)
   * 2. Reload offer as it will have been refreshed by the back end
   * 3. Call next() to proceed in the flow
   */
  private async postChoose(): Promise<void> {
    this.loggingService.logCurrentPage(this.router.url, 'selectBankAccount');
    try {
      if (this.bankAccountService.increaseLimit) {
        await this.bankAccountService.postIncreaseLimit().toPromise();
      }
      await this.reloadOffer();
    }
    catch (e) {
      Bugsnag.notify(e);
      this.processingAccount = false;
      this.errorService.show(UiError.postSelectBankAccount);
      return;
    }
    if (this.requiresInsightPreference) {
      this.updateInsightsPreference();
    } else {
      this.next();
    }

    return Promise.resolve();
  }

  private updateInsightsPreference(): void {
    this.userSessionService.updateInsightsPreference(this.insightsOptIn)
      .then(() => {
        // We need to reload the user session information
        this.stateRoutingService.performRedirect(CONSTANTS.AUTO_LOGIN_URL);
      })
      .catch(() => {
        const logMessage = { message: 'Error updating users insights preference', severity: LogSeverity.error };
        this.loggingService.log(logMessage);

        this.next();
      });
  }

  /**
   * Reload offer with id set in service.
   */
  private async reloadOffer(): Promise<ZttResponse<Offer>> {
    const offerId = this.offerService.currentOfferId;
    if (offerId) return this.offerService.loadOffer$(offerId).toPromise();
  }

  private showSelectBankAccountConflictModal(): void {
    const context = new ErrorModalContext('CHOOSE_BANKACCT_ERROR_HEADING', ['CHOOSE_BANKACCT_ERROR_TEXT'], AppRoutes.dashboard.root);
    this.errorService.show(UiError.postSelectBankAccount, context);
  }

  private showSelectBankAccountErrorModal(): void {
    this.errorService.show(UiError.postSelectBankAccount);
  }

  private handleError(e: ErrorResponse): void {
    this.processingAccount = false;
    if (e.statusCode === 409) {
      this.showSelectBankAccountConflictModal();
    } else {
      Bugsnag.notify(e);
      this.showSelectBankAccountErrorModal();
    }
  }
}
