import { Component } from 'vue-property-decorator';
import InputPort from './input-port';
import { SubsetPackage } from '@/data/package';

@Component
export default class SubsetInPort extends InputPort {
  protected DATA_TYPE = 'subset';
  protected package: SubsetPackage = new SubsetPackage();

  // Typing helper method
  public getSubsetPackage() {
    return this.getPackage() as SubsetPackage;
  }

  protected tooltip(): string {
    if (!this.hasPackage()) {
      return 'no input';
    }
    return `${(this.getPackage() as SubsetPackage).numItems()} items`;
  }

}
