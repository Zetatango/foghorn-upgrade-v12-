import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Agreement, AgreementType } from 'app/models/agreement';
import { API_AGREEMENTS, API_MERCHANT } from 'app/constants';
import { UtilityService } from './utility.service';
import { ZttResponse } from 'app/models/api-entities/response';
import { ErrorResponse } from "app/models/error-response";


export const ACTIVE_PAF_AGREEMENT = 'ACTIVE_PAF_AGREEEMNT';

@Injectable()
export class AgreementService {
  private _agreement: BehaviorSubject<Agreement> = new BehaviorSubject<Agreement>(null);

  private static getMerchantAgreementUrl(id: string): string {
    return API_MERCHANT.GET_MERCHANT_AGREEMENT_PATH.replace(':id', id);
  }

  private static getAgreementUrl(id: string): string {
    return API_AGREEMENTS.GET.replace(':id', id);
  }

  private static acceptAgreementUrl(id: string): string {
    return API_AGREEMENTS.ACCEPT.replace(':id', id);
  }

  private static optOutUrl(id: string): string {
    return API_AGREEMENTS.OPT_OUT.replace(':id', id);
  }

  constructor(private http: HttpClient,
              private utilityService: UtilityService) {
  }

  loadAgreementById(agreementId: string): Observable<ZttResponse<Agreement>> {
    return this.fetchAgreementById(agreementId, true);
  }

  loadAgreementByType(merchantId: string,
                      agreementType: AgreementType,
                      showTerms: boolean,
                      supplierId?: string): Observable<ZttResponse<Agreement>> {
    return this.fetchAgreementByType(merchantId, agreementType, showTerms, supplierId);
  }

  accept(): Observable<ZttResponse<Agreement>> {
    return this.acceptAgreement();
  }
  // Note: [Graham] no need to return subject, and value separately.
  get agreementSubject(): BehaviorSubject<Agreement> {
    return this._agreement;
  }

  get agreement(): Agreement {
    return this.agreementSubject.value || null;
  }

  set agreement(agreement: Agreement) {
    this.agreementSubject.next(agreement);
  }

  setHasActivePafAgreementForMerchant(merchantId: string): void {
    localStorage.setItem(ACTIVE_PAF_AGREEMENT + '_' + merchantId, 'true');
  }

  hasActivePafAgreementForMerchant(merchantId: string): boolean {
    const hasActiveAgreement: string = localStorage.getItem(ACTIVE_PAF_AGREEMENT + '_' + merchantId);
    return (/true/i).test(hasActiveAgreement);
  }

  clearActivePafAgreementForMerchant(merchantId: string): void {
    localStorage.removeItem(ACTIVE_PAF_AGREEMENT + '_' + merchantId);
  }

  private fetchAgreementById(agreementId: string,
                             showTerms: boolean): Observable<ZttResponse<Agreement>> {
    const httpOptions = this.utilityService.getHttpOptionsForBody();
    const params = {show_terms: showTerms};
    const url = this.utilityService.getAugmentedUrl(AgreementService.getAgreementUrl(agreementId), params);

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<Agreement>) => this.agreement = res.data)
      );
  }

  private fetchAgreementByType(merchantId: string,
                               agreementType: AgreementType,
                               showTerms: boolean,
                               supplierId?: string): Observable<ZttResponse<Agreement>> {
    const httpOptions = this.utilityService.getHttpOptionsForBody();
    const params = {
      type: agreementType,
      show_terms: showTerms,
      supplier_id: supplierId
    };
    const url = this.utilityService.getAugmentedUrl(AgreementService.getMerchantAgreementUrl(merchantId), params);

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<Agreement>) => this.agreement = res.data)
      );
  }

  private acceptAgreement(): Observable<ZttResponse<Agreement>> {
    if (!this.agreement) {
      return throwError(new ErrorResponse(new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' })));
    }

    const httpOptions = this.utilityService.getHttpOptionsForBody();
    const url = AgreementService.acceptAgreementUrl(this.agreement.id);

    return this.http.put(url, {}, httpOptions)
      .pipe(
        tap((res: ZttResponse<Agreement>) => this.agreement = res.data)
      );
  }

  optOut(agreementId: string): Observable<ZttResponse<Agreement>> {
    const httpOptions = this.utilityService.getHttpOptionsForBody();
    const url = AgreementService.optOutUrl(agreementId);

    return this.http.put(url, {}, httpOptions)
      .pipe(
        tap((res: ZttResponse<Agreement>) => this.agreement = res.data)
      );
  }
}
