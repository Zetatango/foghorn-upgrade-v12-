import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import Bugsnag from '@bugsnag/js';
import { TranslateService } from '@ngx-translate/core';
import { LendingAgreement } from 'app/models/api-entities/lending-agreement';
import { LendingApplication } from 'app/models/api-entities/lending-application';
import { ErrorResponse } from "app/models/error-response";
import { UiError } from 'app/models/ui-error';
import { ErrorService } from 'app/services/error.service';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { GTMEvent, LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { ReauthService } from 'app/services/reauth.service';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'ztt-lending-agreement',
  templateUrl: './lending-agreement.component.html'
})
export class LendingAgreementComponent implements OnInit, OnDestroy {
  static className = 'lending_agreement';

  currentTerms: LendingAgreement;
  lendingApplication: LendingApplication;
  loaded = false;

  private lendingApplicationSubscription$ = new Subscription();
  private currentTermsSubscription$ = new Subscription();
  private reauthSubscription$ = new Subscription();
  private _isProcessingAgreement = false;

  @Output() acceptApplicationEvent = new EventEmitter<void>();
  @Output() backEvent = new EventEmitter<void>();

  get isProcessingAgreement(): boolean {
    return this._isProcessingAgreement;
  }

  set isProcessingAgreement(signing: boolean) {
    this._isProcessingAgreement = signing;
  }

  constructor(
    private errorService: ErrorService,
    private lendingApplicationsService: LendingApplicationsService,
    private loggingService: LoggingService,
    private merchantService: MerchantService,
    private reauthService: ReauthService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadLendingApplications();
  }

  ngOnDestroy(): void {
    this.lendingApplicationSubscription$.unsubscribe();
    this.currentTermsSubscription$.unsubscribe();
    this.reauthSubscription$.unsubscribe();
  }

  // SUBSCRIPTIONS

  setLendingApplicationSubscription(): void {
    this.lendingApplicationSubscription$ = this.lendingApplicationsService.lendingApplication$
      .subscribe((lendingApplication) => {
          this.lendingApplication = lendingApplication;
          this.loadTerms();
      });
  }

  setTermsSubscription(): void {
    this.currentTermsSubscription$ = this.lendingApplicationsService.terms$
      .pipe(
        take(1)
      )
      .subscribe(
        (terms) => {
          this.loaded = true;
          this.currentTerms = terms;
        });
  }

  // SERVICE CALLS

  loadLendingApplications(): void {
    this.lendingApplicationsService.loadApplications()
      .pipe(
        take(1)
      )
      .subscribe(
        () => this.setLendingApplicationSubscription(),
        () => this.errorService.show(UiError.loadLendingApplications)
      );
  }

  loadTerms(): void {
    this.lendingApplicationsService.loadTerms(this.lendingApplication.id)
      .pipe(
        take(1)
      )
      .subscribe(
        () => this.setTermsSubscription(),
        () => this.errorService.show(UiError.general)
      );
  }

  signAgreementByReauth(): void {
    if (this.isProcessingAgreement) return;

    this.isProcessingAgreement = true;

    if (this.merchantService.isDelegatedAccessMode()) {
      this.errorService.show(UiError.delegatedMode);
      return;
    }

    this.loggingService.GTMUpdate(GTMEvent.BUTTON_CLICKED, 'Sign Agreement');

    this.reauthSubscription$ = this.reauthService.open(this.translateService.currentLang)
      .pipe(
        take(1)
      )
      .subscribe(
        (res) => {
          // Would be good to have an interface for the data, whatever the idp returns
          if (res?.status === this.reauthService.SUCCESS) {
            this.acceptLendingApplication();
          } else {
            this.isProcessingAgreement = false;
          }
        },
        (e: ErrorResponse) => {
          this.isProcessingAgreement = false;

          Bugsnag.notify(e);
          this.errorService.show(UiError.signByReauth);
        });
  }

  // NAVIGATION

  back(): void {
    this.backEvent.emit();
  }

  acceptLendingApplication(): void {
    this.acceptApplicationEvent.emit();
  }
}
