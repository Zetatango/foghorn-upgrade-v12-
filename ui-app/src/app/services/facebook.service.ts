import { Injectable, NgZone } from '@angular/core';

import { FACEBOOK_CONNECT } from 'app/constants';
import { UtilityService } from './utility.service';
import { LoggingService } from './logging.service';
import { OmniauthProviderService } from './omniauth-provider.service';
import { FacebookSocialConnectionState } from 'app/models/api-entities/social-connections';

@Injectable()
export class FacebookService extends OmniauthProviderService {
  private _facebookUrl = FACEBOOK_CONNECT.URL_ROUTE;


  constructor(private utilityService: UtilityService,
              loggingService: LoggingService,
              ngZone: NgZone) {
    super(ngZone, loggingService);
  }

  authFlowUrl(): string {
    return this._facebookUrl;
  }

  translateFacebookSocialConnectionState(state: FacebookSocialConnectionState): string {
    switch (state) {
      case FacebookSocialConnectionState.connected:
        return 'SOCIAL_CONNECTIONS.FACEBOOK.CONNECTED_STATUS';
      case FacebookSocialConnectionState.not_connected:
        return 'SOCIAL_CONNECTIONS.FACEBOOK.NOT_CONNECTED_STATUS';
      case FacebookSocialConnectionState.invalid_connection:
        return 'SOCIAL_CONNECTIONS.FACEBOOK.INVALID_CONNECTION_STATUS';
      case FacebookSocialConnectionState.about_to_expire:
        return 'SOCIAL_CONNECTIONS.FACEBOOK.CONNECTED_STATUS';
      case FacebookSocialConnectionState.unknown:
        return '';
    }
  }
}
