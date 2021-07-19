import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { UtilityService } from './utility.service';
import { SupplierInformation } from 'app/models/api-entities/supplier';
import { DirectPayment } from 'app/models/api-entities/direct-payment';
import { DirectPaymentPost } from 'app/models/api-entities/direct-payment-post';
import { API_DIRECT_PAYMENT, DIRECT_DEBIT_POST_KEY, SUPPLIER_INFORMATION_KEY } from 'app/constants';
import * as storage from 'app/helpers/storage.helper';
import { ZttResponse } from 'app/models/api-entities/response';

@Injectable({
  providedIn: 'root'
})
export class DirectPaymentService {
  private _directPaymentPost$: BehaviorSubject<DirectPaymentPost> = new BehaviorSubject(null);
  private _supplierInformation$: BehaviorSubject<SupplierInformation> = new BehaviorSubject(null);
  private _reviewed = false;

  get activeId(): string {
    return storage.local.getItem(DIRECT_DEBIT_POST_KEY);
  }

  // Current fee for direct debit is $2
  get directDebitFee(): number {
    return 2;
  }

  get directDebitPromoFee(): number {
    return -this.directDebitFee;
  }

  get directPaymentPost$(): BehaviorSubject<DirectPaymentPost> {
    return this._directPaymentPost$;
  }

  setDirectPaymentPost(directPaymentPost: DirectPaymentPost): void {
    this._directPaymentPost$.next(directPaymentPost);
  }

  // returns true if a direct debit is in progress or not
  get hasActiveDirectDebitSet(): boolean {
    return (storage.local.getItem(DIRECT_DEBIT_POST_KEY) !== null);
  }

  get reviewed(): boolean {
    return this._reviewed;
  }

  set reviewed(value: boolean) {
    this._reviewed = value;
  }

  get supplierInformation$(): BehaviorSubject<SupplierInformation> {
    return this._supplierInformation$;
  }

  setSupplierInformation(supplier: SupplierInformation): void {
    this._supplierInformation$.next(supplier);
  }

  constructor(
    private http: HttpClient,
    private utilityService: UtilityService
  ) {}

  storeDirectPaymentInformation(directPaymentPost: DirectPaymentPost, supplier: SupplierInformation): void {
    this.setDirectPaymentPost(directPaymentPost);
    this.setSupplierInformation(supplier);
    storage.local.setItem(DIRECT_DEBIT_POST_KEY, JSON.stringify(directPaymentPost));
    storage.local.setItem(SUPPLIER_INFORMATION_KEY, JSON.stringify(supplier));
  }

  clearActiveId(): void {
    if (this.activeId !== null) {
      storage.local.removeItem(DIRECT_DEBIT_POST_KEY);
      storage.local.removeItem(SUPPLIER_INFORMATION_KEY);
    }
  }

  // create initial direct payment
  postDirectPayment(): Observable<ZttResponse<DirectPayment>> {
    const url = API_DIRECT_PAYMENT.POST_NEW_PATH;
    const httpOptions = this.utilityService.getHttpOptionsForBody();
    const directPaymentParams = this._directPaymentPost$.getValue();

    return this.http.post<ZttResponse<DirectPayment>>(url, directPaymentParams, httpOptions);
  }

  // explicitly refresh the direct payment
  refreshDirectPayment(): void {
    if (!this.hasActiveDirectDebitSet) {
      throw new Error('No active direct debit found');
    }

    this.setDirectPaymentPost(JSON.parse(localStorage.getItem(DIRECT_DEBIT_POST_KEY)));
    this.setSupplierInformation(JSON.parse(localStorage.getItem(SUPPLIER_INFORMATION_KEY)));
  }
}
