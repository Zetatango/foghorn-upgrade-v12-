import { ageRangeValidator, dateSmallEqualTodayValidator } from 'app/components/utilities/date-picker/date-small-equal-today.validator';
import { FormControl } from '@angular/forms';
import { addDays, subDays, subYears } from 'date-fns';

describe('dateSmallEqualTodayValidator', () => {
  const errorResponse = { 'error': 'Invalid Date' };
  let formControl: FormControl;

  beforeEach(() => {
    formControl = new FormControl('');
  });

  it('should return an error if the control.value is undefined', () => {
    formControl.setValue(undefined);

    expect(dateSmallEqualTodayValidator()(formControl)).toEqual(errorResponse);
  });

  it('should return an error if the control.value is null', () => {
    formControl.setValue(null);

    expect(dateSmallEqualTodayValidator()(formControl)).toEqual(errorResponse);
  });

  it('should return an error if the control.value is invalid', () => {
    const date = new Date('mumbly_bumbly_58');
    formControl.setValue(date);

    expect(dateSmallEqualTodayValidator()(formControl)).toEqual(errorResponse);
  });

  it('should return an error if the control.value is valid but is in the future', () => {
    const futureDate = addDays(new Date(), 1);
    formControl.setValue(futureDate);

    expect(dateSmallEqualTodayValidator()(formControl)).toEqual(errorResponse);
  });


  it('should return null if the control.value is valid and is in the past', () => {
    const pastDate = subDays(new Date(), 1);
    formControl.setValue(pastDate);

    expect(dateSmallEqualTodayValidator()(formControl)).toBeNull();
  });
}); // describe - principalValidator

describe('ageRangeValidator', () => {
  const errorResponse = { 'error': 'Invalid Date' };
  let formControl: FormControl;

  beforeEach(() => {
    formControl = new FormControl('');
  });

  it('should return an error if the control.value is undefined', () => {
    formControl.setValue(undefined);

    expect(ageRangeValidator()(formControl)).toEqual(errorResponse);
  });

  it('should return an error if the control.value is null', () => {
    formControl.setValue(null);

    expect(ageRangeValidator()(formControl)).toEqual(errorResponse);
  });

  it('should return an error if the control.value is valid but age is less than 16', () => {
    const selDate = subYears(new Date(),15);
    
    formControl.setValue(selDate);

    expect(ageRangeValidator()(formControl)).toEqual(errorResponse);
  });

  it('should return an error if the control.value is valid but age is greater than 115', () => {
    const selDate = subYears(new Date(),116);
    
    formControl.setValue(selDate);

    expect(ageRangeValidator()(formControl)).toEqual(errorResponse);
  });

  it('should return null if the control.value is valid and is within range 16 to 115', () => {
    const pastDate = subYears(new Date(), 18);
    formControl.setValue(pastDate);

    expect(ageRangeValidator()(formControl)).toBeNull();
  });
}); // describe - ageRangeValidator
