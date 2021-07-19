import { asJurisdiction, isJurisdiction, Jurisdiction } from 'app/models/jurisdiction';

describe('JursdictionModel', () => {
  // -------------------------------------------------------------- isJurisdiction()
  describe('isJurisdiction()', () => {
    it('should return true for every supported jurisdiction', () => {
      Object.values(Jurisdiction).forEach(jurisdiction => {
        expect(isJurisdiction(jurisdiction)).toEqual(true);
      });
    });

    it('should return false unsupported jurisdiction', () => {
      expect(isJurisdiction('US')).toEqual(false);
    });
  }); // describe - isJurisdiction()

  // -------------------------------------------------------------- asJurisdiction()
  describe('asJurisdiction()', () => {
    it('should not alter a valid jurisdiction', () => {
      Object.values(Jurisdiction).forEach(jurisdiction => {
        expect(asJurisdiction(jurisdiction)).toEqual(Jurisdiction[jurisdiction]);
      });
    });

    it('should return null if the jurisdiction is unknown', () => {
      expect(asJurisdiction('US')).toEqual(null);
    });
  }); // describe - asJurisdiction()

}); // describe - JursdictionModel
