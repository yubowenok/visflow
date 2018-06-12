import { Component, Prop, Watch } from 'vue-property-decorator';
import { mixins } from 'vue-class-component';

import Node, { injectNodeTemplate } from '../node/node';
import template from './visualization.html';
@Component({
  template: injectNodeTemplate(template),
})
export default class Visualization extends mixins(Node) {
  protected NODE_TYPE = 'visualization';
  protected DEFAULT_WIDTH = 300;
  protected DEFAULT_HEIGHT = 300;
  protected RESIZABLE = true;

  public minimize() {
    console.log('vis.minimize');
  }

  protected created() {
    this.coverText = 'no data';
    this.containerClasses.push(this.NODE_TYPE);

    console.log('created vis');
  }

  private testOption() {
    this.minimize();
  }
}
