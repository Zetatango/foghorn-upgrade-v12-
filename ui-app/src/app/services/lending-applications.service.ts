import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UtilityService } from './utility.service';
import { LendingApplicationPost } from 'app/models/api-entities/lending-application-post';
import { LendingApplicationAcceptPut } from 'app/models/api-entities/lending-application-accept-put';
import { LendingAgreement } from 'app/models/api-entities/lending-agreement';
import { ApplicationState } from 'app/models/api-entities/utility';
import {
  APPROVED_APP_STATES, BEFORE_APPROVED_APP_STATES,
  COMPLETED_APP_STATES,
  COMPLETING_APP_STATES,
  FAILED_APP_STATES,
  IN_PROGRESS_APP_STATES,
  LendingApplication,
  LendingApplicationFee
} from 'app/models/api-entities/lending-application';
import { API_LENDING_APPLICATIONS } from 'app/constants';
import { DocumentCode, DocumentState } from 'app/models/api-entities/merchant-document-status';
import { LendingTerm } from 'app/models/api-entities/lending-term';
import { LendingOfflinePayout } from 'app/models/api-entities/lending-offline-payout';
import { ZttResponse } from 'app/models/api-entities/response';

export enum ApplicationProgress {
  before_approved = 'BEFORE APPROVED',
  approved = 'APPROVED',
  completing = 'COMPLETING',
  invalid = 'INVALID IN PROGRESS STATE'
}

@Injectable({
  providedIn: 'root'
})
export class LendingApplicationsService {

  private _lendingApplications$: BehaviorSubject<LendingApplication[]> = new BehaviorSubject([]);
  private _lendingApplication$: BehaviorSubject<LendingApplication> = new BehaviorSubject(null);
  private _lendingApplicationFee$: BehaviorSubject<LendingApplicationFee> = new BehaviorSubject<LendingApplicationFee>(null);
  private _padAgreement$: BehaviorSubject<LendingAgreement> = new BehaviorSubject(new LendingAgreement());
  private _terms$: BehaviorSubject<LendingAgreement> = new BehaviorSubject(new LendingAgreement());

  get lendingApplications$(): BehaviorSubject<LendingApplication[]> {
    return this._lendingApplications$;
  }

  private setLendingApplications(lendingApplications: LendingApplication[]): void {
    this._lendingApplications$.next(lendingApplications);
  }

  get lendingApplication$(): BehaviorSubject<LendingApplication> {
    return this._lendingApplication$;
  }

  private setLendingApplication(lendingApplication: LendingApplication): void {
    this._lendingApplication$.next(lendingApplication);
  }

  get lendingApplicationFee$(): BehaviorSubject<LendingApplicationFee> {
    return this._lendingApplicationFee$;
  }

  private setLendingApplicationFee(lendingApplicationFee: LendingApplicationFee): void {
    this._lendingApplicationFee$.next(lendingApplicationFee);
  }

  get padAgreement$(): BehaviorSubject<LendingAgreement> {
    return this._padAgreement$;
  }

  private setPadAgreement(padAgreement: LendingAgreement): void {
    this._padAgreement$.next(padAgreement);
  }

  get terms$(): BehaviorSubject<LendingAgreement> {
    return this._terms$;
  }

  private setTerms(termsAgreement: LendingAgreement): void {
    this._terms$.next(termsAgreement);
  }

  constructor(
    private http: HttpClient,
    private utilityService: UtilityService
  ) {}

  // API CALLS

  postApplication(lendingApplicationPostEntity: LendingApplicationPost): Observable<ZttResponse<LendingApplication>> {
    const url = API_LENDING_APPLICATIONS.POST_NEW_PATH;
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.post(url, lendingApplicationPostEntity, httpOptions)
      .pipe(
        tap((res: ZttResponse<LendingApplication>) => this.setLendingApplication(res.data))
      );
  }

