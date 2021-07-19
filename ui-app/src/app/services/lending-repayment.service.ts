import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { LendingRepayment } from '../models/api-entities/lending-repayment';
import { API_LENDING } from '../constants';
import { UtilityService } from './utility.service';
import { ZttResponse } from 'app/models/api-entities/response';

@Injectable({
  providedIn: 'root'
})
export class LendingRepaymentService {
  private lendingRepayments: BehaviorSubject<LendingRepayment[]> = new BehaviorSubject([]);
  private lendingRepayment: BehaviorSubject<LendingRepayment> = new BehaviorSubject(null);

  constructor(private http: HttpClient, private utilityService: UtilityService) {}

  private setLendingRepayments(lendingRepayments: LendingRepayment[]) {
    this.lendingRepayments.next(lendingRepayments);
  }
  private setLendingRepayment(lendingRepayment: LendingRepayment) {
    this.lendingRepayment.next(lendingRepayment);
  }

  getLendingRepayments(): BehaviorSubject<LendingRepayment[]> {
    return this.lendingRepayments;
  }

  getLendingRepayment(): BehaviorSubject<LendingRepayment> {
    return this.lendingRepayment;
  }

  getRepayments(): Observable<ZttResponse<LendingRepayment[]>> {
    return this.http.get(API_LENDING.GET_REPAYMENTS_PATH, this.utilityService.getHttpOptionsForBody())
      .pipe(
        tap((res: ZttResponse<LendingRepayment[]>) => this.setLendingRepayments(res.data))
      );
  }

  getRepayment(id: string): Observable<ZttResponse<LendingRepayment>> {
    return this.http.get(API_LENDING.GET_REPAYMENT_PATH.replace(':id', id), this.utilityService.getHttpOptionsForBody())
      .pipe(
        tap((res: ZttResponse<LendingRepayment>) => this.setLendingRepayment(res.data))
      );
  }
}
