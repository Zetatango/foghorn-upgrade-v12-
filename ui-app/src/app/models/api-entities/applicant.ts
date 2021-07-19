export interface Applicant {
  first_name: string;
  last_name: string;
  date_of_birth: Date;
  owner_since: Date;
  phone_number: string;
  sin?: string;
}

export interface SubmitApplicantResponse {
  id: string;
  first_name: string;
  last_name: string;
}
