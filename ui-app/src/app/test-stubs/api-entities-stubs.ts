import { HttpHeaders } from '@angular/common/http';
import { ApplicantAuthenticationComplete } from 'app/models/api-entities/applicant-authentication-complete';
import { LendingAgreement } from 'app/models/api-entities/lending-agreement';
import { LendingApplication } from 'app/models/api-entities/lending-application';
import { LendingApplicationPost } from 'app/models/api-entities/lending-application-post';
import { Offer, SmallBusinessGrade } from 'app/models/api-entities/offer';
import { OfferState, OfferType, PayeeType, RepaymentSchedule } from 'app/models/api-entities/utility';
import { lendingApplicationApproved } from 'app/test-stubs/factories/lending-application';
import { offerFee } from 'app/test-stubs/factories/lending/offer-fee';
import { offerApproved } from 'app/test-stubs/factories/lending/offers';
import { supplierBeerStore, supplierInfoBeerStore } from 'app/test-stubs/factories/supplier';
import { ApplicantAuthentication, AuthenticationQuestion, AuthenticationQuestionAnswer } from 'app/models/api-entities/applicant-authentication';
import { userSessionFactory } from './factories/user-session';

// TODO slowly deprecate and use factories instead
/********************************* OLD FIXTURES ********************************/

// Bank Account Responses --------------------------------

/** @deprecated Favor use of factories instead. */
export const goodFlinksData = {
  status: 200,
  message: 'completed',
  data: 'completed'
};

/** @deprecated Favour use of factories instead. */
export const badFlinksData = {
  status: 404,
  message: 'query completed',
  data: { something: 'something' }
};

/** @deprecated Favour use of factories instead. */
export const http_flinksResponseUnprocessableEntity = {
  status: 422,
  error: {status: 422, code: 40010, message: 'Account is not a business account'},
  statusText: 'Unprocessable Entity',
  ok: false
};

// Offers Entities ------------------------------------------------------------------

/** @deprecated Favour use of factories instead. */
export const goodSupplierLocOffer: Offer = {
  applications_in_progress: [],
  application_prerequisites: {
    offer_type: OfferType.LineOfCredit,
    payee: PayeeType.supplier,
  },
  available_amount: 14500.00,
  available_terms: [],
  default_loan_term: '120',
  default_principal_amount: 8000.00,
  id: 'fvo_T3MteJERao5Qsv12',
  in_progress_amount: 0,
  max_principal_amount: 15000.00,
  min_principal_amount: 100.00,
  outstanding_balance: 500.00,
  small_business_grade: SmallBusinessGrade.C,
  state: OfferState.approved,
  used_amount: 500.00
};



// Applicant Authentication Entities --------------------------------------------------------

/** @deprecated Favour use of factories instead. */
export const goodApplicantAuthenticationQuestionAnswers: AuthenticationQuestionAnswer[] = [
  {
    id: 1,
    answer_text: 'Answer 1',
    correct_answer: false
  },
  {
    id: 2,
    answer_text: 'Answer 2',
    correct_answer: true
  },
  {
    id: 3,
    answer_text: 'Answer 3',
    correct_answer: false
  },
  {
    id: 4,
    answer_text: 'Answer 4',
    correct_answer: false
  },
  {
    id: 5,
    answer_text: 'None of the above',
    correct_answer: false
  }
];

/** @deprecated Favour use of factories instead. */
export const goodApplicantAuthenticationQuestions: AuthenticationQuestion[] = [
  {
    id: 1,
    question_text: 'What is the question?',
    answers: goodApplicantAuthenticationQuestionAnswers
  }
];

/** @deprecated Favour use of factories instead. */
export const goodApplicantAuthenticationEntity: ApplicantAuthentication = {
  guid: 'authq_123456789',
  questions: goodApplicantAuthenticationQuestions
};

// Applicant Authentication Response --------------------------------------------------------

/** @deprecated Favour use of factories instead. */
export const get_goodInitAuthenticateResponse = {
  status: 200,
  message: 'Authentication initiated',
  data: goodApplicantAuthenticationEntity
};

// Applicant Authentication Complete Entities -----------------------------------------------

