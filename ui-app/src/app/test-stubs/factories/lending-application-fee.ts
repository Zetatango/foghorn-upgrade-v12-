import * as Factory from 'factory.ts';
import { Currency } from 'app/models/api-entities/utility';
import { lendingTerm60Days } from 'app/test-stubs/factories/lending-term';
import { LendingApplicationFee } from 'app/models/api-entities/lending-application';
import { lendingApplicationApproved } from 'app/test-stubs/factories/lending-application';
import { ZttResponse } from 'app/models/api-entities/response';

/********************************* FACTORIES **********************************/

export const lendingApplicationFeeFactory = Factory.Sync.makeFactory<LendingApplicationFee>({
  application_id: lendingApplicationApproved.id,
  fee: 0,
  principal_amount: 0,
  currency: Currency.CAD,
  loan_term: lendingTerm60Days,
  repayment_amount: 0
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const lendingApplicationFee = lendingApplicationFeeFactory.build();

/************************************ ZTT RESPONSES ********************************/

export const lendingApplicationFeeResponseFactory = Factory.makeFactory<ZttResponse<LendingApplicationFee>>({
  status: '200',
  message: 'success',
  data: lendingApplicationFeeFactory.build()
});
