import { Component, OnInit, OnDestroy, ViewChild, Type, ComponentRef } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { AgreementService } from 'app/services/agreement.service';
import { BankAccountService } from 'app/services/bank-account.service';
import { LoadingService } from 'app/services/loading.service';
import { TranslateService } from '@ngx-translate/core';
import { UiError } from 'app/models/ui-error';
import { ErrorService } from 'app/services/error.service';
import { ErrorModalContext } from 'app/components/utilities/error-modal/error-modal-context';
import { DynamicComponentService } from 'app/services/dynamic-component.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { BankingFlowService, BankingContext } from 'app/services/banking-flow.service';
import { MerchantService } from 'app/services/merchant.service';
import { DirectPaymentService} from 'app/services/direct-payment.service';
import { SetUpBankComponent } from 'app/components/states/set-up-bank/set-up-bank.component';
import { DirectDebitPrerequisitesDirective } from 'app/components/states/direct-debit-prerequisites/direct-debit-prerequisites.directive';
import { ReviewDirectDebitComponent } from 'app/components/states/review-direct-debit/review-direct-debit.component';
import { PadAgreementComponent } from 'app/components/states/pad-agreement/pad-agreement.component';
import { Merchant } from 'app/models/api-entities/merchant';
import { Agreement, AgreementType } from 'app/models/agreement';
import { BankAccount } from 'app/models/bank-account';
import { AppRoutes } from 'app/models/routes';
import { ZttResponse } from 'app/models/api-entities/response';
import { ErrorMessage, ErrorResponse } from "app/models/error-response";
import Bugsnag from '@bugsnag/js';

@Component({
  selector: 'ztt-direct-debit-prerequisites',
  templateUrl: './direct-debit-prerequisites.component.html',
  styleUrls: [ './direct-debit-prerequisites.component.scss' ]
})
export class DirectDebitPrerequisitesComponent implements OnInit, OnDestroy {
  // Dynamic component to render at runtime
  @ViewChild(DirectDebitPrerequisitesDirective, { static: true }) private _directDebitPrerequisitesDirective: DirectDebitPrerequisitesDirective;
  componentRef: ComponentRef<any>; // eslint-disable-line

  private _cancellingDirectDebit = false;
  private _confirmingDirectDebit = false;

  nextEvent: Event;
  cancelEvent: Event;
  backEvent: Event;

  // Destroy object for safely unsubscribing to subscriptions
  unsubscribe$ = new Subject<void>();

  private _mainLoader: string;
  private _merchant: Merchant;
  private _agreement: Agreement;
  private _agreementRendered = false;

  // Getters

  get directDebitPrerequisitesDirective(): DirectDebitPrerequisitesDirective {
    return this._directDebitPrerequisitesDirective;
  }

  get cancellingDirectDebit(): boolean {
    return this._cancellingDirectDebit;
  }

  set cancellingDirectDebit(value: boolean) {
    // pass this to the child component - used for review
    this.componentRef.instance.cancellingDirectDebit = value;
    this._cancellingDirectDebit = value;
  }

  get confirmingDirectDebit(): boolean {
    return this._confirmingDirectDebit;
  }

  set confirmingDirectDebit(value: boolean) {
    // pass this to the child component - used for review
    this.componentRef.instance.confirmingDirectDebit = value;
    this._confirmingDirectDebit = value;
  }

  constructor(private loadingService: LoadingService,
              private translateService: TranslateService,
              private errorService: ErrorService,
              private stateRouter: StateRoutingService,
              private componentLoader: DynamicComponentService,
              private directPaymentService: DirectPaymentService,
              private merchantService: MerchantService,
              private bankingFlowService: BankingFlowService,
              private bankAccountService: BankAccountService,
              private agreementService: AgreementService) {
    this.mainLoader = this.loadingService.getMainLoader();
  }

  /**
   * Triggers loader, will set direct payment subscription
   */
  ngOnInit(): void {
    this.loadingService.showMainLoader();
    this.merchant = this.merchantService.getMerchant();
    this.setAttributes();
    this.loadPadAgreement();
  }

