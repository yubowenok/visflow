import { Component, Prop, Watch } from 'vue-property-decorator';
import { mixins } from 'vue-class-component';

import Node, { injectNodeTemplate } from '../node/node';
import Visualization from '../visualization/visualization';
import template from './table.html';
@Component({
  template: injectNodeTemplate(template),
})
export default class Table extends mixins(Visualization) {
  protected NODE_TYPE = 'table';
  protected containerClasses = ['node', 'visualization', 'table'];
  protected DEFAULT_WIDTH = 300;
  protected DEFAULT_HEIGHT = 300;
  protected RESIZABLE = true;
}
