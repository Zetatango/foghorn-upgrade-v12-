import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { Supplier, SupplierInformation } from 'app/models/api-entities/supplier';
import { UtilityService } from 'app/services/utility.service';

import { API_SUPPLIER } from 'app/constants';
import { ZttResponse } from 'app/models/api-entities/response';

export const CURRENT_SUPPLIER_ID_KEY = 'CURRENT_SELECTED_SUPPLIER_ID';

@Injectable({
  providedIn: 'root'
})

export class SupplierService {
  private suppliers: BehaviorSubject<Supplier[]> = new BehaviorSubject([]);
  private _currentSupplierInformation: BehaviorSubject<SupplierInformation> = new BehaviorSubject(undefined);
  private currentSupplier: BehaviorSubject<Supplier> = new BehaviorSubject(undefined);

  constructor(private http: HttpClient,
              private utilityService: UtilityService) {}

  // GETTERS & SETTERS

  getSuppliers(): BehaviorSubject<Supplier[]> {
    return this.suppliers;
  }

  getSupplier(): BehaviorSubject<Supplier> {
    return this.currentSupplier;
  }

  private setSuppliers(suppliers: Supplier[]) {
    this.suppliers.next(suppliers);
  }

  setCurrentSupplierInformation(supplier: SupplierInformation): void {
    this._currentSupplierInformation.next(supplier);
  }

  setCurrentSupplier(supplier: Supplier): void {
    this.currentSupplier.next(supplier);
  }

  get currentSupplierInformation(): BehaviorSubject<SupplierInformation> {
    return this._currentSupplierInformation;
  }

  clearSupplierInformation(): void {
    this.setCurrentSupplierInformation(null);
  }

  clearCurrentSupplier(): void {
    this.setCurrentSupplier(null);
  }

  getSelectedSupplierIdForMerchant(merchantId: string): string {
    return localStorage.getItem(CURRENT_SUPPLIER_ID_KEY + '_' + merchantId);
  }

  setSelectedSupplierIdForMerchant(merchantId: string, supplierId: string): void {
    localStorage.setItem(CURRENT_SUPPLIER_ID_KEY + '_' + merchantId, supplierId);
  }

  clearSelectedSupplierIdForMerchant(merchantId: string): void {
    localStorage.removeItem(CURRENT_SUPPLIER_ID_KEY + '_' + merchantId);
  }

  // API CALLS

  loadSuppliers(queryParams: Record<string, unknown> = {}): Observable<ZttResponse<Supplier[]>> {
    const url = this.utilityService.getAugmentedUrl(API_SUPPLIER.GET_SUPPLIERS_PATH, queryParams);
    const httpOptions = this.utilityService.getHttpOptionsForBody();
    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<Supplier[]>) => this.setSuppliers(res.data))
      );
  }
}
