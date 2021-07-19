import { AbstractControl, ValidatorFn } from '@angular/forms';
import { parsePhoneNumber } from 'libphonenumber-js';

export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => { // eslint-disable-line
    if (!control.value) {
      return null;
    }

    if (control.value.length < 3) {
      return { 'invalid': { value: control.value } };
    }

    const isValidCanadaOrUSPhoneNumber = parsePhoneNumber(control.value, 'CA').isValid() || parsePhoneNumber(control.value, 'US').isValid();

    return !isValidCanadaOrUSPhoneNumber ? { 'invalid': { value: control.value } } : null;
  };
}
