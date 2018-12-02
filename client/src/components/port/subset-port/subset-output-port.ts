import { Component } from 'vue-property-decorator';
import { mixins } from 'vue-class-component';
import OutputPort from '../output-port';
import SubsetPort from './subset-port';
import { SubsetPackage } from '@/data/package';

@Component
export default class SubsetOutputPort extends mixins(OutputPort, SubsetPort) {
  protected isSelection = false;
  protected reverseOutputDirection = false;

  /** Clears package items but retains the dataset. */
  public clearPackageItems() {
    this.package.clearItems();
    this.isUpdated = true;
  }

  /** Clears package items and the dataset. */
  public clear() {
    this.package.clearDataset();
    this.clearPackageItems();
  }

  /**
   * Updates the subset package. Avoid setting isUpdated to true when neither the dataset nor the subset changes.
   */
  public updatePackage(pkg: SubsetPackage) {
    const prevPkg = this.package;
    this.package = pkg;
    if (!prevPkg.isSamePackage(pkg)) {
      this.isUpdated = true;
    }
  }

  protected tooltip(): string {
    return `${this.package.numItems()} items`;
  }

  protected get iconClasses(): string {
    if (this.isSelection) {
      return 'far fa-square';
    }
    return this.maxConnections === 1 ? 'fas fa-circle' :
      (!this.reverseOutputDirection ? 'fas fa-caret-right' : 'fas fa-caret-left');
  }
}
