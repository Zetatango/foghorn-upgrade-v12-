import { asSupportedLanguage, isSupportedLanguage, SupportedLanguage } from 'app/models/languages';

describe('LanguageModel', () => {
  // -------------------------------------------------------------- isSupportedLanguage()
  describe('isSupportedLanguage()', () => {
    it('should return true for every supported languages', () => {
      Object.values(SupportedLanguage).forEach(lang => {
        expect(isSupportedLanguage(lang)).toEqual(true);
      });
    });

    it('should return false unsupported languages', () => {
      expect(isSupportedLanguage('ES')).toEqual(false); // Note: Ideally, should test again full list of language codes.
    });
  }); // describe - isSupportedLanguage()

  // -------------------------------------------------------------- asSupportedLanguage()
  describe('asSupportedLanguage()', () => {
    it('should not alter supported languages', () => {
      Object.values(SupportedLanguage).forEach(lang => {
        expect(asSupportedLanguage(lang)).toEqual(SupportedLanguage[lang]);
      });
    });

    it('should default unsupported languages to english', () => {
      expect(asSupportedLanguage('ES')).toEqual(SupportedLanguage.default); // Note: Ideally, should test again full list of language codes.
    });
  }); // describe - asSupportedLanguage()

}); // describe - LanguageModel
