import { Component } from 'vue-property-decorator';
import OutputPort from '../output-port';
import { ConstantsPackage } from '@/data/package';

@Component
export default class ConstantsOutputPort extends OutputPort {
  protected DATA_TYPE = 'constants';
  protected package: ConstantsPackage = new ConstantsPackage();

  public clear() {
    this.package.clear();
    this.isUpdated = true;
  }

  protected tooltip(): string {
    return `${this.package.numConstants} constants`;
  }
}
