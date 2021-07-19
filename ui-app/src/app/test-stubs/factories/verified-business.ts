import * as Factory from 'factory.ts';
import { businessFormValid, addressFormValid } from 'app/test-stubs/factories/forms';
import { COUNTRY } from 'app/constants';
import { VerifiedBusiness } from 'app/models/api-entities/merchant-query';

/********************************* FACTORIES **********************************/

const verifiedBusinessFactory = Factory.Sync.makeFactory<VerifiedBusiness>({
  id: Factory.each(i => i.toString()),
  name: Factory.each(i => 'BUSINESS' + i),
  phone_number: businessFormValid.phone_number,
  address_line_1: addressFormValid.address_line_1,
  address_line_2: addressFormValid.address_line_2,
  city: addressFormValid.city,
  state_province: addressFormValid.state_province,
  postal_code: addressFormValid.postal_code,
  country: COUNTRY
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

// verified business objects
/** @deprecated Prefer factories instead. */
export const verifiedBusiness1 = verifiedBusinessFactory.build();
/** @deprecated Prefer factories instead. */
export const verifiedBusiness2 = verifiedBusinessFactory.build();
