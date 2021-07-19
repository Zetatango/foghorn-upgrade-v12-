import * as Factory from 'factory.ts';
import { UploadOutput } from 'ngx-uploader';
import { payloadTooLargeErrorFile, uploadFileEnqueued, uploadFileProgressDone } from '../factories/upload-file';

/********************************* FACTORIES **********************************/

const uploadOutputFactory = Factory.makeFactory<UploadOutput>({
  type: 'allAddedToQueue',
  file: uploadFileEnqueued
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const uploadOutputMock = uploadOutputFactory.build();
/** @deprecated Prefer factories instead. */
export const uploadOutputEnqueued = uploadOutputFactory.build({ type: 'addedToQueue' });
/** @deprecated Prefer factories instead. */
export const uploadOutputEnqueuedUndefined = uploadOutputFactory.build({ type: 'addedToQueue', file: undefined });
/** @deprecated Prefer factories instead. */
export const uploadOutputUploading = uploadOutputFactory.build({ type: 'uploading' });
/** @deprecated Prefer factories instead. */
export const uploadOutputCancelled = uploadOutputFactory.build({ type: 'cancelled'});
/** @deprecated Prefer factories instead. */
export const uploadOutputCancelledNotFound = uploadOutputFactory.build({ type: 'cancelled', file: { id: '2' } });
/** @deprecated Prefer factories instead. */
export const uploadOutputUploadingNotFound = uploadOutputFactory.build({ type: 'uploading', file: { id: '2' } });
/** @deprecated Prefer factories instead. */
export const uploadOutputDoneNotFound = uploadOutputFactory.build({ type: 'done', file: { id: '2', responseStatus: 400 } });
/** @deprecated Prefer factories instead. */
export const uploadOutputRemoved = uploadOutputFactory.build({ type: 'removed' });
/** @deprecated Prefer factories instead. */
export const uploadOutputDragOver = uploadOutputFactory.build({ type: 'dragOver' });
/** @deprecated Prefer factories instead. */
export const uploadOutputDragOut = uploadOutputFactory.build({ type: 'dragOut' });
/** @deprecated Prefer factories instead. */
export const uploadOutputDrop = uploadOutputFactory.build({ type: 'drop' });
/** @deprecated Prefer factories instead. */
export const uploadOutputDone = uploadOutputFactory.build({ type: 'done', file: uploadFileProgressDone });
/** @deprecated Prefer factories instead. */
export const uploadOutputDoneWithError = uploadOutputFactory.build({ type: 'done', file: payloadTooLargeErrorFile });
/** @deprecated Prefer factories instead. */
export const uploadOutputRejected = uploadOutputFactory.build({ type: 'rejected', file: uploadFileEnqueued });
