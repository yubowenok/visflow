import { Component } from 'vue-property-decorator';
import OutputPort from '../output-port';
import { SubsetPackage } from '@/data/package';

@Component
export default class SubsetOutputPort extends OutputPort {
  protected DATA_TYPE = 'subset';
  protected package: SubsetPackage = new SubsetPackage();
  protected isSelection = false;

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

  protected tooltip(): string {
    return `${this.package.numItems()} items`;
  }

  protected get iconClasses(): string {
    if (this.isSelection) {
      return 'far fa-square';
    }
    return this.maxConnections === 1 ? 'fas fa-circle' : 'fas fa-caret-right';
  }
}
