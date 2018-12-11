import { dateDisplay } from '@/common/util/display';

describe('dateDisplay', () => {
  it('4-digit year', () => {
    expect(dateDisplay('2010')).toBe('2010');
    expect(dateDisplay(2010)).toBe('2010');
  });

  it('timestamp with intraday', () => {
    expect(dateDisplay(1234567890123)).toBe('2/13/09 18:31:30');
  });

  it('timestamp without intraday', () => {
    expect(dateDisplay(1519362000000)).toBe('2/23/18');
  });

  it('year month day strings', () => {
    expect(dateDisplay('10/07/2011')).toBe('10/7/11');
    expect(dateDisplay('2011 Oct 7')).toBe('10/7/11');
    expect(dateDisplay('2011 October')).toBe('10/1/11');
  });
});
