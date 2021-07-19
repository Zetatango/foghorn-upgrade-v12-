import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Ubl } from 'app/models/api-entities/ubl';
import { API_LENDING } from 'app/constants';
import { UtilityService } from './utility.service';
import { ZttResponse } from 'app/models/api-entities/response';

@Injectable()
export class UblService {
  // Note: [Graham] rename variables to observable
  private _ubls$ = new BehaviorSubject<Ubl[]>([]);
  private _ubl$ = new BehaviorSubject<Ubl>(null);
  private _hasPaymentPlan$ = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private utilityService: UtilityService
  ) {}

  // Note: [Graham] change to class variable.
  get ubls$(): BehaviorSubject<Ubl[]> {
    return this._ubls$;
  }
  private setUbls(ubls: Ubl[]): void {
    this._ubls$.next(ubls);
  }

  // Note: [Graham] these could possibly be private.
  get ubl$(): BehaviorSubject<Ubl> {
    return this._ubl$;
  }
  private setUbl(ubl: Ubl): void {
    this._ubl$.next(ubl);
  }

  get hasPaymentPlan$(): BehaviorSubject<boolean> {
    return this._hasPaymentPlan$;
  }
  private setHasPaymentPlan(ubls: Ubl[]): void {
    const hasPaymentPlan = ubls.some(ubl => ubl.loan_status === 'payment_plan');
    this._hasPaymentPlan$.next(hasPaymentPlan);
  }

  // API CALLS
  loadUbls$(): Observable<ZttResponse<Ubl[]>> {
    const url = API_LENDING.GET_UBLS_PATH;
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap(
          (res: ZttResponse<Ubl[]>) => {
            this.setUbls(res.data);
            this.setHasPaymentPlan(res.data);
          }
        )
      );
  }

  loadUbl$(id: string): Observable<ZttResponse<Ubl>> {
    const url = API_LENDING.GET_UBL_PATH.replace(':id', id);
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get(url, httpOptions)
      .pipe(
        tap((res: ZttResponse<Ubl>) => this.setUbl(res.data))
      );
  }
}
