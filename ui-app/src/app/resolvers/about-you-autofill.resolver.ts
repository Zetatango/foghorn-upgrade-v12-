import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { LeadService } from 'app/services/lead.service';
import { PartialApplicantLead } from 'app/models/api-entities/lead';
import { take } from 'rxjs/operators';

@Injectable({ providedIn: 'any' })
export class AboutYouAutofillResolver implements Resolve<PartialApplicantLead> {
  constructor(
    private leadService: LeadService
  ) {}

  resolve(): Observable<PartialApplicantLead> {
    return this.leadService.applicantInfo$.pipe(take(1));
  }
}
