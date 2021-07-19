import * as Factory from 'factory.ts';
import { Address } from 'app/models/address';

/********************************* FACTORIES **********************************/

export const addressFactory = Factory.Sync.makeFactory<Address>({
  address_line_1: '35 Fitzgerald Rd.',
  city: 'Ottawa',
  state_province: 'ON',
  postal_code: 'K4K4K4'
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const address = (): Address => addressFactory.build();
/** @deprecated Prefer factories instead. */
export const addressWithLine2 = (): Address => addressFactory.build({
  address_line_2: 'Unit 400'
});

