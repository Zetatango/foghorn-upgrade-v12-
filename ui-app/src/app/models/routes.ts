export enum WlmpRoute {
  application = 'application',
  onboarding = 'onboarding',
  dashboard = 'dashboard',
  insights = 'insights',
  /** @deprecated Not used */
  help = 'help',
  partner_dashboard = 'partner',
  partner_onboarding = 'partner_onboarding',
  cash_flow = 'cash_flow',
  documents = 'documents',
  quickbooks = 'quickbooks',
  marketing = 'marketing',
  agreement = 'agreement',
  error = 'error'
}

export enum StateRoute {
  // Onboarding
  about_business = 'about_business',
  about_you = 'about_you',
  unable_to_be_certified = 'unable_to_be_certified',
  kyc_failed = 'kyc_failed',
  waiting_lending_offers = 'waiting_lending_offers',
  no_offers = 'no_offers',
  authenticate_applicant = 'authenticate_applicant',

  // /Application Flow
  lending_application_flow = 'lending_application_flow',

  // /Application Screens
  add_guarantor = 'add_guarantor',
  approval_pending = 'approval_pending',
  select_payee = 'select_payee',
  select_lending_offer = 'select_lending_offer',
  set_up_bank = 'set_up_bank',
  no_insights_data = 'no_insights_data',
  approval_prerequisites = 'approval_prerequisites',
  direct_debit_prerequisites = 'direct_debit_prerequisites',
  approval_post = 'approval_post',
  upload_documents = 'upload_documents',
  review_direct_debit = 'review_direct_debit',
  review_lending_application = 'review_lending_application',
  lending_agreement = 'lending_agreement',
  completing_lending_application = 'completing_lending_application',
  lending_application_declined = 'lending_application_declined',
  pad_agreement = 'pad_agreement',
  paf_agreement = 'paf_agreement',
  pending_bank_account_verification = 'pending_bank_account_verification',
  pre_authorized_financing_prerequisites = 'pre_authorized_financing_prerequisites',
  cash_flow = 'cash_flow',
  cash_flow_end = 'cash_flow_end',
  cash_flow_manual = 'cash_flow_manual',
  cash_flow_start = 'cash_flow_start',
  // /Dashboard - 'My Financing'
  active_ubls = 'active_ubls',

  dashboard = 'dashboard',
  preferences = 'preferences',
  about_cfa = 'about_cfa',

  // Business Partner
  business_partner_landing = 'business_partner_landing',
  business_partner_branding = 'business_partner_branding',
  business_partner_agreement = 'business_partner_agreement',
  business_partner_dashboard = 'business_partner_dashboard',

  // Documents
  upload_banking = 'upload_banking',
  cfa_landing = 'cfa_landing',

  // QuickBooks
  // quickbooks_connect_info = 'quickbooks_connect_info',

  // Marketing
  marketing = 'marketing'
}

