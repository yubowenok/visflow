import { Component } from 'vue-property-decorator';
import InputPort from '../input-port';
import { SubsetPackage } from '@/data/package';

@Component
export default class SubsetInputPort extends InputPort {
  protected DATA_TYPE = 'subset';
  protected package: SubsetPackage = new SubsetPackage();

  // (Typing helper method) Explicitly states the output to be SubsetPackage.
  public getSubsetPackage(): SubsetPackage {
    return this.getPackage() as SubsetPackage;
  }

  public getSubsetPackageList(): SubsetPackage[] {
    return this.getPackageList() as SubsetPackage[];
  }

  protected tooltip(): string {
    if (!this.hasPackage()) {
      return 'no input';
    }
    return !this.isMultiple ? `${this.getSubsetPackage().numItems()} items` : `${this.edges.length} connections`;
  }
}
