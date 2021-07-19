import { asProvince, isProvince, Province } from 'app/models/province';

describe('ProvinceModel', () => {
  // -------------------------------------------------------------- isProvince()
  describe('isProvince()', () => {
    it('should return true for every supported Province', () => {
      Object.values(Province).forEach(province => {
        expect(isProvince(province)).toEqual(true);
      });
    });

    it('should return false unsupported Province', () => {
      expect(isProvince('US')).toEqual(false);
    });
  }); // describe - isProvince()

  // -------------------------------------------------------------- asProvince()
  describe('asProvince()', () => {
    it('should not alter valid province', () => {
      Object.values(Province).forEach(province => {
        expect(asProvince(province)).toEqual(Province[province]);
      });
    });

    it('should return null if the province is unknown', () => {
      expect(asProvince('US')).toEqual(null);
    });
  }); // describe - asProvince()

}); // describe - ProvinceModel
