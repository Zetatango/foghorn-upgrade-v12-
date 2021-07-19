import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';
import { LendingApplicationsService } from 'app/services/lending-applications.service';
import { catchError } from 'rxjs/operators';
import { UiError } from 'app/models/ui-error';
import { ErrorService } from 'app/services/error.service';
import { LendingApplication } from 'app/models/api-entities/lending-application';
import { ZttResponse } from 'app/models/api-entities/response';

@Injectable({ providedIn: 'any' })
export class LendingApplicationsResolver implements Resolve<ZttResponse<LendingApplication[]>> {
  constructor(
    private errorService: ErrorService,
    private lendingApplicationsService: LendingApplicationsService
  ) {}

  resolve(): Observable<ZttResponse<LendingApplication[]>> {
    return this.lendingApplicationsService.loadApplications()
      .pipe(
        catchError(() => {
          this.errorService.show(UiError.loadLendingApplications);
          return of(null);
        })
      );
  }
}
