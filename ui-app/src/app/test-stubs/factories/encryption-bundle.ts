import * as Factory from 'factory.ts';
import { EncryptionBundle } from 'app/models/encryption-bundle';
import { ZttResponse } from 'app/models/api-entities/response';

/********************************* FACTORIES **********************************/

export const encryptionBundleFactory = Factory.Sync.makeFactory<EncryptionBundle>({
  presigned_url: 'https://nacho-dev.s3.ca-central-1.amazonaws.com/test1.txt?x-amz-server-side-encryption=aws',
  s3_key: 'd2f1b8fc-1634-4e00-b583-ef87f1a69196'
});

export const encryptionBundleResponseFactory = Factory.Sync.makeFactory<ZttResponse<EncryptionBundle>>({
  status: 'SUCCESS',
  message: 'Loaded',
  body: encryptionBundleFactory.build()
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const sampleEncryptionBundle: EncryptionBundle = encryptionBundleFactory.build();
