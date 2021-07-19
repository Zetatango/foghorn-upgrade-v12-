import { MaskPipe } from './mask.pipe';

describe('MaskPipe', () => {
  it('create an instance', () => {
    const pipe = new MaskPipe();
    expect(pipe).toBeTruthy();
  });

  it('will not apply mask for input of length 4', () => {
    const pipe = new MaskPipe();
    expect(pipe.transform('1234')).toEqual('1234');
  });

  it('should apply a mask and only display last 4 digits', () => {
    const pipe = new MaskPipe();
    expect(pipe.transform('123456789')).toEqual('*****6789');
  });
});
