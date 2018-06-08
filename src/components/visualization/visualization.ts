import { Component } from 'vue-property-decorator';
import { mixins } from 'vue-class-component';

import Node from '../node/node';

const TYPE_NAME = 'visualization';
@Component
export default class Visualization extends mixins(Node) {
  constructor() {
    super();
  }

  public minimize() {
    console.log('vis.minimize');
  }

  protected created() {
    this.coverText = 'no data';
    this.containerClasses.push(TYPE_NAME);
  }
}
