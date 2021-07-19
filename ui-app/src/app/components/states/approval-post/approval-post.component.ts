import { Component, OnInit, OnDestroy, ViewChild, Type, ComponentRef, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { LendingApplication } from 'app/models/api-entities/lending-application';
import { AppRoutes } from 'app/models/routes';
import { UiError } from 'app/models/ui-error';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { LoadingService } from 'app/services/loading.service';
import { ErrorService } from 'app/services/error.service';
import { DynamicComponentService } from 'app/services/dynamic-component.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { MerchantService } from 'app/services/merchant.service';
import { BankAccountService } from 'app/services/bank-account.service';
import { BankingFlowService, BankingContext } from 'app/services/banking-flow.service';
import { SetUpBankComponent } from 'app/components/states/set-up-bank/set-up-bank.component';
import { ApprovalPostDirective } from 'app/components/states/approval-post/approval-post.directive';
import { ReviewLendingApplicationComponent } from 'app/components/states/review-lending-application/review-lending-application.component';
import { LendingAgreementComponent } from 'app/components/states/lending-agreement/lending-agreement.component';
import Bugsnag from '@bugsnag/js';
import { ErrorResponse } from "app/models/error-response";
import { BugsnagSeverity } from 'app/models/bugsnag';

@Component({
  selector: 'ztt-approval-post',
  templateUrl: './approval-post.component.html',
  styleUrls: [ './approval-post.component.scss' ]
})
export class ApprovalPostComponent implements OnInit, OnDestroy {
  // Dynamic component to render at runtime
  @ViewChild(ApprovalPostDirective, { static: true }) private _approvalPostDirective: ApprovalPostDirective;
  componentRef: ComponentRef<any>; // eslint-disable-line

  // Lending application variables
  lendingApplication: LendingApplication;
  private _processingApplication = false;
  private _cancellingApplication = false;
  private _signatureRequired = false;

  // Event variables
  acceptApplicationEvent: Event;
  nextEvent: Event;
  cancelEvent: Event;
  backEvent: Event;

  public mainLoader: string;

  unsubscribe$ = new Subject<void>();

  get approvalPostDirective(): ApprovalPostDirective {
    return this._approvalPostDirective;
  }

  get processingApplication(): boolean {
    return this._processingApplication;
  }

  set processingApplication(value: boolean) {
    this.componentRef.instance.processingApplication = value;
    this._processingApplication = value;
  }

  get cancellingApplication(): boolean {
    return this._cancellingApplication;
  }

  set cancellingApplication(value: boolean) {
    this.componentRef.instance.cancellingApplication = value;
    this._cancellingApplication = value;
  }

  get signatureRequired(): boolean {
    return this._signatureRequired;
  }

  set signatureRequired(value: boolean) {
    this._signatureRequired = value;
  }

  constructor(
    private lendingApplicationsService: LendingApplicationsService,
    private bankingFlowService: BankingFlowService,
    private bankAccountService: BankAccountService,
    private loadingService: LoadingService,
    private errorService: ErrorService,
    private stateRouter: StateRoutingService,
    private componentLoader: DynamicComponentService,
    private merchantService: MerchantService,
    private ngZone: NgZone
  ) {
    this.mainLoader = this.loadingService.getMainLoader();
  }

  /**
   * Triggers loader, sets lending application, sets needed attributes,
   * then renders the correct component.
   */
  ngOnInit(): void {
    this.loadingService.showMainLoader();
    this.setLendingApplicationSubscription();
    this.setBankingFlowParameters();
    this.render();
  }

  /**
   * Drops live subscriptions.
   */
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.bankingFlowService.clearAttributes();
  }

  // SUBSCRIPTIONS

  /**
   * Subscribes to current application.
   */
  private setLendingApplicationSubscription(): void {
    this.lendingApplicationsService.lendingApplication$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((application: LendingApplication) => {
        this.lendingApplication = application;
        // Reset signature required when there is no application.
        (this.lendingApplication) ? this.setSignatureRequired() : this.signatureRequired = false;
      });
  }

  /**
   * Subscribes to events if they exist in component ref instance.
   * This allows child components to delegate actions to the parent based on the event.
   */
  private setComponentRefEventSubscriptions(): void {
    this.acceptApplicationEvent = this.componentRef.instance.acceptApplicationEvent;
    this.nextEvent = this.componentRef.instance.nextEvent;
    this.cancelEvent = this.componentRef.instance.cancelEvent;
    this.backEvent = this.componentRef.instance.backEvent;

    if (this.acceptApplicationEvent) {
      this.componentRef.instance.acceptApplicationEvent.subscribe(() => {
        this.acceptLendingApplication();
      });
    }

    if (this.nextEvent) {
      this.componentRef.instance.nextEvent.subscribe(() => {
        this.next();
      });
    }

    if (this.cancelEvent) {
      this.componentRef.instance.cancelEvent.subscribe(() => {
        this.processingApplication = false;
        this.cancelApplication();
      });
    }

    if (this.backEvent) {
      this.componentRef.instance.backEvent.subscribe(() => {
        this.processingApplication = false;
        this.goToReviewPage();
      });
    }
  }

  /**
   * Subscribes to events from the BankingFlow Service.
   */
  private setBankingFlowParameters(): void {
    this.bankingFlowService.setAttributes(false);

    this.bankingFlowService.completeEvent
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.goToReviewPage();
      });

    this.bankingFlowService.cancelEvent
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.goToReviewPage();
      });

    this.bankingFlowService.startEvent
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => this.startBankingFlow());
  }

  /**
   * Renders the correct dynamic component in template
   */
  private render(): void {
    this.loadingService.hideMainLoader();
    if (this.bankingFlowService.isBankFlowInProgress(BankingContext.application)) {
      this.startBankingFlow();
    } else {
      this.goToReviewPage();
    }
  }

  /**
   * Renders the correct dynamic component in template after next event is emitted
   */
  private next(): void {
    if (!this.processingApplication) {
      this.processingApplication = true;
      if (!this.merchantService.merchantHasSelectedBankAccount()) {
        this.startBankingFlow();
      } else {
        this.checkSignature();
      }
    }
  }

  /**
   * Checks if agreement needs to be signed or not. If it does, go to LendingAgreement, otherwise accept application
   */
  private checkSignature(): void {

    if (this.signatureRequired) {
      this.loadComponent(LendingAgreementComponent);
    } else {
      this.acceptLendingApplication();
    }
  }

  // UTILITY

  /**
   * Sets signature required
   */
  private setSignatureRequired(): void {
    this.signatureRequired = this.lendingApplicationsService.requiresSignature(this.lendingApplication);
  }

  // NAVIGATION UTILITY

  /**
   * Loads the SetupBank Component to start the banking flow
   */
  private startBankingFlow(): void {
    this.loadComponent(SetUpBankComponent);
  }

  /**
   * Loads the ReviewLendingApplication Component.
   */
  private goToReviewPage(): void {
    this.loadComponent(ReviewLendingApplicationComponent);
  }

  /**
   * Navigates to dashboard after cancelling the application
   */
  private back(): void {
    this.stateRouter.navigate(AppRoutes.dashboard.root);
  }

  /**
   * Navigates to completing lending application after accepting the application
   * ngZone.run required due to reauth window being outside of Angular zone when attempting to navigate
   */
  private finalize(): void {
    this.ngZone.run(() => {
      this.stateRouter.navigate(AppRoutes.application.completing_lending_application, true);
    });
  }

  // SERVICE CALLS

  /**
   * Cancels application.
   */
  private cancelApplication(): void {
    if (!this.cancellingApplication) {
      this.cancellingApplication = true;
      this.lendingApplicationsService.cancel(this.lendingApplication.id)
        .pipe(take(1))
        .subscribe(
          () => this.back(),
          (e: ErrorResponse) => {
            Bugsnag.notify(e);

            this.cancellingApplication = false;
            this.errorService.show(UiError.cancelLendingApplication);
          }
        );
    }
  }

  /**
   * Accepts application
   **/
  private acceptLendingApplication(): void {
    const id = this.lendingApplication.id;
    const payorAccountId = this.bankAccountService.selectedBankAccountId;
    this.lendingApplicationsService.accept(id, true, true, payorAccountId)
      .pipe(take(1))
      .subscribe(
        () => this.finalize(), // Note: [Graham] ಠ_ಠ
        (e: ErrorResponse) => {
          if (e.errorCode === 20004) {
            e.customSeverity = BugsnagSeverity.info;
          }

          Bugsnag.notify(e);

          this.processingApplication = false;
          this.errorService.show(UiError.acceptLendingApplication);
        });
  }

  // DYNAMIC LOADING

  /**
   * Sets the component to container ref from componentLoader service and subscribes to events from
   * child component.
   */
  private loadComponent(component: Type<any>): void { // eslint-disable-line
    this.componentLoader.viewContainerRef = this.approvalPostDirective.viewContainerRef;
    this.componentRef = this.componentLoader.loadComponent(component);
    this.setComponentRefEventSubscriptions();
  }
}
