import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

import { UblService } from 'app/services/ubl.service';
import { UtilityService } from './utility.service';
import { API_LENDING } from '../constants';
import { lendingUblFactory, lendingUblRepaying } from 'app/test-stubs/factories/lending-ubl';
import { CookieService } from 'ngx-cookie-service';
import { HTTP_ERRORS } from 'app/test-stubs/api-errors-stubs';

describe('UblService', () => {
  let ublService: UblService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CookieService, UblService, UtilityService]
    });
  });

  beforeEach(() => {
    ublService = TestBed.inject(UblService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(ublService).toBeTruthy();
  });

  it('ubls$ BehaviorSubject is initially an empty array', () => {
    expect(ublService.ubls$).toEqual(new BehaviorSubject([]));
  });

  it('ubl$ BehaviorSubject is initially null', () => {
    expect(ublService.ubl$).toEqual(new BehaviorSubject(null));
  });

  it('should load UBLs data and set BehaviourSubject on success', () => {
    ublService.loadUbls$().pipe(take(1)).subscribe(() => {
      ublService.ubls$.pipe(take(1)).subscribe((value) => expect(value).toEqual([ lendingUblRepaying ]));
    });

    const ublsRequest = httpMock.expectOne(API_LENDING.GET_UBLS_PATH);
    expect(ublsRequest.request.method).toEqual('GET');
    ublsRequest.flush({ status: 'SUCCESS', message: 'Loaded resources', data: [ lendingUblRepaying ] });
  });

  it('should load empty UBLs data and set BehaviorSubject with empty array', () => {
    ublService.loadUbls$().pipe(take(1)).subscribe(() => {
      ublService.ubls$.pipe(take(1)).subscribe((value) => expect(value).toEqual([]));
    });

    const ublsRequest = httpMock.expectOne(API_LENDING.GET_UBLS_PATH);
    expect(ublsRequest.request.method).toEqual('GET');
    ublsRequest.flush({ status: 'SUCCESS', message: 'Loaded resources', data: [] });
  });

  it('should load UBL data for ID and set BehaviorSubject with result', () => {
    ublService.loadUbl$(lendingUblRepaying.id).pipe(take(1)).subscribe(() => {
      ublService.ubl$.pipe(take(1)).subscribe((value) => expect(value).toEqual(lendingUblRepaying));
    });

    const ublRequest = httpMock.expectOne(API_LENDING.GET_UBL_PATH.replace(':id', lendingUblRepaying.id));
    expect(ublRequest.request.method).toEqual('GET');
    ublRequest.flush({ status: 'SUCCESS', message: 'Loaded resources', data: lendingUblRepaying });
  });

  it('should pass down an error to caller if getting a list of lending UBLs returns an http error', () => {
    HTTP_ERRORS.forEach(httpError => {
      ublService.loadUbls$().subscribe(
        () => fail('Unexpected'), // Nothing to check here, won't be reached
        (err) => expect(err.status).toEqual(httpError.status));

      const ublRequest = httpMock.expectOne(API_LENDING.GET_UBLS_PATH);
      expect(ublRequest.request.method).toEqual('GET');
      ublRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
    });
  });

  it('should pass down an error to caller if getting a lending UBL returns an http error', () => {
    HTTP_ERRORS.forEach(httpError => {
      ublService.loadUbl$(lendingUblRepaying.id).subscribe(
        () => fail('Unexpected'), // Nothing to check here, won't be reached
        (err) => expect(err.status).toEqual(httpError.status));

      const ublRequest = httpMock.expectOne(API_LENDING.GET_UBL_PATH.replace(':id', lendingUblRepaying.id));
      expect(ublRequest.request.method).toEqual('GET');
      ublRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
    });
  });

  it('should return true if any of the ubls has an active payment plan', () => {
    const ublsWithPaymentPlan = [ lendingUblFactory.build({loan_status: 'payment_plan'}) ];

    ublService.loadUbls$().subscribe();

    httpMock.expectOne(API_LENDING.GET_UBLS_PATH).flush({ status: 'SUCCESS', message: 'Loaded resources', data: ublsWithPaymentPlan });

    expect(ublService.hasPaymentPlan$.value).toBeTrue();
  });

  it('should return false if none of the ubls has an active payment plan', () => {
    const ublsWithPaymentPlan = [ lendingUblFactory.build() ];

    ublService.loadUbls$().subscribe();

    httpMock.expectOne(API_LENDING.GET_UBLS_PATH).flush({ status: 'SUCCESS', message: 'Loaded resources', data: ublsWithPaymentPlan });

    expect(ublService.hasPaymentPlan$.value).toBeFalse();
  });
});
