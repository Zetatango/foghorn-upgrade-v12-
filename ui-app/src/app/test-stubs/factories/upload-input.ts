import { UploadInput } from 'ngx-uploader';
import * as Factory from 'factory.ts';
import { UPLOAD_URL, CACHE_URL } from 'app/services/file-storage.service';
import { uploadOutputMock } from './upload-output';
import { UploadedDocumentDestination } from 'app/models/api-entities/file-storage';
import { CustomUploadFile } from 'app/models/custom-upload-file';

const file: CustomUploadFile = uploadOutputMock.file;

/********************************* FACTORIES **********************************/

const uploadInputFactory = Factory.makeFactory<UploadInput>({
    type: 'uploadFile',
    url: UPLOAD_URL,
    headers: {},
    method: 'POST',
    file: file,
    id: file.id,
    data: {
        file_id: file.id,
        document_type: file.documentType,
        destination: UploadedDocumentDestination.WILE_E,
        s3_key: null
    }
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

// Note: Technically, these are fine since they are functions and will generate a fesh entity eveytime.

export function uploadEventWithToken(token: string): UploadInput {
    return uploadInputFactory.build({ headers: { 'X-CSRF-TOKEN': token }});
}

export function uploadEventWithS3(token: string, s3Key: string): UploadInput {
    return uploadInputFactory.build({
        url: CACHE_URL,
        headers: { 'X-CSRF-TOKEN': token },
        data: {
            destination: CACHE_URL,
            s3_key: s3Key
        }
    });
}
