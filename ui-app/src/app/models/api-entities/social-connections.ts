export interface SocialConnections {
  facebook: FacebookSocialConnection;
}

export interface FacebookSocialConnection {
  state: FacebookSocialConnectionState;
  pages: Array<FacebookPage>;
}

export interface FacebookPage {
  id: string;
  name: string;
  category: string;
}

export enum FacebookSocialConnectionState {
  unknown = 'unknown',
  not_connected = 'not_connected',
  invalid_connection = 'invalid_connection',
  about_to_expire = 'about_to_expire',
  connected = 'connected'
}
