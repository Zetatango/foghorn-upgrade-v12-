import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { differenceInYears, isBefore, isValid } from 'date-fns'

export function dateSmallEqualTodayValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => { // eslint-disable-line
    const date = control.value; // is already a Date object.

    return (!isValid(date) || isBefore(new Date(), date)) ? { 'error': 'Invalid Date' } : null;
  }
}

// Only allows age groups from 16 to 115.
export function ageRangeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => { // eslint-disable-line
    const diff = differenceInYears(new Date(), control.value);
    const ageLimit = (diff <= 15 || diff >= 116);
    return (!isValid(control.value) || ageLimit) ? { 'error': 'Invalid Date' } : null;
  }
}
