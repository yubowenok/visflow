import { Component } from 'vue-property-decorator';

import { injectNodeTemplate } from '@/components/node/node';
import Visualization from '@/components/visualization/visualization';
import template from './table.html';
import { SubsetPackage } from '@/data/package';

@Component({
  template: injectNodeTemplate(template),
})
export default class Table extends Visualization {
  protected NODE_TYPE = 'table';
  protected containerClasses = ['node', 'visualization', 'table'];

  protected update() {
    if (this.checkNoDataset()) {
      return;
    }

    const input = this.inputPorts[0]; // single input
    const pkg = input.getPackage();

    console.log(this.selection, JSON.stringify(this.selection));
  }
}
