import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { merge, Observable, of, } from 'rxjs';
import { ZttResponse } from 'app/models/api-entities/response';
import { InsightsService } from 'app/services/insights.service';
import { AggregatedBankAccountsResponse } from 'app/models/api-entities/insights';
import { catchError } from 'rxjs/operators';
import { StateRoutingService } from 'app/services/state-routing.service';
import { AppRoutes } from 'app/models/routes';
import { BankAccountService } from 'app/services/bank-account.service';

@Injectable({
  providedIn: 'any'
})
export class CfaGraphResolver implements Resolve<ZttResponse<AggregatedBankAccountsResponse>> {

  constructor(
    private bankAccountService: BankAccountService,
    private insightsService: InsightsService,
    private stateRoutingService: StateRoutingService
  ) {}

  resolve(): Observable<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
      return merge(
        this.insightsService.fetchCashFlowData(this.bankAccountService.owner.flinks_account_uuids),
        this.insightsService.fetchAccountBalanceData(this.bankAccountService.owner.flinks_account_uuids)
      ).pipe(catchError(() => {
        this.stateRoutingService.navigate(AppRoutes.insights.no_insights_data, true);
        return of(null);
      }));
  }
}