export const AppRoutes = {
  onboarding: {
    root: WlmpRoute.onboarding,
    root_link: `/${WlmpRoute.onboarding}`,
    about_business: `${WlmpRoute.onboarding}/${StateRoute.about_business}`,
    about_you: `${WlmpRoute.onboarding}/${StateRoute.about_you}`,
    authenticate_applicant: `${WlmpRoute.onboarding}/${StateRoute.authenticate_applicant}`,
    unable_to_be_certified: `${WlmpRoute.onboarding}/${StateRoute.unable_to_be_certified}`,
    waiting_lending_offers: `${WlmpRoute.onboarding}/${StateRoute.waiting_lending_offers}`
  },
  application: {
    root: WlmpRoute.application,
    root_link: `/${WlmpRoute.application}`,
    add_guarantor: `${WlmpRoute.application}/${StateRoute.add_guarantor}`,
    approval_pending: `${WlmpRoute.application}/${StateRoute.approval_pending}`,
    approval_post: `${WlmpRoute.application}/${StateRoute.approval_post}`,
    approval_prerequisites: `${WlmpRoute.application}/${StateRoute.approval_prerequisites}`,
    cash_flow_end: `${WlmpRoute.application}/${StateRoute.cash_flow_end}`,
    cash_flow_manual: `${WlmpRoute.application}/${StateRoute.cash_flow_manual}`,
    cash_flow_start: `${WlmpRoute.application}/${StateRoute.cash_flow_start}`,
    completing_lending_application: `${WlmpRoute.application}/${StateRoute.completing_lending_application}`,
    direct_debit_prerequisites: `${WlmpRoute.application}/${StateRoute.direct_debit_prerequisites}`,
    lending_agreement: `${WlmpRoute.application}/${StateRoute.lending_agreement}`,
    lending_application_declined: `${WlmpRoute.application}/${StateRoute.lending_application_declined}`,
    lending_application_flow: `${WlmpRoute.application}/${StateRoute.lending_application_flow}`,
    pad_agreement: `${WlmpRoute.application}/${StateRoute.pad_agreement}`,
    paf_agreement: `${WlmpRoute.application}/${StateRoute.paf_agreement}`,
    pending_bank_account_verification: `${WlmpRoute.application}/${StateRoute.pending_bank_account_verification}`,
    pre_authorized_financing_prerequisites: `${WlmpRoute.application}/${StateRoute.pre_authorized_financing_prerequisites}`,
    review_direct_debit: `${WlmpRoute.application}/${StateRoute.review_direct_debit}`,
    review_lending_application: `${WlmpRoute.application}/${StateRoute.review_lending_application}`,
    select_lending_offer: `${WlmpRoute.application}/${StateRoute.select_lending_offer}`,
    select_payee: `${WlmpRoute.application}/${StateRoute.select_payee}`,
    set_up_bank: `${WlmpRoute.application}/${StateRoute.set_up_bank}`,
    upload_documents: `${WlmpRoute.application}/${StateRoute.upload_documents}`
  },
  partner_onboarding: {
    root: WlmpRoute.partner_onboarding,
    root_link: `/${WlmpRoute.partner_onboarding}`,
    business_partner_agreement: `${WlmpRoute.partner_onboarding}/${StateRoute.business_partner_agreement}`,
    business_partner_branding: `${WlmpRoute.partner_onboarding}/${StateRoute.business_partner_branding}`,
    business_partner_landing: `${WlmpRoute.partner_onboarding}/${StateRoute.business_partner_landing}`,
    set_up_bank: `${WlmpRoute.partner_onboarding}/${StateRoute.set_up_bank}`
  },
  error: {
    root: WlmpRoute.error,
    root_link: `/${WlmpRoute.error}`,
    kyc_failed: `${WlmpRoute.error}/${StateRoute.kyc_failed}`,
    no_offers: `${WlmpRoute.error}/${StateRoute.no_offers}`
  },
  dashboard: {
    root: WlmpRoute.dashboard,
    root_link: `/${WlmpRoute.dashboard}`,
    active_ubls: `${WlmpRoute.dashboard}/${StateRoute.active_ubls}`,
    set_up_bank: `${WlmpRoute.dashboard}/${StateRoute.set_up_bank}`
  },
  partner_dashboard: {
    root: WlmpRoute.partner_dashboard,
    root_link: `/${WlmpRoute.partner_dashboard}`,
    business_partner_dashboard: `${WlmpRoute.partner_dashboard}/${StateRoute.business_partner_dashboard}`
  },
  cash_flow: {
    root: WlmpRoute.cash_flow,
    root_link: `/${WlmpRoute.cash_flow}`
  },
  documents: {
    root: WlmpRoute.documents,
    root_link: `/${WlmpRoute.documents}`,
    upload_banking: `/${WlmpRoute.documents}/${StateRoute.upload_banking}`
  },
  quickbooks: {
    root: WlmpRoute.quickbooks,
    root_link: `/${WlmpRoute.quickbooks}`
  },
  marketing: {
    root: WlmpRoute.marketing,
    root_link: `/${WlmpRoute.marketing}`
  },
  agreement: {
    root: WlmpRoute.agreement,
    root_link: `/${WlmpRoute.agreement}`
  },
  insights: {
    root: WlmpRoute.insights,
    root_link: `/${WlmpRoute.insights}`,
    set_up_bank: `${WlmpRoute.insights}/${StateRoute.set_up_bank}`,
    no_insights_data: `/${WlmpRoute.insights}/${StateRoute.no_insights_data}`,
    dashboard: `${WlmpRoute.insights}/${StateRoute.dashboard}`,
    preferences: `${WlmpRoute.insights}/${StateRoute.preferences}`,
    about_cfa: `${WlmpRoute.insights}/${StateRoute.about_cfa}`,
    cfa_landing: `${WlmpRoute.insights}/${StateRoute.cfa_landing}`,
  },
  unknown: 'unknown' // Not used for actual route
};