  loadPadAgreement(applicationId: string): Observable<ZttResponse<LendingAgreement>> {
    const url = API_LENDING_APPLICATIONS.GET_PAD_AGREEMENT_PATH.replace(':id', applicationId);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<LendingAgreement>) => this.setPadAgreement(res.data))
      );
  }

  loadTerms(applicationId: string): Observable<ZttResponse<LendingAgreement>> {
    const url = API_LENDING_APPLICATIONS.GET_TERMS_PATH.replace(':id', applicationId);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<LendingAgreement>) => this.setTerms(res.data))
      );
  }

  accept(applicationId: string, ublAgreedAt: boolean, padAgreedAt: boolean, payorAccountId = ''): Observable<ZttResponse<LendingApplication>> {
    // Note: In opt-in the sign_pad_agreement, sign_ubl_terms, accept_application should be decoupled actions.
    //       Would to refactor that as ZT API evolves.
    const url = API_LENDING_APPLICATIONS.PUT_ACCEPT_PATH.replace(':id', applicationId);
    const httpOptions = this.utilityService.getHttpOptionsForBody();
    const body: LendingApplicationAcceptPut = {
      ubl_terms_agreed: ublAgreedAt,
      pad_terms_agreed: padAgreedAt,
      payor_account_id: payorAccountId
    };

    return this.http.put(url, body, httpOptions)
      .pipe(
        tap((res: ZttResponse<LendingApplication>) => this.setLendingApplication(res.data))
      );
  }

  cancel(applicationId: string): Observable<ZttResponse<LendingApplication>> {
    const url = API_LENDING_APPLICATIONS.PUT_CANCEL_PATH.replace(':id', applicationId);
    const httpOptions = this.utilityService.getHttpOptionsForBody();
    const body = {};

    return this.http.put(url, body, httpOptions)
      .pipe(
        tap((res: ZttResponse<LendingApplication>) => this.setLendingApplication(res.data))
      );
  }

  loadApplications(): Observable<ZttResponse<LendingApplication[]>> {
    const url = API_LENDING_APPLICATIONS.GET_APPLICATIONS_PATH;
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<LendingApplication[]>) => this.setLendingApplications(res.data))
      );
  }

  loadApplication(id: string): Observable<ZttResponse<LendingApplication>> {
    const url = API_LENDING_APPLICATIONS.GET_APPLICATION_PATH.replace(':id', id);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<LendingApplication>) => this.setLendingApplication(res.data))
      );
  }

  amend(applicationId: string, principalAmount: number, loanTerm: LendingTerm): Observable<ZttResponse<LendingApplication>> {
    const url = `${API_LENDING_APPLICATIONS.PUT_AMEND_PATH.replace(':id', applicationId)}`
      + `?principal_amount=${principalAmount}&loan_term_id=${loanTerm.id}`;
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.put(url, {}, httpOptions)
      .pipe(
        tap((res: ZttResponse<LendingApplication>) => this.setLendingApplication(res.data))
      );
  }

  loadApplicationFee(applicationId: string, principalAmount: number, loanTerm: LendingTerm): Observable<ZttResponse<LendingApplicationFee>> {
    const url = `${API_LENDING_APPLICATIONS.GET_APPLICATION_FEE_PATH.replace(':id', applicationId)}`
      + `?principal_amount=${principalAmount}&loan_term_id=${loanTerm.id}`;
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<LendingApplicationFee>) => this.setLendingApplicationFee(res.data))
      );
  }

  // UTILITY METHODS

  /**
   * Less potent public setter for _lendingApplication.
   *
   * Assigns _lendingApplication BS to:
   *  - the processing lending application tied to provided offerId.
   *  - null if there is no lending application tied to the provided offerId.
   */
  setProcessingApplicationForOffer(applications: LendingApplication[], offerId: string): void {
    const app = this.findProcessingApplicationForOffer(applications, offerId);
    this.setLendingApplication(app);
  }

  /**
   * Assumption: Only 1 application can be in processing state.
   *
   * Return current application being processed ; returns null otherwise.
   *
   * If no application is found, then it is assumed there is no application currently being processed, which means either:
   *   1. There are no applications at all
   *   2. There are only applications in completed state
   *   3. Something bad has happened (for example, more than one application in failed/completing/in_progress state,
   *      which should not happen because we do not allow processing of more than 1 application at a time)
   *
   * @param applications
   * @param offerId
   */
  findProcessingApplicationForOffer(applications: LendingApplication[], offerId: string): LendingApplication | null {
    const res = this.findProcessingApplications(applications)
      .filter((app: LendingApplication) => app.offer_id === offerId);

    switch (res.length) {
      case 0:
        return null;
      case 1:
        return res[0];
      default:
        return null;
    }
  }

  findProcessingApplications(applications: LendingApplication[]): LendingApplication[] {
    return this.findApplicationsByStates(applications, IN_PROGRESS_APP_STATES);
  }

  findCompletedApplications(applications: LendingApplication[]): LendingApplication[] {
    return this.findApplicationsByStates(applications, COMPLETED_APP_STATES);
  }

  findFailedApplications(applications: LendingApplication[]): LendingApplication[] {
    return this.findApplicationsByStates(applications, FAILED_APP_STATES);
  }

  isApplicationInProgress(applicationState: ApplicationState): boolean {
    return IN_PROGRESS_APP_STATES.includes(applicationState);
  }

  getApplicationProgress(applicationState: ApplicationState): ApplicationProgress {
    if (BEFORE_APPROVED_APP_STATES.includes(applicationState)) {
      return ApplicationProgress.before_approved;
    }

    if (APPROVED_APP_STATES.includes(applicationState)) {
      return ApplicationProgress.approved;
    }

    if (COMPLETING_APP_STATES.includes(applicationState)) {
      return ApplicationProgress.completing;
    }

    return ApplicationProgress.invalid;
  }

  /**
   * Returns list of applications with states matching a given list of states.
   *
   * @param applications
   * @param states
   */
  findApplicationsByStates(applications: LendingApplication[], states: ApplicationState[]): LendingApplication[] {
    return applications.filter((app: LendingApplication) => states.includes(app.state));
  }

  /**
   * Returns the application with states matching a given id.
   *
   * @param applications
   * @param id
   */
  findApplicationById(applications: LendingApplication[], id: string): LendingApplication {
    return applications && id && applications.length > 0 ? applications.find(app => app.id === id) : null;
  }

  /**
   * Returns list of document codes that are required.
   *
   * @param application
   */
  getRequiredDocuments(application: LendingApplication): DocumentCode[] {
    return application.required_documents.reduce((res, doc) => {
      if (doc.state === DocumentState.required) {
        res.push(doc.code);
      }
      return res;
    }, []);
  }

  /**
   * Sets lending application fee to null.
   */
  clearLendingApplicationFee(): void {
    this.setLendingApplicationFee(null);
  }

  // SYNCHRONOUS HELPERS

   // returns true if application has been approved, returns false otherwise.
  applicationApproved(application: LendingApplication): boolean {
    return APPROVED_APP_STATES.includes(application.state);
  }

  // returns true if application is in completing state, returns false otherwise.
  applicationCompleting(application: LendingApplication): boolean {
    return COMPLETING_APP_STATES.includes(application.state);
  }

  /**
   * Returns the sum of the passed payouts' amounts values.
   */
  getPayoutsSum(payouts: LendingOfflinePayout[]): number {
    return payouts ? payouts.reduce((res, payout) => res + payout.amount, 0) : 0;
  }

  /**
   * Returns true if offline_payouts field in application is present and has more than 0 elements. Returns false otherwise.
   */
  hasPayouts(application: LendingApplication): boolean {
    return application && application.offline_payouts ? application.offline_payouts.length > 0 : false;
  }

  /**
   * Returns true if term_signature_required is set and true.
   */
  requiresSignature(application: LendingApplication): boolean {
    return application && application.terms_signature_required ? application.terms_signature_required : false;
  }
}
