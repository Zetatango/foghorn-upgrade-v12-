import { FormControl } from '@angular/forms';
import { principalValidator } from 'app/offer/validators/offer.validator';
import { offer$ } from 'app/test-stubs/factories/lending/offer-stubs';

describe('principalValidator', function () {
  this.offerMinAmount = offer$.value.min_principal_amount;
  this.offerAvailableAmount = offer$.value.available_amount;

  beforeEach(() => {
    this.control = new FormControl('');
  });

  it('should return { principalTooLow: true } if the value is too low', () => {
    this.control.setValue(this.offerMinAmount - 1);

    expect(principalValidator.bind(this)(this.control)).toEqual({principalTooLow: true});
  });

  it('should return { principalTooHigh: true } if the value is too low', () => {
    this.control.setValue(this.offerAvailableAmount + 1);

    expect(principalValidator.bind(this)(this.control)).toEqual({principalTooHigh: true});
  });

  it('should return null if the value is within range', () => {
    this.control.setValue(this.offerMinAmount);

    expect(principalValidator.bind(this)(this.control)).toBeNull();
  });
}); // describe - principalValidator
