import { Component, ComponentRef, OnDestroy, OnInit, Type, ViewChild } from '@angular/core';
import { PreAuthorizedFinancingDirective } from './pre-authorized-financing.directive';
import { LoadingService } from 'app/services/loading.service';
import { DynamicComponentService } from 'app/services/dynamic-component.service';
import { BankingContext, BankingFlowService } from 'app/services/banking-flow.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppRoutes } from 'app/models/routes';
import { SetUpBankComponent } from 'app/components/states/set-up-bank/set-up-bank.component';
import { MerchantService } from 'app/services/merchant.service';
import { Agreement, AgreementType } from 'app/models/agreement';
import { AgreementService } from 'app/services/agreement.service';
import { BankAccountService } from 'app/services/bank-account.service';
import { BankAccount } from 'app/models/bank-account';
import { ErrorModalContext } from 'app/components/utilities/error-modal/error-modal-context';
import { TranslateService } from '@ngx-translate/core';
import { ErrorService } from 'app/services/error.service';
import { UiError } from 'app/models/ui-error';
import { PafAgreementComponent } from 'app/components/states/paf-agreement/paf-agreement.component';
import { SupplierService } from 'app/services/supplier.service';
import { Merchant } from 'app/models/api-entities/merchant';
import { ZttResponse } from 'app/models/api-entities/response';
import { ErrorResponse } from "app/models/error-response";
import Bugsnag from '@bugsnag/js';

@Component({
  selector: 'ztt-pre-authorized-financing-prerequisites',
  templateUrl: './pre-authorized-financing-prerequisites.component.html',
  styleUrls: ['./pre-authorized-financing-prerequisites.component.scss']
})
export class PreAuthorizedFinancingPrerequisitesComponent implements OnInit, OnDestroy {
  // Dynamic component to render at runtime
  @ViewChild(PreAuthorizedFinancingDirective, { static: true }) private _preAuthorizedFinancingDirective: PreAuthorizedFinancingDirective;
  componentRef: ComponentRef<any>; // eslint-disable-line
  private _agreement: Agreement;
  private _merchant: Merchant;
  private _supplierId: string;

  // Destroy object for safely unsubscribing to subscriptions
  unsubscribe$ = new Subject<void>();
  private _mainLoader: string;
  private _agreementRendered = false;

  // Getters

  get preAuthorizedFinancingDirective(): PreAuthorizedFinancingDirective {
    return this._preAuthorizedFinancingDirective;
  }

  constructor(private loadingService: LoadingService,
              private translateService: TranslateService,
              private componentLoader: DynamicComponentService,
              private bankingFlowService: BankingFlowService,
              private stateRouter: StateRoutingService,
              private merchantService: MerchantService,
              private agreementService: AgreementService,
              private bankAccountService: BankAccountService,
              private errorService: ErrorService,
              private supplierService: SupplierService) {
    this.mainLoader = this.loadingService.getMainLoader();
  }

  ngOnInit(): void {
    this.loadingService.showMainLoader();
    this.merchant = this.merchantService.getMerchant();
    this.supplierId = this.supplierService.getSelectedSupplierIdForMerchant(this.merchant.id);
    this.setAttributes();
    this.loadPafAgreement();
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
   * - componentLoad.viewContainerRef: dictates the reference on which to attach child
   *   component (<ng-template zttpreAuthorizedFinancingDirective></ng-template>)
   * - calls setBankingFlowParameters()
   */
  private setAttributes(): void {
    this.componentLoader.viewContainerRef = this.preAuthorizedFinancingDirective.viewContainerRef;
    this.setBankingFlowParameters();
  }

  // SUBSCRIPTIONS

  private setAgreementSubscription(): void {
    this.agreementService.agreementSubject.pipe(takeUntil(this.unsubscribe$)).subscribe((agreement: Agreement) => {
      // Only set the agreement if it is of type PAF and is for the current merchant user
      if (this.isPafAgreementForCurrentMerchant(agreement)) {
        this.agreement = agreement;
      }
      // Only render the agreement if it has not been rendered
      if (!this.agreementRendered) {
        this.render();
      }
    });
  }

  private loadPafAgreement(): void {
    this.agreementService.loadAgreementByType(this.merchant.id, AgreementType.pre_authorized_financing, false, this.supplierId).pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        () => {
          this.setAgreementSubscription(); // Only set the agreement here so we don't show agreement text for a previously loaded agreement
        },
        (e: ErrorResponse) => {
          Bugsnag.notify(e);
          this.errorService.show(UiError.getAgreement);
        });
  }

