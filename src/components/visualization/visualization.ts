import { Component, Vue } from 'vue-property-decorator';
import Node from '../node/node';

@Component
export default class Visualization extends Node {
  public minimize() {
    console.log('vis.minimize');
  }

  private mounted() {
    this.minimize();
    this.maximize();
  }
}
