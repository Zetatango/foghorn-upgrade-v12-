import * as Factory from 'factory.ts';
import { Ubl, UblState } from 'app/models/api-entities/ubl';
import { Currency, RepaymentSchedule } from 'app/models/api-entities/utility';
import { lendingApplicationApproved } from 'app/test-stubs/factories/lending-application';
import { merchantDataFactory } from './merchant';

/********************************* FACTORIES **********************************/

export const lendingUblFactory = Factory.makeFactory<Ubl>({
  id: 'lub_abc',
  state: UblState.repaying,
  application_id: lendingApplicationApproved.id,
  merchant_id: merchantDataFactory.build().id,
  merchant_account_id: '',
  terms: 'terms',
  currency: Currency.CAD,
  principal_amount: 100.00,
  interest_amount: 1.50,
  apr: 1.5,
  loan_term: null,
  repayment_schedule: RepaymentSchedule.daily,
  activated_at: null,
  loan_sent_at: null,
  loan_deposited_at: null,
  fully_repaid_at: null,
  first_repayment_at: null,
  next_repayment_amount: 50.00,
  next_repayment_at: '2019-01-01T00:00:00.000Z',
  loan_status: null
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const lendingUblRepaying = lendingUblFactory.build();
/** @deprecated Prefer factories instead. */
export const lendingUblLastRepayment = lendingUblFactory.build({ state: UblState.last_repayment });
/** @deprecated Prefer factories instead. */
export const lendingUblInProgress = lendingUblFactory.build({ state: UblState.in_progress });
/** @deprecated Prefer factories instead. */
export const lendingUblComplete = lendingUblFactory.build({ state: UblState.complete });
/** @deprecated Prefer factories instead. */
export const lendingUblPending = lendingUblFactory.build({ state: UblState.pending });
