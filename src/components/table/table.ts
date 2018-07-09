import { Component, Prop, Watch } from 'vue-property-decorator';

import { injectNodeTemplate } from '../node/node';
import Visualization from '../visualization/visualization';
import template from './table.html';

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
    console.log(pkg);
  }
}
