import { HttpErrorResponse } from '@angular/common/http';
import { LogSeverity } from './api-entities/log';
import { ErrorMessage, ErrorResponse } from './error-response';

describe('ErrorResponse', () => {
  describe('constructor()', () => {
    it('should create ErrorResponse with error with code', () => {
      const httpError = new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        error: {code: 60100}
      });
      const errorResponse = new ErrorResponse(httpError);
      expect(errorResponse.statusCode).toEqual(404);
      expect(errorResponse.errorCode).toEqual(60100);
      expect(errorResponse.severity).toEqual(LogSeverity.error);
    });

    it('should create ErrorResponse with error with no error body', () => {
      const httpError = new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found'
      });
      const errorResponse = new ErrorResponse(httpError);
      expect(errorResponse.statusCode).toEqual(404);
      expect(errorResponse.errorCode).toEqual(undefined);
      expect(errorResponse.severity).toEqual(LogSeverity.error);
    });

    it('should create ErrorResponse with error with empty error body', () => {
      const httpError = new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
        error: {}
      });
      const errorResponse = new ErrorResponse(httpError);
      expect(errorResponse.statusCode).toEqual(404);
      expect(errorResponse.errorCode).toEqual(undefined);
      expect(errorResponse.severity).toEqual(LogSeverity.error);
    });
  });
});


describe('ErrorMessage', () => {
  describe('constructor()', () => {
    it('should create ErrorMessage with string', () => {
      const message = 'Uh oh';
      const errorMessage = new ErrorMessage(message);

      expect(errorMessage.name).toEqual(message);
      expect(errorMessage.message).toEqual(message);
      expect(errorMessage.severity).toEqual(LogSeverity.error);
    });
  });
});
