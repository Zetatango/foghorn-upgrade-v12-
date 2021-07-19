import { ValidatorFn, AbstractControl } from '@angular/forms';

export function sinValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => { // eslint-disable-line
    const value = (control.value as string).replace(/[ _]/g, '');

    if (value.length === 0) {
      return null;
    }

    //http://www.notesbit.com/index.php/web-mysql/web-scripts/luhn-algorithm-for-credit-card-check-using-javascript/
    if (value.length !== 9) {
        return { 'error': 'Invalid Value' };
    }

    let sum = 0;
    let mul = 1;
    const l = value.length;
    for (let i = 0; i < l; i++) {
      const digit = value.substring(l - i - 1, l - i);
      const tproduct = parseInt(digit, 10) * mul;
      if (tproduct >= 10) { sum += (tproduct % 10) + 1; } else { sum += tproduct; }
      if (mul == 1) { mul++; } else { mul--; }
    }
    if ((sum % 10) !== 0) {
        return { 'error': 'Invalid Value' };
    }

    return null;
  };
}
