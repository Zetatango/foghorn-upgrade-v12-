import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UtilityService } from 'app/services/utility.service';
import { CONFIG_URL, CONFIGURATION_DEFAULTS, APP_VERSION_URL } from 'app/constants';
import { Observable } from 'rxjs';
import { ApplicationConfiguration, ApplicationVersion } from 'app/models/application-configuration';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  private _applicationConfig: ApplicationConfiguration;
  private _appVersion: string;
  private _initialAppVersion: string;

  get addressAutocompleteEnabled(): boolean {
    return this._applicationConfig?.address_autocomplete_enabled ?? CONFIGURATION_DEFAULTS.ADDRESS_AUTOCOMPLETE_ENABLED;
  }

  get appVersion(): string {
    return this._appVersion || '';
  }

  get arioDomainSuffix(): string {
    return this._applicationConfig?.ario_domain_suffix ?? CONFIGURATION_DEFAULTS.DOMAIN_SUFFIX;
  }

  get bugsnagApiKey(): string {
    return this._applicationConfig?.angular_bugsnag_api_key ?? '';
  }

  get businessPartnerEnabled(): boolean {
    return this._applicationConfig?.business_partner_enabled ?? CONFIGURATION_DEFAULTS.BUSINESS_PARTNER_ENABLED;
  }

  get businessPartnerRegistrationBlacklist(): string {
    return this._applicationConfig?.business_partner_id_blacklist ?? '';
  }

  get calendlyUrl(): string {
    return this._applicationConfig?.calendly_url ?? '';
  }

  get covidFinancingDisabled(): boolean {
    return this._applicationConfig?.covid_disable_financing ?? CONFIGURATION_DEFAULTS.COVID_DISABLE_FINANCING;
  }

  get directDebitEnabled(): boolean {
    return this._applicationConfig?.direct_debit_enabled ?? CONFIGURATION_DEFAULTS.DIRECT_DEBIT_ENABLED;
  }

  get directDebitMaxAmount(): number {
    return this._applicationConfig?.direct_debit_max_amount ?? CONFIGURATION_DEFAULTS.DIRECT_DEBIT_MAX_AMOUNT;
  }

  get directDebitMinAmount(): number {
    return this._applicationConfig?.direct_debit_min_amount ?? CONFIGURATION_DEFAULTS.DIRECT_DEBIT_MIN_AMOUNT;
  }

  get disableWcaCard(): boolean {
    return this._applicationConfig?.disable_wca_card ?? CONFIGURATION_DEFAULTS.DISABLE_WCA_CARD;
  }

  get disableInvoiceUi(): boolean {
    return this._applicationConfig?.disable_invoice_ui ?? CONFIGURATION_DEFAULTS.DISABLE_INVOICE_UI;
  }

  get enhancedBrandingEnabled(): boolean {
    return this._applicationConfig?.enhanced_branding_enabled ?? true;
  }

  get fileEncryptionType(): string {
    return this._applicationConfig?.file_encryption_type ?? CONFIGURATION_DEFAULTS.FILE_ENCRYPTION_TYPE;
  }

  get flinks(): { flinks_url: string, flinks_creds: string, flinks_uri: string, flinks_opts: string, max_polling: number, poll_interval: number } {
    return this._applicationConfig?.flinks ?? {
      flinks_url: CONFIGURATION_DEFAULTS.FLINKS.FLINKS_URL,
      flinks_creds: CONFIGURATION_DEFAULTS.FLINKS.FLINKS_CREDS,
      flinks_uri: CONFIGURATION_DEFAULTS.FLINKS.FLINKS_URI,
      flinks_opts: CONFIGURATION_DEFAULTS.FLINKS.FLINKS_OPTS,
      max_polling: CONFIGURATION_DEFAULTS.FLINKS.MAX_POLLING,
      poll_interval: CONFIGURATION_DEFAULTS.FLINKS.POLL_INTERVAL
    };
  }

  get initialAppVersion(): string {
    return this._initialAppVersion || '';
  }

  get insightsApiEnabled(): boolean {
    return !!this._applicationConfig?.insights_api_enabled;
  }

  get insightsEnabled(): boolean {
    return !!this._applicationConfig?.insights_enabled;
  }

  get intercomEnabled(): boolean {
    return !!this._applicationConfig?.intercom_enabled;
  }

  get invoiceHandlingEnabled(): boolean {
    return this._applicationConfig?.invoice_handling_enabled ?? CONFIGURATION_DEFAULTS.INVOICE_HANDLING_ENABLED;
  }

  get jurisdictionEnabled(): boolean {
    return this._applicationConfig?.jurisdiction_enabled ?? false;
  }

  get locEnabled(): boolean {
    return this._applicationConfig?.loc_enabled ?? false;
  }

  get marketingCalendlyUrl(): string {
    return this._applicationConfig?.marketing_calendly_url ?? '';
  }

  get marketingEnabled(): boolean {
    return this._applicationConfig?.marketing_enabled ?? CONFIGURATION_DEFAULTS.MARKETING_ENABLED;
  }

  get marketingSampleBlogUrl(): string {
    return this._applicationConfig?.marketing_sample_blog_url ?? '';
  }

  get maxFileSize(): number {
    return this._applicationConfig?.max_file_size ?? CONFIGURATION_DEFAULTS.MAX_FILE_SIZE;
  }

  get maxUploads(): number {
    return this._applicationConfig?.max_uploads ?? CONFIGURATION_DEFAULTS.MAX_UPLOADS;
  }

  get merchantSelfEditEnabled(): boolean {
    return this._applicationConfig?.merchant_self_edit_enabled ?? false;
  }

  get preAuthorizedFinancingEnabled(): boolean {
    return this._applicationConfig?.pre_authorized_financing_enabled ?? false;
  }

  get quickBooksConnectEnabled(): boolean {
    return this._applicationConfig?.quickbooks_connect_enabled ?? CONFIGURATION_DEFAULTS.QUICKBOOKS_CONNECT_ENABLED;
  }

  get salesCalendlyUrl(): string {
    return this._applicationConfig?.sales_calendly_url ?? '';
  }

  get scheduleMarketingCampaignEnabled(): boolean {
    return this._applicationConfig?.schedule_marketing_campaign_enabled ?? CONFIGURATION_DEFAULTS.SCHEDULE_MARKETING_CAMPAIGN_ENABLED;
  }

  get supportedFileFormats(): string {
    return this._applicationConfig?.allowed_file_types ?? CONFIGURATION_DEFAULTS.FILE_TYPES;
  }

  get weeklyRepaymentEnabled(): boolean {
    return this._applicationConfig?.weekly_repayment_enabled ?? true;
  }

  get onCurrentAppVersion(): boolean {
    return this.appVersion === this.initialAppVersion;
  }

  constructor(
    private http: HttpClient,
    private utilityService: UtilityService
  ) {}

  // API CALL
  loadConfig(): Observable<ApplicationConfiguration> {
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(CONFIG_URL, httpOptions)
      .pipe(
        tap((res: ApplicationConfiguration) => {
          this._applicationConfig = res;
          this._initialAppVersion = res.app_version;
        })
      );
  }

  loadAppVersion(): Observable<ApplicationVersion> {
    const httpOptions = this.utilityService.getHttpOptionsForBody();
    return this.http.get(APP_VERSION_URL, httpOptions)
      .pipe(
        tap((res: ApplicationVersion) => this._appVersion = res.app_version)
      );
  }
}
