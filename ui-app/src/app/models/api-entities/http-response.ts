import { HttpResponseBase } from '@angular/common/http';
import { OmniauthProviderConnectEvent } from 'app/models/omniauth-provider-connect-events';

export interface OmniauthProviderHttpResponse {
  status: OmniauthProviderConnectEvent;
  message?: string;
}

export type BaseHttpEvents = HttpResponseBase | ErrorEvent;
