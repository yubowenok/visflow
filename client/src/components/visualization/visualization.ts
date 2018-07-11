import { Component } from 'vue-property-decorator';

import { Node, NodeSave, injectNodeTemplate } from '@/components/node';
import template from './visualization.html';
import { SubsetSelection } from '@/data/package';

export interface VisualizationSave extends NodeSave {
  selection: Selection;
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

  protected selection: SubsetSelection = new SubsetSelection();

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

  protected created() {
    this.serializationChain.push(() => {
      return {
        selection: this.selection,
      };
    });
  }

  private testOption() {
  }
}
