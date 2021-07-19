import { DEFAULT_MIME_TYPES } from 'app/models/mime-types';

/** @deprecated Prefer using a specifc name space. */
export const CONSTANTS = {
  MERCHANT_INVOICES: '/api/v1/invoices',
  CAMPAIGNS: '/api/v1/campaigns',

  /** @deprecated Old remittance-based WCA */
  CALCULATE_FEE: '/merchants/:id/calculate_fee',
  /** @deprecated Old remittance-based WCA */
  APPLY: '/merchants/:id/apply',
  /** @deprecated Old remittance-based WCA */
  ACCEPT: '/merchants/:id/accept_app',
  /** @deprecated Old remittance-based WCA */
  REJECT: '/merchants/:id/reject_app',

  CSRF_KEY: 'X-CSRF-Token',
  CSRF_META_KEY: 'name=csrf-token',
  CSRF_COOKIE_KEY: 'csrftoken',
  COOKIE_SEPARATOR: ';',
  LOGOUT_URL_KEY: 'name=logout_url',
  SUBDOMAIN_META_KEY: 'name=subdomain',
  PARTNER_ID_META_KEY: 'name=partner_id',
  LANGUAGE_THEME_META_KEY: 'name=language_theme',

  ACCOUNT_INFO_URL_KEY: 'name=account_info_url',
  /** @deprecated Old remittance-based WCA */
  PAD_AGREEMENT: '/api/v1/pad_agreement/:app_id',

  /** @deprecated Feature support is in a state of decay. */
  DELEGATED_LOGOUT: '/delegated_logout',
  AUTO_LOGIN_URL: '/on_boarding/auto_login',
  UNAUTHORIZED_REDIRECT_LOGIN_URL: '/auth/user',
  REDIS_UNAVAILABLE_URL: '/503.html',
  REDIS_ERROR_CODE: 10007,

  CURRENT_USER_DATA_PATH: '/api/v1/user_sessions/current_user_data',
  UPDATE_INSIGHTS_PREFERENCE_PATH: '/api/v1/user_sessions/update_insights_preference',

  BUSINESS_PARTNER_VANITY: 'business_partner_vanity_',

  TO_PDF: '/generate_pdf/to_pdf'
};

export const REAUTH = {
  POLL_INTERVAL: 500,
  SUCCESS: 'success',
  FAIL: 'fail',
  URL_ROUTE: '/confirm_login'
};

export const OMNIAUTH_PROVIDER_CONNECT = {
  POLL_INTERVAL: 500
};

export const QUICKBOOKS_CONNECT = {
  URL_ROUTE: '/quickbooks_start',
  IMPORT_REFRESH_INTERVAL: 3000
};

export const FACEBOOK_CONNECT = {
  URL_ROUTE: '/facebook_start'
};

export const INTERCOM_NAMES = {
  ABOUT_YOU: 'About You',
  ABOUT_BUSINESS: 'About Business',
  ACTIVE_UBLS: 'Dashboard',
  APPROVAL_PENDING: 'Pending WCA Decision',
  AUTHENTICATE_APPLICANT: 'EID Questions',
  CASH_FLOW: 'Cash Flow',
  LENDING_AGREEMENT: 'Sign Contract',
  SELECT_LENDING_OFFER: 'Select Amount & Repayment Term',
  SELECT_PAYEE: 'Select Supplier',
  SET_UP_BANK: 'Provide Bank details',
  SHOW_LENDING_OFFERS: 'Certification Page',
  REVIEW_LENDING_APPLICATION: 'Review Financing Details',
  UNABLE_TO_BE_CERTIFIED: 'Unable To Be Certified',
  UPLOAD_DOCUMENTS: 'Upload Documents',
  WAITING_LENDING_OFFERS: 'Waiting for Offers'
};

