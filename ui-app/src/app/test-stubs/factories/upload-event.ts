import * as Factory from 'factory.ts';
import { UploadEvent, UploadEventType } from 'app/models/upload-event';
import { stringResponseFactory } from './response';


export const MAX_FILE_UPLOAD_SIZE = 75 * 1024 * 1024; // 75MB

/********************************* FACTORIES **********************************/

const uploadEventFactory = Factory.makeFactory<UploadEvent>({
  type: UploadEventType.INPUT_CHANGE,
  disabled: false,
  filesUploaded: 0,
  response: undefined
});


/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const inputChangeDisabledEvent = uploadEventFactory.build({ disabled: true });
/** @deprecated Prefer factories instead. */
export const inputChangeEnabledEvent = uploadEventFactory.build();
/** @deprecated Prefer factories instead. */
export const statusReadyEvent = uploadEventFactory.build({ type: UploadEventType.READY, filesUploaded: 1 });
/** @deprecated Prefer factories instead. */
export const finalizedEvent = uploadEventFactory.build({ type: UploadEventType.FINALIZED });
/** @deprecated Prefer factories instead. */
export const finalizedEventWithFiles = (numberOfFiles: number): UploadEvent => uploadEventFactory.build({
  type: UploadEventType.FINALIZED,
  filesUploaded: numberOfFiles, response: stringResponseFactory.build({ data: `["md_123"]` })
});
/** @deprecated Prefer factories instead. */
export const resetEvent = uploadEventFactory.build({ type: UploadEventType.RESET, disabled: true });
/** @deprecated Prefer factories instead. */
export const errorEnabledEvent = uploadEventFactory.build({ type: UploadEventType.ERROR });
/** @deprecated Prefer factories instead. */
export const errorDisabledEvent = uploadEventFactory.build({ type: UploadEventType.ERROR, disabled: true });
/** @deprecated Prefer factories instead. */
export const finalizedEventWithResponse = uploadEventFactory.build({ disabled: true, response: stringResponseFactory.build({ data: `["md_123"]` }) });
/** @deprecated Prefer factories instead. */
export const finalizedEventWithFilesAndResponse = (numberOfFiles: number): UploadEvent => uploadEventFactory.build({
  type: UploadEventType.FINALIZED,
  filesUploaded: numberOfFiles, response: stringResponseFactory.build()
});
