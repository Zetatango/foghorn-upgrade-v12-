export interface ApplicationConfiguration {
  address_autocomplete_enabled: boolean;
  allowed_file_types: string;
  angular_bugsnag_api_key: string;
  app_version: string;
  ario_domain_suffix: string;
  business_partner_enabled: boolean;
  business_partner_id_blacklist: string;
  calendly_url: string;
  covid_disable_financing: boolean;
  direct_debit_enabled: boolean;
  direct_debit_max_amount: number;
  direct_debit_min_amount: number;
  disable_invoice_ui: boolean;
  disable_wca_card: boolean;
  enhanced_branding_enabled: boolean;
  file_encryption_type: string;
  flinks: {
    flinks_url: string;
    flinks_creds: string;
    flinks_uri: string;
    flinks_opts: string;
    max_polling: number;
    poll_interval: number;
  };
  insights_api_enabled: boolean;
  insights_enabled: boolean;
  intercom_enabled: boolean;
  invoice_handling_enabled: boolean;
  jurisdiction_enabled: boolean;
  loc_enabled: boolean;
  marketing_calendly_url: string;
  marketing_enabled: boolean;
  marketing_sample_blog_url: string;
  max_file_size: number;
  max_uploads: number;
  merchant_self_edit_enabled: boolean;
  pre_authorized_financing_enabled: boolean;
  quickbooks_connect_enabled: boolean;
  sales_calendly_url: string;
  schedule_marketing_campaign_enabled: boolean;
  weekly_repayment_enabled: boolean;
}

export interface ApplicationVersion {
  app_version: string;
}
