import * as Factory from 'factory.ts';
import { ApplicationConfiguration, ApplicationVersion } from 'app/models/application-configuration';
import { DEFAULT_MIME_TYPES } from 'app/models/mime-types';
import { merchantDataFactory } from 'app/test-stubs/factories/merchant';
import { CONFIGURATION_DEFAULTS } from 'app/constants';

/********************************* FACTORIES **********************************/

export const applicationConfigurationFactory = Factory.makeFactory<ApplicationConfiguration>({
  address_autocomplete_enabled: true,
  allowed_file_types: DEFAULT_MIME_TYPES.toString(),
  angular_bugsnag_api_key: '1234567890abbcdef',
  app_version: 'ca09323k',
  ario_domain_suffix: 'zetatango.local',
  business_partner_enabled: false,
  business_partner_id_blacklist: '',
  calendly_url: 'https://calendly.com',
  covid_disable_financing: false,
  direct_debit_enabled: true,
  direct_debit_max_amount: 10000.00,
  direct_debit_min_amount: 10.00,
  disable_invoice_ui: false,
  disable_wca_card: false,
  enhanced_branding_enabled: true,
  file_encryption_type: 'backend',
  flinks: {
    flinks_url: 'https://zetatango-iframe.private.fin.ag/',
    flinks_creds: '',
    flinks_uri: '',
    flinks_opts: 'demo=true&withTransactions=true&daysOfTransactions=Days365',
    max_polling: 60,
    poll_interval: 15000,
  },
  insights_api_enabled: true,
  insights_enabled: true,
  intercom_enabled: true,
  invoice_handling_enabled: true,
  jurisdiction_enabled: false,
  loc_enabled: true,
  marketing_calendly_url: 'https://calendly.com/marketing',
  marketing_enabled: true,
  marketing_sample_blog_url: 'https://arioplatform.com/blog',
  max_file_size: 1048576,
  max_uploads: 12,
  merchant_self_edit_enabled: true,
  pre_authorized_financing_enabled: true,
  quickbooks_connect_enabled: true,
  sales_calendly_url: 'https://calendly.com/sales',
  schedule_marketing_campaign_enabled: true,
  weekly_repayment_enabled: true,
});

export const defaultApplicationConfigurationFactory = Factory.makeFactory<ApplicationConfiguration>({
  address_autocomplete_enabled: CONFIGURATION_DEFAULTS.ADDRESS_AUTOCOMPLETE_ENABLED,
  allowed_file_types: CONFIGURATION_DEFAULTS.FILE_TYPES,
  angular_bugsnag_api_key: '',
  app_version: '',
  ario_domain_suffix: CONFIGURATION_DEFAULTS.DOMAIN_SUFFIX,
  business_partner_enabled: CONFIGURATION_DEFAULTS.BUSINESS_PARTNER_ENABLED,
  business_partner_id_blacklist: '',
  calendly_url: '',
  covid_disable_financing: CONFIGURATION_DEFAULTS.COVID_DISABLE_FINANCING,
  direct_debit_enabled: CONFIGURATION_DEFAULTS.DIRECT_DEBIT_ENABLED,
  direct_debit_max_amount: CONFIGURATION_DEFAULTS.DIRECT_DEBIT_MAX_AMOUNT,
  direct_debit_min_amount: CONFIGURATION_DEFAULTS.DIRECT_DEBIT_MIN_AMOUNT,
  disable_invoice_ui: CONFIGURATION_DEFAULTS.DISABLE_INVOICE_UI,
  disable_wca_card: CONFIGURATION_DEFAULTS.DISABLE_WCA_CARD,
  enhanced_branding_enabled: true,
  file_encryption_type: CONFIGURATION_DEFAULTS.FILE_ENCRYPTION_TYPE,
  flinks: {
    flinks_url: CONFIGURATION_DEFAULTS.FLINKS.FLINKS_URL,
    flinks_creds: CONFIGURATION_DEFAULTS.FLINKS.FLINKS_CREDS,
    flinks_uri: CONFIGURATION_DEFAULTS.FLINKS.FLINKS_URI,
    flinks_opts: CONFIGURATION_DEFAULTS.FLINKS.FLINKS_OPTS,
    max_polling: CONFIGURATION_DEFAULTS.FLINKS.MAX_POLLING,
    poll_interval: CONFIGURATION_DEFAULTS.FLINKS.POLL_INTERVAL
  },
  jurisdiction_enabled: false,
  insights_api_enabled: false,
  insights_enabled: false,
  intercom_enabled: false,
  invoice_handling_enabled: CONFIGURATION_DEFAULTS.INVOICE_HANDLING_ENABLED,
  loc_enabled: false,
  marketing_calendly_url: '',
  marketing_enabled: CONFIGURATION_DEFAULTS.MARKETING_ENABLED,
  marketing_sample_blog_url: '',
  max_file_size: CONFIGURATION_DEFAULTS.MAX_FILE_SIZE,
  max_uploads: 1,
  merchant_self_edit_enabled: false,
  pre_authorized_financing_enabled: false,
  quickbooks_connect_enabled: CONFIGURATION_DEFAULTS.QUICKBOOKS_CONNECT_ENABLED,
  sales_calendly_url: '',
  schedule_marketing_campaign_enabled: CONFIGURATION_DEFAULTS.SCHEDULE_MARKETING_CAMPAIGN_ENABLED,
  weekly_repayment_enabled: true,
});

export const applicationVersionFactory = Factory.makeFactory<ApplicationVersion>({
  app_version: '123'
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const applicationConfiguration = applicationConfigurationFactory.build();
/** @deprecated Prefer factories instead. */
export const applicationConfigurationBlacklist: ApplicationConfiguration = applicationConfigurationFactory.build({
  business_partner_id_blacklist: merchantDataFactory.build().endorsing_partner_id
});
