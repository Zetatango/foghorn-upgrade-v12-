import {
  JurisdictionBusinessNumberValidatorDirective,
  ALPHANUMERIC_JURISDICTIONS,
  ALPHA_START_JURISDICTIONS,
  NUMERIC_DASH_JURISDICTIONS,
  NUMERIC_JURISDICTIONS,
  JURISDICTION_LENGTH_RESTRICTIONS
} from './jurisdiction-business-number-validator.directive';
import { FormGroup, FormControl } from '@angular/forms';

describe('JurisdictionValidatorDirective', () => {
  const directive = new JurisdictionBusinessNumberValidatorDirective();

  const testControl = new FormGroup({
    'business_num': new FormControl('', []),
    'incorporated_in': new FormControl('', [])
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });
  // Note: [Graham] these describe / it contexts are backwards.
  describe('should return null', () => {
    it('when both business_num and incorporated_in are empty, regardless of business_num validation', () => {
      testControl.setValue({
        business_num: '',
        incorporated_in: ''
      });
      spyOnProperty(testControl.get('business_num'), 'valid').and.returnValue(true);

      expect(directive.validate(testControl)).toBeFalsy();
    });

    it('when business_num is filled and valid but incorporated_in does not exist', () => {
      const invalidControl = new FormGroup({
        'business_num': new FormControl('', []),
      });

      spyOnProperty(invalidControl.get('business_num'), 'valid').and.returnValue(false);

      expect(directive.validate(invalidControl)).toBeNull();
    });

    it('when both business_num and incorporated_in are non empty, regardless of business_num validation', () => {
      testControl.setValue({
        business_num: '000000',
        incorporated_in: 'ON'
      });
      spyOnProperty(testControl.get('business_num'), 'valid').and.returnValue(true);

      expect(directive.validate(testControl)).toBeFalsy();
    });

    it('when business_number is provided and incorporated_in is empty BUT business_num is invalid', () => {
      testControl.setValue({
        business_num: '000000',
        incorporated_in: 'ON'
      });
      spyOnProperty(testControl.get('business_num'), 'valid').and.returnValue(false);

      expect(directive.validate(testControl)).toBeFalsy();
    });
  });

  describe('should return jurisdictionIncomplete', () => {
    it('when business_num is filled and valid but incorporated_in is empty', () => {
      testControl.setValue({
        business_num: '000000',
        incorporated_in: ''
      });
      spyOnProperty(testControl.get('business_num'), 'valid').and.returnValue(true);

      expect(directive.validate(testControl)).toBeTruthy();
    });

    it('when business_num is filled and valid but incorporated_in does not exist', () => {
      const invalidControl = new FormGroup({
        'business_num': new FormControl('', []),
      });

      invalidControl.setValue({
        business_num: '12345AB'
      });

      spyOnProperty(invalidControl.get('business_num'), 'valid').and.returnValue(true);

      expect(directive.validate(invalidControl)).toEqual({ jurisdictionIncomplete: true });
    });
  });

  describe('should be not valid for jurisdiction selected', () => {
    it('when business_num is filled with non alphanumeric char with alphanumeric jurisdiction', () => {
      ALPHANUMERIC_JURISDICTIONS.forEach( (jurisdiction) => {
        testControl.setValue({
          business_num: 'AB12%',
          incorporated_in: jurisdiction
        });
        expect(directive.validate(testControl)).toBeTruthy();
        expect(directive.validate(testControl)).toEqual({'alphanumeric': true});
      });
    });

    it('when business_num is filled with non alpha leading char with alpha start jurisdiction', () => {
      ALPHA_START_JURISDICTIONS.forEach( (jurisdiction) => {
        testControl.setValue({
          business_num: '1',
          incorporated_in: jurisdiction
        });
        expect(directive.validate(testControl)).toBeTruthy();
        expect(directive.validate(testControl)).toEqual({'alphastart': true});
      });
    });

    it('when business_num is filled with alphanumeric char with numeric jurisdiction', () => {
      NUMERIC_JURISDICTIONS.forEach( (jurisdiction) => {
        testControl.setValue({
          business_num: '12345AB',
          incorporated_in: jurisdiction
        });
        expect(directive.validate(testControl)).toBeTruthy();
        expect(directive.validate(testControl)).toEqual({'numeric': true});
      });
    });

    it('when business_num is filled with alphanumeric and dash char with federal jurisdiction', () => {
      NUMERIC_DASH_JURISDICTIONS.forEach( (jurisdiction) => {
        testControl.setValue({
          business_num: '12345-78A',
          incorporated_in: jurisdiction
        });
        expect(directive.validate(testControl)).toBeTruthy();
        expect(directive.validate(testControl)).toEqual({'federal': true});
      });
    });

    it('when business_num is filled with beyond the length of selected jurisdiction', () => {
      const full_business_num = '12345678901234567890';
      for (const key of Object.keys(JURISDICTION_LENGTH_RESTRICTIONS)) {
        testControl.setValue({
          business_num: full_business_num.substr(0, JURISDICTION_LENGTH_RESTRICTIONS[key] + 1),
          incorporated_in: key
        });
        expect(directive.validate(testControl)).toBeTruthy();
        expect(directive.validate(testControl)).toEqual({'length': true});
      }
    });
  });

  describe('should  be valid for selected jurisdiction', () => {
    it('when business_num is filled with alphanumeric char with alphanumeric jurisdiction', () => {
      ALPHANUMERIC_JURISDICTIONS.forEach( (jurisdiction) => {
        testControl.setValue({
          business_num: 'AB12',
          incorporated_in: jurisdiction
        });
        expect(directive.validate(testControl)).toBeFalsy();
      });
    });

    it('when business_num is filled with alpha leading char with alpha start jurisdiction', () => {
      ALPHA_START_JURISDICTIONS.forEach( (jurisdiction) => {
        testControl.setValue({
          business_num: 'A',
          incorporated_in: jurisdiction
        });
        expect(directive.validate(testControl)).toBeFalsy();
      });
    });

    it('when business_num is filled with numeric char with numeric jurisdiction', () => {
      NUMERIC_JURISDICTIONS.forEach( (jurisdiction) => {
        testControl.setValue({
          business_num: '12345',
          incorporated_in: jurisdiction
        });
        expect(directive.validate(testControl)).toBeFalsy();
      });
    });

    it('when business_num is filled with numeric and dash char with federal jurisdiction', () => {
      NUMERIC_DASH_JURISDICTIONS.forEach( (jurisdiction) => {
        testControl.setValue({
          business_num: '12345-78',
          incorporated_in: jurisdiction
        });
        expect(directive.validate(testControl)).toBeFalsy();
      });
    });

    it('when business_num is filled within the length of selected jurisdiction', () => {
      let full_business_num = '';
      for (const key of Object.keys(JURISDICTION_LENGTH_RESTRICTIONS)) {
        if ((ALPHA_START_JURISDICTIONS.indexOf(key)) !== -1) {
           full_business_num = 'B2345678901234567890';
        } else {
          full_business_num = '12345678901234567890';
        }
        testControl.setValue({
          business_num: full_business_num.substr(0, JURISDICTION_LENGTH_RESTRICTIONS[key]),
          incorporated_in: key
        });
        expect(directive.validate(testControl)).toBeFalsy();
      }
    });
  });
});
