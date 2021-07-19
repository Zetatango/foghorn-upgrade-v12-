import { Directive } from '@angular/core';
import { ValidationErrors, ValidatorFn, FormGroup, Validator, AbstractControl } from '@angular/forms';

export const ALPHANUMERIC_JURISDICTIONS = ['AB', 'BC', 'NB', 'NL'];
export const ALPHA_START_JURISDICTIONS = ['BC'];
export const NUMERIC_JURISDICTIONS = ['MB', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];
export const NUMERIC_DASH_JURISDICTIONS = ['CD'];

export const JURISDICTION_LENGTH_RESTRICTIONS = {
  AB: 10,
  BC: 10,
  CD: 10,
  QC: 10,
  NS: 9,
  NL: 8,
  NB: 6
};

export const jurisdictionBusinessNumberValidator: ValidatorFn = (control: FormGroup): ValidationErrors | null => {
  const jurisdiction = control.get('incorporated_in');
  const businessNumber = control.get('business_num');

  // Check for missing jurisdiction when business number has been set
  if (businessNumber.value && businessNumber.valid && !jurisdiction?.value) {
    return { 'jurisdictionIncomplete': true };
  }

  // If jurisdiction is not set, no need to check anything else
  if (!jurisdiction?.value) return null;

  // Check for alphanumeric jurisdictions
  if (ALPHANUMERIC_JURISDICTIONS.indexOf(jurisdiction.value) !== -1) {
    if (!(/^[a-zA-Z\d]+$/.test(businessNumber.value))) {
      return {'alphanumeric': true};
    }
  }

  // Check for numeric jurisdictions
  if (NUMERIC_JURISDICTIONS.indexOf(jurisdiction.value) !== -1) {
    if (!(/^\d+$/.test(businessNumber.value))) {
      return {'numeric': true};
    }
  }

  // Check for federal jurisdictions
  if (NUMERIC_DASH_JURISDICTIONS.indexOf(jurisdiction.value) !== -1) {
    if (!(/^[\d-]+$/.test(businessNumber.value))) {
      return {'federal': true};
    }
  }

  // Check for maximum length for those that jurisdictions that restrict it
  if (JURISDICTION_LENGTH_RESTRICTIONS[jurisdiction.value] !== undefined) {
    if (businessNumber.value && businessNumber.value.length > JURISDICTION_LENGTH_RESTRICTIONS[jurisdiction.value]) {
      return {'length': true};
    }
  }

  // Check for Jurisdiction that starts with alpha only
  if (ALPHA_START_JURISDICTIONS.indexOf(jurisdiction.value) !== -1) {
    if (!(/[a-zA-Z]/.test(businessNumber.value))) {
      return {'alphastart': true};
    }
  }

  return null;
};

@Directive({
  selector: '[zttJurisdictionValidator]'
})
export class JurisdictionBusinessNumberValidatorDirective implements Validator {

  validate(control: AbstractControl): ValidationErrors {
    return jurisdictionBusinessNumberValidator(control);
  }
}
