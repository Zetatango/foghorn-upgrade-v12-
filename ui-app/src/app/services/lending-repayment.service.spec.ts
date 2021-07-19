import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

import { LendingRepaymentService } from './lending-repayment.service';
import { UtilityService } from './utility.service';
import { API_LENDING } from '../constants';
import { lendingRepaymentTransferring } from 'app/test-stubs/factories/lending-repayment';
import { CookieService } from 'ngx-cookie-service';
import { HTTP_ERRORS } from 'app/test-stubs/api-errors-stubs';

describe('LendingRepaymentService', () => {
  let repaymentService: LendingRepaymentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CookieService, LendingRepaymentService, UtilityService]
    });
  });

  beforeEach(() => {
    repaymentService = TestBed.inject(LendingRepaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(repaymentService).toBeTruthy();
  });

  it('lendingRepaymentss BehaviorSubject is initially an empty array', () => {
    expect(repaymentService.getLendingRepayments()).toEqual(new BehaviorSubject([]));
  });

  it('lendingRepayment BehaviorSubject is initially null', () => {
    expect(repaymentService.getLendingRepayment()).toEqual(new BehaviorSubject(null));
  });

  it('should load repayments data and set BehaviourSubject on success', () => {
    repaymentService.getRepayments().pipe(take(1)).subscribe(() => {
      repaymentService.getLendingRepayments().pipe(take(1)).subscribe((value) => expect(value).toEqual([ lendingRepaymentTransferring ]));
    });
    const repaymentsRequest = httpMock.expectOne(API_LENDING.GET_REPAYMENTS_PATH);
    expect(repaymentsRequest.request.method).toEqual('GET');
    repaymentsRequest.flush({ status: 200, data: [ lendingRepaymentTransferring ] });
  });

  it('should load empty repayments data and set BehaviorSubject with empty array', () => {
    repaymentService.getRepayments().pipe(take(1)).subscribe(() => {
      repaymentService.getLendingRepayments().pipe(take(1)).subscribe((value) => expect(value).toEqual([]));
    });
    const repaymentsRequest = httpMock.expectOne(API_LENDING.GET_REPAYMENTS_PATH);
    expect(repaymentsRequest.request.method).toEqual('GET');
    repaymentsRequest.flush({ status: 200, data: [] });
  });

  it('should load repayment data for ID and set BehaviorSubject with result', () => {
    repaymentService.getRepayment(lendingRepaymentTransferring.id).pipe(take(1)).subscribe(() => {
      repaymentService.getLendingRepayment().pipe(take(1)).subscribe((value) => expect(value).toEqual(lendingRepaymentTransferring));
    });
    const repaymentRequest = httpMock.expectOne(API_LENDING.GET_REPAYMENT_PATH.replace(':id', lendingRepaymentTransferring.id));
    expect(repaymentRequest.request.method).toEqual('GET');
    repaymentRequest.flush({ status: 200, data: lendingRepaymentTransferring });
  });

  it('should pass down an error to caller if getting a list of lending repayments returns an http error', () => {
    HTTP_ERRORS.forEach(httpError => {
      repaymentService.getRepayments().subscribe(
        () => fail('Unexpected'), // Nothing to check here, won't be reached
        (err) => expect(err.status).toEqual(httpError.status));
      const repaymentRequest = httpMock.expectOne(API_LENDING.GET_REPAYMENTS_PATH);
      expect(repaymentRequest.request.method).toEqual('GET');
      repaymentRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
    });
  });

  it('should pass down an error to caller if getting a lending repayment returns an http error', () => {
    HTTP_ERRORS.forEach(httpError => {
      repaymentService.getRepayment(lendingRepaymentTransferring.id).subscribe(
        () => fail('Unexpected'), // Nothing to check here, won't be reached
        (err) => expect(err.status).toEqual(httpError.status));
      const repaymentRequest = httpMock.expectOne(API_LENDING.GET_REPAYMENT_PATH.replace(':id', lendingRepaymentTransferring.id));
      expect(repaymentRequest.request.method).toEqual('GET');
      repaymentRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
    });
  });
});
