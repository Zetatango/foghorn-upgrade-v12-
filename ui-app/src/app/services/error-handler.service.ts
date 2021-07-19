import { ErrorHandler, Injectable } from '@angular/core';
import Bugsnag, { Client } from '@bugsnag/js';
import { BugsnagErrorHandler } from '@bugsnag/plugin-angular';
import { BugsnagSeverity } from 'app/models/bugsnag';
import { ConfigurationService } from 'app/services/configuration.service';
import { LoggingService } from './logging.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService implements ErrorHandler {
  private _bugsnagClient: Client;
  private _bugsnagErrorHandler: BugsnagErrorHandler;

  constructor(
    private configurationService: ConfigurationService,
    private loggingService: LoggingService) {
  }

  applicantId = '';
  leadId = '';
  merchantId = '';
  userId = '';

  /**
   * Internal wrapper for bugsnag client and bugsnag error handler initialisation.
   *
   * @param key
   */
  initBugsnagClient(key: string, appVersion: string): void {
    if (!this._bugsnagClient && key) { // do not initialise if client already set OR key not defined (default local env)
      this._bugsnagClient = Bugsnag.start({
        apiKey: key,
        appVersion: appVersion,
        onError: /* istanbul ignore next */ (event): boolean => this.onError(event),
        maxBreadcrumbs: 50
      });
      this._bugsnagErrorHandler = new BugsnagErrorHandler(this._bugsnagClient);
    }
  }

  /**
   * Overwrite default error handler with bugsnagErrorHandler.
   *
   * @param error
   */
  handleError(error: any): void { // eslint-disable-line
    // Initialise bugsnag client if not already initialised
    // Need to call initBugsnagClient if handleError called before bugsnagNotify
    this.initBugsnagClient(this.configurationService.bugsnagApiKey, this.configurationService.initialAppVersion);
    if (this._bugsnagClient) { // do not try to notify if client not set
      this._bugsnagErrorHandler.handleError(error);
    }
  }

  initMetadata(metadata: { applicantId: string, leadId: string, merchantId: string, userId: string }): void {
    this.applicantId = metadata.applicantId;
    this.leadId = metadata.leadId;
    this.merchantId = metadata.merchantId;
    this.userId = metadata.userId;
  }

  onError(event): boolean { // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
    const metadata: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
    metadata.applicant_guid = this.applicantId;
    metadata.lead_guid = this.leadId;
    metadata.merchant_guid = this.merchantId;

    event.setUser(this.userId);
    event.addMetadata('metadata', metadata);

    if (event.originalError) {
      // Reload page if JS chunk is not available
      if (this.isChunkLoadError(event.originalError)) {
        this.reloadPage();
        return false;
      }

      event.addMetadata('original-error', event.originalError);
      this.loggingService.log(event.originalError, false);
      this.setContext(event);
      this.setSeverity(event);
    }

    return true;
  }

  /* istanbul ignore next */
  reloadPage(): void {
    location.reload();
  }

  private setContext(event): void {
    if (event.originalError.url) {
      event.context = event.originalError.url;
    }
  }

  private setSeverity(event): void {
    if ([200, 503].includes(event.originalError.statusCode)) event.severity = BugsnagSeverity.info;
    if (event.originalError.customSeverity) event.severity = event.originalError.customSeverity;
  }

  private isChunkLoadError(error): boolean {
    const chunkLoadErrorMessage = /Loading chunk [\d]+ failed/;
    return chunkLoadErrorMessage.test(error.message);
  }
}
