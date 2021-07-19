import { Component, OnInit, ViewChild, OnDestroy, TemplateRef, NgZone } from '@angular/core';
import { BsModalService, ModalOptions, BsModalRef } from 'ngx-bootstrap/modal';

import { MerchantService } from 'app/services/merchant.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { ErrorService } from 'app/services/error.service';
import { LoggingService } from 'app/services/logging.service';
import { ErrorModalContext } from 'app/components/utilities/error-modal/error-modal-context';

import { UiError } from 'app/models/ui-error';

import { CONSTANTS } from 'app/constants';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ztt-error-modal',
  templateUrl: './error-modal.component.html'
})
export class ErrorModalComponent implements OnInit, OnDestroy {
  public static DEFAULT_CONTEXT: ErrorModalContext = new ErrorModalContext(
    'ERROR_MODAL.GENERIC.HEADING',
    [
      'ERROR_MODAL.GENERIC.BODY_MESSAGE1',
      'ERROR_MODAL.GENERIC.BODY_MESSAGE2'
    ]
  );

  @ViewChild('template', { static: true }) template: TemplateRef<any>; // eslint-disable-line
  UiError = UiError; // To make type enum accessible in template expressions
  error: UiError;
  context: ErrorModalContext;
  modalRef: BsModalRef;
  defaultModalOptions: ModalOptions = {
    // TODO: [Graham] make styling more visible by moving it to the template.
    class: 'error-modal modal-dialog-centered'
  };
  logoutUrl: string;
  accountInfoUrl: string;
  merchantName: string;
  unsubscribe$ = new Subject<void>();

  // UI flags
  btnActionDisabled = false;

  constructor(
    private merchantService: MerchantService,
    private modalService: BsModalService,
    private stateRouterService: StateRoutingService,
    private errorService: ErrorService,
    private loggingService: LoggingService,
    private _ngZone: NgZone
  ) {}

  // LIFE CYCLE

  ngOnInit(): void {
    this.errorService.registerInstance(this);
    this.logoutUrl = this.merchantService.logoutUrl;
    this.accountInfoUrl = this.merchantService.accountInfoUrl;
    this.merchantService.merchantObs.subscribe((merchant) => this.merchantName = merchant?.name);
  }

  ngOnDestroy(): void {
    this.errorService.removeInstances();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  // PUBLIC HELPERS

  show(error: UiError, context: ErrorModalContext = ErrorModalComponent.DEFAULT_CONTEXT): void {
    this.btnActionDisabled = false;
    this.error = error;
    this.context = context;

    this._ngZone.run(() => {
      setTimeout(() => {
        this.modalRef = this.modalService.show(this.template, this.getModalOptions(error));
      });
    });

    this.modalService.onHidden.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.hide();

      if (context.route_destination) this.stateRouterService.navigate(context.route_destination, context.skipLocationChange);
    });
  }

  hide(): void {
    this.btnActionDisabled = true;
    this.modalRef.hide();
  }

  intercomShow(): void {
    this.loggingService.intercomShow();
    this.hide();
  }

  redirectToSignIn(): void {
    this.btnActionDisabled = true;
    this.stateRouterService.performRedirect(CONSTANTS.UNAUTHORIZED_REDIRECT_LOGIN_URL);
  }

  getModalOptions(error: UiError): ModalOptions {
    if (error === UiError.sessionExpired) {
      Object.assign(this.defaultModalOptions, { backdrop : 'static', keyboard : false });
    }

    return this.defaultModalOptions;
  }

  isDelegatedAccessMode(): boolean {
    return this.merchantService.isDelegatedAccessMode();
  }
}
