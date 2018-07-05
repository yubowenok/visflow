import { Component, Prop, Watch } from 'vue-property-decorator';
import { mixins } from 'vue-class-component';

import Node, { injectNodeTemplate } from '../node/node';
import template from './visualization.html';
@Component({
  template: injectNodeTemplate(template),
})
export default class Visualization extends mixins(Node) {
  protected NODE_TYPE = 'visualization';
  protected containerClasses = ['node', 'visualization'];
  protected DEFAULT_WIDTH = 300;
  protected DEFAULT_HEIGHT = 300;
  protected RESIZABLE = true;

  protected isInVisMode = true;

  private testOption() {
  }
}