export const FLINKS = {
  QUERY_PARAMS: {
    BACKGROUND_COLOR: 'FFFFFF00',
    FOREGROUND_COLOR_1: '000000',
    FOREGROUND_COLOR_2: '000000'
  },
  BACKEND_ROUTE:          '/api/v1/bank_account/flinks',
  GET_REQUEST_STATE_PATH: '/api/v1/bank_account/flinks_request_state',
  COOKIE_KEY: {
    ROUTE: 'flinks_route',
    REQUEST_ID: 'flinks_request_id'
  },
  LOG_PREFIX: 'FLINKS : ',
  INSTITUTION_URL: {
    ATB_FINANCIAL: 'ATB',
    BANK_OF_MONTREAL: 'BMO',
    BANK_OF_NOVA_SCOTIA: 'Scotia',
    CANADIAN_IMPERIAL_BANK_OF_COMMERCE: 'CIBC',
    COAST_CAPITAL_SAVINGS_FEDERAL_CREDIT_UNION: 'CoastCapital',
    EQ_BANK: 'EQBank',
    FÉDÉRATION_DES_CAISSES_DESJARDINS_DU_QUÉBEC: 'Desjardins',
    FLINKSCAPITAL: 'FlinksCapital',
    HSBC_BANK_OF_CANADA: 'HSBC',
    LAURENTIAN_BANK_OF_CANADA: 'Laurentienne',
    MERIDIAN_CREDIT_UNION: 'Meridian',
    NATIONAL_BANK_OF_CANADA: 'National',
    ROYAL_BANK_OF_CANADA: 'RBC',
    SIMPLII_FINANCIAL: 'Simplii',
    TANGERINE: 'Tangerine',
    TORONTO_DOMINION_BANK: 'TD',
    VANCOUVER_CITY_SAVINGS_CREDIT_UNION: 'Vancity'
  },
  RETRY_LIMIT: 3,
  STEP: {
    INSTITUTION_SELECTED: 'INSTITUTION_SELECTED',
    REDIRECT: 'REDIRECT',
    RETRY_COUNT: 'RETRY_COUNT'
  },
  OWNER: {
    LOC: 'line_of_credit',
    CFA: 'cash_flow_advisor'
  },
  UNSUPPORTED_INSTITUTIONS: ['Meridian', 21, 22, 'BMO'] // Alterna are 21 and 22
};

export const CONFIG_URL = '/api/v1/configuration';
export const APP_VERSION_URL = '/api/v1/app_version';

export const CONFIGURATION_DEFAULTS = {
  ADDRESS_AUTOCOMPLETE_ENABLED: false,
  BUSINESS_PARTNER_ENABLED: true,
  COVID_DISABLE_FINANCING: false,
  FLINKS: {
    FLINKS_URL: 'https://zetatango-iframe.private.fin.ag/',
    FLINKS_CREDS: '',
    FLINKS_URI: '',
    FLINKS_OPTS: 'demo=true&withTransactions=true&daysOfTransactions=Days365',
    MAX_POLLING: 60,
    POLL_INTERVAL: 15000
  },
  INVOICE_HANDLING_ENABLED: true,
  DIRECT_DEBIT_ENABLED: false,
  DIRECT_DEBIT_MIN_AMOUNT: 10.00,
  DIRECT_DEBIT_MAX_AMOUNT: 50000.00,
  DISABLE_WCA_CARD: false,
  DISABLE_INVOICE_UI: false,
  QUICKBOOKS_CONNECT_ENABLED: false,
  MARKETING_ENABLED: false,
  SCHEDULE_MARKETING_CAMPAIGN_ENABLED: false,
  FILE_ENCRYPTION_TYPE: 'backend',
  DOMAIN_SUFFIX: 'arioplatform.com',
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  MAX_UPLOADS: 1,
  FILE_TYPES: DEFAULT_MIME_TYPES.toString()
};

export const ONBOARDING = {
  POST_MERCHANT_QUERY_PATH:        '/on_boarding/query_merchant',
  POST_MERCHANT_QUERY_SELECT_PATH: '/on_boarding/select_merchant',
  POST_APPLICANT_PATH:             '/on_boarding/submit_applicant',
};

