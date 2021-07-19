import { RepaymentSchedule, TermUnit } from 'app/models/api-entities/utility';

export interface LendingTerm {
  id: string;
  term_duration: number;
  term_unit: TermUnit;
  localised_unit_label?: string;
  term_type?: LendingTermType;
  term_frequency: RepaymentSchedule;
}

export enum LendingTermType {
  direct_debit = 'direct_debit',
  financing = 'financing'
}
