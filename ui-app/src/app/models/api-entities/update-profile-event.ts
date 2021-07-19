import { BusinessPartnerProfileRequestParams } from './business-partner-profile-request-params';

export interface UpdateProfileEvent {
  params: BusinessPartnerProfileRequestParams;
  requestType: UpdateProfileEventRequestType;
}

export enum UpdateProfileEventRequestType {
  setFacebookSharingRequest = 'setFacebookSharingRequest',
  setLinkedInSharingRequest = 'setLinkedInSharingRequest',
  setTwitterSharingRequest = 'setTwitterSharingRequest'
}
