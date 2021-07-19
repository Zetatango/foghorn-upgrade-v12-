import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CONSTANTS } from 'app/constants';
import { StateRoutingService } from 'app/services/state-routing.service';
import { HttpErrorsInterceptor } from './http-errors-interceptor';
import { RouterTestingModule } from '@angular/router/testing';
import { LoggingService } from 'app/services/logging.service';
import { UtilityService } from 'app/services/utility.service';
import { unauthorizedFactory, commonErrorsFactory, passthroughErrorsFactory, successResponseFactory, unknownErrorFactory, serviceUnavailableFactory } from 'app/test-stubs/factories/response';

describe('HttpErrorsInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let stateRoutingService: StateRoutingService;

  beforeEach(() => TestBed.configureTestingModule({
    imports: [HttpClientTestingModule, RouterTestingModule],
    providers: [
      {
        provide: HTTP_INTERCEPTORS,
        useClass: HttpErrorsInterceptor,
        multi: true
      },
      LoggingService,
      StateRoutingService,
      UtilityService
    ]
  }));

  beforeEach(() => {
    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    stateRoutingService = TestBed.inject(StateRoutingService);
    spyOn(stateRoutingService, 'performRedirect');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be defined', function () {
    expect(HttpErrorsInterceptor).toBeDefined();
  });

  describe('intercept HTTP requests', () => {
    it('valid request and response are unchanged.', () => {
      httpClient.get('/api')
        .subscribe(
          response => expect(response).toBeTruthy(),
          () => fail('should not fail'));

      const request = httpMock.expectOne('/api');
      expect(request.request.method).toEqual('GET');
      request.flush({ data: 'test' });
    });

    it('request and response are unchanged', () => {
      commonErrorsFactory.build().errors.forEach(httpError => {
        httpClient.get('/api')
          .subscribe(
            () => fail('should not succeed.'),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const request = httpMock.expectOne('/api');
        expect(request.request.method).toEqual('GET');
        request.flush([], httpError);
      });
    });

    it('Unauthorized status redirects user to /auth/user to re-auth user', () => {
        httpClient.get('/api').subscribe(
          () => fail('should be intercepted and not succeed.'),
          () => fail('should be intercepted and not throw error.'),
          () => {
            expect(stateRoutingService.performRedirect).toHaveBeenCalledOnceWith(CONSTANTS.UNAUTHORIZED_REDIRECT_LOGIN_URL);
          }
        );

        const request = httpMock.expectOne('/api');
        expect(request.request.method).toEqual('GET');
        request.flush([], unauthorizedFactory.build());
    });

    it('Successful responses and whitelisted error responses should not be intercepted', () => {
      const responseArray = [successResponseFactory.build().responses, passthroughErrorsFactory.build().errors];
      responseArray.forEach((responses) => {
        responses.forEach((response) => {
          let observed = false;
          httpClient.get('/api').subscribe(
            () => observed = true,
            () => observed = true,
            () => {
              expect(observed).toBeTruthy();
              expect(stateRoutingService.performRedirect).toHaveBeenCalledTimes(0);
            }
          );

          const request = httpMock.expectOne('/api');
          expect(request.request.method).toEqual('GET');
          request.flush([], response);
        });
      });
    });

    it('Generic service unavailable is not intercepted and does not redirect to /503.html', () => {
      httpClient.get('/api')
        .subscribe(
          () => fail('should not succeed.'),
          () => expect(stateRoutingService.performRedirect).toHaveBeenCalledTimes(0)
        );

      const request = httpMock.expectOne('/api');
      expect(request.request.method).toEqual('GET');
      request.flush([], serviceUnavailableFactory.build());
    });

    it('Redis unavailable status is intercepted and redirects user to /503.html', () => {
      httpClient.get('/api')
        .subscribe(
          () => fail('should not succeed.'),
          () => fail('should be intercepted and not throw error.'),
          () => {
            expect(stateRoutingService.performRedirect).toHaveBeenCalledOnceWith(CONSTANTS.REDIS_UNAVAILABLE_URL);
          });

      const request = httpMock.expectOne('/api');
      expect(request.request.method).toEqual('GET');
      request.flush({ status: 'Error', message: 'Service unavailable', code: CONSTANTS.REDIS_ERROR_CODE },
        { status: 503, statusText: 'Service unavailable' });
    });

    it('Unknown error should be intercepted and not redirect anywhere', () => {
      httpClient.get('/api')
        .subscribe(
          () => fail('should not succeed.'),
          () => fail('should be intercepted and not throw error.'),
          () => expect(stateRoutingService.performRedirect).toHaveBeenCalledTimes(0)
        );

      const request = httpMock.expectOne('/api');
      expect(request.request.method).toEqual('GET');
      request.flush([], unknownErrorFactory.build());
    });
  });
});
