import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_LENDING, SELECTED_OFFER_ID_KEY } from 'app/constants';
import * as storage from 'app/helpers/storage.helper';
import {
  APPROVED_APP_STATES,
  BEFORE_APPROVED_APP_STATES,
  COMPLETING_APP_STATES,
  DISREGARDED_APP_STATES
} from 'app/models/api-entities/lending-application';
import { ApplicationSummary, Offer, OfferFee } from 'app/models/api-entities/offer';
import { LendingTerm } from 'app/models/api-entities/lending-term';
import { AfterAcceptedApplicationStates, OfferState, OfferType } from 'app/models/api-entities/utility';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UtilityService } from './utility.service';
import { LogMessage, LogSeverity } from '../models/api-entities/log';
import { LoggingService } from './logging.service';
import { ZttResponse } from 'app/models/api-entities/response';

@Injectable()
export class OfferService {
  // Note: [Graham] service inheritance is coming to break some of this apart.
  covidFinancingDisabled: boolean;
  requestedAmount: number;

  private _offers$ = new BehaviorSubject<Offer[]>([]);
  private _offer$ = new BehaviorSubject<Offer>(null);
  private _offerFee$ = new BehaviorSubject<OfferFee>(null);

  /** ====================================================================== **/
  /** ===================== SERVICE PUBLIC VARIABLES ======================= **/
  /** ====================================================================== **/

  // Note: [Graham] potentially change to class variable.
  get offers$(): BehaviorSubject<Offer[]> {
    return this._offers$;
  }

  private setOffers(offers: Offer[]) {
    this._offers$.next(offers);
  }
  // TODO: [Graham] we never subscribe to this. Make component var.
  get offer$(): BehaviorSubject<Offer> {
    return this._offer$;
  }

  /**
   * Stores the passed in offer.id in local storage if it exists,
   * otherwise it will wipe the storage if the offer is null.
   * It then sets the local offer.value.
   */
  setOffer(offer: Offer): void {
    if (offer) {
      storage.local.setItem(SELECTED_OFFER_ID_KEY, offer.id); // store id in local storage
    } else {
      storage.local.removeItem(SELECTED_OFFER_ID_KEY); // remove from local storage
    }

    this._offer$.next(offer);
  }

  get offerFee$(): BehaviorSubject<OfferFee> {
    return this._offerFee$;
  }

  private setOfferFee(offerFee: OfferFee) {
    this._offerFee$.next(offerFee);
  }

  /**
   * Returns the locally stored Offer.id, or null if none exists.
   */
  get currentOfferId(): string | null {
    return storage.local.getItem(SELECTED_OFFER_ID_KEY);
  }

  /**
   * Returns a single match from offers$ with the locally stored Offer.id, or undefined if none exist.
   */
  get selectedOffer(): Offer | undefined {
    return this.findOfferById(this.currentOfferId);
  }

  /**
   * Returns a single match from offers$ with the OfferType of LoC, or undefined if none exist.
   */
  get locOffer(): Offer | undefined {
    return this.offers$?.value.find((offer: Offer) => this.isOfferLoc(offer));
  }

  /**
   * Returns a single match from offers$ with the OfferType of WCA, or undefined if none exist.
   */
  get wcaOffer(): Offer | undefined {
    return this.offers$?.value.find((offer: Offer) => this.isOfferWca(offer));
  }

  constructor(
    private loggingService: LoggingService,
    private utilityService: UtilityService,
    private http: HttpClient
  ) {}

  /** ====================================================================== **/
  /** ========================= OFFER(S) LOADING =========================== **/
  /** ====================================================================== **/

  // API CALLS
  // Note: [Graham] make an error response logger.
  // Is there a way to check in the service if an offer is stale, and to automatically load them on method calls?
  loadOffers$(): Observable<ZttResponse<Offer[]>> {
    const url = API_LENDING.GET_OFFERS_PATH;
    const httpOptions = this.utilityService.getHttpOptionsForBody();
    return this.http.get(url, httpOptions)
      .pipe(
        tap(
          (res: ZttResponse<Offer[]>) => this.setOffers(res.data)
        )
      );
  }

