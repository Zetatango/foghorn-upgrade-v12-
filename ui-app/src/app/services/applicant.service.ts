import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { API_APPLICANTS } from '../constants';
import { UtilityService } from './utility.service';
import { ApplicantAuthentication } from '../models/api-entities/applicant-authentication';
import { ApplicantAuthenticationComplete } from '../models/api-entities/applicant-authentication-complete';
import { ZttResponse } from 'app/models/api-entities/response';

@Injectable()
export class ApplicantService {
  private initAuthenticateSubject: BehaviorSubject<ApplicantAuthentication> = new BehaviorSubject(null);
  private authenticateSubject: BehaviorSubject<ApplicantAuthenticationComplete> = new BehaviorSubject(null);

  constructor(private http: HttpClient,
              private utilityService: UtilityService) {}

  private static getApplicantAuthenticateUrl(id) {
    return API_APPLICANTS.APPLICANTS_AUTHENTICATE.replace(':id', id);
  }

  private setInitAuthenticationSubject(initAuthenticateSubject: ApplicantAuthentication) {
    this.initAuthenticateSubject.next(initAuthenticateSubject);
  }

  private setAuthenticateSubject(authenticateSubject: ApplicantAuthenticationComplete) {
    this.authenticateSubject.next(authenticateSubject);
  }

  public getInitAuthenticateSubject(): BehaviorSubject<ApplicantAuthentication> {
    return this.initAuthenticateSubject;
  }

  public getAuthenticateSubject(): BehaviorSubject<ApplicantAuthenticationComplete> {
    return this.authenticateSubject;
  }

  initAuthentication(id: string, language: string): Observable<ZttResponse<ApplicantAuthentication>> {
    const authenticationId = ApplicantService.getApplicantAuthenticateUrl(id);
    const httpOptions = this.utilityService.getHttpOptionsForBody();
    const body = { language: language };

    return this.http.post(authenticationId, body, httpOptions)
      .pipe(
        tap((res: ZttResponse<ApplicantAuthentication>) => this.setInitAuthenticationSubject(res.data))
      );
  }

  authenticate(id: string, authentication_query_guid: string, applicant_responses: number[]): Observable<ZttResponse<ApplicantAuthenticationComplete>> {
    const authenticationId = ApplicantService.getApplicantAuthenticateUrl(id);
    const httpOptions = this.utilityService.getHttpOptionsForBody();
    const body = {
      authentication_query_guid: authentication_query_guid,
      applicant_responses: applicant_responses
    };

    return this.http.put(authenticationId, body, httpOptions)
      .pipe(
        tap((res: ZttResponse<ApplicantAuthenticationComplete>) => this.setAuthenticateSubject(res.data))
      );
  }
}
