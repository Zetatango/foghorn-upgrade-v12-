import * as Factory from 'factory.ts';
import {
  FacebookPage,
  FacebookSocialConnection,
  FacebookSocialConnectionState,
  SocialConnections
} from 'app/models/api-entities/social-connections';

/********************************* FACTORIES **********************************/

export const facebookPageFactory = Factory.Sync.makeFactory<FacebookPage>({
  id: 'ZXUfcriJGwZK8qGK',
  name: 'My Facebook Page',
  category: 'Beauty, Cosmetic & Personal Care'
});

export const facebookSocialConnectionFactory = Factory.Sync.makeFactory<FacebookSocialConnection>({
  state: FacebookSocialConnectionState.invalid_connection,
  pages: [ facebookPageFactory.build() ]
});

export const socialConnectionsFactory = Factory.Sync.makeFactory<SocialConnections>({
  facebook: facebookSocialConnectionFactory.build()
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

// Note: Technically, these are fine since they are functions and will generate a fesh entity eveytime.

export const receivedSocialConnections = (): SocialConnections => socialConnectionsFactory.build();

export const facebookSocialConnectionConnected = (): FacebookSocialConnection => facebookSocialConnectionFactory.build({
  state: FacebookSocialConnectionState.connected,
  pages: [facebookPageFactory.build()]
});
export const facebookSocialConnectionNotConnected = (): FacebookSocialConnection => facebookSocialConnectionFactory.build({
  state: FacebookSocialConnectionState.not_connected,
  pages: [facebookPageFactory.build()]
});
export const facebookSocialConnectionInvalidConnection = (): FacebookSocialConnection => facebookSocialConnectionFactory.build({
  state: FacebookSocialConnectionState.invalid_connection,
  pages: [facebookPageFactory.build()]
});
export const facebookSocialConnectionAboutToExpire = (): FacebookSocialConnection => facebookSocialConnectionFactory.build({
  state: FacebookSocialConnectionState.about_to_expire,
  pages: [facebookPageFactory.build()]
});
