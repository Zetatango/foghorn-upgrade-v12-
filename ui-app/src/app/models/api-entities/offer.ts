// TODO: Check the entire project and expand the use of these interface to every component that should use it.

import { LendingTerm } from 'app/models/api-entities/lending-term';
import { ApplicationState, Currency, OfferState, OfferType, PayeeType } from './utility';

export interface Offer {
  applications_in_progress: ApplicationSummary[];
  application_prerequisites: {
    offer_type: OfferType;
    payee: PayeeType;
    supplier_guid?: string;
  };
  available_amount: number;
  available_terms: LendingTerm[];
  default_loan_term: string;
  default_principal_amount: number;
  expires_at?: string;
  id: string;
  in_progress_amount: number;
  max_principal_amount: number;
  min_principal_amount: number;
  outstanding_balance: number;
  small_business_grade: SmallBusinessGrade;
  state: OfferState;
  used_amount: number;
}

export interface ApplicationSummary {
  applied_at: string;
  id: string;
  max_principal_amount: number;
  principal_amount: number;
  requested_amount: number;
  state: ApplicationState;
  updated_at: string;
}

export enum SmallBusinessGrade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  none = '-'
}

export interface OfferFee {
  offer_id: string;
  fee: number;
  principal_amount: number;
  currency: Currency;
  loan_term: LendingTerm;
  repayment_amount: number;
}

export const CLEAR_LENDING_FEE = {
  offer_id: null,
  fee: 0.0,
  currency: null,
  loan_term: null,
  principal_amount: 0.0,
  repayment_amount: 0.0
};

export const ALL_OFFER_STATES = Object.values(OfferState);

export const VALID_GRADES = Object.values(SmallBusinessGrade);

export const CERT_GRADE_ASSET_PATH = (grade: string, locale: string): string => `/assets/cert-grades/BM-certification-score-${grade}_${locale.toUpperCase()}.svg`;

export const NO_SCORE_ASSET_PATH = (locale: string): string => CERT_GRADE_ASSET_PATH(SmallBusinessGrade.none, locale);

export const VALID_TOOLTIPS = Object.values(SmallBusinessGrade).map((grade: string) => {
  return {
    title: `SMALL_BUSINESS_GRADE.TOOLTIP_TITLE_${grade}`,
    body: `SMALL_BUSINESS_GRADE.TOOLTIP_BODY_${grade}`
  };
});
