import * as Factory from 'factory.ts';
import {
  LendingApplication,
  INCOMPLETE_APP_STATES,
  COMPLETING_APP_STATES,
  COMPLETED_APP_STATES,
  FAILED_APP_STATES,
  DECLINED_APP_STATES,
  CANCELLED_APP_STATES,
  EXPIRED_APP_STATES,
  IN_PROGRESS_APP_STATES,
  DISREGARDED_APP_STATES,
  APPROVED_APP_STATES,
  BEFORE_APPROVED_APP_STATES
} from 'app/models/api-entities/lending-application';
import { RepaymentSchedule, ApplicationState, Currency, TermUnit } from 'app/models/api-entities/utility';
import {
  merchDocumentBankCollected,
  merchDocumentTaxRequired,
  merchDocumentBankRequired,
  merchDocumentTaxCollected
} from 'app/test-stubs/factories/merchant-document';
import { supplierLcbo } from 'app/test-stubs/factories/supplier';
import { LendingApplicationPost } from 'app/models/api-entities/lending-application-post';
import {
  lendingTerm6weeks,
  lendingTerm60Days,
  lendingTerm120Days,
  lendingTerm90Days,
  lendingTerm6months,
  lendingTerm9months, lendingTerm12months, lendingTerm10weeks, lendingTerm14weeks
} from 'app/test-stubs/factories/lending-term';
import { merchantDataFactory } from './merchant';
import { ZttResponse } from 'app/models/api-entities/response';

/**========================= OfferType.LineOfCredit =========================**/

/********************************* FACTORIES **********************************/

export const lendingApplicationFactory = Factory.makeFactory<LendingApplication>({
  id: 'lap_1',
  state: ApplicationState.approved,
  merchant_id: merchantDataFactory.build().id,
  offer_id: 'lo_1',
  terms: 'terms',
  currency: Currency.CAD,
  fee: 0.0,
  merchant_user_email: merchantDataFactory.build().email,
  merchant_user_id: merchantDataFactory.build().id,
  expires_at: null,
  cancellation_reason: '',
  ztt_approved_at: null,
  applied_at: null,
  pad_terms_agreed_at: null,
  laas_approved_at: null,
  client_ip_address: '',
  loan_id: 'lub_abc',
  principal_amount: 200.00,
  apr: 0,
  repayment_schedule: RepaymentSchedule.daily,
  loan_term: 120,
  term_unit: TermUnit.months,
  term_duration: 6,
  ubl_terms_agreed_at: null,
  payee_account_id: '',
  payor_account_id: '',
  payee_id: supplierLcbo.id,
  payee_name: supplierLcbo.name,
  payee_account_num: '1234',
  payee_invoice_num: '5678',
  terms_signature_required: true,
  required_documents: [
    merchDocumentBankCollected,
    merchDocumentTaxRequired
  ],
  requires_guarantor: false,
  repayment_amount: 11.20,
  contract_repayment_amount: 10.00,
  available_terms: [
    lendingTerm60Days,
    lendingTerm120Days,
    lendingTerm90Days,
    lendingTerm6months,
    lendingTerm9months,
    lendingTerm12months,
    lendingTerm6weeks,
    lendingTerm10weeks,
    lendingTerm14weeks
  ],
  requested_amount: 2000.00,
  max_principal_amount: 3000.00,
  offline_payouts: []
});

export const lendingApplicationPostFactory = Factory.makeFactory<LendingApplicationPost>({
  offer_id: 'lo_1',
  principal_amount: 1000,
  apr: 0,
  repayment_schedule: RepaymentSchedule.daily,
  merchant_user_email: merchantDataFactory.build().email,
  merchant_user_id: merchantDataFactory.build().id,
  interest_amount: 21.15,
  repayment_amount: 10.05,
  loan_term_id: lendingTerm6weeks.id,
  payee_id: '',
  payee_account_num: '',
  payee_invoice_num: ''
});

