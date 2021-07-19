import { ApplicationConfiguration } from 'app/models/application-configuration';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CookieService } from 'ngx-cookie-service';
import { take } from 'rxjs/operators';
import { ConfigurationService } from './configuration.service';
import { UtilityService } from 'app/services/utility.service';
import { CONFIG_URL, APP_VERSION_URL } from 'app/constants';
import { defaultApplicationConfigurationFactory, applicationConfigurationFactory, applicationVersionFactory } from 'app/test-stubs/factories/application-configuration';
import { HTTP_ERRORS } from 'app/test-stubs/api-errors-stubs';
import { Factory } from 'factory.ts';
import { internalServerErrorFactory } from 'app/test-stubs/factories/response';

/**
 * This test helper aims to both:
 *  - avoid to have to enumerate the attributes in each tests
 *  - guarantee that were not forgetting to (atleast) test any of the mandatory keys defined in the factory
 */
function testAppConfigServiceGettersAgainstFactory(service: ConfigurationService, acFactory: Factory<ApplicationConfiguration>): void {
  const fixture: ApplicationConfiguration = acFactory.build();
  const applicationConfigurationKeys: string[] = Object.keys(fixture);

  applicationConfigurationKeys.forEach((key: string) => {
    switch (key) {
      case ('address_autocomplete_enabled'): expect(service.addressAutocompleteEnabled).toEqual(fixture.address_autocomplete_enabled); break;
      case ('allowed_file_types'): expect(service.supportedFileFormats).toEqual(fixture.allowed_file_types); break;
      case ('angular_bugsnag_api_key'): expect(service.bugsnagApiKey).toEqual(fixture.angular_bugsnag_api_key); break;
      case ('app_version'): expect(service.initialAppVersion).toEqual(fixture.app_version); break;
      case ('ario_domain_suffix'): expect(service.arioDomainSuffix).toEqual(fixture.ario_domain_suffix); break;
      case ('business_partner_enabled'): expect(service.businessPartnerEnabled).toEqual(fixture.business_partner_enabled); break;
      case ('business_partner_id_blacklist'): expect(service.businessPartnerRegistrationBlacklist).toEqual(fixture.business_partner_id_blacklist); break;
      case ('calendly_url'): expect(service.calendlyUrl).toEqual(fixture.calendly_url); break;
      case ('covid_disable_financing'): expect(service.covidFinancingDisabled).toEqual(fixture.covid_disable_financing); break;
      case ('direct_debit_enabled'): expect(service.directDebitEnabled).toEqual(fixture.direct_debit_enabled); break;
      case ('direct_debit_max_amount'): expect(service.directDebitMaxAmount).toEqual(fixture.direct_debit_max_amount); break;
      case ('direct_debit_min_amount'): expect(service.directDebitMinAmount).toEqual(fixture.direct_debit_min_amount); break;
      case ('disable_invoice_ui'): expect(service.disableInvoiceUi).toEqual(fixture.disable_invoice_ui); break;
      case ('disable_wca_card'): expect(service.disableWcaCard).toEqual(fixture.disable_wca_card); break;
      case ('enhanced_branding_enabled'): expect(service.enhancedBrandingEnabled).toEqual(fixture.enhanced_branding_enabled); break;
      case ('file_encryption_type'): expect(service.fileEncryptionType).toEqual(fixture.file_encryption_type); break;
      case ('flinks'): expect(service.flinks).toEqual(fixture.flinks); break;
      case ('insights_api_enabled'): expect(service.insightsApiEnabled).toEqual(fixture.insights_api_enabled); break;
      case ('insights_enabled'): expect(service.insightsEnabled).toEqual(fixture.insights_enabled); break;
      case ('intercom_enabled'): expect(service.intercomEnabled).toEqual(fixture.intercom_enabled); break;
      case ('invoice_handling_enabled'): expect(service.invoiceHandlingEnabled).toEqual(fixture.invoice_handling_enabled); break;
      case ('jurisdiction_enabled'): expect(service.jurisdictionEnabled).toEqual(fixture.jurisdiction_enabled); break;
      case ('loc_enabled'): expect(service.locEnabled).toEqual(fixture.loc_enabled); break;
      case ('marketing_calendly_url'): expect(service.marketingCalendlyUrl).toEqual(fixture.marketing_calendly_url); break;
      case ('marketing_enabled'): expect(service.marketingEnabled).toEqual(fixture.marketing_enabled); break;
      case ('marketing_sample_blog_url'): expect(service.marketingSampleBlogUrl).toEqual(fixture.marketing_sample_blog_url); break;
      case ('max_file_size'): expect(service.maxFileSize).toEqual(fixture.max_file_size); break;
      case ('max_uploads'): expect(service.maxUploads).toEqual(fixture.max_uploads); break;
      case ('merchant_self_edit_enabled'): expect(service.merchantSelfEditEnabled).toEqual(fixture.merchant_self_edit_enabled); break;
      case ('pre_authorized_financing_enabled'): expect(service.preAuthorizedFinancingEnabled).toEqual(fixture.pre_authorized_financing_enabled); break;
      case ('quickbooks_connect_enabled'): expect(service.quickBooksConnectEnabled).toEqual(fixture.quickbooks_connect_enabled); break;
      case ('sales_calendly_url'): expect(service.salesCalendlyUrl).toEqual(fixture.sales_calendly_url); break;
      case ('schedule_marketing_campaign_enabled'): expect(service.scheduleMarketingCampaignEnabled).toEqual(fixture.schedule_marketing_campaign_enabled); break;
      case ('weekly_repayment_enabled'): expect(service.weeklyRepaymentEnabled).toEqual(fixture.weekly_repayment_enabled); break;

      default: { fail(`The ApplicationConfiguration.${key} key should be tested.`); }
    } // switch
  }); // forEach
}

