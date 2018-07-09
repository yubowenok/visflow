import { expect } from 'chai';
import { isProbablyDate } from '@/data/parser';

describe('isProbablyDate', () => {
  it('integer 10', () => {
    expect(isProbablyDate('10')).to.be.false;
  });

  it('float points', () => {
    expect(isProbablyDate('10.1')).to.be.false; // conservative about date like 10.1 (Oct 1)
    expect(isProbablyDate('3.123')).to.be.false;
    expect(isProbablyDate('13.1')).to.be.false;
  });

  it('4-digit year', () => {
    expect(isProbablyDate('2001')).to.be.true;
    expect(isProbablyDate('0100')).to.be.false;
    expect(isProbablyDate('9999')).to.be.false;
  });

  it('large timestamps', () => {
    expect(isProbablyDate('946684800000')).to.be.true;
    expect(isProbablyDate('12345')).to.be.false; // too small as timestamp
  });

  it('yyyy mm dd', () => {
    expect(isProbablyDate('2001/10/10')).to.be.true;
    expect(isProbablyDate('2001-10-10')).to.be.true;
  });

  it('mm dd yyyy', () => {
    expect(isProbablyDate('10/10/2001')).to.be.true;
    expect(isProbablyDate('10-10-2001')).to.be.true;
  });

  it('with h:mm:ss [a]', () => {
    expect(isProbablyDate('10:00:00 pm')).to.be.false; // conservative about daily time
    expect(isProbablyDate('July 1 2018, 10:00:00')).to.be.true;
    expect(isProbablyDate('July 1 2018, 10:00:00 pm')).to.be.true;
  });
});
