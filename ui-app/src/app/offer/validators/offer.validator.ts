import { AbstractControl, ValidationErrors } from '@angular/forms';

export function principalValidator(control: AbstractControl): ValidationErrors | null {
  if (control.value < this.offerMinAmount) {
    return {principalTooLow: true}
  }

  if (control.value > this.offerAvailableAmount) {
    return {principalTooHigh: true}
  }

  return null;
}
