import { Component, OnDestroy, OnInit } from '@angular/core';
import { LogMessage, LogSeverity } from 'app/models/api-entities/log';
import { OfferState } from 'app/models/api-entities/utility';
import { AppRoutes } from 'app/models/routes';
import { UiError } from 'app/models/ui-error';
import { ErrorService } from 'app/services/error.service';
import { LoggingService } from 'app/services/logging.service';
import { OfferService } from 'app/services/offer.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { defer, Subject, throwError } from 'rxjs';
import { catchError, delay, map, repeatWhen, retry, takeUntil, takeWhile, timeout } from 'rxjs/operators'

@Component({
  selector: 'ztt-offer-processing',
  templateUrl: './offer-processing.component.html'
})
export class OfferProcessingComponent implements OnInit, OnDestroy {
  unsubscribe$ = new Subject<void>();

  constructor(
    private errorService: ErrorService,
    private loggingService: LoggingService,
    private offerService: OfferService,
    private stateRoutingService: StateRoutingService
  ) {
  }

  ngOnInit(): void {
    this.pollForOfferState();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private pollForOfferState(): void {
    defer(() => this.offerService.loadOffers$()
      .pipe(
        timeout(30000),
        catchError(err => {
          const logMessage: LogMessage = {message: `Load offers failed: ${err.message}`, severity: LogSeverity.warn};
          this.loggingService.log(logMessage);

          return throwError(err);
        }),
        map(() => this.offerService.locOffer?.state ?? OfferState.processing),
        takeUntil(this.unsubscribe$)
      )
    )
      .pipe(
        repeatWhen(notifications => notifications.pipe(delay(5000))),
        takeWhile((offerState) => this.isOfferProcessing(offerState), true)
      )
      .pipe(retry(2))
      .subscribe(
        (offerState) => this.completedPolling(offerState),
        (err: Error) => {
          const logMessage: LogMessage = {
            message: `Polling for offers failed: ${err.message}`,
            severity: LogSeverity.warn
          };
          this.loggingService.log(logMessage);
          this.errorService.show(UiError.getOffers); // Note: [Graham] change to loadOffers.
        }
      );
  }

  private isOfferProcessing(offerState: OfferState): boolean {
    return offerState === OfferState.processing;
  }

  private completedPolling(offerState: OfferState): void {
    if (!this.isOfferProcessing(offerState)) {
      this.stateRoutingService.navigate(AppRoutes.dashboard.root);
    }
  }
}
