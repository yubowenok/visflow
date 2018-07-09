import { Component, Prop, Watch } from 'vue-property-decorator';

import Node, { injectNodeTemplate, NodeSave } from '../node/node';
import template from './visualization.html';

export interface VisualizationSave extends NodeSave {
  selectedItems: number[];
}

@Component({
  template: injectNodeTemplate(template),
})
export default class Visualization extends Node {
  protected NODE_TYPE = 'visualization';
  protected containerClasses = ['node', 'visualization'];
  protected DEFAULT_WIDTH = 300;
  protected DEFAULT_HEIGHT = 300;
  protected RESIZABLE = true;

  protected isInVisMode = true;

  /**
   * Checks if there is input dataset. If not, shows a text message.
   */
  protected checkNoDataset(): boolean {
    if (!this.inputPortMap.in.hasPackage()) {
      this.coverText = 'No Dataset';
      return true;
    }
    this.coverText = '';
    return false;
  }

  private testOption() {
  }
}
