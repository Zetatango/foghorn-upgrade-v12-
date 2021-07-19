import { Injectable, NgZone } from '@angular/core';
import { Observable, Observer, Subject, Subscription } from 'rxjs';
import { OMNIAUTH_PROVIDER_CONNECT } from 'app/constants';
import { OmniauthProviderConnectEvent } from 'app/models/omniauth-provider-connect-events';
import { finalize, takeUntil } from 'rxjs/operators';
import { OmniauthProviderHttpResponse } from 'app/models/api-entities/http-response';
import { LoggingService } from './logging.service';
import { LogMessage, LogSeverity } from 'app/models/api-entities/log';
import { OmniauthFlowResponse } from 'app/models/api-entities/omniauth-flow-response';

@Injectable()
export abstract class OmniauthProviderService {
  connecting = false;
  public authObservable: Observable<any>; // eslint-disable-line
  private _windowSubscription: Subscription;
  private _windowMessageObserver: Observer<OmniauthProviderHttpResponse>;
  private _windowInstance: Window;
  unsubscribe$ = new Subject<void>();
  private intervalId: number = null;
  private readonly pollInterval = OMNIAUTH_PROVIDER_CONNECT.POLL_INTERVAL;
  receiveConnectedEvent: Subject<OmniauthFlowResponse> = new Subject();

  constructor(private ngZone: NgZone,
              private _loggingService: LoggingService) {
    // Can't stub out / mock message channel to test this handler
    window.onmessage = /* istanbul ignore next */ (e: MessageEvent) => {
      if (!this.windowMessageObserver || e.data?.type !== 'omniauth') {
        return;
      }

      // this post message will be received from opened window after success
      let result = OmniauthProviderConnectEvent.fail;
      let message;
      if (e.data && Object.keys(OmniauthProviderConnectEvent).includes(e.data.status)) {
        result = e.data.status;
        message = e.data.message;
      } else {
        result = OmniauthProviderConnectEvent.fail;
        const logMessage: LogMessage = { message: `Unexpected OmniauthProviderConnectEvent data or status received on messageChannel: ${JSON.stringify(e)}`, severity: LogSeverity.error };
        this._loggingService.log(logMessage);
      }

      this.ngZone.run(() => {
        this.finishOmniauthFlow(result, message);
      });
    };
  }

  checkIfClosed(): void {
    if (this.windowInstance && this.windowInstance.closed) {
      this.finishOmniauthFlow(OmniauthProviderConnectEvent.cancel);
    }
  }

  initiateAuthFlow(): void {
    if (this.connecting) {
      this.receiveConnectedEvent.next({status: false, message: ''});
      return;
    }

    this.connecting = true;

    this._windowSubscription = this.startOmniauthFlow()
      .pipe(
        finalize(() => this.connecting = false),
        takeUntil(this.unsubscribe$)
      )
      .subscribe(
        (data: OmniauthProviderHttpResponse) => {
          const value = { status: (data.status === OmniauthProviderConnectEvent.success), message: data.message };
          this.receiveConnectedEvent.next(value);
        });
  }

  startOmniauthFlow(): Observable<OmniauthProviderHttpResponse> {
    const windowLeft = window.screenLeft ? window.screenLeft : window.screenX;
    const windowTop = window.screenTop ? window.screenTop : window.screenY;
    const width = 600;
    const height = 600;
    const left = windowLeft + (window.innerWidth / 2) - (width / 2);
    const top = windowTop + (window.innerHeight / 2) - (height / 2);

    this.windowInstance = window.open(this.authFlowUrl(), '_blank',
      `width=${width}, height=${height}, top=${top}, left=${left}, rel="noopener"`);

    this.intervalId = window.setInterval(this.checkIfClosed.bind(this), this.pollInterval);

    this.authObservable = new Observable<OmniauthProviderHttpResponse>((observer: Observer<OmniauthProviderHttpResponse>) => {
      this.windowMessageObserver = observer;
    });

    return this.authObservable;
  }

  finishOmniauthFlow(status: OmniauthProviderConnectEvent, message?: string): void {
    if (this.windowInstance) {
      this.windowInstance.close();
    }

    if (this.windowMessageObserver) {
      const flowResponse: OmniauthProviderHttpResponse = { status: status };
      if (message) {
        flowResponse.message = message;
      }
      this.windowMessageObserver.next(flowResponse);
      this.windowMessageObserver.complete();
    }

    this.unsubscribe$.next();
    clearInterval(this.intervalId);
  }

  abstract authFlowUrl(): string;

  get windowMessageObserver(): Observer<OmniauthProviderHttpResponse> {
    return this._windowMessageObserver;
  }

  set windowMessageObserver(value: Observer<OmniauthProviderHttpResponse>) {
    this._windowMessageObserver = value;
  }

  get windowInstance(): Window {
    return this._windowInstance;
  }
  set windowInstance(value: Window) {
    this._windowInstance = value;
  }
}
