import { Component, OnDestroy, OnInit } from '@angular/core';
import Bugsnag from '@bugsnag/js';
import { LENDING_OFFERS_POLLING } from 'app/constants';
import { COMPLETED_APP_STATES, DECLINED_APP_STATES, FAILED_APP_STATES, LendingApplication, COMPLETING_APP_STATES } from 'app/models/api-entities/lending-application';
import { LogSeverity } from 'app/models/api-entities/log';
import { ErrorMessage } from 'app/models/error-response';
import { RetryConfig } from 'app/models/api-entities/utility';
import { AppRoutes } from 'app/models/routes';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { LoggingService } from 'app/services/logging.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { Subject } from 'rxjs';

import { take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ztt-completing-lending-application',
  templateUrl: './completing-lending-application.component.html'
})
export class CompletingLendingApplicationComponent implements OnInit, OnDestroy {
  isCompletingApplication = false;
  backoffConfig: RetryConfig;
  unsubscribe$ = new Subject<void>();
  private lendingApplication: LendingApplication;

  constructor(private lendingApplicationsService: LendingApplicationsService,
              private loggingService: LoggingService,
              private stateRouter: StateRoutingService) {
    // Initialize backoffConfig for Offer polling.
    this.backoffConfig = {
      initialInterval: LENDING_OFFERS_POLLING.INITIAL_INTERVAL,
      maxAttempts: LENDING_OFFERS_POLLING.MAX_ATTEMPTS,
      retryCounter: 0
    };
  }

  ngOnInit(): void {
    this.setLendingApplicationSubscription();
    this.pollForLendingApplication();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();

    // Clear last backoff time-out in case not completed
    clearTimeout(this.backoffConfig.timeoutId);
  }

  pollForLendingApplication(): void {
    if (this.lendingApplication) {
      this.lendingApplicationsService.loadApplication(this.lendingApplication.id).pipe(take(1)).subscribe(() => {
        if (FAILED_APP_STATES.includes(this.lendingApplication.state)) {
          this.stateRouter.navigate(AppRoutes.error.kyc_failed, true);
        } else if (DECLINED_APP_STATES.includes(this.lendingApplication.state)) {
          this.stateRouter.navigate(AppRoutes.application.lending_application_declined, true);
        } else if (COMPLETED_APP_STATES.includes(this.lendingApplication.state)) {
          this.stateRouter.navigate(AppRoutes.dashboard.root);
        } else if (COMPLETING_APP_STATES.includes(this.lendingApplication.state)) {
          this.isCompletingApplication = true;
        } else {
          this.registerNextPollForLendingApplication();
        }
      });
    } else {
      Bugsnag.notify(new ErrorMessage('Invalid state when trying to complete application: application is not set, returning to dashboard'));

      this.stateRouter.navigate(AppRoutes.dashboard.root);
    }
  }

  registerNextPollForLendingApplication(): void {
    if (this.backoffConfig.retryCounter < this.backoffConfig.maxAttempts) {
      this.backoffConfig.timeoutId = setTimeout(() => this.pollForLendingApplication(),
        this.calculateNextInterval()
      );

      this.backoffConfig.retryCounter++;
    } else {
      this.loggingService.log({
        message: `Automated polling lending applications is now disabled after ${this.backoffConfig.maxAttempts} tries.`,
        severity: LogSeverity.warn
      });
    }
  }

  calculateNextInterval(): number {
    // Calculate next backed-off interval using an exponential basis.
    const exponentialBasis = LENDING_OFFERS_POLLING.EXPONENTIAL_BASIS;
    const delayFactor = Math.pow(exponentialBasis, this.backoffConfig.retryCounter);

    return delayFactor * this.backoffConfig.initialInterval;
  }

  private setLendingApplicationSubscription(): void {
    this.lendingApplicationsService.lendingApplication$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((application: LendingApplication) => this.lendingApplication = application);
  }

  get dashboardRouterLink(): string {
    return AppRoutes.dashboard.root_link;
  }

  get iconClass(): string {
    return this.isCompletingApplication ? 'fa-check-circle' : 'fa-circle-notch fa-spin';
  }
}