export const API_LENDING = {
  GET_OFFERS_PATH:        '/api/v1/lending_offers/get_offers',
  GET_OFFER_PATH:         '/api/v1/lending_offers/get_offer/:id',
  GET_OFFER_FEE_PATH:     '/api/v1/lending_offers/fee',
  PUT_OFFER_APPROVE_PATH: '/api/v1/lending_offers/approve',
  PUT_OFFER_CANCEL_PATH:  '/api/v1/lending_offers/cancel',

  GET_UBLS_PATH:       '/api/v1/lending_ubls/get_ubls',
  GET_UBL_PATH:        '/api/v1/lending_ubls/get_ubl/:id',
  GET_REPAYMENTS_PATH: '/api/v1/lending_repayments',
  GET_REPAYMENT_PATH:  '/api/v1/lending_repayments/get_repayment/:id',
};

export const API_FILE_STORAGE = {
  UPLOAD_FILE_PATH:      '/api/v1/upload_file',
  CACHE_FILE_PATH:      '/api/v1/cache_file',
  REMOVE_FILE_PATH:      '/api/v1/remove_file',
  SUBMIT_DOCUMENTS_PATH: '/api/v1/submit_documents',
  CLEAN_FILES_PATH:      '/api/v1/clean_documents_cache'
};

export const API_CRYPTO = {
  ENCRYPTION_BUNDLE: '/api/v1/encryption_bundle'
};

export const API_LENDING_APPLICATIONS = {
  POST_NEW_PATH:            '/api/v1/lending_applications',
  GET_APPLICATIONS_PATH:    '/api/v1/lending_applications',
  GET_APPLICATION_PATH:     '/api/v1/lending_applications/:id',
  GET_PAD_AGREEMENT_PATH:   '/api/v1/lending_applications/:id/pad_agreement',
  GET_TERMS_PATH:           '/api/v1/lending_applications/:id/terms',
  GET_APPLICATION_FEE_PATH: '/api/v1/lending_applications/:id/fee',
  PUT_ACCEPT_PATH:          '/api/v1/lending_applications/:id/accept',
  PUT_CANCEL_PATH:          '/api/v1/lending_applications/:id/cancel',
  PUT_AMEND_PATH:           '/api/v1/lending_applications/:id/amend'
};

export const API_APPLICANTS = {
  APPLICANTS_AUTHENTICATE: '/api/v1/applicants/:id/authenticate'
};

export const API_AGREEMENTS = {
  GET: '/api/v1/agreements/:id/',
  ACCEPT: '/api/v1/agreements/:id/accept',
  OPT_OUT: '/api/v1/agreements/:id/opt_out'
};

export const API_PDFS = {
  GET_PDF: 'api/v1/pdfs/to_pdf'
};

export const API_DIRECT_PAYMENT = {
  POST_NEW_PATH: '/api/v1/direct_payments',
  GET_PATH: '/api/v1/direct_payments/:id'
};

export const BORROWER_INVOICES = {
  GET_INVOICE:       '/api/v1/borrower_invoices/:id/',
  GET_INVOICES_PATH: '/api/v1/borrower_invoices'
};

export const LENDING_OFFERS_POLLING = {
  MAX_ATTEMPTS: 10,        // TODO: Refine polling parameters with performance considerations.
  INITIAL_INTERVAL: 2000,  //                "                  "                  "
  EXPONENTIAL_BASIS: 2     //                "                  "                  "
};

export const API_SUPPLIER = {
  GET_SUPPLIERS_PATH: '/api/v1/suppliers'
};

export const API_MERCHANT = {
  GET_MERCHANTS_PATH:        '/api/v1/merchants',
  PUT_MERCHANTS_PATH:        '/api/v1/merchants/:id',
  GET_MERCHANT_DOCUMENTS_PATH: '/api/v1/merchants/documents',
  /** @deprecated Old remittance-based WCA */
  GET_MERCHANTS_BUNDLE_PATH: '/api/v1/merchants/bundle',
  GET_MERCHANT_AGREEMENT_PATH: '/api/v1/merchants/:id/agreement',
  POST_MERCHANTS_PATH:       '/api/v1/merchants',
  REQUEST_ASSISTANCE_PATH:   '/api/v1/request_assistance',
  REFRESH_OFFERS_PATH:       '/api/v1/refresh_offers',
  INCREASE_LIMIT_PATH:       '/api/v1/increase_limit',
  MERCHANTS_BRANDING_PATH: '/api/v1/merchants/:id/business_partner_branding',
};