/** @deprecated Favour use of factories instead. */
export const applicantAuthenticationCompleteSuccessEntity: ApplicantAuthenticationComplete = {
  authenticated: true
};

/** @deprecated Favour use of factories instead. */
export const applicantAuthenticationCompleteFailEntity: ApplicantAuthenticationComplete = {
  authenticated: false
};

// Applicant Authentication Complete Response -----------------------------------------------

/** @deprecated Favour use of factories instead. */
export const get_goodAuthenticateResponses = [
  {
    status: 'SUCCESS',
    message: 'Authenticated',
    data: applicantAuthenticationCompleteSuccessEntity
  },
  {
    status: 'SUCCESS',
    message: 'Authenticated',
    data: applicantAuthenticationCompleteFailEntity
  }
];

// Http Options -----------------------------------------------------------------------------

const sampleCsrfToken = 'e8mNWTnzsSqf6ZdqHVqaqQwyQU9gKGkQsYPSQHX16rNjVv2wgiVy1CteBWybEcTmHMPnbd3exqqtxmEYbMVXEK8n1i3gohJR5Wx8cFxAkd8aMmCxZL6FBeZosVp3v46k';

let fakeHttpHeaders = new HttpHeaders();
fakeHttpHeaders = fakeHttpHeaders.set('Accept', 'application/json');
fakeHttpHeaders = fakeHttpHeaders.set('Content-type', 'application/json');
fakeHttpHeaders = fakeHttpHeaders.set('X-CSRF-Token', sampleCsrfToken);

/** @deprecated Favour use of factories instead. */
export const fakeHttpOptions = {
  headers: fakeHttpHeaders
};

// POST /lending/application

/** @deprecated Favour use of factories instead. */
export const post_goodLendingApplication: LendingApplicationPost = {
  offer_id: offerApproved.id,
  principal_amount: 0,
  apr: 0,
  repayment_schedule: RepaymentSchedule.daily,
  merchant_user_email: userSessionFactory.build().email,
  merchant_user_id: userSessionFactory.build().id,
  interest_amount: offerFee.fee,
  repayment_amount: offerFee.repayment_amount,
  loan_term_id: offerFee.loan_term.id,

  // payor_account_id: '',
  payee_id: supplierBeerStore.id,
  payee_account_num: supplierInfoBeerStore.account_number,
  payee_invoice_num: supplierInfoBeerStore.invoice_number
};

// Lending Application Terms Entities -------------------------------------------------------

/** @deprecated Favour use of factories instead. */
export const goodLendingApplicationTerms: LendingAgreement = {
  content: '... sample ...'
};

// GET /lending/applications/:id/terms ------------------------------------------------------

/** @deprecated Favour use of factories instead. */
export const get_goodLendingApplicationTermsResponse = {
  status: 200,
  message: 'Loaded resource',
  data: goodLendingApplicationTerms
};

// Lending Application PAD Agreement Entities -----------------------------------------------

/** @deprecated Favour use of factories instead. */
export const goodLendingApplicationPadAgreement: LendingAgreement = {
  content: '... sample ...'
};

// GET /lending/applications/:id/pad_agreement ----------------------------------------------

/** @deprecated Favour use of factories instead. */
export const get_goodLendingApplicationPadAgreementResponse = {
  status: 200,
  message: 'Loaded resource',
  data: goodLendingApplicationPadAgreement
};

// Lending Application Accept Entities ------------------------------------------------------

/** @deprecated Favour use of factories instead. */
export const goodLendingApplicationAcceptResponse: LendingApplication = {
  ...lendingApplicationApproved,
  ...{ // Override specific properties:
    ubl_terms_agreed_at: null,
    pad_terms_agreed_at: null,
    payor_account_id: 'BawUG2UP-RTNn-R8ma-cosa-81ZxJG8LqbB6',
    client_ip_address: '192.0.2.1',
  }
};

// PUT /lending/applications/:id/accept -----------------------------------------------------

/** @deprecated Favour use of factories instead. */
export const put_goodLendingApplicationAcceptResponse = {
  status: 200,
  message: 'Loaded resource',
  data: goodLendingApplicationAcceptResponse
};
