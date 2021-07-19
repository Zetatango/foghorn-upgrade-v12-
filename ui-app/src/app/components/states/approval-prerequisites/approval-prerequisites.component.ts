import { Component, OnInit, OnDestroy, ViewChild, Type, ComponentRef } from '@angular/core';
import { Subject } from 'rxjs';
import { take, takeUntil, finalize } from 'rxjs/operators';
import { LendingApplication } from 'app/models/api-entities/lending-application';
import { ApplicationState } from 'app/models/api-entities/utility';
import { DocumentCode, SUPPORTED_DOC_CODES } from 'app/models/api-entities/merchant-document-status';
import { AppRoutes } from 'app/models/routes';
import { UiError } from 'app/models/ui-error';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { OfferService } from 'app/services/offer.service';
import { LoadingService } from 'app/services/loading.service';
import { ErrorService } from 'app/services/error.service';
import { DynamicComponentService } from 'app/services/dynamic-component.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { LoggingService } from 'app/services/logging.service';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { MerchantService } from 'app/services/merchant.service';
import { SetUpBankComponent } from 'app/components/states/set-up-bank/set-up-bank.component';
import { ApprovalPrerequisitesDirective } from 'app/components/states/approval-prerequisites/approval-prerequisites.directive';
import { UploadDocumentsComponent } from 'app/components/containers/upload-documents/upload-documents.component';
import { ApprovalPendingComponent } from 'app/components/containers/approval-pending/approval-pending.component';
import { AddGuarantorComponent } from 'app/components/states/add-guarantor/add-guarantor.component';
import Bugsnag from '@bugsnag/js';
import { ErrorMessage, ErrorResponse } from "app/models/error-response";

@Component({
  selector: 'ztt-approval-prerequisites',
  templateUrl: './approval-prerequisites.component.html'
})
export class ApprovalPrerequisitesComponent implements OnInit, OnDestroy {
  unsubscribe$ = new Subject<void>();

  // Dynamic component to render at runtime
  @ViewChild(ApprovalPrerequisitesDirective, { static: true })
  private _approvalPrerequisitesDirective: ApprovalPrerequisitesDirective;

  // component variables
  mainLoader: string;

  private _componentRef: ComponentRef<any>; // eslint-disable-line
  private _lendingApplication: LendingApplication;
  private _applicationState: ApplicationState;
  private _cancellingApplication = false;
  private _skipBankingFlow = false;

  // Getters & Setters

  get approvalPrerequisitesDirective(): ApprovalPrerequisitesDirective {
    return this._approvalPrerequisitesDirective;
  }

  get skipBankingFlow(): boolean {
    return this._skipBankingFlow;
  }
  set skipBankingFlow(value: boolean) {
    this._skipBankingFlow = value;
  }

  get cancellingApplication(): boolean {
    return this._cancellingApplication;
  }
  set cancellingApplication(value: boolean)  {
    this._cancellingApplication = value;
  }

  constructor(
    private lendingApplicationsService: LendingApplicationsService,
    private offerService: OfferService,
    private loadingService: LoadingService,
    private errorService: ErrorService,
    private stateRouter: StateRoutingService,
    private componentLoader: DynamicComponentService,
    private loggingService: LoggingService,
    private merchantService: MerchantService,
    private bankingFlowService: BankingFlowService
  ) {
    this.mainLoader = this.loadingService.getMainLoader();
  }

