import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApplicantInfo, Lead, MerchantInfo } from 'app/models/api-entities/lead';
import { ZttResponse } from '../models/api-entities/response';
import { API_LEAD } from '../constants';
import { UtilityService } from './utility.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LeadService {

  lead$ = new BehaviorSubject<Lead>(undefined);
  applicantInfo$ = new BehaviorSubject<ApplicantInfo>(undefined);
  merchantInfo$ = new BehaviorSubject<MerchantInfo>(undefined);

  constructor(
    private http: HttpClient,
    private utilityService: UtilityService
  ) { }

  setLead(lead: Lead): void {
    this.lead$.next(lead);
    this.merchantInfo$.next(new MerchantInfo(lead, lead?.attributes));
    this.applicantInfo$.next(new ApplicantInfo(lead, lead?.attributes));
  }

  // API CALLS

  getLead(): Observable<ZttResponse<Lead>> {
    const url = API_LEAD.GET_LEAD_PATH;
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.get<ZttResponse<Lead>>(url, httpOptions)
      .pipe(
        tap(
          (res: ZttResponse<Lead>) => {
            this.lead$.next(res.data);
          }
        )
      );
  }

  updateDesiredBankAccountBalance(id: string, amount: number): Observable<ZttResponse<Lead>> {
    const url = API_LEAD.UPDATE_DESIRED_BANK_ACCOUNT_BALANCE_LEADS_PATH.replace(':id', id);
    const body = { desired_bank_account_balance: amount };
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.put<ZttResponse<Lead>>(url, body, httpOptions)
      .pipe(
        tap((res: ZttResponse<Lead>) => this.lead$.next(res.data))
      );
  }

  updateSelectedInsightsAccounts(id: string, accounts: string[]): Observable<ZttResponse<Lead>> {
    const url = API_LEAD.UPDATE_SELECTED_INSIGHTS_BANK_ACCOUNTS_LEADS_PATH.replace(':id', id);
    const body = { bank_account_ids: accounts };
    const httpOptions = this.utilityService.getHttpOptionsForBody();

    return this.http.post<ZttResponse<Lead>>(url, body, httpOptions)
      .pipe(
        tap((res: ZttResponse<Lead>) => this.lead$.next(res.data))
      );
  }
}
