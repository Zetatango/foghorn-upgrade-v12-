import * as Factory from 'factory.ts';
import { LendingTerm, LendingTermType } from 'app/models/api-entities/lending-term';
import { RepaymentSchedule, TermUnit } from 'app/models/api-entities/utility';

/********************************* FACTORIES **********************************/

export const lendingTermFactory = Factory.makeFactory<LendingTerm>({
  id: Factory.each(i => 'pt_' + i.toString()),
  term_duration: 60,
  term_unit: TermUnit.days,
  localised_unit_label: 'PAY_TERMS.LABEL_DAYS',
  term_frequency: RepaymentSchedule.daily
});

/************************************ FIXTURES ********************************
 * Use of factories is strongly encouraged:
 *  - You can create whole new factories if necessary.
 *  - You can derive a variation of a factory with `myFactory.withDerivation( ... )`
 *  - You can assemble a factory out of other with `myFactory.combine(myOtherFactory)`
 */

/** @deprecated Prefer factories instead. */
export const lendingTerm60Days = lendingTermFactory.build();
/** @deprecated Prefer factories instead. */
export const lendingTerm90Days = lendingTermFactory.build({ term_duration: 90 });
/** @deprecated Prefer factories instead. */
export const lendingTerm120Days = lendingTermFactory.build({ term_duration: 120 });
/** @deprecated Prefer factories instead. */
export const lendingTerm6months = lendingTermFactory.build({
  term_duration: 6,
  term_unit: TermUnit.months,
  localised_unit_label: 'PAY_TERMS.LABEL_MONTHS'
});
/** @deprecated Prefer factories instead. */
export const lendingTerm9months = lendingTermFactory.build({
  term_duration: 9,
  term_unit: TermUnit.months,
  localised_unit_label: 'PAY_TERMS.LABEL_MONTHS'
});
/** @deprecated Prefer factories instead. */
export const lendingTerm12months = lendingTermFactory.build({
  term_duration: 12,
  term_unit: TermUnit.months,
  localised_unit_label: 'PAY_TERMS.LABEL_MONTHS'
});
/** @deprecated Prefer factories instead. */
export const lendingTerm6weeks = lendingTermFactory.build({
  term_duration: 6,
  term_unit: TermUnit.weeks,
  localised_unit_label: 'PAY_TERMS.LABEL_WEEKS'
});
/** @deprecated Prefer factories instead. */
export const lendingTerm10weeks = lendingTermFactory.build({
  term_duration: 10,
  term_unit: TermUnit.weeks,
  localised_unit_label: 'PAY_TERMS.LABEL_WEEKS'
});
/** @deprecated Prefer factories instead. */
export const lendingTerm14weeks = lendingTermFactory.build({
  term_duration: 14,
  term_unit: TermUnit.weeks,
  localised_unit_label: 'PAY_TERMS.LABEL_WEEKS'
});
/** @deprecated Prefer factories instead. */
export const directDebitTerm = lendingTermFactory.build({
  term_duration: 0,
  term_unit: TermUnit.one_time,
  id: 'direct_debit',
  term_type: LendingTermType.direct_debit,
  term_frequency: RepaymentSchedule.none,
  localised_unit_label: 'PAY_TERMS.LABEL_DAYS'
});
