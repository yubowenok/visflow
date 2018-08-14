import { Component } from 'vue-property-decorator';
import { mixins } from 'vue-class-component';

import SubsetPort from './subset-port';
import InputPort from '../input-port';
import { SubsetPackage } from '@/data/package';

@Component
export default class SubsetInputPort extends mixins(InputPort, SubsetPort) {
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
