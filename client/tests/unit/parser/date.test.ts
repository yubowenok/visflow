import { isProbablyDate } from '@/data/parser';

describe('isProbablyDate', () => {
  it('integer 10', () => {
    expect(isProbablyDate('10')).toBe(false);
  });

  it('float points', () => {
    expect(isProbablyDate('10.1')).toBe(false); // conservative about date like 10.1 (Oct 1)
    expect(isProbablyDate('3.123')).toBe(false);
    expect(isProbablyDate('13.1')).toBe(false);
  });

  it('4-digit year', () => {
    expect(isProbablyDate('2001')).toBe(true);
    expect(isProbablyDate('0100')).toBe(false);
    expect(isProbablyDate('9999')).toBe(false);
  });

  it('large timestamps', () => {
    expect(isProbablyDate('946684800000')).toBe(true);
    expect(isProbablyDate('12345')).toBe(false); // too small as timestamp
  });

  it('yyyy mm dd', () => {
    expect(isProbablyDate('2001/10/10')).toBe(true);
    expect(isProbablyDate('2001-10-10')).toBe(true);
  });

  it('mm dd yyyy', () => {
    expect(isProbablyDate('10/10/2001')).toBe(true);
    expect(isProbablyDate('10-10-2001')).toBe(true);
  });

  it('with h:mm:ss [a]', () => {
    expect(isProbablyDate('10:00:00 pm')).toBe(false); // conservative about daily time
    expect(isProbablyDate('July 1 2018, 10:00:00')).toBe(true);
    expect(isProbablyDate('July 1 2018, 10:00:00 pm')).toBe(true);
  });
});
