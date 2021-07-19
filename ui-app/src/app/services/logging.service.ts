import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { take } from 'rxjs/operators';
import { UtilityService } from './utility.service';
import { LogMessage } from 'app/models/api-entities/log';
import { API_LOG_PATH, INTERCOM_NAMES } from 'app/constants';
import Bugsnag from '@bugsnag/js';
import { ErrorMessage, ErrorResponse } from "app/models/error-response";
import { GoogleTagManagerEvent, GoogleTagManagerInitEvent } from 'app/models/google-tag-manager';
import { DevModeService } from './dev-mode.service';
import { SupportedLanguage } from 'app/models/languages';

export enum GTMEvent {
  BUTTON_CLICKED = 'buttonClicked',
  TAB_CLICKED = 'tabClicked',
  CURRENT_PAGE = 'currentPage'
}

export enum GTMStatus {
  SUCCESS = 'success'
}

@Injectable()
export class LoggingService {
  constructor(
    private devModeService: DevModeService,
    private utilityService: UtilityService,
    private http: HttpClient
  ){}

  dataLayer = (window as any).dataLayer; // eslint-disable-line @typescript-eslint/no-explicit-any

  log(logMessage: ErrorResponse | LogMessage | ErrorMessage, notifyBugsnag = true): void {
    const log = {
      message: logMessage.message,
      severity: logMessage.severity
    };

    if (!log.severity) throw new Error('Severity cannot be null or undefined');
    if (!log.message) throw new Error('Log message cannot be blank, null or undefined');

    const httpOptions = this.utilityService.getHttpOptions();
    this.http.post(API_LOG_PATH, log, httpOptions)
      .pipe(take(1))
      .subscribe((res) => res,
        (err: ErrorResponse) => {
          if (notifyBugsnag) Bugsnag.notify(err);
        }
      )
  }

  logCurrentPage(currentPage: string, action?: string): void {
    const routes = currentPage.split('/');
    currentPage = routes[routes.length - 1];
    if (action) currentPage = `${currentPage}:${action}`;

    this.intercomUpdate(currentPage);
    this.GTMUpdate(GTMEvent.CURRENT_PAGE, currentPage);
  }

  intercomShow(): void {
    const intercom = (window as any).Intercom; // eslint-disable-line
    if (intercom) {
      intercom('show');
    }
  }

  // Used for tracking a user.
  // UserID is used for Google Analytics
  // Email is used for Active Campaign
  GTMSetUserID(userId: string, email: string): void {
    if (!userId) return;

    const event = new GoogleTagManagerInitEvent({ userId, email });
    this.pushEvent(event);
  }

  GTMUpdate(eventKey: keyof GoogleTagManagerEvent, eventValue: any): void { // eslint-disable-line
    const events = new GoogleTagManagerEvent({[eventKey]: eventValue});
    this.pushEvent(events);
  }

  GTMAction(eventCategory: string, eventAction: string, status: GTMStatus): void {
    const event = new GoogleTagManagerEvent( {
      eventAction: eventAction,
      eventCategory: eventCategory,
      eventLabel: status
    });
    this.pushEvent(event);
  }

  GTMOnBlur(formName: string, controlName: string): void {
    const event = new GoogleTagManagerEvent({
      eventAction: controlName,
      eventCategory: formName,
      eventLabel: 'completed'
    });
    this.pushEvent(event);
  }

  GTMDnq(status: boolean, industry: string, lang: string): void {
    const event = new GoogleTagManagerEvent({
      currentPage: status ? 'qualified' : 'dnq',
      industry: industry
    });
    if(lang === SupportedLanguage.fr) event.currentPage += `-${SupportedLanguage.fr}`;
    this.pushEvent(event);
  }

  private intercomUpdate(currentPage: string): void {
    const intercom = (window as any).Intercom; // eslint-disable-line
    if (intercom) intercom('update', { current_page: INTERCOM_NAMES[currentPage.toUpperCase()] || currentPage });
  }

  private pushEvent(event: GoogleTagManagerEvent | GoogleTagManagerInitEvent): void {
    /* istanbul ignore else */
    if (this.devModeService.isDevMode()) {
      console.groupCollapsed(`GTM Event`);
      console.table(event);
      console.groupEnd();
      return;
    }

    if (this.dataLayer) {
      this.dataLayer.push(event);
    } else {
      Bugsnag.notify(new ErrorMessage(`Unable to push GTM event: ${Object.keys(event)}`));
    }
  }
}
