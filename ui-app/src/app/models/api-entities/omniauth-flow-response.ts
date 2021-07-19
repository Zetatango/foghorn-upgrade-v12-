export interface OmniauthFlowResponse {
  status: boolean;
  message?: string;
}

export enum QuickbooksFlowMessage {
  realmIdChangedError = 'REALM_ID_CHANGED'
}

