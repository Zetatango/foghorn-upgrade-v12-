export enum RepaymentSchedule { // See model/language.ts for localization helpers.
  daily = 'daily',
  weekly = 'weekly',
  bi_weekly = 'bi-weekly',
  monthly = 'monthly',
  none = 'none'
}

export enum TermUnit { // See model/language.ts for localization helpers.
  days = 'days',
  months = 'months',
  one_time = 'one_time',
  weeks = 'weeks'
}

export enum Currency {
  CAD = 'CAD'
}

export enum ApplicationState { // Lending
  pending = 'pending',
  waiting_for_documents = 'waiting_for_documents',
  reviewing = 'reviewing',
  approving = 'approving',
  approved = 'approved',
  declining = 'declining',
  declined = 'declined',
  cancelling = 'cancelling',
  cancelled = 'cancelled',
  expiring = 'expiring',
  expired = 'expired',
  accepted = 'accepted',
  kyc_verifying = 'kyc_verifying',
  kyc_failing = 'kyc_failing',
  kyc_failed = 'kyc_failed',
  hard_hitting = 'hard_hitting',
  laasing = 'laasing', // TODO: Once we figure out what will be done here define a better state name
  completing = 'completing',
  completed = 'completed',
  hard_hit_failing = 'hard_hit_failing',
  hard_hit_failed = 'hard_hit_failed'
}

export const AfterAcceptedApplicationStates = [ApplicationState.accepted, ApplicationState.kyc_verifying,
  ApplicationState.kyc_failing, ApplicationState.kyc_failed, ApplicationState.hard_hitting, ApplicationState.laasing,
  ApplicationState.completing, ApplicationState.completed, ApplicationState.hard_hit_failing, ApplicationState.hard_hit_failed];

/**
 * These are the supported countries by the app. Currently, Canada only.
 */
export enum Country {
  Canada = 'Canada'
}

export interface RetryConfig {
  initialInterval: number;
  retryCounter: number;
  maxAttempts: number;
  timeoutId?: any; // eslint-disable-line
  maxInterval?: number;
}

export enum OfferState { // Lending
  accepted = 'accepted',
  active = 'active', // An offer become active once an application has been completed against it.
  approved = 'approved',
  expired = 'expired',
  pending = 'pending',
  processing = 'processing',
  rejected = 'rejected',
}

export enum PayeeType {
  self = 'self',
  supplier = 'supplier',   // Note: Implies 'supplier_guid' is set in 'application_prerequisites'
  suppliers = 'suppliers',
}

export enum OfferType {
  LineOfCredit = 'loc',
  /** @deprecated Old remittance-based WCA */
  RemittanceBased = 'rba',
  WorkingCapitalAdvance = 'wca'
}

/**
 * This type is an alias solely used to type annotation enrichment purpose.
 *
 * DateString are expected to be <Date>s formatted in UTC string format !
 * See Date.toUTCString() helper.
 */
export type DateString = string;

/**
 * This type is an alias solely used to type annotation enrichment purpose.
 *
 * DateNumber are expected to be a <number> respresenting a <Date> in millisecondes.
 * See Date.getTime() helper.
 */
export type DateNumber = string;
