import * as Factory from 'factory.ts';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { ZttResponse } from 'app/models/api-entities/response';

///  ERROR RESPONSE FACTORIES///
export const unknownErrorFactory = Factory.Sync.makeFactory<HttpErrorResponse>(new HttpErrorResponse({
  status: 0,
  statusText: 'Unknown Error'
}));

export const badRequestFactory = Factory.Sync.makeFactory<HttpErrorResponse>(new HttpErrorResponse({
  status: 400,
  statusText: 'Bad Request'
}));

export const unauthorizedFactory = Factory.Sync.makeFactory<HttpErrorResponse>(new HttpErrorResponse({
  status: 401,
  statusText: 'Unauthorized'
}));

export const paymentRequiredFactory = Factory.Sync.makeFactory<HttpErrorResponse>(new HttpErrorResponse({
  status: 402,
  statusText: 'Payment Required'
}));

export const notFoundFactory = Factory.Sync.makeFactory<HttpErrorResponse>(new HttpErrorResponse({
  status: 404,
  statusText: 'Not Found'
}));

export const conflictFactory = Factory.Sync.makeFactory<HttpErrorResponse>(new HttpErrorResponse({
  status: 409,
  statusText: 'Conflict'
}));

export const expectationFailedFactory = Factory.Sync.makeFactory<HttpErrorResponse>(new HttpErrorResponse({
  status: 417,
  statusText: 'Expectation Failed'
}));

export const unprocessableEntityFactory = Factory.Sync.makeFactory<HttpErrorResponse>(new HttpErrorResponse({
  status: 422,
  statusText: 'Unprocessable Entity'
}));

export const internalServerErrorFactory = Factory.Sync.makeFactory<HttpErrorResponse>(new HttpErrorResponse({
  status: 500,
  statusText: 'Internal Server Error'
}));

export const serviceUnavailableFactory = Factory.Sync.makeFactory<HttpErrorResponse>(new HttpErrorResponse({
  status: 503,
  statusText: 'Service Unavailable'
}));

///  SUCCESS RESPONSE FACTORIES///
export const okFactory = Factory.Sync.makeFactory<HttpResponse<unknown>>(new HttpResponse({
  status: 200,
  statusText: 'OK'
}));

export const acceptedFactory = Factory.Sync.makeFactory<HttpResponse<unknown>>(new HttpResponse({
  status: 201,
  statusText: 'Accepted'
}));

export const nonAuthInfoFactory = Factory.Sync.makeFactory<HttpResponse<unknown>>(new HttpResponse({
  status: 202,
  statusText: 'Non-Authoritative Information'
}));

export const noContentFactory = Factory.Sync.makeFactory<HttpResponse<unknown>>(new HttpResponse({
  status: 203,
  statusText: 'Non-Authoritative Information'
}));

export const resetContentFactory = Factory.Sync.makeFactory<HttpResponse<unknown>>(new HttpResponse({
  status: 205,
  statusText: 'Reset Content'
}));

export const partialConentFactory = Factory.Sync.makeFactory<HttpResponse<unknown>>(new HttpResponse({
  status: 206,
  statusText: 'Partial Content'
}));


///  ARRAY OF RESPONSE FACTORIES ///
export const commonErrorsFactory = Factory.Sync.makeFactory<{ errors: HttpErrorResponse[] }>(
  {
    errors: [
      badRequestFactory.build(),
      unauthorizedFactory.build(),
      notFoundFactory.build(),
      conflictFactory.build(),
      unprocessableEntityFactory.build(),
      internalServerErrorFactory.build()
    ]
  }
);

export const passthroughErrorsFactory = Factory.Sync.makeFactory<{ errors: HttpErrorResponse[] }>(
  {
    errors: [
      badRequestFactory.build(),
      notFoundFactory.build(),
      conflictFactory.build(),
      unprocessableEntityFactory.build(),
      internalServerErrorFactory.build(),
    ]
  }
);

export const successResponseFactory = Factory.Sync.makeFactory<{ responses: HttpResponse<unknown>[] }>(
  {
    responses: [
      okFactory.build(),
      acceptedFactory.build(),
      nonAuthInfoFactory.build(),
      noContentFactory.build(),
      resetContentFactory.build(),
      partialConentFactory.build(),
    ]
  }
);

///  COMMON GENERIC ZTT RESPONSE FACTORIES ///
export const voidResponseFactory = Factory.Sync.makeFactory<ZttResponse<void>>({
  status: 'SUCCESS',
  message: 'Loaded'
});

export const stringResponseFactory = Factory.Sync.makeFactory<ZttResponse<string>>({
  status: 'SUCCESS',
  message: 'Loaded',
  data: ''
});

export const nullResponseFactory = Factory.Sync.makeFactory<ZttResponse<null>>({
  status: 'SUCCESS',
  message: 'Loaded',
  data: null
});