  loadOffer$(offerId: string, supplierId?: string): Observable<ZttResponse<Offer>> {
    const url = supplierId === undefined || supplierId === null ? API_LENDING.GET_OFFER_PATH.replace(':id', offerId) :
      this.utilityService.getAugmentedUrl(API_LENDING.GET_OFFER_PATH.replace(':id', offerId), { supplier_id: supplierId });
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap(
          (res: ZttResponse<Offer>) => this.setOffer(res.data)
        )
      );
  }

  loadOfferFee$(offerId: string, principalAmount: number, loanTerm: LendingTerm): Observable<ZttResponse<OfferFee>> {
    const url = `${API_LENDING.GET_OFFER_FEE_PATH}?id=${offerId}&principal_amount=${principalAmount}&loan_term_id=${loanTerm.id}`;
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap(
          (res: ZttResponse<OfferFee>) => this.setOfferFee(res.data)
        )
      );
  }

  /**
   * Returns a single match from offers$ with the specified offerId, or undefined if none exist.
   */
  findOfferById(offerId: string): Offer | undefined {
    return this.offers$.value.find((offer: Offer) => offer.id === offerId);
  }

  /**
   * Returns a single match from offers$ with the specified offerState, or undefined if none exist.
   */
  findOffersByState(offerState: OfferState): Offer[] | undefined {
    return this.offers$?.value.filter((offer: Offer) => offer.state === offerState);
  }

  /**
   * Sets the current offer$ to the locally stored offer, if one exists.
   */
  // Note: [Graham] we may be able to consolidate this and setOffer.
  loadSelectedOffer(): void {
    const offer = this.selectedOffer;

    if (offer) this.setOffer(offer);
  }

  /** ====================================================================== **/
  /** ========================= OFFER(S) HELPERS =========================== **/
  /** ====================================================================== **/

  offersExist(): boolean {
    return this.offers$.value.some(offer => this.isAnOffer(offer));
  }

  /**
   * Checks to see if the offer is an actual valid Offer type.
   */
  isAnOffer(offer: Offer): offer is Offer {
    return (offer as Offer)?.application_prerequisites?.offer_type !== undefined;
  }

  isOfferLoc(offer: Offer): boolean {
    return this.checkOfferType(offer, OfferType.LineOfCredit);
  }

  isOfferWca(offer: Offer): boolean {
    return this.checkOfferType(offer, OfferType.WorkingCapitalAdvance);
  }

  /**
   * Returns true if offer and offer state are truthy and offer is in rejected state. Returns false otherwise.
   */
  isOfferRejected(offer: Offer): boolean {
    return offer?.state === OfferState.rejected;
  }

  /**
   * Returns true if offer is rejected and has an application in progress.
   */
  // Note: [Graham] this logic can be removed.
  isOfferTemporarilyAvailable(offer: Offer): boolean {
    return this.isOfferRejected(offer) && !!this.getInProgressApplication(offer);
  }

  /**
   * Returns true if offer and offer state are truthy and offer is not in rejected state.
   * Returns false otherwise.
   */
  isOfferAvailable(offer: Offer): boolean {
    return !this.isOfferRejected(offer) || this.isOfferTemporarilyAvailable(offer);
  }

  blockOnKycFailure(offer: Offer): boolean {
    // Don't block unless there is an application in progress beyond accept status
    const afterAcceptedApplications = offer?.applications_in_progress?.filter((app: ApplicationSummary) => AfterAcceptedApplicationStates.includes(app.state));
    return afterAcceptedApplications?.length > 0;
  }

  /**
   * Logs an error if a component was initialized without a proper Offer.
   */
  checkOfferValid(offer: Offer): boolean {
    if (this.isAnOffer(offer)) return true;

    const logMessage: LogMessage = { message: 'Component initialized with undefined Offer.', severity: LogSeverity.warn };
    this.loggingService.log(logMessage);

    return false;
  }

  /**
   * Logs an error if a component was initialized without a proper OfferType.
   */
  checkOfferTypeValid(offerType: OfferType): boolean {
    if ([OfferType.LineOfCredit, OfferType.WorkingCapitalAdvance].includes(offerType)) {
      return true;
    } else {
      const logMessage: LogMessage = { message: 'Component initialized with undefined OfferType.', severity: LogSeverity.warn };
      this.loggingService.log(logMessage);
      return false;
    }
  }

  /**
   * Returns first application summary for given offer, or undefined if there are none.
   * @returns ApplicationSummary
   */
  getInProgressApplication(offer: Offer): ApplicationSummary {
    return offer?.applications_in_progress?.[0];
  }

  /** ====================================================================== **/
  /** ========================== OFFER METRICS ============================= **/
  /** ====================================================================== **/

  getOfferApplicationState(offer: Offer): string {
    if (!offer) return;

    const applicationState = this.getInProgressApplication(offer)?.state;

    if (APPROVED_APP_STATES.includes(applicationState)) {
      return 'APPROVED'; // only applies to WCA
    } else if ((BEFORE_APPROVED_APP_STATES.concat(COMPLETING_APP_STATES)).includes(applicationState)) {
      return 'IN_PROGRESS';
    } else if (DISREGARDED_APP_STATES.includes(applicationState)) {
      return 'INVALID';
    } else {
      // Note: [Graham] We should discern between the OfferState.active if no application exists, and the offer isn't NEW.
      return 'NEW';
    }
  }

  getOfferAvailableAmount(offer: Offer): number {
    if (!this.isOfferLoc(offer)) return 0;

    const availableAmount = offer.available_amount - offer.in_progress_amount;
    return availableAmount > 0 ? availableAmount : 0;
  }

  /**
   * This will return the maximum amount available on the Offer.
   */
  getOfferCapacity(offer: Offer): number {
    if (!offer?.max_principal_amount) return 0;
    // Note: [Graham] log something if the available amount is larger than the max amount.
    return (this.getOfferAvailableAmount(offer) / offer.max_principal_amount) * 100;
  }

  /**
   * This will return whether or not the remaining amount can be withdrawn.
   * @note: This ONLY applies to LoC.
   */
  getOfferFundsAccessible(offer: Offer): boolean {
    return this.getOfferAvailableAmount(offer) >= offer?.min_principal_amount;
  }

  getExpiryDate(offer: Offer): Date | null {
    return offer.expires_at ? new Date(offer.expires_at) : null;
  }

  isOfferExpired(offer: Offer): boolean {
    return offer.state === OfferState.expired;
  }

  // OFFERS SELECTION LOGIC
  // Note: [Graham] this logic is stop gap. Should be removed.
  // used in OnboardingFlow.loadOffers()
  setOfferToLoc(): void {
    this.setOffer(this.locOffer);
  }

  /** ====================================================================== **/
  /** ============================ OFFER RESETS ============================ **/
  /** ====================================================================== **/

  /**
   * Sets Offer subject to null.
   */
  clearCurrentOffer(): void {
    this.setOffer(null);
  }

  /**
   * Sets OfferFee subject to null.
   */
  clearOfferFee(): void {
    this.setOfferFee(null);
  }

  /** ============================== PRIVATE =============================== **/

  private checkOfferType(offer: Offer, offerType: OfferType): boolean {
    return offer?.application_prerequisites?.offer_type === offerType;
  }

  /** ====================================================================== **/
  /** ======================= LEGACY WCA FUNCTIONALITY ===================== **/
  /** ====================================================================== **/

  /**
   * @returns Number, amount to display to the user, depending on WCA application state.
   */
  getOfferWcaAvailableAmount(offer: Offer): number {
    if (!this.isOfferWca(offer)) return 0;

    const application = this.getInProgressApplication(offer);

    // Note: [Graham] at some point there will be no new WCA loans, and will always return max_principal_amount;
    if (APPROVED_APP_STATES.includes(application?.state)) {
      return application.max_principal_amount;
    } else if ((BEFORE_APPROVED_APP_STATES.concat(COMPLETING_APP_STATES)).includes(application?.state)) {
      return application.requested_amount;
    } else {
      return offer.max_principal_amount;
    }
  }
}
