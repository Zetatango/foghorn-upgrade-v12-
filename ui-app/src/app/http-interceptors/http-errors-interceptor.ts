import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError, EMPTY, NEVER } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StateRoutingService } from 'app/services/state-routing.service';
import { CONSTANTS } from 'app/constants';
import { ErrorResponse } from "app/models/error-response";

@Injectable()
export class HttpErrorsInterceptor implements HttpInterceptor {

  constructor(private stateRouterService: StateRoutingService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> { // eslint-disable-line @typescript-eslint/no-explicit-any
    return next.handle(req).pipe(
      catchError((err) => {
        if (this.isUnauthorizedError(err)) {
          this.stateRouterService.performRedirect(CONSTANTS.UNAUTHORIZED_REDIRECT_LOGIN_URL);
          return NEVER;
        } else if (this.isRedisUnavailableError(err)) {
          this.stateRouterService.performRedirect(CONSTANTS.REDIS_UNAVAILABLE_URL);
          return NEVER;
        } else if (this.isUnknownError(err)) {
          return EMPTY;
        } else {
          return throwError(new ErrorResponse(err)); // Propagate the error.
        }
      }));
  }

  private isUnauthorizedError(err: unknown): boolean {
    return err instanceof HttpErrorResponse && err.status === 401;
  }

  private isRedisUnavailableError(err: unknown): boolean {
    return err instanceof HttpErrorResponse && err.status === 503 && err.error.code === CONSTANTS.REDIS_ERROR_CODE;
  }

  private isUnknownError(err: unknown): boolean {
    return err instanceof HttpErrorResponse && err.status === 0 && err.statusText === 'Unknown Error';
  }
}
