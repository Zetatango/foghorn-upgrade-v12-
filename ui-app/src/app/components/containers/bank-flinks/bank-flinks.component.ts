import { Component, HostListener, ChangeDetectorRef, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BankAccountDetails } from 'app/models/api-entities/merchant';
import { LoggingService } from 'app/services/logging.service';
import { LogMessage, LogSeverity } from 'app/models/api-entities/log';
import { ConfigurationService } from 'app/services/configuration.service';
import { TranslateService } from '@ngx-translate/core';
import { MerchantService } from 'app/services/merchant.service';
import { ErrorService } from 'app/services/error.service';
import { FLINKS } from 'app/constants';
import { BankingFlowService } from 'app/services/banking-flow.service';
import { StateRoutingService } from 'app/services/state-routing.service';
import { ActivatedRoute } from '@angular/router';
import { AppRoutes } from 'app/models/routes';

@Component({
  selector: 'ztt-bank-flinks',
  templateUrl: './bank-flinks.component.html'
})
export class BankFlinksComponent implements OnInit {
  hasReceivedFlinksMessage = false;
  isRejecting = false;
  isFlinksLoaded = false;
  flinksRoute: string;
  flinksUrl: SafeResourceUrl;

  @ViewChild('iframe') iframe;

  @HostListener('window:message', ['$event'])
  onMessage(event: Event): void {
    this.checkForUnsupportedInstitution(event as MessageEvent);
    this.checkRetryCount(event as MessageEvent);
    this.logFlinksMessage(event);
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private bankingFlowService: BankingFlowService,
    private errorService: ErrorService,
    private changeDetectorRef: ChangeDetectorRef,
    private configurationService: ConfigurationService,
    private loggingService: LoggingService,
    private merchantService: MerchantService,
    private stateRoutingService: StateRoutingService,
    public sanitizer: DomSanitizer,
    public translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.setFlinksUrl();
    this.changeDetectorRef.detectChanges();
  }

  setFlinksUrl(): void {
    this.flinksRoute = this.stateRoutingService.rootRoute(this.activatedRoute.snapshot);
    this.loggingService.log({ message: 'Current flinks context: ' + this.flinksRoute, severity: LogSeverity.info });

    // Get the flinks base URL bits from configuration service
    const urlBase = this.getFlinksBaseUrl();

    // Build the redirectUrl

    let redirectUrl = `${window.location.protocol}//${window.location.hostname}`;

    /* istanbul ignore next */
    if (window.location.port) redirectUrl += ':' + window.location.port;
    redirectUrl += FLINKS.BACKEND_ROUTE;
    redirectUrl += `?flinks_route=${this.flinksRoute}&owner=${this.owner()}`;
    redirectUrl = encodeURIComponent(redirectUrl);

    const _appendedQueryParams = {
      redirectUrl: redirectUrl,
      backgroundColor: FLINKS.QUERY_PARAMS.BACKGROUND_COLOR.toString(),
      foregroundColor1: FLINKS.QUERY_PARAMS.FOREGROUND_COLOR_1.toString(),
      foregroundColor2: FLINKS.QUERY_PARAMS.FOREGROUND_COLOR_2.toString(),
      language: this.translateService.currentLang
    };

    const appendedQueryParams = Object.keys(_appendedQueryParams)
      .map(k => '&' + k + '=' + _appendedQueryParams[k])
      .join('');

    // Complete URL
    const URL = urlBase + appendedQueryParams;

    this.loggingService.log({ message: 'Flinks URL set: ' + URL + ' for merchant ' + this.merchantService.merchantId, severity: LogSeverity.info });

    // TODO: do not bypass security
    this.flinksUrl = this.sanitizer.bypassSecurityTrustResourceUrl(URL);
  }

  private logFlinksMessage(event: Event) {
    this.hasReceivedFlinksMessage = true;
    const message = event as MessageEvent;
    if (!this.flinksMessageEvent(message)) return;

    const messageToLog = this.flinksMessageToLog(message);
    const logMessage: LogMessage = {
      message: `${ FLINKS.LOG_PREFIX }${ messageToLog }`, severity: LogSeverity.info
    };
    this.loggingService.log(logMessage);

    const gtmMessage = this.messageToGtmData(message);
    this.loggingService.logCurrentPage(gtmMessage);
  }

  private messageToGtmData(message: MessageEvent): string {
    if ([FLINKS.STEP.INSTITUTION_SELECTED, FLINKS.STEP.REDIRECT].includes(message.data.step))
      return `${ FLINKS.LOG_PREFIX }${ message.data.step } : ${ message.data.institution }`
    else
      return `${ FLINKS.LOG_PREFIX }${ message.data.step }`
  }

  private getFlinksBaseUrl(): string {
    const flinks = this.configurationService.flinks;

    // Pre-select the institution if merchant is reconnecting bank
    if (this.bankingFlowService.needConnectionRefresh) {
      const details: BankAccountDetails = this.merchantService.getMerchant().selected_sales_volume_account_details;
      const institutionName = details ? details.institution_name : '';
      const institution_key = institutionName.toUpperCase().replace(/ /g, '_').replace(/-/g, '_');
      if (institution_key in FLINKS.INSTITUTION_URL) {
        const institution_url = FLINKS.INSTITUTION_URL[institution_key];
        const modified_flinks_creds = flinks.flinks_creds + `Credential/${institution_url}`;
        const modified_flinks_opts = flinks.flinks_opts + '&backEnable=false';

        return `${flinks.flinks_url}${modified_flinks_creds}${flinks.flinks_uri}?${modified_flinks_opts}`;
      }
    }

    // Otherwise return defaults
    return `${flinks.flinks_url}${flinks.flinks_creds}${flinks.flinks_uri}?${flinks.flinks_opts}`;
  }

  private flinksMessageEvent(messageEvent: MessageEvent): boolean {
    return !!messageEvent.data.step;
  }

  /**
   * to trigger a Flinks message event for debugging enter the following in the browser console:
   * window.dispatchEvent(new MessageEvent('message', {data: {step: 'INSTITUTION_SELECTED', institution: 22}}));
   */

  private checkForUnsupportedInstitution(messageEvent: MessageEvent): void {
    if (messageEvent.data.step !== FLINKS.STEP.INSTITUTION_SELECTED) return;
    if (!FLINKS.UNSUPPORTED_INSTITUTIONS.includes(messageEvent.data.institution)) return;

    this.bankingFlowService.showConnectionErrorModalToUpload();
  }

  private checkRetryCount(messageEvent: MessageEvent): void {
    if (messageEvent.data.step !== FLINKS.STEP.RETRY_COUNT || messageEvent.data.count < FLINKS.RETRY_LIMIT) return;

    this.bankingFlowService.showConnectionErrorModalToUpload();
  }

  private flinksMessageToLog(messageEvent: MessageEvent): string {
    // REDIRECT contains loginId and redirect url (which contains loginId - which we don't want to log)
    if (messageEvent.data.step === FLINKS.STEP.REDIRECT) {
      const modEventData = { step: messageEvent.data.step, institution: messageEvent.data.institution };

      return JSON.stringify(modEventData);
    }
    return JSON.stringify(messageEvent.data);
  }

  private owner(): string {
    return this.flinksRoute === AppRoutes.insights.root ? FLINKS.OWNER.CFA : FLINKS.OWNER.LOC;
  }

  flinksIframeLoaded(): void {
    this.isFlinksLoaded = true;
  }

  get isFlinksReady(): boolean {
    return this.isFlinksLoaded && this.hasReceivedFlinksMessage;
  }
}
