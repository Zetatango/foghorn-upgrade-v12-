import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';
import { UblService } from 'app/services/ubl.service';
import { catchError } from 'rxjs/operators';
import { ErrorService } from 'app/services/error.service';
import { UiError } from 'app/models/ui-error';
import { ZttResponse } from 'app/models/api-entities/response';
import { Ubl } from 'app/models/api-entities/ubl';

@Injectable({ providedIn: 'any' })
export class UblsResolver implements Resolve<ZttResponse<Ubl[]>> {
  constructor(
    private errorService: ErrorService,
    private ublService: UblService
  ) {}

  resolve(): Observable<ZttResponse<Ubl[]>> {
    return this.ublService.loadUbls$()
      .pipe(
        catchError(() => {
          this.errorService.show(UiError.loadUbls);
          return of(null);
        })
      );
  }
}
