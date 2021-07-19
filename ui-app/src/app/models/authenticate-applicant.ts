export class AuthenticateApplicant {
  authentication_query_guid: string;
  applicant_responses: number[];

  constructor(authentication_query_guid = '', applicant_responses = []) {
    this.authentication_query_guid = authentication_query_guid;
    this.applicant_responses = applicant_responses;
  }
}
