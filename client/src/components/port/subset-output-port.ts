import { Component } from 'vue-property-decorator';
import OutputPort from './output-port';
import { SubsetPackage } from '@/data/package';

@Component
export default class SubsetOutputPort extends OutputPort {
  protected package: SubsetPackage = new SubsetPackage();

  protected tooltip(): string {
    return `${this.package.numItems()} items`;
  }
}
