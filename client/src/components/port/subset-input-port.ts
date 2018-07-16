import { Component } from 'vue-property-decorator';
import InputPort from './input-port';
import { SubsetPackage } from '@/data/package';

@Component
export default class SubsetInPort extends InputPort {
  protected DATA_TYPE = 'subset';
  protected package: SubsetPackage = new SubsetPackage();

  // (Typing helper method) Explicitly states the output to be SubsetPackage.
  public getSubsetPackage(): SubsetPackage {
    return this.getPackage() as SubsetPackage;
  }

  protected tooltip(): string {
    if (!this.hasPackage()) {
      return 'no input';
    }
    return `${(this.getPackage() as SubsetPackage).numItems()} items`;
  }

}
