import { Component } from 'vue-property-decorator';
import OutputPort from './output-port';
import { SubsetPackage } from '@/data/package';

@Component
export default class SubsetOutputPort extends OutputPort {
  protected DATA_TYPE = 'subset';
  protected package: SubsetPackage = new SubsetPackage();

  public clearPackageItems() {
    this.package.clearItems();
    this.isUpdated = true;
  }

  protected tooltip(): string {
    return `${this.package.numItems()} items`;
  }
}
