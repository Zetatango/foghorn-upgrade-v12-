import { SupportedLanguage } from 'app/models/languages';
import { ZttCurrencyPipe } from './ztt-currency.pipe';

describe('ZttCurrencyPipe', () => {
  let pipe: ZttCurrencyPipe;

  beforeEach(() => {
    pipe = new ZttCurrencyPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('returns empty string if unsupported locale is passed in', () => {
    expect(pipe.transform(123, null)).toEqual('');
  });

  describe('English', () => {
    it('should format to expected English format', () => {
      expect(pipe.transform(123.23, SupportedLanguage.en)).toEqual('$123.23');
    });
  });

  describe('French', () => {
    it('should format to expected French format', () => {
      expect(pipe.transform(123.23, SupportedLanguage.fr)).toEqual('123,23 $');
    });
  });

  describe('Precision', () => {
    it('should show 2 decimal points from a number that has no cents', () => {
      expect(pipe.transform(123, SupportedLanguage.en)).toEqual('$123.00');
    });

    it('should show 2 decimal points from a number that has 2 decimal places', () => {
      expect(pipe.transform(123.45, SupportedLanguage.en)).toEqual('$123.45');
    });

    it('should show 2 decimal points from a number that has greater than 2 decimal places', () => {
      expect(pipe.transform(123.45111, SupportedLanguage.en)).toEqual('$123.45');
    });

    it('should show 2 decimal points rounded up from a number that has greater than 2 decimal places', () => {
      expect(pipe.transform(123.45678, SupportedLanguage.en)).toEqual('$123.46');
    });
    it('should show give number of decimal points when an symbol-narrow is provided', () => {
      expect(pipe.transform(123.45678, SupportedLanguage.en, '1.0-0')).toEqual('$123');
    });
  });
});
