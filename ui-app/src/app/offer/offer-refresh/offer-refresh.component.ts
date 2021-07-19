import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy } from '@angular/core';
import { LogMessage, LogSeverity } from 'app/models/api-entities/log';
import { AppRoutes } from 'app/models/routes';
import { UiError } from 'app/models/ui-error';
import { OfferCtaState } from 'app/offer/offer.component';
import { ErrorService } from 'app/services/error.service';
import { LoggingService } from 'app/services/logging.service';
import { MerchantService } from 'app/services/merchant.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ztt-offer-refresh',
  templateUrl: './offer-refresh.component.html'
})
export class OfferRefreshComponent implements OnDestroy {
  @Input() offerCtaState: OfferCtaState;

  // subscriptions
  unsubscribe$ = new Subject<void>();

  constructor(
    private errorService: ErrorService,
    private loggingService: LoggingService,
    private merchantService: MerchantService,
    private stateRoutingService: StateRoutingService
  ) {
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  refreshOffers(): void {
    this.merchantService.refreshOffers$()
      .pipe(
        takeUntil(this.unsubscribe$)
      )
      .subscribe(
        () => this.stateRoutingService.navigate(AppRoutes.dashboard.root),
        (err: HttpErrorResponse) => {
          const logMessage: LogMessage = {message: `Refresh offers failed: ${err.message}`, severity: LogSeverity.warn};
          this.loggingService.log(logMessage);
          this.errorService.show(UiError.refreshOffers);
        }
      );
  }
}
