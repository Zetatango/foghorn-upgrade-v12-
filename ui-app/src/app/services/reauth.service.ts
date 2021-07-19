import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import * as storage from 'app/helpers/storage.helper';

import { REAUTH } from 'app/constants';

@Injectable()
export class ReauthService {
  public authDone = false;
  public authObservable: Observable<any>; // eslint-disable-line
  private _observer: Observer<any>; // eslint-disable-line
  private _windowInstance: Window;
  private intervalId: number = null;
  private readonly pollInterval = REAUTH.POLL_INTERVAL;
  public readonly SUCCESS = REAUTH.SUCCESS;
  public readonly FAIL = REAUTH.FAIL;

  constructor() {
    // Can't stub out / mock message channel to test this handler
    window.onmessage = /* istanbul ignore next */ (e: MessageEvent) => {
      if (!this.observer || e.data?.type !== 'reauth') {
        return;
      }
      // this post message will be received from opened window after success signed in
      if (e.data?.message === this.SUCCESS) {
        this.observer.next({
          status: this.SUCCESS
        });
        this.windowInstance.close();
        this.observer.complete();
      } else {
        this.observer.next({
          status: this.FAIL
        });
        this.windowInstance.close();
        this.observer.complete();
      }
      clearInterval(this.intervalId);
    };
  }

  static getReauthReturn(): string {
    const reauthReturn = storage.local.getItem('reauth_return');
    storage.local.removeItem('reauth_return');

    return reauthReturn;
  }

  checkIfClosed(): void {
    if (this.windowInstance && this.windowInstance.closed) {
      window.clearInterval(this.intervalId);
      this.observer.next({
        status: this.FAIL
      });
      this.observer.complete();
    }
  }

  open(locale?: string): Observable<any> { // eslint-disable-line
    /* istanbul ignore next */
    const windowLeft = window.screenLeft ? window.screenLeft : window.screenX;
    /* istanbul ignore next */
    const windowTop = window.screenTop ? window.screenTop : window.screenY;
    const width = 500;
    const height = 600;
    const left = windowLeft + (window.innerWidth / 2) - (width / 2);
    const top = windowTop + (window.innerHeight / 2) - (height / 2);

    this.windowInstance = window.open(this.reauthUrl(locale), '_blank',
      `width=${width}, height=${height}, top=${top}, left=${left}, rel="noopener"`);

    this.intervalId = window.setInterval(this.checkIfClosed.bind(this), this.pollInterval);

    this.authObservable = new Observable<any>((observer: Observer<any>) => { // eslint-disable-line
      this.observer = observer;
    });

    return this.authObservable;
  }

  reauthUrl(locale?: string): string {
    const reauth = [REAUTH.URL_ROUTE, '?reauth_return=', ReauthService.getReauthReturn()];
    if (locale) { reauth.push(`&locale=${locale}`); }
    return reauth.join('');
  }

  get observer(): Observer<any> { // eslint-disable-line
    return this._observer;
  }

  set observer(value: Observer<any>) { // eslint-disable-line
    this._observer = value;
  }

  get windowInstance(): Window {
    return this._windowInstance;
  }

  set windowInstance(value: Window) {
    this._windowInstance = value;
  }

}
