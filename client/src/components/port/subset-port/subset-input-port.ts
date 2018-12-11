import { Component } from 'vue-property-decorator';
import { mixins } from 'vue-class-component';

import SubsetPort from './subset-port';
import InputPort from '../input-port';
import { SubsetPackage } from '@/data/package';
import TabularDataset from '@/data/tabular-dataset';

@Component
export default class SubsetInputPort extends mixins(InputPort, SubsetPort) {
  // (Typing helper method) Explicitly states the output to be SubsetPackage.
  public getSubsetPackage(): SubsetPackage {
    return this.getPackage() as SubsetPackage;
  }

  public getSubsetPackageList(): SubsetPackage[] {
    return this.getPackageList() as SubsetPackage[];
  }

  public checkValidConnections(): boolean {
    for (const port of this.getConnectedPorts()) {
      if (!this.isTypeMatched(port)) {
        this.hasInvalidConnection = true;
        return false;
      }
    }
    this.hasInvalidConnection = this.areInputTablesDifferent();
    return true;
  }

  protected tooltip(): string {
    if (!this.hasPackage()) {
      return 'no input';
    }
    return !this.isMultiple ? `${this.getSubsetPackage().numItems()} items` : `${this.edges.length} connections`;
  }

  private areInputTablesDifferent(): boolean {
    let hash = '';
    for (const port of this.getConnectedPorts()) {
      const pkg = port.getPackage() as SubsetPackage;
      if (pkg && pkg.hasDataset()) {
        const dataset = pkg.getDataset() as TabularDataset;
        if (hash !== '' && dataset.getHash() !== hash) {
          return true;
        }
        hash = dataset.getHash();
      }
    }
    return false;
  }
}
