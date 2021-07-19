export enum UiError {
  // GENERIC --------------------------------------------------------------------------------

  general = 'generalError',
  none = '',

  // AUTHORIZATION --------------------------------------------------------------------------

  delegatedMode = 'delegated_mode',
  sessionExpired = 'Failed_SessionExpired',

  // ACTIONS --------------------------------------------------------------------------------

  routing = 'Failed_RoutingError',
  equifaxAuthentication = 'Failed_EquifaxAuthenticationError',
  signByReauth = 'Failed_SignByReauth',

  // API CALLS ------------------------------------------------------------------------------

  // USER SESSION
  getUserSession = 'Failed_GetUserSession',

  // MERCHANT
  postMerchant = 'Failed_PostMerchant',
  putMerchant = 'Failed_PutMerchant',
  getMerchants = 'Failed_GetMerchants',
  getMerchant = 'Failed_GetMerchant',
  getMerchantDocuments = 'Failed_GetMerchantDocuments',
  merchantAlreadyExists = 'Failed_PostMerchant_AlreadyExist',
  postSelectBankAccount = 'Failed_PostSelectedBankAccount',

  // BANK ACCOUNTS
  loadBankAccounts = 'Failed_LoadBankAccounts',
  loadBankAccount = 'Failed_LoadBankAccount',
  createBankAccount = 'Failed_CreateBankAccount',
  flinksInvalidAccountOrHolder = 'flinksInvalidAccountType',
  flinksAccountReconnectMismatch = 'flinksAccountReconnectMismatch',
  bankConnectError = 'Failed_BankConnectError',

  // SUPPLIERS
  getSuppliers = 'Failed_GetSuppliers',
  loadSuppliers = 'Failed_LoadSuppliers',
  noSuppliersAvailable = 'Failed_GetSuppliers_NoneAvailable', // Not used

  // LENDING API CALLS ----------------------------------------------------------------------

  // OFFERS
  getOffers = 'Failed_GetOffers',
  getOfferFee = 'Failed_GetOffersFee',
  notEligibleForOffer = 'NotEligibleForOffer',
  refreshOffers = 'Failed_RefreshOffers',

  // INVOICES
  loadInvoiceError = 'Failed_LoadInvoice',
  appInProgressError = 'Failed_InvoiceWhileInProgressApplication',

  // APPLICATIONS
  postLendingApplication = 'Failed_PostLendingApplication',
  loadLendingApplications = 'Failed_LoadLendingApplications',
  acceptLendingApplication = 'Failed_AcceptLendingApplication',
  cancelLendingApplication = 'Failed_CancelLendingApplication',
  amendLendingApplication = 'Failed_AmendLendingApplication',
  getLendingApplicationFee = 'Failed_GetLendingApplicationFee',

  // GUARANTORS
  postApplicationGuarantor = 'Failed_PostapplicationGuarantor',

  // UBLS
  loadUbls = 'Failed_LoadUBLs',

  // REPAYMENTS
  loadRepayments = 'Failed_LoadRepayment',

  // BUSINESS_PARTNER
  newBusinessPartnerError = 'Failed_PostBusinessPartner',
  getBusinessPartnerApplicationError = 'Failed_GetBusinessPartnerApplication',
  businessPartnerVanityInvalidError = 'BusinessPartnerVanityInvalid',
  getBusinessPartnerProfileError = 'Failed_GetBusinessPartnerProfile',
  putBusinessPartnerProfileError = 'Failed_PutBusinessPartnerProfile',

  // BUSINESS_PARTNER_MERCHANT
  subscribeToAutoSend = 'Failed_PutSubscribeToAutoSend',

  // QUICKBOOKS
  notConnectedToQuickbooks = 'Failed_NotConnectedToQuickbooks',

  // SOCIAL CONNECTIONS
  failedToLoadSocialConnections = 'Failed_LoadSocialConnections',

  // INVOICES
  loadBorrowerInvoices = 'Failed_LoadBorrowerInvoices',

  // AGREEMENTS
  getAgreement = 'Failed_GetAgreement',

  // DEPRECATED ------------------------------------------------------------------------------

  acceptPad = 'accept_PAD'
}
