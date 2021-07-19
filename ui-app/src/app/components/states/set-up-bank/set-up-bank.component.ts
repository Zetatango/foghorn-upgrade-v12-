import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Bugsnag from '@bugsnag/js';
import { LogMessage, LogSeverity } from 'app/models/api-entities/log';
import { ErrorResponse } from 'app/models/error-response';
import { BankAccount, FlinksPollingState } from 'app/models/bank-account';
import { UiError } from 'app/models/ui-error';
import { BankAccountLoadingState, BankAccountService } from 'app/services/bank-account.service';
import { BankingContext, BankingFlowService } from 'app/services/banking-flow.service';
import { ConfigurationService } from 'app/services/configuration.service';
import { ErrorService } from 'app/services/error.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { Subject, timer } from 'rxjs';
import { switchMap, take, takeUntil } from 'rxjs/operators';
import { FlinksRequestResponse } from 'app/models/api-entities/flinks-request';
import { BugsnagSeverity } from 'app/models/bugsnag';
import { AppLoadService } from 'app/services/app-load.service';

@Component({
  selector: 'ztt-set-up-bank',
  templateUrl: './set-up-bank.component.html'
})

// TODO consolidate this component with BankAccountInfoComponent - both components do essentially the same thing.
export class SetUpBankComponent implements OnInit, OnDestroy {
  static className = 'set_up_bank';

  unsubscribe$ = new Subject<void>();
  donePolling$ = new Subject<void>();

  // Bank account related variables
  bankAccount: BankAccount;
  bankAccountLoadingState: BankAccountLoadingState;

  // Flinks related variables
  pollCounter = 1;
  pollInterval: number;
  maxPolling: number;

  get flinksRequestId(): string {
    return this.bankingFlowService.flinksRequestId;
  }

  get includeStepper(): boolean {
    return this.bankingFlowService.applicationContext;
  }

  get includeAvailableFinancing(): boolean {
    return this.bankingFlowService.applicationContext;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private bankingFlowService: BankingFlowService,
    private bankAccountService: BankAccountService,
    private configurationService: ConfigurationService,
    private errorService: ErrorService,
    private loggingService: LoggingService,
    private merchantService: MerchantService,
    private appLoadService: AppLoadService
  ) { }

  ngOnInit(): void {
    this.bankingFlowService.setContext(this.activatedRoute.snapshot.data.context);
    this.setBankAccountLoadingStateSubscription();
    this.subscribeConnectBankManually();

    this.bankingFlowService.clearFlinksRouteCookie();
    this.startFlinksFlow();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();

    this.donePolling$.next();
    this.donePolling$.complete();
  }

  // SUBSCRIPTIONS

  private setBankAccountLoadingStateSubscription(): void {
    this.bankAccountService.bankAccountLoadingState
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(state => this.bankAccountLoadingState = state);
  }

