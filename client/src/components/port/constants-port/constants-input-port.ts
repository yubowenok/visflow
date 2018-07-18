import { Component } from 'vue-property-decorator';
import InputPort from '../input-port';
import { ConstantsPackage } from '@/data/package';

@Component
export default class ConstantsInputPort extends InputPort {
  protected DATA_TYPE = 'constants';
  protected package: ConstantsPackage = new ConstantsPackage();
  protected isMultiple = true;

  // (Typing helper method) Explicitly states the output to be ConstantsPackage.
  public getConstantsPackage(): ConstantsPackage {
    return this.getPackage() as ConstantsPackage;
  }

  protected tooltip(): string {
    if (!this.hasPackage()) {
      return 'no input';
    }
    return `${this.getConstantsPackage().numConstants()} constants`;
  }
}