describe('ConfigurationService', () => {
  let configurationService: ConfigurationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [
        ConfigurationService,
        CookieService,
        UtilityService
      ]
    });
  });

  beforeEach(() => {
    configurationService = TestBed.inject(ConfigurationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(configurationService).toBeTruthy();
  });

  describe('loadConfig()', () => {
    it('should be able to load application config', () => {
      configurationService.loadConfig()
        .pipe(take(1))
        .subscribe(
          (res) => expect(res).toBeTruthy(),
          (err) => fail('should not fail: ' + err));

      const appConfigRequest = httpMock.expectOne(CONFIG_URL);
      expect(appConfigRequest.request.method).toEqual('GET');
      appConfigRequest.flush(applicationConfigurationFactory.build());
    });

    it('should return error if call to load application fails', () => {
      HTTP_ERRORS.forEach(httpError => {
        configurationService.loadConfig()
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status));

        const appConfigRequest = httpMock.expectOne(CONFIG_URL);
        expect(appConfigRequest.request.method).toEqual('GET');
        appConfigRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  }); // describe - loadConfig()

  describe('Getters', () => {
    it('should retrieve correct values on load success', () => {
      configurationService.loadConfig()
        .pipe(take(1))
        .subscribe(
          () => testAppConfigServiceGettersAgainstFactory(configurationService, applicationConfigurationFactory),
          (err) => fail(`Should not succeed: ${err}`));

      const appConfigRequest = httpMock.expectOne(CONFIG_URL);
      expect(appConfigRequest.request.method).toEqual('GET');
      appConfigRequest.flush(applicationConfigurationFactory.build());
    });

    it('should retrieve default values on load failure', () => {
      configurationService.loadConfig()
        .pipe(take(1))
        .subscribe(
          (res) => fail(`Should not succeed: ${res}`),
          () => testAppConfigServiceGettersAgainstFactory(configurationService, defaultApplicationConfigurationFactory));

      const appConfigRequest = httpMock.expectOne(CONFIG_URL);
      expect(appConfigRequest.request.method).toEqual('GET');
      appConfigRequest.flush([], { status: 500, statusText: 'Internal server error' });
    });

    it('should retrieve default values if loadConfig not called', () => {
      testAppConfigServiceGettersAgainstFactory(configurationService, defaultApplicationConfigurationFactory);
    });
  }); // describe - Getters

  describe('loadAppVersion', () => {
    it('should set correct values on load success', () => {
      const response = applicationVersionFactory.build();
      configurationService.loadAppVersion()
        .pipe(take(1))
        .subscribe(
          () => expect(configurationService.appVersion).toEqual(response.app_version),
          (err) => fail(`Should not succeed: ${err}`));

      const appVersionRequest = httpMock.expectOne(APP_VERSION_URL);
      expect(appVersionRequest.request.method).toEqual('GET');
      appVersionRequest.flush(response);
    });

    it('should not set value on error', () => {
      configurationService.loadAppVersion()
        .pipe(take(1))
        .subscribe(
          () => fail(`Should not succeed`),
          () => expect(configurationService.appVersion).toEqual(''));

      const appVersionRequest = httpMock.expectOne(APP_VERSION_URL);
      expect(appVersionRequest.request.method).toEqual('GET');
      appVersionRequest.flush([], internalServerErrorFactory.build());
    });
  });

  describe('onCurrentAppVersion', () => {
    it('should return true when appVersion + initialAppVersion are the same', () => {
      spyOnProperty(configurationService, 'appVersion').and.returnValue('1');
      spyOnProperty(configurationService, 'initialAppVersion').and.returnValue('1');

      expect(configurationService.onCurrentAppVersion).toBeTrue();
    });

    it('should return false when appVersion + initialAppVersion are different', () => {
      spyOnProperty(configurationService, 'appVersion').and.returnValue('1');
      spyOnProperty(configurationService, 'initialAppVersion').and.returnValue('2');

      expect(configurationService.onCurrentAppVersion).toBeFalse();
    });
  });

}); // describe - ConfigurationService
