import { Component, OnDestroy, OnInit } from '@angular/core';
import { GTMEvent, LoggingService } from 'app/services/logging.service';
import { Subject } from 'rxjs';
import { ErrorService } from 'app/services/error.service';
import { UiError } from 'app/models/ui-error';
import { SocialConnectionsService } from 'app/services/social-connections.service';
import { FacebookSocialConnectionState, SocialConnections } from 'app/models/api-entities/social-connections';
import { FacebookService } from 'app/services/facebook.service';
import { UiAlert, UiAlertStatus } from 'app/models/ui-alerts';
import { take, takeUntil } from 'rxjs/operators';
import { OmniauthFlowResponse } from 'app/models/api-entities/omniauth-flow-response';
import Bugsnag from '@bugsnag/js';
import { ErrorResponse } from "app/models/error-response";

@Component({
  selector: 'ztt-social-connections',
  templateUrl: './social-connections.component.html'
})

export class SocialConnectionsComponent implements OnDestroy, OnInit {
  unsubscribe$ = new Subject<void>();

  alerts: UiAlert[] = [];
  private _socialConnections: SocialConnections = null;

  constructor(
    private _loggingService: LoggingService,
    private _socialConnectionsService: SocialConnectionsService,
    private _errorService: ErrorService,
    private _facebookService: FacebookService
  ) {}

  ngOnInit(): void {
    this.subscribeToSocialConnections();
    this.loadSocialConnections();

    this._facebookService.receiveConnectedEvent
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
        (flowResponse: OmniauthFlowResponse) => {
          this.receiveFacebookConnectedEvent(flowResponse.status === true);
        },
        () => {
          this.receiveFacebookConnectedEvent(false);
        });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private subscribeToSocialConnections(): void {
    this._socialConnectionsService.getSocialConnections()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(
      (socialConnections: SocialConnections) => {
        this._socialConnections = socialConnections;
      });
  }

  private loadSocialConnections(): void {
    this._socialConnectionsService.loadSocialConnections()
      .pipe(take(1))
      .subscribe({
        error: (e: ErrorResponse) => {
          Bugsnag.notify(e);

          this._errorService.show(UiError.failedToLoadSocialConnections);
        }
      });
  }

  get facebookStatus(): FacebookSocialConnectionState {
    if (!this._socialConnections || !this._socialConnections.facebook) {
      return FacebookSocialConnectionState.unknown;
    }

    return this._socialConnections.facebook.state;
  }

  get facebookStatusDisplay(): string {
    return this._facebookService.translateFacebookSocialConnectionState(this.facebookStatus);
  }

  connectFacebook(): void {
    this._loggingService.GTMUpdate(GTMEvent.BUTTON_CLICKED, 'Connect to Facebook');
    this._facebookService.initiateAuthFlow();
  }

  private receiveFacebookConnectedEvent(isSuccessful: boolean): void {
    this.alerts.push({
      type: isSuccessful ? UiAlertStatus.success : UiAlertStatus.danger,
      msg: isSuccessful ? 'SOCIAL_CONNECTIONS.FACEBOOK.CONNECT_SUCCESS' : 'SOCIAL_CONNECTIONS.FACEBOOK.CONNECT_FAIL',
      timeout: 5000
    });

    if (isSuccessful) this.loadSocialConnections();
  }

  onClosed(dismissedAlert: UiAlert): void {
    this.alerts = (this.alerts || []).filter(alert => alert !== dismissedAlert);
  }
}
