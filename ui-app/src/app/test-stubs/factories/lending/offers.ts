import * as Factory from 'factory.ts';
import { Offer, SmallBusinessGrade } from 'app/models/api-entities/offer';
import { OfferState, PayeeType, OfferType } from 'app/models/api-entities/utility';
import {
  lendingTerm60Days,
  lendingTerm90Days,
  lendingTerm120Days,
  lendingTerm6weeks,
  lendingTerm10weeks,
  lendingTerm14weeks,
  lendingTerm6months,
  lendingTerm9months,
  lendingTerm12months
} from 'app/test-stubs/factories/lending-term';
import { ApplicationState } from 'app/models/api-entities/utility';
import { applicationSummaryFactory } from 'app/test-stubs/factories/application-summary';

/**========================= OfferType.LineOfCredit =========================**/

/********************************* FACTORIES **********************************/
// TODO: [Graham] I'd rather have a clean offer with no used amount, and available matching max. Adjust failing tests later.
export const offerFactory = Factory.Sync.makeFactory<Offer>({
  applications_in_progress: [],
  application_prerequisites: {
    payee: PayeeType.suppliers,
    offer_type: OfferType.LineOfCredit,
  },
  available_amount: 5000,
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
  default_loan_term: '120',
  default_principal_amount: 0,
  expires_at: new Date(2022, 1, 1).toISOString(),
  id: 'lo_1',
  in_progress_amount: 0,
  max_principal_amount: 5000,
  min_principal_amount: 500,
  outstanding_balance: 0,
  small_business_grade: SmallBusinessGrade.A,
  state: OfferState.approved,
  used_amount: 0
});

/********************************** FIXTURES **********************************/

// Generic:
export const offer = offerFactory.build();

// States:
export const offerApproved = offer;
export const offerPending = offerFactory.build({state: OfferState.pending});
export const offerActive = offerFactory.build({state: OfferState.active});
export const offerAccepted = offerFactory.build({state: OfferState.accepted});
export const offerProcessing = offerFactory.build({state: OfferState.processing});
export const offerRejected = offerFactory.build({state: OfferState.rejected});

export const offerApprovedWithSignedApp = offerFactory.build(
  {
    state: OfferState.approved,
    applications_in_progress: [applicationSummaryFactory.build({state: ApplicationState.laasing})]
  });

export const offerApprovedWithNonSignedApp = offerFactory.build(
  {
    state: OfferState.approved,
    applications_in_progress: [applicationSummaryFactory.build({state: ApplicationState.pending})]
  });

export const offerNoPreapproval = offerFactory.build({
  application_prerequisites: {
    payee: PayeeType.suppliers,
    supplier_guid: 'su_5cEi8DdJ1RYN15EM',
    offer_type: OfferType.LineOfCredit,
  },
  max_principal_amount: 0.0
});

export const offerUnsupportedOfferTypeApproved = offerFactory.build({
  application_prerequisites: {
    payee: null,
    offer_type: null,
  }
});

/**===================== OfferType.WorkingCapitalAdvance ====================**/

/********************************* FACTORIES **********************************/

export const offerWcaFactory = offerFactory.extend({
  id: 'lo_2',
  max_principal_amount: 300000,
  available_amount: 300000,
  small_business_grade: SmallBusinessGrade.none,
  available_terms: [
    lendingTerm6weeks,
    lendingTerm10weeks,
    lendingTerm14weeks,
    lendingTerm6months,
    lendingTerm9months,
    lendingTerm12months
  ],
  application_prerequisites: {
    payee: PayeeType.self,
    offer_type: OfferType.WorkingCapitalAdvance,
  }
});

/********************************** FIXTURES **********************************/

// Generic:
export const offerWca = offerWcaFactory.build();

// States:
export const offerWcaApproved = offerWca;
export const offerWcaPending = offerWcaFactory.build({state: OfferState.pending});
export const offerWcaActive = offerWcaFactory.build({state: OfferState.active});
export const offerWcaAccepted = offerWcaFactory.build({state: OfferState.accepted});
export const offerWcaProcessing = offerWcaFactory.build({state: OfferState.processing});
export const offerWcaRejected = offerWcaFactory.build({state: OfferState.rejected});
