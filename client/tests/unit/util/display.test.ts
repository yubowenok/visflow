import { dateDisplay } from '@/common/util/display';

describe('dateDisplay', () => {
  it('4-digit year', () => {
    expect(dateDisplay('2010')).toBe('2010');
    expect(dateDisplay(2010)).toBe('2010');
  });

  it('timestamp', () => {
    expect(dateDisplay(1234567890123)).toBe('2/13/09 18:31:30');
  });

  it('mm/dd/yyyy', () => {
    expect(dateDisplay('10/07/2011')).toBe('10/7/11 00:00:00');
  });
});
