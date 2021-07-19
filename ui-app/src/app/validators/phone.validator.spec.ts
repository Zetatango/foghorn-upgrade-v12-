import { phoneValidator } from './phone.validator';
import { FormControl } from '@angular/forms';

describe('phoneValidator', () => {
  const control = new FormControl('');
  const validator = phoneValidator();

  it('should return error object for invalid phone numbers', () => {
    const invalidPhoneNumbers = [
      '(000) 000-0000',
      '(111) 111-1111',
      '() 000-0000'
    ];
    invalidPhoneNumbers.forEach(phone => {
      control.setValue(phone);
      expect(validator(control)).toEqual({ 'invalid': { value: phone } });
    });
  });

  it('should return error object for phone numbers that are less than 3 chars', () => {
    const falsyValues = [
      '(',
      '(1',
      '(2'
    ];
    falsyValues.forEach(phone => {
      control.setValue(phone);
      expect(validator(control)).toEqual({ 'invalid': { value: phone } });
    });
  });

  it('should return null for phone numbers with falsy values', () => {
    const falsyValues = [
      null,
      undefined,
      ''
    ];
    falsyValues.forEach(phone => {
      control.setValue(phone);
      expect(validator(control)).toBeNull();
    });
  });

  it('should return null for valid phone numbers', () => {
    const validPhoneNumbers = [
      `(403) 200-1234`, // Alberta - Calgary
      `(604) 685-1234`, // British Columbia - Vancouver
      `(204) 661-1234`, // Manitoba - Winnipeg
      `(506) 440-1234`, // New Brunswick - Fredericton
      `(709) 771-1234`, // Newfoundland and Labrador - St. John's
      `(902) 497-1234`, // Nova Scotia and Prince Edward Island - Halifax
      `(416) 999-1234`, // Ontario - Toronto
      `(514) 200-1234`, // Quebec Montreal
      `(306) 227-1234`, // Saskatchewan - Saskatoon
      `(867) 322-1234`, // Yukon, Northwest Territories and Nunavut - Whitehorse
      `(469) 547-1234`, // Texas - Dallas
      `(650) 209-1234`, // California - Mountain View
    ];

    validPhoneNumbers.forEach(phone => {
      control.setValue(phone);
      expect(validator(control)).toBeNull();
    });
  });
});
