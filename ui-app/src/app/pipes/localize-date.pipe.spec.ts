import { DatePipe } from '@angular/common';
import { SupportedLanguage } from 'app/models/languages';
import { LocalizeDatePipe } from './localize-date.pipe';

describe('LocalizeDatePipe', () => {
  let pipe: LocalizeDatePipe;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthsFr = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  beforeEach(() => {
    pipe = new LocalizeDatePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('returns empty string if unsupported locale is passed in', () => {
    expect(pipe.transform(new Date(), null)).toEqual('');
  });

  describe('Timezone', () => {
    it('should format date to current timezone by default', () => {
      months.forEach((_, i) => {
        const date = new Date(2020, i, 25);
        const value = new DatePipe(SupportedLanguage.en).transform(date, 'longDate');
        expect(pipe.transform(date, SupportedLanguage.en)).toEqual(value);
      });
    });

    it('should format date to passed in timezone', () => {
      months.forEach((_, i) => {
        const date = new Date(2020, i, 25);
        const value = new DatePipe(SupportedLanguage.en).transform(date, 'longDate', 'UTC');
        expect(pipe.transform(date, SupportedLanguage.en, null, 'UTC')).toEqual(value);
      });
    });
  });

  describe('English', () => {
    it('should format date to longDate by default', () => {
      months.forEach((month, i) => {
        expect(pipe.transform(new Date(2020, i, 25), SupportedLanguage.en)).toEqual(`${month} 25, 2020`);
      });
    });

    it('should format to passed in format', () => {
      months.forEach((month, i) => {
        expect(pipe.transform(new Date(2020, i, 25), SupportedLanguage.en, 'MMMM')).toEqual(`${month}`);
      });
    });
  });

  describe('French', () => {
    it('should format date to longDate by default', () => {
      monthsFr.forEach((month, i) => {
        expect(pipe.transform(new Date(2020, i, 25), SupportedLanguage.fr)).toEqual(`25 ${month} 2020`);
      });
    });

    it('should format to passed in format', () => {
      monthsFr.forEach((month, i) => {
        expect(pipe.transform(new Date(2020, i, 25), SupportedLanguage.fr, 'MMMM')).toEqual(`${month}`);
      });
    });
  });
});
