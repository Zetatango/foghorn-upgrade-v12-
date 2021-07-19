import * as Factory from 'factory.ts';
import { FlinksRequestResponse, FlinksRequestError } from 'app/models/api-entities/flinks-request';
import { FlinksPollingState } from 'app/models/bank-account';
import { ErrorResponse } from 'app/models/error-response';

/********************************* FACTORIES **********************************/

export const flinksRequestResponseFactory = Factory.Sync.makeFactory<FlinksRequestResponse>({
  status: 200,
  message: 'query completed',
  data: FlinksPollingState.success,
  code: 0
});

export const flinksRequestErrorFactory = Factory.Sync.makeFactory<FlinksRequestError>( {
  status: 500,
  code: 0,
  message: 'internal server error'
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

// SUCCESS Responses
/** @deprecated Prefer factories instead. */
export const flinksRequestStateDone = flinksRequestResponseFactory.build();
/** @deprecated Prefer factories instead. */
export const flinksRequestStatePending = flinksRequestResponseFactory.build({ data: FlinksPollingState.pending });
/** @deprecated Prefer factories instead. */
export const flinksRequestStateUnkown = flinksRequestResponseFactory.build({ data: null });

/** @deprecated Prefer factories instead. */
export const flinksRequestStateSuccess = [ flinksRequestStateDone, flinksRequestStatePending ];

// ERROR Responses
/** @deprecated Prefer factories instead. */
export const flinksRequestStateInvalidReqId = new ErrorResponse(flinksRequestResponseFactory.build({ status: 404, message: 'Not found', code: 40003 }));
/** @deprecated Prefer factories instead. */
export const flinksRequestStateTimeoutError = new ErrorResponse(flinksRequestResponseFactory.build({ status: 408, message: 'Timeout error', code: 40013 }));
/** @deprecated Prefer factories instead. */
export const flinksRequestStateFlinksAccountTypeNotAccepted = new ErrorResponse(flinksRequestResponseFactory.build({ status: 422 }));
/** @deprecated Prefer factories instead. */
export const flinksRequestStateFlinksInvalidHolder = new ErrorResponse(flinksRequestResponseFactory.build({ status: 422 }));
/** @deprecated Prefer factories instead. */
export const flinksRequestStateFlinksCommError = new ErrorResponse(flinksRequestResponseFactory.build({ status: 424, message: 'Communication error', code: 40012 }));

/** @deprecated Prefer factories instead. */
export const flinksRequestStateFail = [
  flinksRequestStateInvalidReqId,
  flinksRequestStateTimeoutError,
  flinksRequestStateFlinksAccountTypeNotAccepted,
  flinksRequestStateFlinksInvalidHolder,
  flinksRequestStateFlinksCommError
];