  /**
   * Drops live subscriptions.
   */
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.bankingFlowService.clearAttributes();
  }

  /**
   * Sets attributes needed for execution of the component.
   * - direct payment state: dictates child component to trigger
   * - componentLoad.viewContainerRef: dictates the reference on which to attach child
   *   component (<ng-template zttDirectDebitPrerequisites></ng-template>)
   * - calls setBankingFlowParameters()
   */
  private setAttributes(): void {
    this.componentLoader.viewContainerRef = this.directDebitPrerequisitesDirective.viewContainerRef;
    this.setBankingFlowParameters();
  }

  private loadPadAgreement(): void {
    this.agreementService.loadAgreementByType(this.merchant.id, AgreementType.pre_authorized_debit, false)
      .pipe(takeUntil(this.unsubscribe$)).subscribe(
        () => {
          this.setAgreementSubscription();
        },
        (e: ErrorResponse) => {
          Bugsnag.notify(e);

          this.errorService.show(UiError.getAgreement);
        }
      );
  }

  private loadBankAccount(): Observable<ZttResponse<BankAccount>> {
    const bankAccountId = this.merchantService.getMerchant().selected_bank_account;
    return this.bankAccountService.loadBankAccount(bankAccountId);
  }

  // SUBSCRIPTIONS

  private setAgreementSubscription(): void {
    this.agreementService.agreementSubject.pipe(takeUntil(this.unsubscribe$)).subscribe((agreement: Agreement) => {
      // Only set the agreement if it is of type PAD and is for the current merchant user
      if (this.isPadAgreementForCurrentMerchant(agreement)) {
        this.agreement = agreement;
      }
      // Only render the agreement if it has not been rendered
      if (!this.agreementRendered) this.render();
    });
  }

  /**
   * Subscribes to events if they exist in component ref instance.
   * This allows child components to delegate actions to the parent based on the event.
   */
  private setComponentRefEventSubscriptions(): void {

    if (this.componentRef.instance.nextEvent) {
      this.componentRef.instance.nextEvent.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
        this.next();
      });
    }

    if (this.componentRef.instance.cancelEvent) {
      this.componentRef.instance.cancelEvent.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
        this.cancelDirectDebitPayment();
      });
    }

    if (this.componentRef.instance.backEvent) {
      this.componentRef.instance.backEvent.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
        this.cancelDirectDebitPayment();
      });
    }
  }
  // SERVICE CALLS

  /**
   * Sets required parameters to invoke the banking flow
   */
  private setBankingFlowParameters(): void {
    this.bankingFlowService.setAttributes(false);

    this.bankingFlowService.cancelEvent.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.cancelDirectDebitPayment();
    });

    this.bankingFlowService.completeEvent.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.updateDirectPayment();
    });
  }

  private cancelDirectDebitPayment(): void {
    if (!this.cancellingDirectDebit) {
      this.cancellingDirectDebit = true;
      this.goToDashboard();
    }
  }

  /**
   * Navigates to completing/cancelling direct debit
   */
  private goToDashboard(): void {
    this.directPaymentService.reviewed = false;
    this.stateRouter.navigate(AppRoutes.dashboard.root);
  }

  // RENDERING

  private updateDirectPayment(): void {
    try {
      this.directPaymentService.refreshDirectPayment();
      this.render();
    } catch (e) {
      Bugsnag.notify(new ErrorMessage(`Error refreshing direct debit information: ${e}`));
    }
  }
  /**
   * Renders dynamic component in template. The logic is as follows:
   *
   * 1. If merchant has no selected bank account loads setup bank component
   * 2. Else currently goes loads the component dictated by getComponent call
   */
  private render(): void {
    this.loadingService.hideMainLoader();
    if (this.bankingFlowService.isBankFlowInProgress(BankingContext.direct_debit)) {
      this.loadComponent(SetUpBankComponent);
    } else {
      if (!this.merchantService.merchantHasSelectedBankAccount()) {
        this.loadComponent(SetUpBankComponent);
      } else {
        this.loadBankAccount().pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
          const bankAccount = this.bankAccountService.bankAccount.getValue();
          if (this.bankAccountService.isBankAccountVerified(bankAccount)) {
            if (!this.directPaymentService.reviewed) {
              this.loadComponent(ReviewDirectDebitComponent);
            } else {
              if (this.agreement && this.agreement.accepted_at && !this.agreement.opt_out_at) {
                this.confirmDirectDebitPayment();
              } else {
                this.agreementRendered = true;
                this.loadComponent(PadAgreementComponent);
              }
            }
          } else {
            const context: ErrorModalContext = new ErrorModalContext(
              'PENDING_BANK_ACCOUNT_VERIFICATION.TITLE',
              [
                this.translateService.instant('PENDING_BANK_ACCOUNT_VERIFICATION.BODY_1'),
                this.translateService.instant('PENDING_BANK_ACCOUNT_VERIFICATION.BODY_2')
              ]
            );
            this.errorService.show(UiError.general, context);
            this.stateRouter.navigate(AppRoutes.dashboard.root);
          }
        }, () => {
          Bugsnag.notify(new ErrorMessage('Error loading bank account.'));

          this.errorService.show(UiError.general);
          this.stateRouter.navigate(AppRoutes.dashboard.root);
        });
      }
    }
  }

  private confirmDirectDebitPayment(): void {
    if (!this.confirmingDirectDebit) {
      this.confirmingDirectDebit = true;
      this.directPaymentService.postDirectPayment()
      .pipe(
        finalize(() => this.goToDashboard()),
        takeUntil(this.unsubscribe$)
      )
      .subscribe({
        error: (e: ErrorResponse) => {
          Bugsnag.notify(e);

          this.errorService.show(UiError.general);
        }
      });
    }
  }


  /**
   * Renders the correct dynamic component in template after next event is emitted
   */
  private next(): void {
    this.render();
  }

  // UTILITY

  /**
   * Sets the component to container ref from componentLoader service.
   *
   */
  private loadComponent(component: Type<any>): void { // eslint-disable-line
    this.componentRef = this.componentLoader.loadComponent(component);
    this.setComponentRefEventSubscriptions();
  }

  private isPadAgreementForCurrentMerchant(agreement: Agreement): boolean {
    return agreement && agreement.type === AgreementType.pre_authorized_debit && agreement.merchant_id === this.merchant.id;
  }

  // HELPER

  get mainLoader(): string {
    return this._mainLoader;
  }

  set mainLoader(value: string) {
    this._mainLoader = value;
  }

  get merchant(): Merchant {
    return this._merchant;
  }

  set merchant(value: Merchant) {
    this._merchant = value;
  }

  set agreement(value: Agreement) {
    this._agreement = value;
  }

  get agreement(): Agreement {
    return this._agreement;
  }

  get agreementRendered(): boolean {
    return this._agreementRendered;
  }

  set agreementRendered(value: boolean) {
    this._agreementRendered = value;
  }
}
