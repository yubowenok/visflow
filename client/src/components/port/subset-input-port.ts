import { Component } from 'vue-property-decorator';
import InputPort from './input-port';
import { SubsetPackage } from '@/data/package';

@Component
export default class SubsetInPort extends InputPort {
  protected package: SubsetPackage = new SubsetPackage();

  protected tooltip(): string {
    if (!this.hasPackage()) {
      return '';
    }
    return `${(this.getPackage() as SubsetPackage).numItems()} items`;
  }
}
