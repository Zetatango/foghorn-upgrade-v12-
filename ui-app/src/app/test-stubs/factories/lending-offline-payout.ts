import * as Factory from 'factory.ts';
import { LendingOfflinePayout, PayoutPayee } from 'app/models/api-entities/lending-offline-payout';

/********************************* FACTORIES **********************************/

export const lendingPayoutFactory = Factory.makeFactory<LendingOfflinePayout>({
  payee: PayoutPayee.cra,
  amount: 10000,
  label: ''
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const lendingPayoutCra = lendingPayoutFactory.build();
/** @deprecated Prefer factories instead. */
export const lendingPayoutLandlord = lendingPayoutFactory.build({ payee: PayoutPayee.landlord });
/** @deprecated Prefer factories instead. */
export const lendingPayoutOther = lendingPayoutFactory.build({ payee: PayoutPayee.other });
