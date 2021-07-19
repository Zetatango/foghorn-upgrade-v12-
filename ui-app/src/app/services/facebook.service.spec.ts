import { TestBed, waitForAsync } from '@angular/core/testing';
import { FACEBOOK_CONNECT } from 'app/constants';
import { FacebookService } from './facebook.service';
import { UtilityService } from './utility.service';
import { CookieService } from 'ngx-cookie-service';
import { LoggingService } from './logging.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { FacebookSocialConnectionState } from 'app/models/api-entities/social-connections';

describe('FacebookService', () => {
  let facebookService: FacebookService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        FacebookService,
        UtilityService,
        CookieService,
        LoggingService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    facebookService = TestBed.inject(FacebookService);
  });

  it('should be created', () => {
    expect(facebookService).toBeTruthy();
  });

  describe('authFlowUrl()', () => {
    it('returns the quickbooks route', () => {
      expect(facebookService.authFlowUrl()).toEqual(FACEBOOK_CONNECT.URL_ROUTE);
    });
  });

  describe('translateFacebookSocialConnectionState', () => {
    it('sets the correct Facebook connection status string (unknown)', () => {
      expect(facebookService.translateFacebookSocialConnectionState(FacebookSocialConnectionState.unknown))
        .toEqual('');
    });

    it('sets the correct Facebook connection status string (connected)', () => {
      expect(facebookService.translateFacebookSocialConnectionState(FacebookSocialConnectionState.connected))
        .toEqual('SOCIAL_CONNECTIONS.FACEBOOK.CONNECTED_STATUS');
    });

    it('sets the correct Facebook connection status string (not connected)', () => {
      expect(facebookService.translateFacebookSocialConnectionState(FacebookSocialConnectionState.not_connected))
        .toEqual('SOCIAL_CONNECTIONS.FACEBOOK.NOT_CONNECTED_STATUS');
    });

    it('sets the correct Facebook connection status string (invalid connection)', () => {
      expect(facebookService.translateFacebookSocialConnectionState(FacebookSocialConnectionState.invalid_connection))
        .toEqual('SOCIAL_CONNECTIONS.FACEBOOK.INVALID_CONNECTION_STATUS');
    });

    it('sets the correct Facebook connection status string (about to expire)', () => {
      expect(facebookService.translateFacebookSocialConnectionState(FacebookSocialConnectionState.about_to_expire))
        .toEqual('SOCIAL_CONNECTIONS.FACEBOOK.CONNECTED_STATUS');
    });
  });
}); // describe - FacebookService
