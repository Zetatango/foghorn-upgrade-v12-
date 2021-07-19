import * as Factory from 'factory.ts';
import { COUNTRY } from 'app/constants';
import { businessFormValid, addressFormValid } from 'app/test-stubs/factories/forms';
import { verifiedBusiness1, verifiedBusiness2 } from 'app/test-stubs/factories/verified-business';
import { MerchantQueryPost, MerchantQueryResponse } from 'app/models/api-entities/merchant-query';

/********************************* FACTORIES **********************************/

const merchantQueryPostFactory = Factory.Sync.makeFactory<MerchantQueryPost>({
  name: businessFormValid.name,
  address_line_1: addressFormValid.address_line_1,
  city: addressFormValid.city,
  state_province: addressFormValid.state_province,
  postal_code: addressFormValid.postal_code,
  country: COUNTRY,
  phone_number: businessFormValid.phone_number
});

const merchantQueryResponseFactory = Factory.Sync.makeFactory<MerchantQueryResponse>({
  query_id: Factory.each(i => i.toString()),
  results: [ verifiedBusiness1, verifiedBusiness2 ]
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

// merchant query POST
/** @deprecated Prefer factories instead. */
export const merchantQueryPost = merchantQueryPostFactory.build();
/** @deprecated Prefer factories instead. */
export const merchantQueryPostWhiteSpace = merchantQueryPostFactory.build({
  name: '    ' + businessFormValid.name + '    '
});
/** @deprecated Prefer factories instead. */
export const merchantQueryPostNullProperty = merchantQueryPostFactory.build({
  name: null
});

// merchant query response
/** @deprecated Prefer factories instead. */
export const merchantQueryResponse = merchantQueryResponseFactory.build();
/** @deprecated Prefer factories instead. */
export const merchantQueryResponseEmpty = merchantQueryResponseFactory.build({ results: [] });
