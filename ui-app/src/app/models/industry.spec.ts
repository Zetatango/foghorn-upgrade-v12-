import { asIndustry, Industry, isIndustry } from 'app/models/industry';

describe('IndustryModel', () => {
  // -------------------------------------------------------------- isIndustry()
  describe('isIndustry()', () => {
    it('should return true for every supported Industry', () => {
      Object.values(Industry).forEach(industry => {
        expect(isIndustry(industry)).toEqual(true);
      });
    });

    it('should return false unsupported Industry', () => {
      expect(isIndustry('US')).toEqual(false);
    });
  }); // describe - isIndustry()

  // -------------------------------------------------------------- asIndustry()
  describe('asIndustry()', () => {
    it('should not alter a valid industry', () => {
      Object.values(Industry).forEach(industry => {
        expect(asIndustry(industry)).toEqual(Industry[industry]);
      });
    });

    it('should return null if the industry is unknown', () => {
      expect(asIndustry('US')).toEqual(null);
    });
  }); // describe - asIndustry()

}); // describe - IndustryModel