  private subscribeConnectBankManually(): void {
    this.bankingFlowService.displayManualFormEvent
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => this.bankAccountService.setBankAccountLoadingState(BankAccountLoadingState.MANUAL));
  }

  // FLINKS CALLS

  startFlinksFlow(): void {
    this.loggingService.log({ message: 'Starting front-end Flinks flow with context: ' + this.bankingFlowService.context, severity: LogSeverity.info });
    this.setFlinksPollingConditions();
    this.determineBankAccountsState();
  }

  private clearFlinksRequestId(): void {
    this.bankingFlowService.clearFlinksRequestIdCookie();
  }

  waitForFlinks(): void {
    timer(0, this.pollInterval)
      .pipe(
        takeUntil(this.donePolling$),
        switchMap(() => this.bankAccountService.pollFlinks(this.flinksRequestId)),
      )
      .subscribe(
        (flinksPollingState: FlinksRequestResponse) => {
          const state = flinksPollingState?.data;
          if (state === FlinksPollingState.pending) {
            this.registerNextPoll();
          } else if (state === FlinksPollingState.success) {
            this.checkBankAccounts();
          } else {
            this.setFailedState();
          }
        },
        (e: ErrorResponse) => {
          this.done();
          if (e.statusCode === 422) {
            // 422 is returned for 3 cases: account_type_not_accepted (code: 40010), invalid_holder (code: 40011), and account_reconnect_mismatch (code: 40015)
            if (e.errorCode === 40015) {
              // Message for 40015 is distinct.
              this.handleError(UiError.flinksAccountReconnectMismatch); // user can try again
              this.loggingService.log(e); // do not bugsnag for this
            } else {
              // For the user perspective we handle 40010 and 40011 the same way. The user doesn't need to know the difference.
              this.bankingFlowService.showConnectionErrorModalToUpload(); // generic connection error modal and go to upload docs
              this.loggingService.log(e); // do not bugsnag for this
            }
          } else { // example possible errors: 424, 404, 408
            /* istanbul ignore next */
            Bugsnag.notify(e, event => { event.severity = BugsnagSeverity.info });


            this.bankAccountService.setBankAccountLoadingState(BankAccountLoadingState.FAILED);
          }
        }
      );
  }

  registerNextPoll(): void {
    this.pollCounter += 1;
    if (this.pollCounter > this.maxPolling) {
      this.setFailedState();
      const message = 'Flinks max polling attempts reached';
      const logMessage: LogMessage = { message: message, severity: LogSeverity.error };
      this.loggingService.log(logMessage);
    }
  }

  setFlinksPollingConditions(): void {
    this.pollInterval = this.configurationService.flinks.poll_interval;
    this.maxPolling = this.configurationService.flinks.max_polling;
  }

  // BANK ACCOUNTS

  private checkBankAccounts() {
    this.done();

    this.loadMerchantAndBankAccounts()
      .then(() => {
        if (this.bankAccountService.bankAccounts.length === 0) {
          this.loggingService.log({ message: 'Call to flinks yielded no bank accounts', severity: LogSeverity.warn });
          this.handleError(UiError.loadBankAccounts);
        } else if (!this.areBankAccountsRequired()) {
          // No need to trigger picker when merchant has bank account selected and neither SV nor insights required.
          this.bankingFlowService.triggerCompleteEvent();
        } else {
          // Trigger picker
          this.bankAccountService.setBankAccountLoadingState(BankAccountLoadingState.LOADED);
        }
      })
      .catch((e: ErrorResponse) => {
        Bugsnag.notify(e);

        this.handleError(UiError.loadBankAccounts);
      });
  }

  private async loadMerchantAndBankAccounts(): Promise<void> {
    await this.bankAccountService.loadBankAccounts().toPromise()
      .catch((err) => Promise.reject(err));
    await this.appLoadService.loadUserData().toPromise()
      .catch((err) => Promise.reject(err));

    Promise.resolve();
  }

  determineBankAccountsState(): void {
    this.bankAccountService.loadBankAccounts()
      .pipe(take(1))
      .subscribe(
        () => {
          if (this.flinksRequestId) {
            // bank accounts in process of being loaded, just wait
            this.bankAccountService.setBankAccountLoadingState(BankAccountLoadingState.LOADING);
            this.waitForFlinks();
          } else if (this.bankAccountService.owner.bankConnectionRequired()) {
            // takes precedence over anything else
            this.bankAccountService.setBankAccountLoadingState(BankAccountLoadingState.READY);
          } else if (this.areBankAccountsRequired() && this.bankAccountService.bankAccounts.length) {
            // entered flinks credentials, must prompt for select bank account (display bank account picker)
            this.bankAccountService.setBankAccountLoadingState(BankAccountLoadingState.LOADED);
          } else if (this.bankAccountService.owner.hasCompletedCYB()) {
            // Already selected a bank account - do nothing
            this.bankingFlowService.triggerCompleteEvent();
          } else {
            // first time through the flow
            this.bankAccountService.setBankAccountLoadingState(BankAccountLoadingState.READY);
          }
        },
        (e: ErrorResponse) => {
          Bugsnag.notify(e);

          this.handleError(UiError.loadBankAccounts);
        });
  }

  // DISPLAY

  displayLoading(): boolean {
    return this.bankAccountLoadingState === BankAccountLoadingState.LOADING;
  }

  displayPicker(): boolean {
    return this.bankAccountLoadingState === BankAccountLoadingState.LOADED;
  }

  displayFlinks(): boolean {
    return this.bankAccountLoadingState === BankAccountLoadingState.READY;
  }

  displayError(): boolean {
    return this.bankAccountLoadingState === BankAccountLoadingState.FAILED;
  }

  displayManualEntry(): boolean {
    return this.bankAccountLoadingState === BankAccountLoadingState.MANUAL;
  }

  handleError(err: UiError): void {
    this.bankAccountService.setBankAccountLoadingState(BankAccountLoadingState.READY);
    this.errorService.show(err);
  }

  // HELPERS
  areBankAccountsRequired(): boolean {
    if (this.bankingFlowService.context === BankingContext.insights) {
      return !this.bankAccountService.owner.areInsightsBankAccountsChosen();
    } else {

      return !this.merchantService.merchantHasSelectedBankAccount() || this.merchantService.merchantSalesVolumeRequired();
    }
  }

  private done(): void {
    this.donePolling$.next();
    this.donePolling$.complete();
    this.clearFlinksRequestId();
  }

  private setFailedState(): void {
    this.done();
    this.bankAccountService.setBankAccountLoadingState(BankAccountLoadingState.FAILED);
  }
}
