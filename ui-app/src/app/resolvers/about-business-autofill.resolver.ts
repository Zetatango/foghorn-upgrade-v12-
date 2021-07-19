import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { LeadService } from 'app/services/lead.service';
import { MerchantInfo } from 'app/models/api-entities/lead';
import { take } from 'rxjs/operators';

@Injectable({ providedIn: 'any' })
export class AboutBusinessAutofillResolver implements Resolve<MerchantInfo> {
  constructor(
    private leadService: LeadService
  ) {}

  resolve(): Observable<MerchantInfo> {
    return this.leadService.merchantInfo$.pipe(take(1));
  }
}