  /**
   * Triggers loader, sets lending application and offer subscriptions, sets needed attributes,
   * then renders the correct component.
   */
  ngOnInit(): void {
    this.loadingService.showMainLoader();
    this.setLendingApplicationSubscription();
    this.setAttributes();
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

  /**
   * Sets attributes needed for execution of the component.
   * - applicationState: dictates child component to trigger
   * - componentLoad.viewContainerRef: dictates the reference on which to attach child
   *   component (<ng-template zttApprovalPrerequisites></ng-template>)
   * - calls setBankingFlowParameters()
   */
  private setAttributes(): void {
    this._applicationState = this._lendingApplication ? this._lendingApplication.state : null;
    this.componentLoader.viewContainerRef = this.approvalPrerequisitesDirective.viewContainerRef;
    this.setBankingFlowParameters();
  }

  // SUBSCRIPTIONS

  /**
   * Subscribes to current application.
   */
  // TODO: [Graham] remove/refactor this subscription/service.
  private setLendingApplicationSubscription(): void {
    this.lendingApplicationsService.lendingApplication$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((application: LendingApplication) => this._lendingApplication = application);
  }

  // SERVICE CALLS

  /**
   * Sets required parameters to invoke the banking flow
   */
  private setBankingFlowParameters(): void {
    this.bankingFlowService.setAttributes(false);

    this.bankingFlowService.cancelEvent
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.cancelApplication();
      });

    this.bankingFlowService.skipEvent
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.skipBankingFlow = true;
        this.render();
      });

    this.bankingFlowService.completeEvent
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        this.render();
      });
  }

  // SERVICE CALLS

  /**
   * Cancels application.
   */
  private cancelApplication(): void {
    if (!this.cancellingApplication) {
      this.cancellingApplication = true;
      this.lendingApplicationsService.cancel(this._lendingApplication.id)
        .pipe(take(1), finalize(() => this.cancellingApplication = false))
        .subscribe(
          () => this.stateRouter.navigate(AppRoutes.dashboard.root),
          (e: ErrorResponse) => {
            Bugsnag.notify(e);
            this.errorService.show(UiError.cancelLendingApplication);
          }
        );
    }
  }

  // RENDERING

  /**
   * Renders dynamic component in template. The logic is as follows:
   *
   * 1. If merchant has no selected bank account and is not skipping the flow, loads setupbank component with ability to skip enabled
   * 2. Else if the application has been approved, loads lending application flow component to handle the flow
   * 3. Else if merchant has a selected bank account and application has not yet been approved, finds correct next step based on state of application
   */
  private render(): void {
    this.loadingService.hideMainLoader();
    if (!this.merchantService.merchantHasSelectedBankAccount() && !this.skipBankingFlow) {
      this.loadComponent(SetUpBankComponent);
    } else if (this.lendingApplicationsService.applicationApproved(this._lendingApplication)) {
      this.stateRouter.navigate(AppRoutes.application.approval_post, true);
    } else {
      const component = this.getComponent();
      if (component) {
        this.loadComponent(component);
      } else {
        this.errorService.show(UiError.general);
      }
    }
  }

  // UTILITY

  /**
   * Returns component to display based on application state.
   * 1. If state is waiting_for_documents, render UploadDocumentsComponent
   * 2. If state is reviewing, render ApprovalPendingComponent
   * 3. Else return null, log warning, and throw bugsnag because no component could be derived from application state
   */
  private getComponent(): Type<any> { // eslint-disable-line
    switch (this._applicationState) {
      case ApplicationState.waiting_for_documents:
        this.checkDocuments();
        return UploadDocumentsComponent;
      case ApplicationState.reviewing:
        if (this._lendingApplication.requires_guarantor === true) {
          return AddGuarantorComponent;
        }
        return ApprovalPendingComponent;
      default:
        Bugsnag.notify(new ErrorMessage(`Could not decipher component from application state: ${this._applicationState}`));
    }
  }

  /**
   * Generates a log and console warn if unsupported documents have been configured.
   */
  private checkDocuments(): void {
    const docs = this.lendingApplicationsService.getRequiredDocuments(this._lendingApplication);

    docs.forEach((doc: DocumentCode) => {
      if (!SUPPORTED_DOC_CODES.includes(doc)) {
        this.loggingService.log(new ErrorMessage(`Unsupported required document detected: ${doc}`));
      }
    });
  }

  /**
   * Sets the component to container ref from componentLoader service.
   *
   */
  private loadComponent(component: Type<any>): void { // eslint-disable-line
    this._componentRef = this.componentLoader.loadComponent(component);
  }
}
