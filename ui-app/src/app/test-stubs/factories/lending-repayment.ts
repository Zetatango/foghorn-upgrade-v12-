import * as Factory from 'factory.ts';
import { LendingRepayment, LendingRepaymentState } from 'app/models/api-entities/lending-repayment';
import { Currency, RepaymentSchedule } from 'app/models/api-entities/utility';
import { lendingUblComplete } from 'app/test-stubs/factories/lending-ubl';

/********************************* FACTORIES **********************************/

export const lendingRepaymentFactory = Factory.makeFactory<LendingRepayment>({
  id: 'lrp_1',
  state: LendingRepaymentState.transferring,
  ubl_id: lendingUblComplete.id,
  merchant_account_id: '',
  currency: Currency.CAD,
  repayment_amount: 10.0,
  repayment_requested_for: '2019-01-01',
  repayment_schedule: RepaymentSchedule.daily
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const lendingRepaymentTransferring = lendingRepaymentFactory.build();
/** @deprecated Prefer factories instead. */
export const oldLendingRepaymentTransferring = lendingRepaymentFactory.build({repayment_requested_for: '1970-01-02'});
/** @deprecated Prefer factories instead. */
export const newLendingRepaymentTransferring = lendingRepaymentFactory.build({repayment_requested_for: '2070-01-01'});
/** @deprecated Prefer factories instead. */
export const undefinedDateLendingRepaymentTransferring = lendingRepaymentFactory.build({repayment_requested_for: undefined});

