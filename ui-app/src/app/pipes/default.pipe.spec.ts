import { DefaultPipe } from './default.pipe';

describe('DefaultPipe', () => {
  let pipe: DefaultPipe;

  beforeEach(() => {
    pipe = new DefaultPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('when handling numbers', () => {
    it('should return the value if defined', () => {
      expect(pipe.transform(123, '-')).toEqual(123);
    });

    it('should return the default value if null', () => {
      expect(pipe.transform(null, '-')).toEqual('-');
    });

    it('should return the default value if undefined', () => {
      expect(pipe.transform(undefined, '-')).toEqual('-');
    });
  });

  describe('when handling strings', () => {
    it('should return the value if defined', () => {
      expect(pipe.transform('123', '-')).toEqual('123');
    });

    it('should return the default value if null', () => {
      expect(pipe.transform(null, '-')).toEqual('-');
    });

    it('should return the default value if undefined', () => {
      expect(pipe.transform(undefined, '-')).toEqual('-');
    });
  });
});
