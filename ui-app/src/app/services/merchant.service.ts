import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import Bugsnag from '@bugsnag/js';
import { API_BUSINESS_PARTNER, API_MERCHANT, CONSTANTS, ONBOARDING } from 'app/constants';
import { MerchantDocumentsListing } from 'app/documents/models/merchant-documents-listing';
import { MerchantDocumentsQuery } from 'app/documents/models/merchant-documents-query';
import { Address } from 'app/models/address';
import {
  KycCheck,
  KycCheckStatus,
  KycCheckType,
  Merchant,
  MerchantPost,
  MerchantPut,
  QuickBooksState
} from 'app/models/api-entities/merchant';
import {
  MerchantQueryPost,
  MerchantQueryResponse,
  MerchantQuerySelectPost
} from 'app/models/api-entities/merchant-query';
import { ZttResponse } from 'app/models/api-entities/response';
import { Country } from 'app/models/api-entities/utility';
import { Business } from 'app/models/business';
import { ErrorMessage } from 'app/models/error-response';
import { Province } from 'app/models/province';
import { MerchantUpdateThrottling } from 'app/services/business-logic/merchant-update-throttling';
import { UtilityService } from 'app/services/utility.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { startOfDay } from 'date-fns';

@Injectable()
export class MerchantService {
  private delegatedMode = false;
  private httpOptions: any = {}; // eslint-disable-line

  logoutUrl: string;
  accountInfoUrl: string;

  private _merchant: BehaviorSubject<Merchant> = new BehaviorSubject(null);
  private merchantQueryResponse = new BehaviorSubject<MerchantQueryResponse>(null);

