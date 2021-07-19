import { ZttResponse } from './api-entities/response';

export enum UploadEventType {
  ERROR = 'error',                //  Sent when an error has occcurred
  FINALIZED = 'finalized',        //  Sent when the submission has been successfully sent
  INPUT_CHANGE = 'input-change',  //  Sent when the files[] changes
  READY = 'ready',                //  Sent when an autouploader has uploaded all their files
  RESET = 'reset'                 //  Sent when uploader wants to reset itself
}

export interface UploadEvent {
  type: UploadEventType;
  disabled?: boolean;
  filesUploaded?: number;
  response?: ZttResponse<string>;
}
