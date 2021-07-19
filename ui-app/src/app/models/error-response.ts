import { HttpErrorResponse } from '@angular/common/http';
import { FlinksRequestResponse } from './api-entities/flinks-request';
import { LogSeverity } from './api-entities/log';
import { BugsnagSeverity } from './bugsnag';

export class ErrorResponse extends HttpErrorResponse {
  customSeverity: BugsnagSeverity | null;
  errorCode: number;
  severity: LogSeverity;
  statusCode: number;

  constructor(err: HttpErrorResponse | FlinksRequestResponse) { // eslint-disable-line @typescript-eslint/no-explicit-any
    super(err);

    this.customSeverity = null;
    this.errorCode = err.error?.code;
    this.severity = LogSeverity.error;
    this.statusCode = err.status;
  }
}

export class ErrorMessage {
  name: string;
  message: string;
  severity: LogSeverity;

  constructor(err: string) { // eslint-disable-line @typescript-eslint/no-explicit-any
    this.name = err;
    this.message = err;
    this.severity = LogSeverity.error;
  }
}
