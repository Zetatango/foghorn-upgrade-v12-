export interface FlinksRequestResponse {
  status: number;
  message: string;
  data?: string;
  code?: number;
  error?: FlinksRequestError;
}

export interface FlinksRequestError {
  code: number;
  status: number;
  message: string;
}
