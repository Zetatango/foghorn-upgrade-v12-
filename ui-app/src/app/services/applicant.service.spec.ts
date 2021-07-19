import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

import { ApplicantService } from './applicant.service';
import { UtilityService } from './utility.service';
import { API_APPLICANTS } from '../constants';
import {
  get_goodAuthenticateResponses,
  get_goodInitAuthenticateResponse,
  goodApplicantAuthenticationEntity
} from '../test-stubs/api-entities-stubs';
import { CookieService } from 'ngx-cookie-service';
import { HTTP_ERRORS } from 'app/test-stubs/api-errors-stubs';

describe('ApplicantService', () => {
  let applicantService: ApplicantService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApplicantService, CookieService, UtilityService]
    });
  });

  beforeEach(() => {
    applicantService = TestBed.inject(ApplicantService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(applicantService).toBeTruthy();
  });

  it('initAuthenticateSubject BehaviorSubject is initially null', () => {
    expect(applicantService.getInitAuthenticateSubject()).toEqual(new BehaviorSubject(null));
  });

  it('authenticateSubject BehaviorSubject is initially null', () => {
    expect(applicantService.getAuthenticateSubject()).toEqual(new BehaviorSubject(null));
  });

  it('should load authentication questions data and set BehaviourSubject on success', () => {
    applicantService.initAuthentication('app_123456789', 'English').pipe(take(1)).subscribe(() => {
      applicantService.getInitAuthenticateSubject().pipe(take(1)).subscribe((value) => expect(value).toEqual(goodApplicantAuthenticationEntity));
    });

    const request = httpMock.expectOne(API_APPLICANTS.APPLICANTS_AUTHENTICATE.replace(':id', 'app_123456789'));
    expect(request.request.method).toEqual('POST');
    request.flush(get_goodInitAuthenticateResponse);
  });

  it('should load authentication result data and set BehaviourSubject on success', () => {
    get_goodAuthenticateResponses.forEach(response => {
      applicantService.authenticate('app_123456789', goodApplicantAuthenticationEntity.guid, [2]).pipe(take(1)).subscribe(() => {
        applicantService.getAuthenticateSubject().pipe(take(1)).subscribe((value) => expect(value).toEqual(response.data));
      });

      const request = httpMock.expectOne(API_APPLICANTS.APPLICANTS_AUTHENTICATE.replace(':id', 'app_123456789'));
      expect(request.request.method).toEqual('PUT');
      request.flush(response);
    });
  });

  it('should pass down an error to caller if initiating applicant authentication returns an http error', () => {
    HTTP_ERRORS.forEach(httpError => {
      applicantService.initAuthentication('app_123456789', 'English').subscribe(
        () => fail('Unexpected'), // Nothing to check here, won't be reached
        (err) => expect(err.status).toEqual(httpError.status));

      const request = httpMock.expectOne(API_APPLICANTS.APPLICANTS_AUTHENTICATE.replace(':id', 'app_123456789'));
      expect(request.request.method).toEqual('POST');
      request.flush([], { status: httpError.status, statusText: httpError.statusText });
    });
  });

  it('should pass down an error to caller if completing applicant authentication returns an http error', () => {
    HTTP_ERRORS.forEach(httpError => {
      applicantService.authenticate('app_123456789', goodApplicantAuthenticationEntity.guid, [2]).subscribe(
        () => fail('Unexpected'), // Nothing to check here, won't be reached
        (err) => expect(err.status).toEqual(httpError.status));

      const request = httpMock.expectOne(API_APPLICANTS.APPLICANTS_AUTHENTICATE.replace(':id', 'app_123456789'));
      expect(request.request.method).toEqual('PUT');
      request.flush([], { status: httpError.status, statusText: httpError.statusText });
    });
  });
});