export const API_LEAD = {
  GET_LEAD_PATH:           '/api/v1/leads/:id',
  UPDATE_DESIRED_BANK_ACCOUNT_BALANCE_LEADS_PATH:        '/api/v1/leads/:id/desired_bank_account_balance',
  UPDATE_SELECTED_INSIGHTS_BANK_ACCOUNTS_LEADS_PATH:        '/api/v1/leads/:id/selected_insights_bank_accounts',
};

export const API_BANK_ACCOUNTS = {
  GET_BANK_ACCOUNT_PATH:              '/api/v1/bank_accounts/:id',
  GET_BANK_ACCOUNTS_PATH:             '/api/v1/bank_accounts',
  CREATE_NEW_BANK_ACCOUNT_PATH:       '/api/v1/bank_account',
  SELECT_BANK_ACCOUNT_PATH:           '/api/v1/select_bank_account',
  SELECT_SALES_VOLUME_ACCOUNTS_PATH:  '/api/v1/select_sales_volume_accounts',
  SELECT_INSIGHTS_BANK_ACCOUNTS_PATH: '/api/v1/select_insights_bank_accounts'
};

export const API_BUSINESS_PARTNER = {
  POST_BUSINESS_PARTNER_NEW_PATH:             'api/v1/business_partners',
  GET_BUSINESS_PARTNER_APPLICATION_PATH:      'api/v1/business_partners/:id',
  POST_BUSINESS_PARTNER_INVITE_BORROWER_PATH: 'api/v1/business_partners/:id/invite',
  GET_BUSINESS_PARTNER_MERCHANTS_PATH:        'api/v1/business_partners/:id/business_partner_merchant',
  GET_BUSINESS_PARTNER_SENT_INVOICES_PATH:    '/api/v1/business_partners/:id/sent_business_partner_invoices',
  GET_BUSINESS_PARTNER_PROFILE_PATH:          '/api/v1/business_partners/:id/business_partner_profile',
  PUT_BUSINESS_PARTNER_PROFILE_PATH:          '/api/v1/business_partners/:id/business_partner_profile'
};

export const API_BUSINESS_PARTNER_MERCHANT = {
  POST_INVOICE: 'api/v1/business_partner_merchants/:id/invoice',
  PUT_SUBSCRIBE: 'api/v1/business_partner_merchants/subscribe',
};

export const API_DATA_WAREHOUSE = {
  // TODO: remove the sample data url and add the following:  'api/v1/data_warehouse/account_balance' once api is ready
  GET_AGGREGRATED_BANK_ACCOUNTS:  '/api/v1/data_warehouse/aggregated_bank_accounts'

};

export const API_TRACKED_OBJECT = {
  GET_TRACKED_OBJECT_EVENTS_PATH: '/api/v1/tracked_objects/:id/tracked_object_events'
};

export const API_TRANSACTIONS = {
  GET_TRANSACTIONS_PATH: 'api/v1/transactions'
};

export const API_SOCIAL_CONNECTIONS = {
  GET_SOCIAL_CONNECTIONS_PATH: 'api/v1/social_connections'
};

export const API_LOG_PATH = '/api/v1/log';

export const GET_LENDING_OFFER_FEE = {
  DEBOUNCE_TIME: 1000 // ms
};

export const GUARANTOR = {
  POST_ADD_GUARANTOR: 'api/v1/guarantor'
};

// MISC -------------------------------------------------------------------------------------

export const LOADER = {
  MAIN_LOADER: 'mainLoader',
  SPINNER: '<i class="fas fa-circle-notch fa-spin"></i>',
};

/**
 * @deprecated to the benefit of Counrty enum in utility.ts.
 */
export const COUNTRY = 'Canada';

// Select offer id cookie key
export const SELECTED_OFFER_ID_KEY = 'selected_offer_id';

// Direct debit POST information
export const DIRECT_DEBIT_POST_KEY = 'direct_debit_post';

// Supplier information
export const SUPPLIER_INFORMATION_KEY = 'supplier_information';

export const AGGREGATION = {
  WEEKLY:  7,
  MONTHLY: 30
};

export const CASH_RESERVE_LIMIT = {
  MAX_ALLOWED: 100000000000000000000,
  MIN_ALLOWED: 0
};