  // SERVICE CALLS

  /**
   * Sets required parameters to invoke the banking flow
   */
  private setBankingFlowParameters(): void {
    this.bankingFlowService.setAttributes(false);

    this.bankingFlowService.cancelEvent.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.finalize();
    });

    this.bankingFlowService.completeEvent.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.updatePreAuthorizedFinancingSignUp();
    });
  }

  // RENDERING

  private updatePreAuthorizedFinancingSignUp(): void {
    this.render();
  }
  /**
   * Renders dynamic component in template. The logic is as follows:
   *
   * 1. If merchant has no selected bank account loads setup bank component
   * 2. If merchant has selected a verified bank account, show PAF
   * 3. If merchant has selected an unverified bank account, go to dashboard
   */
  private render(): void {
    this.loadingService.hideMainLoader();
    if (!this.bankFlowCompleted()) {
      this.loadComponent(SetUpBankComponent);
    } else {
      this.loadBankAccount().pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
        const bankAccount = this.bankAccountService.bankAccount.getValue();
        if (this.bankAccountService.isBankAccountVerified(bankAccount)) {
          if (!this.agreement || !this.agreement.accepted_at || this.agreement.opt_out_at) {
            this.agreementRendered = true;
            this.loadComponent(PafAgreementComponent);
          } else {
            this.stateRouter.navigate(AppRoutes.dashboard.root);
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
        this.errorService.show(UiError.general);
        this.stateRouter.navigate(AppRoutes.dashboard.root);
      });
    }
  }

  // UTILITY

  private bankFlowCompleted(): boolean {
    return !this.bankingFlowService.isBankFlowInProgress(BankingContext.pre_authorized_financing) && this.merchantService.merchantHasSelectedBankAccount();
  }

  private loadBankAccount(): Observable<ZttResponse<BankAccount>> {
    const bankAccountId = this.merchantService.getMerchant().selected_bank_account;
    return this.bankAccountService.loadBankAccount(bankAccountId);
  }

  set agreement(value: Agreement) {
    this._agreement = value;
  }

  get agreement(): Agreement {
    return this._agreement;
  }

  /**
   * Sets the component to container ref from componentLoader service.
   *
   */
  private loadComponent(component: Type<any>): void { // eslint-disable-line
    this.componentRef = this.componentLoader.loadComponent(component);
    this.setComponentRefEventSubscriptions();
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

    if (this.componentRef.instance.backEvent) {
      this.componentRef.instance.backEvent.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
        this.finalize();
      });
    }
  }

  private isPafAgreementForCurrentMerchant(agreement: Agreement): boolean {
    return agreement && agreement.type === AgreementType.pre_authorized_financing && agreement.merchant_id === this.merchant.id;
  }

  /**
   * Renders the correct dynamic component in template after next event is emitted
   */
  private next(): void {
    this.render();
  }

  /**
   * Navigates to dashboard
   */
  private finalize(): void {
    this.stateRouter.navigate(AppRoutes.dashboard.root);
  }

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

  get supplierId(): string {
    return this._supplierId;
  }

  set supplierId(value: string) {
    this._supplierId = value;
  }

  get agreementRendered(): boolean {
    return this._agreementRendered;
  }

  set agreementRendered(value: boolean) {
    this._agreementRendered = value;
  }
}