export const lendingApplicationPostNoSupplierFactory = Factory.makeFactory<LendingApplicationPost>({
  offer_id: 'lo_1',
  principal_amount: 1000,
  apr: 0,
  repayment_schedule: RepaymentSchedule.daily,
  merchant_user_email: merchantDataFactory.build().email,
  merchant_user_id: merchantDataFactory.build().id,
  interest_amount: 21.15,
  repayment_amount: 10.05,
  loan_term_id: lendingTerm6weeks.id,
  payee_id: ''
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const lendingApplicationApproved = lendingApplicationFactory.build();
/** @deprecated Prefer factories instead. */
export const lendingApplicationApproving = lendingApplicationFactory.build({ state: ApplicationState.approving });
/** @deprecated Prefer factories instead. */
export const lendingApplicationPending = lendingApplicationFactory.build({ state: ApplicationState.pending });
/** @deprecated Prefer factories instead. */
export const lendingApplicationWaitingForDocuments = lendingApplicationFactory.build({ state: ApplicationState.waiting_for_documents });
/** @deprecated Prefer factories instead. */
export const lendingApplicationReviewing = lendingApplicationFactory.build({ state: ApplicationState.reviewing });
/** @deprecated Prefer factories instead. */
export const lendingApplicationDeclining = lendingApplicationFactory.build({ state: ApplicationState.declining });
/** @deprecated Prefer factories instead. */
export const lendingApplicationDeclined = lendingApplicationFactory.build({ state: ApplicationState.declined });
/** @deprecated Prefer factories instead. */
export const lendingApplicationCancelling = lendingApplicationFactory.build({ state: ApplicationState.cancelling });
/** @deprecated Prefer factories instead. */
export const lendingApplicationCancelled = lendingApplicationFactory.build({ state: ApplicationState.cancelled });
/** @deprecated Prefer factories instead. */
export const lendingApplicationExpiring = lendingApplicationFactory.build({ state: ApplicationState.expiring });
/** @deprecated Prefer factories instead. */
export const lendingApplicationExpired = lendingApplicationFactory.build({ state: ApplicationState.expired });
/** @deprecated Prefer factories instead. */
export const lendingApplicationAccepted = lendingApplicationFactory.build({ state: ApplicationState.accepted });
/** @deprecated Prefer factories instead. */
export const lendingApplicationKycVerifying = lendingApplicationFactory.build({ state: ApplicationState.kyc_verifying });
/** @deprecated Prefer factories instead. */
export const lendingApplicationHardHitting = lendingApplicationFactory.build({ state: ApplicationState.hard_hitting });
/** @deprecated Prefer factories instead. */
export const lendingApplicationHardHitFailing = lendingApplicationFactory.build({ state: ApplicationState.hard_hit_failing });
/** @deprecated Prefer factories instead. */
export const lendingApplicationHardHitFailed = lendingApplicationFactory.build({ state: ApplicationState.hard_hit_failed });
/** @deprecated Prefer factories instead. */
export const lendingApplicationLaasing = lendingApplicationFactory.build({ state: ApplicationState.laasing });
/** @deprecated Prefer factories instead. */
export const lendingApplicationKycFailing = lendingApplicationFactory.build({ state: ApplicationState.kyc_failing });
/** @deprecated Prefer factories instead. */
export const lendingApplicationKycFailed = lendingApplicationFactory.build({ state: ApplicationState.kyc_failed });
/** @deprecated Prefer factories instead. */
export const lendingApplicationCompleting = lendingApplicationFactory.build({ state: ApplicationState.completing });
/** @deprecated Prefer factories instead. */
export const lendingApplicationCompleted = lendingApplicationFactory.build({ state: ApplicationState.completed });
/** @deprecated Prefer factories instead. */
export const lendingApplicationUnsupportedState = lendingApplicationFactory.build({ state: null });

// Signature related:
/** @deprecated Prefer factories instead. */
export const lendingApplicationPendingSignature = lendingApplicationFactory.build({terms_signature_required: true });
/** @deprecated Prefer factories instead. */
export const lendingApplicationSigned = lendingApplicationFactory.build({terms_signature_required: false });

// Documents related:
/** @deprecated Prefer factories instead. */
export const lendingApplicationMultiDocsRequired = lendingApplicationFactory.build({
  required_documents: [
    merchDocumentBankRequired,
    merchDocumentTaxRequired
  ]
});
/** @deprecated Prefer factories instead. */
export const lendingApplicationNoDocsRequired = lendingApplicationFactory.build({
  required_documents: [
    merchDocumentTaxCollected,
    merchDocumentBankCollected
  ]
});

// No account or invoice number
/** @deprecated Prefer factories instead. */
export const lendingApplicationNoInvoice = lendingApplicationFactory.build({
  payee_account_num: '',
  payee_invoice_num: ''
});

/**===================== OfferType.WorkingCapitalAdvance ====================**/

/********************************* FACTORIES **********************************/

export const lendingApplicationWcaFactory = lendingApplicationFactory.extend({
  id: 'lap_2',
  offer_id: 'lo_2',
  payee_account_num: '',
  payee_invoice_num: '',
  requested_amount: 50000.00,
  max_principal_amount: 300000.00
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

export const lendingApplicationWca = lendingApplicationWcaFactory.build();

/** @deprecated Prefer factories instead. */
export const lendingApplicationWcaPending = lendingApplicationWcaFactory.build();
/** @deprecated Prefer factories instead. */
export const lendingApplicationWcaApproving = lendingApplicationWcaFactory.build({ state: ApplicationState.approving });
/** @deprecated Prefer factories instead. */
export const lendingApplicationWcaApproved = lendingApplicationWcaFactory.build({ state: ApplicationState.approved });
/** @deprecated Prefer factories instead. */
export const lendingApplicationWcaWaitingForDocuments = lendingApplicationWcaFactory.build({ state: ApplicationState.waiting_for_documents });
/** @deprecated Prefer factories instead. */
export const lendingApplicationWcaReviewing = lendingApplicationWcaFactory.build({ state: ApplicationState.reviewing });
/** @deprecated Prefer factories instead. */
export const lendingApplicationWcaDeclining = lendingApplicationWcaFactory.build({ state: ApplicationState.declining });
/** @deprecated Prefer factories instead. */
export const lendingApplicationWcaDeclined = lendingApplicationWcaFactory.build({ state: ApplicationState.declined });
/** @deprecated Prefer factories instead. */
export const lendingApplicationWcaCancelling = lendingApplicationWcaFactory.build({ state: ApplicationState.cancelling });
/** @deprecated Prefer factories instead. */
export const lendingApplicationWcaCancelled = lendingApplicationWcaFactory.build({ state: ApplicationState.cancelled });
/** @deprecated Prefer factories instead. */
export const lendingApplicationWcaExpiring = lendingApplicationWcaFactory.build({ state: ApplicationState.expiring });
/** @deprecated Prefer factories instead. */
export const lendingApplicationWcaExpired = lendingApplicationWcaFactory.build({ state: ApplicationState.expired });
/** @deprecated Prefer factories instead. */
export const lendingApplicationWcaAccepted = lendingApplicationWcaFactory.build({ state: ApplicationState.accepted });
/** @deprecated Prefer factories instead. */
export const lendingApplicationWcaKycVerifying = lendingApplicationWcaFactory.build({ state: ApplicationState.kyc_verifying });
/** @deprecated Prefer factories instead. */
export const lendingApplicationWcaHardHitting = lendingApplicationWcaFactory.build({ state: ApplicationState.hard_hitting });
/** @deprecated Prefer factories instead. */
export const lendingApplicationWcaHardHitFailing = lendingApplicationWcaFactory.build({ state: ApplicationState.hard_hit_failing });
/** @deprecated Prefer factories instead. */
export const lendingApplicationWcaHardHitFailed = lendingApplicationWcaFactory.build({ state: ApplicationState.hard_hit_failed });
/** @deprecated Prefer factories instead. */
export const lendingApplicationWcaLaasing = lendingApplicationWcaFactory.build({ state: ApplicationState.laasing });
/** @deprecated Prefer factories instead. */
export const lendingApplicationWcaKycFailing = lendingApplicationWcaFactory.build({ state: ApplicationState.kyc_failing });
/** @deprecated Prefer factories instead. */
export const lendingApplicationWcaKycFailed = lendingApplicationWcaFactory.build({ state: ApplicationState.kyc_failed });
/** @deprecated Prefer factories instead. */
export const lendingApplicationWcaCompleting = lendingApplicationWcaFactory.build({ state: ApplicationState.completing });
/** @deprecated Prefer factories instead. */
export const lendingApplicationWcaCompleted = lendingApplicationWcaFactory.build({ state: ApplicationState.completed });

/**======================= Application Bundles by State =====================**/

// Note: This is a direct mapping to the lending application states abstraction
// defined in 'api-entites/lending-=application.ts'

export const ALL_lendingApplications = [
  lendingApplicationPending,
  lendingApplicationWaitingForDocuments,
  lendingApplicationReviewing,
  lendingApplicationApproving,
  lendingApplicationApproved,
  lendingApplicationAccepted,
  lendingApplicationKycVerifying,
  lendingApplicationHardHitting,
  lendingApplicationLaasing,
  lendingApplicationCompleting,
  lendingApplicationCompleted,
  lendingApplicationKycFailing,
  lendingApplicationKycFailed,
  lendingApplicationHardHitFailing,
  lendingApplicationHardHitFailed,
  lendingApplicationDeclining,
  lendingApplicationDeclined,
  lendingApplicationCancelling,
  lendingApplicationCancelled,
  lendingApplicationExpiring,
  lendingApplicationExpired
];

export const INCOMPLETE_lendingApplications = ALL_lendingApplications.filter(app => INCOMPLETE_APP_STATES.includes(app.state));
export const COMPLETING_lendingApplications = ALL_lendingApplications.filter(app => COMPLETING_APP_STATES.includes(app.state));
export const NON_COMPLETING_lendingApplications = ALL_lendingApplications.filter(app => !COMPLETING_APP_STATES.includes(app.state));
export const COMPLETED_lendingApplications = ALL_lendingApplications.filter(app => COMPLETED_APP_STATES.includes(app.state));

export const FAILED_lendingApplications = ALL_lendingApplications.filter(app => FAILED_APP_STATES.includes(app.state));
export const DECLINED_lendingApplications = ALL_lendingApplications.filter(app => DECLINED_APP_STATES.includes(app.state));
export const CANCELLED_lendingApplications = ALL_lendingApplications.filter(app => CANCELLED_APP_STATES.includes(app.state));
export const EXPIRED_lendingApplications = ALL_lendingApplications.filter(app => EXPIRED_APP_STATES.includes(app.state));

export const IN_PROGRESS_lendingApplications = ALL_lendingApplications.filter(app => IN_PROGRESS_APP_STATES.includes(app.state));
export const APPROVED_lendingApplications = IN_PROGRESS_lendingApplications
  .filter(app => APPROVED_APP_STATES.includes(app.state));
export const BEFORE_APPROVED_lendingApplications = IN_PROGRESS_lendingApplications
  .filter(app => BEFORE_APPROVED_APP_STATES.includes(app.state));
export const DISREGARDED_lendingApplications = ALL_lendingApplications.filter(app => DISREGARDED_APP_STATES.includes(app.state));

/************************************ ZTT RESPONSES ********************************/

export const lendingApplicationResponseFactory = Factory.makeFactory<ZttResponse<LendingApplication>>({
  status: '200',
  message: 'success',
  data: lendingApplicationFactory.build()
});

export const lendingApplicationsResponseFactory = Factory.makeFactory<ZttResponse<LendingApplication[]>>({
  status: '200',
  message: 'success',
  data: [lendingApplicationFactory.build()]
});

export const postApplicationResponseFactory = Factory.makeFactory<ZttResponse<LendingApplication>>({
  status: '200',
  message: 'success',
  data: lendingApplicationFactory.build()
});

export const amendResponseFactory = Factory.makeFactory<ZttResponse<LendingApplication>>({
  status: '200',
  message: 'success',
  data: lendingApplicationFactory.build()
});