  private _isDelinquent$ = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private meta: Meta,
    private utilityService: UtilityService
  ) {
    this.setLogoutUrl();
    this.setAccountInfoUrl();
  }

  get merchantId(): string {
    return this._merchant.getValue()?.id;
  }

  // GETTERS & SETTERS
  // Note: [Graham] reconstruct merchant service in similar fashion to lending and ubls services.
  get merchantObs(): BehaviorSubject<Merchant> { // Note: [Graham] change naming convention.
    return this._merchant;
  }

  /** @deprecated Prefer merchantService.merchantObs getter. */
  getMerchant(): Merchant {
    return this._merchant.getValue();
  }

  /** @warning This method is meant to be used sparsely at service level only. */
  setMerchant(merchant: Merchant): void {
    this.sanitizeProperties(merchant);
    this.setIsDelinquent(merchant);
    this._merchant.next(merchant);
  }

  get isDelinquent$(): BehaviorSubject<boolean> {
    return this._isDelinquent$;
  }

  private setIsDelinquent(merchant: Merchant): void {
    this._isDelinquent$.next(merchant?.delinquent);
  }

  getMerchantQueryResponse(): MerchantQueryResponse {
    return this.merchantQueryResponse.getValue();
  }

  private setMerchantQueryResponse(response: MerchantQueryResponse): void {
    this.merchantQueryResponse.next(response);
  }

  setLogoutUrl(): void {
    this.logoutUrl = this.meta.getTag(CONSTANTS.LOGOUT_URL_KEY) ? this.meta.getTag(CONSTANTS.LOGOUT_URL_KEY).content : null;
  }

  getMerchantOutstandingBalance(): number {
    return this.merchantObs?.value.total_remaining_payment_amount || 0;
  }

  setAccountInfoUrl(): void {
    this.accountInfoUrl = this.meta.getTag(CONSTANTS.ACCOUNT_INFO_URL_KEY) ? this.meta.getTag(CONSTANTS.ACCOUNT_INFO_URL_KEY).content : null;
  }

  // HELPERS

  isDelegatedAccessMode(): boolean {
    return this.delegatedMode === true;
  }

  isKycProfilePresent(): boolean {
    const merchant = this.getMerchant();
    return !!merchant && !!merchant.kyc_verified &&
      !!merchant.kyc_verified.details && !!merchant.kyc_verified.status;
  }

  isKycUnverified(): boolean {
    const merchant = this.getMerchant();
    return !this.isKycProfilePresent() || [KycCheckStatus.in_progress, KycCheckStatus.unverified].includes(merchant.kyc_verified.status);
  }

  isKycFailed(): boolean {
    const merchant = this.getMerchant();
    return !this.isKycProfilePresent() || merchant.kyc_verified.status === KycCheckStatus.failed;
  }

  isAuthenticationFailed(applicantId: string): boolean {
    const merchant = this.getMerchant();

    if (!this.isKycProfilePresent()) {
      return true; // [Fail-safe] Don't report authentication as verified if data is missing or malformed.
    }

    const matches = merchant.kyc_verified.details.filter((kycCheck: KycCheck) => {
      return (kycCheck.guid === applicantId) &&
        (kycCheck.check === KycCheckType.IA) &&
        (kycCheck.status === KycCheckStatus.failed);
    });

    /* istanbul ignore next */
    if (matches.length > 1) { // There is no point unit-testing this clause.
      const e = new ErrorMessage('Unexpected duplicate authentication check detected in kyc verified profile.');
      Bugsnag.notify(e);
    }
    return matches.length === 1;
  }

  /**
   * Returns true if the KYC check for authentication is present and has either verified or failed status.
   */
  authenticationCheckComplete(applicantId: string): boolean {
    const merchant = this.getMerchant();
    if (!applicantId || !this.isKycProfilePresent()) {
      return false;
    }

    const matches = merchant.kyc_verified.details
      .filter((kycCheck: KycCheck) => {
        return (kycCheck.guid === applicantId) &&
          (kycCheck.check === KycCheckType.IA) &&
          ([KycCheckStatus.verified, KycCheckStatus.failed].includes(kycCheck.status));
      });

    /* istanbul ignore next */
    if (matches.length > 1) { // There is no point unit-testing this clause.
      const e = new ErrorMessage('Unexpected duplicate authentication check detected in kyc verified profile.');
      Bugsnag.notify(e);
    }
    return (matches.length === 1);
  }

  /**
   * Returns true if the KYC check for confirmation of existence is present and its status is failed.
   */
  isCOECheckFailed(): boolean {
    const merchant = this.getMerchant();
    if (!this.isKycProfilePresent()) {
      return true; // [Fail-safe] Don't report COE as verified if data is missing or malformed.
    }

    const matches = merchant.kyc_verified.details
      .filter((kycCheck: KycCheck) => {
        return (kycCheck.guid === merchant.id) &&
          (kycCheck.check === KycCheckType.COE) &&
          (kycCheck.status === KycCheckStatus.failed);
      });

    /* istanbul ignore next */
    if (matches.length > 1) { // There is no point unit-testing this clause.
      const e = new ErrorMessage('Unexpected duplicate confirmation of existance check detected in kyc verified profile.');
      Bugsnag.notify(e);
    }
    return (matches.length === 1);
  }

  /**
   * Returns true if merchant is set and selected_bank_account is set to a non empty and non null value. Returns false otherwise.
   */
  merchantHasSelectedBankAccount(): boolean {
    return !!this.getMerchant() && !!this.getMerchant().selected_bank_account;
  }

  /**
   * Indicates whether we need to collect sales volume for the merchant.
   *
   * Return false if there is no merchant.
   * Return true if selected_sales_volume_accounts is not set.
   * Return true if selected_sales_volume_accounts is empty, false otherwise.
   */
  merchantSalesVolumeRequired(): boolean {
    if (!this.getMerchant()) {
      return false;
    } else if (!this.getMerchant().selected_sales_volume_accounts) {
      return true;
    } else {
      return this.getMerchant().selected_sales_volume_accounts.length === 0;
    }
  }

  /**
   * Returns true when the merchant has connected QuickBooks to Ario
   */
  isQuickBooksConnected(): boolean {
    return this.getMerchant().quickbooks_state !== QuickBooksState.notConnected;
  }

  // API CALLS

  queryMerchant(merchantQueryPost: MerchantQueryPost): Observable<ZttResponse<MerchantQueryResponse>> {
    const httpHeaders = this.utilityService.getHttpOptionsForBody();
    const url = ONBOARDING.POST_MERCHANT_QUERY_PATH;

    return this.http.post(url, UtilityService.trimParameters(merchantQueryPost), httpHeaders)
      .pipe(
        tap((res: ZttResponse<MerchantQueryResponse>) => this.setMerchantQueryResponse(res.data))
      );
  }

  loadMerchant(): Observable<ZttResponse<Merchant>> {
    const url = API_MERCHANT.GET_MERCHANTS_PATH;
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<Merchant>) => this.setMerchant(res.data))
      );
  }

  postMerchant(merchant: MerchantPost): Observable<ZttResponse<Merchant>> {
    const url = API_MERCHANT.POST_MERCHANTS_PATH;
    const body = UtilityService.trimParameters(merchant);
    const httpOptions = this.utilityService.getHttpOptionsForBody();
    return this.http.post<ZttResponse<Merchant>>(url, body, httpOptions);
  }

  updateDesiredBankAccountBalance(id: string, balance: number): Observable<ZttResponse<Merchant>>{
    const body: MerchantPut = {
      id: id,
      desired_bank_account_balance: balance
    }
    return this.updateMerchant(body);
  }
  
  updateMerchant(merchantPut: MerchantPut, recordUpdate = false): Observable<ZttResponse<Merchant>> {
    const url = API_MERCHANT.PUT_MERCHANTS_PATH.replace(':id', merchantPut.id);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.put<ZttResponse<Merchant>>(url, UtilityService.trimParameters(merchantPut), httpOptions)
      .pipe(
        tap(
          (res: ZttResponse<Merchant>) => {
            this.setMerchant(res.data);

            if (recordUpdate) {
              MerchantUpdateThrottling.recordMerchantUpdate(merchantPut.id);
            }
          }
        )
      );
  }

  /**
   * Uses the params to retrieve a MerchantDocumentListing response containing,
   * among other things, an array of merchant documents to be used.
   *
   * @returns Observable<MerchantDocumentsListing>
   * @param params
   */
  getMerchantDocuments(params: MerchantDocumentsQuery): Observable<MerchantDocumentsListing> {
    const url = this.utilityService.getAugmentedUrl(API_MERCHANT.GET_MERCHANT_DOCUMENTS_PATH, params);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get<ZttResponse<MerchantDocumentsListing>>(url, httpOptions)
      .pipe(
        map(res => res.data),
      );
  }

  becomeBusinessPartner(): Observable<ZttResponse<void>> {
    const url = API_BUSINESS_PARTNER.POST_BUSINESS_PARTNER_NEW_PATH;
    const httpOptions = this.utilityService.getHttpOptionsForBody();
    const merchantId = this.getMerchant().id;
    const params = {
      merchant_guid: merchantId
    };

    return this.http.post<ZttResponse<void>>(url, UtilityService.trimParameters(params), httpOptions);
  }

  refreshOffers$(): Observable<ZttResponse<void>> {
    const url = API_MERCHANT.REFRESH_OFFERS_PATH;
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.post<ZttResponse<void>>(url, {}, httpOptions);
  }

  // MISC CALLSz

  // TODO [Refactor]: It would be better to extract logOut(), logOutDelegated(), setLogoutUrl() & logoutUrl.
  //                  Also, logOut() doesn't seem to be used anywhere.

  async logOut(): Promise<any> { // eslint-disable-line
    return await this.http.get(this.logoutUrl)
      .toPromise();
  }

  async logOutDelegated(): Promise<any> { // eslint-disable-line
    return await this.http.post(CONSTANTS.DELEGATED_LOGOUT, {}, this.httpOptions).toPromise();
  }

  async requestAssistance(reason: string): Promise<ZttResponse<void>> {
    const httpHeaders = this.utilityService.getHttpOptionsForBody();
    const url = API_MERCHANT.REQUEST_ASSISTANCE_PATH;
    const body = {reason: reason};

    return await this.http.post<ZttResponse<void>>(url, body, httpHeaders).toPromise();
  }

  private sanitizeProperties(merchant): void {
    if (!merchant) {
      return;
    }

    if (!Object.keys(Province).includes(merchant.incorporated_in)) {
      merchant.incorporated_in = null;
    }

    if (!Object.keys(Province).includes(merchant.state_province)) {
      merchant.state_province = null;
    }
  }


  // HELPERS
  buildMerchantQueryPost(businessData: Business, addressData: Address): MerchantQueryPost {
    if (businessData && addressData) {
      return {
        name: businessData.name,
        phone_number: businessData.phone_number,
        address_line_1: addressData.address_line_1,
        city: addressData.city,
        state_province: addressData.state_province,
        postal_code: addressData.postal_code,
        country: Country.Canada
      };
    } // TODO [Val] Else case should probably not just return undefined silently.
  }

  /**
   * Uses address and business objects to create a MerchantPost object.
   */
  buildMerchantPost(businessData: Business, addressData: Address, lead_guid: string): MerchantPost {
    if (businessData && addressData) {
      return {
        name: businessData.name,
        phone_number: businessData.phone_number,
        industry: businessData.industry,
        address_line_1: addressData.address_line_1,
        city: addressData.city,
        country: Country.Canada,
        postal_code: addressData.postal_code,
        state_province: addressData.state_province,
        onboarding: true,
        business_num: businessData.business_num,
        incorporated_in: businessData.incorporated_in,
        doing_business_as: businessData.doing_business_as,
        lead_guid: lead_guid,
        owner_since: businessData.owner_since ? startOfDay(businessData.owner_since).toISOString() : undefined,
        self_attested_date_established: businessData.self_attested_date_established ? startOfDay(businessData.self_attested_date_established).toISOString() : undefined,
        self_attested_average_monthly_sales: businessData.self_attested_average_monthly_sales ? Number(businessData.self_attested_average_monthly_sales) : undefined
      };
    } // TODO [Val] Else case should probably not just return undefined silently.
  }

  /**
   * Uses query id, business id, and business object to create a MerchantQuerySelect object
   */
  buildMerchantQuerySelectPost(businessData: Business, queryId: string, businessId: string, lead_guid: string): MerchantQuerySelectPost {
    if (businessData && queryId && businessId) {
      return {
        business_id: businessId,
        query_id: queryId,
        industry: businessData.industry,
        business_num: businessData.business_num,
        incorporated_in: businessData.incorporated_in,
        doing_business_as: businessData.doing_business_as,
        lead_guid: lead_guid,
        owner_since: businessData.owner_since ? startOfDay(businessData.owner_since).toISOString() : undefined,
        self_attested_date_established: businessData.self_attested_date_established ? startOfDay(businessData.self_attested_date_established).toISOString() : undefined,
        self_attested_average_monthly_sales: businessData.self_attested_average_monthly_sales ? Number(businessData.self_attested_average_monthly_sales): undefined
      };
    } // TODO [Val] Else case should probably not just return undefined silently.
  }
}
