import { Component, OnInit, OnDestroy, ViewChild, ComponentRef, Type } from '@angular/core';
import { StateRoutingService } from 'app/services/state-routing.service';
import { BankAccountService } from 'app/services/bank-account.service';
import { BankingContext, BankingFlowService } from 'app/services/banking-flow.service';
import { CashFlowDirective } from 'app/components/routes/cash-flow/cash-flow.directive';
import { DynamicComponentService } from 'app/services/dynamic-component.service';
import { SetUpBankComponent } from 'app/components/states/set-up-bank/set-up-bank.component';
import { CashFlowStartComponent } from 'app/components/containers/cash-flow-start/cash-flow-start.component';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { CashFlowEndComponent } from 'app/components/containers/cash-flow-end/cash-flow-end.component';
import { MerchantService } from 'app/services/merchant.service';
import { ErrorService } from 'app/services/error.service';
import { UiError } from 'app/models/ui-error';
import { BankAccount } from 'app/models/bank-account';
import { LoggingService } from 'app/services/logging.service';
import { LogSeverity } from 'app/models/api-entities/log';
import { CashFlowManualComponent } from 'app/components/containers/cash-flow-manual/cash-flow-manual.component';
import { AppRoutes } from 'app/models/routes';
import { ErrorResponse } from "app/models/error-response";

@Component({
  selector: 'ztt-cash-flow',
  templateUrl: './cash-flow.component.html'
})
export class CashFlowComponent implements OnInit, OnDestroy {
  // Dynamic component to render at runtime
  @ViewChild(CashFlowDirective, { static: true }) private _cashFlowDirective: CashFlowDirective;
  componentRef: ComponentRef<any>; // eslint-disable-line

  private merchantbankAccount: BankAccount;
  unsubscribe$ = new Subject<void>();

  get cashFlowDirective(): CashFlowDirective {
    return this._cashFlowDirective;
  }

  constructor(private bankingFlowService: BankingFlowService,
              private bankService: BankAccountService,
              private componentLoader: DynamicComponentService,
              private errorService: ErrorService,
              private loggingService: LoggingService,
              private merchantService: MerchantService,
              private stateRouter: StateRoutingService) {
  }

  // LIFE CYCLE

  ngOnInit(): void {
    this.setComponentContainer();
    this.setBankingFlowParameters();
    this.bankService.increaseLimit = true;
    this.setMerchantBankAccountSubscription();
    this.loadMerchantBankAccount();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.bankingFlowService.clearAttributes();
  }

  // SUBSCRIPTIONS

  private setMerchantBankAccountSubscription(): void {
    this.bankService.bankAccount
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((bankAccount: BankAccount) => this.merchantbankAccount = bankAccount);
  }

  // API CALLS

  private loadMerchantBankAccount(): void {
    const ba_guid = this.merchantService.getMerchant() ? this.merchantService.getMerchant().selected_bank_account : null;
    if (ba_guid) {
      this.bankService.loadBankAccount(ba_guid)
        .pipe(take(1))
        .subscribe(
          () => this.render(),
          (err: ErrorResponse) => {
            this.loggingService.log({ message: 'Error loading bank account in cash-flow component: ' + err.message, severity: LogSeverity.warn });
            this.errorService.show(UiError.loadBankAccount);
          });
    } else {
      this.render();
    }
  }

  // RENDERING

  private render(): void {
    if (this.bankingFlowService.isBankFlowInProgress(BankingContext.cash_flow)) {
      this.loadComponent(SetUpBankComponent);
    } else if (this.merchantService.merchantHasSelectedBankAccount() && this.bankService.isBankAccountFromManual(this.merchantbankAccount)) {
      this.loadComponent(CashFlowManualComponent);
    } else {
      this.loadComponent(CashFlowStartComponent);
    }
  }

  // INITIALISATION

  private setBankingFlowParameters() {
    this.bankingFlowService.setAttributes(false);

    this.bankingFlowService.startEvent
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.loadComponent(SetUpBankComponent);
      });

    this.bankingFlowService.cancelEvent
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.stateRouter.navigate(AppRoutes.dashboard.root);
      });

    this.bankingFlowService.completeEvent
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.loadComponent(CashFlowEndComponent);
      });
  }

  private setComponentContainer(): void {
    this.componentLoader.viewContainerRef = this.cashFlowDirective.viewContainerRef;
  }

  /**
   * Sets the component to container ref from componentLoader service.
   */
  private loadComponent(component: Type<any>): void { // eslint-disable-line
    this.componentRef = this.componentLoader.loadComponent(component);
  }
}
