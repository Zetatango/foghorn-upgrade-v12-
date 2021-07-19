import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

import { SocialConnectionsService } from './social-connections.service';
import { UtilityService } from './utility.service';
import { API_SOCIAL_CONNECTIONS } from 'app/constants';
import { HTTP_ERRORS } from 'app/test-stubs/api-errors-stubs';
import { receivedSocialConnections } from 'app/test-stubs/factories/social-connections';

describe('SocialConnectionsService', () => {
  let socialConnectionsService: SocialConnectionsService;
  let utilityService: UtilityService;
  let httpMock: HttpTestingController;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SocialConnectionsService,
        CookieService,
        UtilityService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    socialConnectionsService = TestBed.inject(SocialConnectionsService);
    utilityService = TestBed.inject(UtilityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(socialConnectionsService).toBeTruthy();
  });

  describe('loadSocialConnections', () => {
    it('should return the social connection status on success', () => {
      socialConnectionsService.loadSocialConnections()
        .pipe(take(1))
        .subscribe(
          () => expect(socialConnectionsService.getSocialConnections()).toEqual(new BehaviorSubject(receivedSocialConnections())),
          (err) => fail('Prevented this test to fail silently: ' + err)
        );

      const url: string = utilityService.getAugmentedUrl(API_SOCIAL_CONNECTIONS.GET_SOCIAL_CONNECTIONS_PATH);
      const getSocialConnectionsRequest: TestRequest = httpMock.expectOne(url);
      expect(getSocialConnectionsRequest.request.method).toEqual('GET');
      getSocialConnectionsRequest.flush({ status: 'SUCCESS', data: receivedSocialConnections() });
    });

    it('should pass down an error if loadSocialConnections returns an HTTP error', () => {
      HTTP_ERRORS.forEach(httpError => {
        socialConnectionsService.loadSocialConnections()
          .pipe(take(1))
          .subscribe(
            (res) => fail('Should not succeed: ' + res),
            (err) => expect(err.status).toEqual(httpError.status)
          );

        const url: string = utilityService.getAugmentedUrl(API_SOCIAL_CONNECTIONS.GET_SOCIAL_CONNECTIONS_PATH);
        const getSocialConnectionsRequest: TestRequest = httpMock.expectOne(url);
        expect(getSocialConnectionsRequest.request.method).toEqual('GET');
        getSocialConnectionsRequest.flush([], { status: httpError.status, statusText: httpError.statusText });
      });
    });
  });
});
