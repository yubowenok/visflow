import { Component, Watch } from 'vue-property-decorator';

import { Node, NodeSave } from '@/components/node';
import { SubsetSelection, SubsetPackage } from '@/data/package';
import { SubsetOutputPort, SubsetInputPort } from '@/components/port';
import TabularDataset from '@/data/tabular-dataset';
import { getColumnSelectOptions } from '@/data/util';

export interface VisualizationSave extends NodeSave {
  selection: number[];
  lastDatasetHash: string;
}

@Component
export default class Visualization extends Node {
  protected NODE_TYPE = 'visualization';
  protected containerClasses = ['node', 'visualization'];
  protected DEFAULT_WIDTH = 300;
  protected DEFAULT_HEIGHT = 300;
  protected RESIZABLE = true;

  protected isInVisMode = true;

  protected selection: SubsetSelection = new SubsetSelection();

  protected dataset: TabularDataset | null = null;
  protected lastDatasetHash: string = '';

  /**
   * Updates the output ports when there is no input dataset.
   */
  protected updateNoDatasetOutput() {
    (this.outputPortMap.out.getPackage() as SubsetPackage).clearItems();
  }

  /**
   * Computes the package for the selection port. This is the default implementation that assumes the visualization
   * node has a single input port 'in' and a single selection port 'selection'.
   */
  protected computeSelection() {
    const pkg = this.inputPortMap.in.getPackage() as SubsetPackage;
    const selectionPkg = pkg.subset(this.selection.getItems());
    this.outputPortMap.selection.updatePackage(selectionPkg);
  }

  /**
   * Propagates the selection changes by calling dataflow mutation.
   */
  protected propagateSelection() {
    this.portUpdated(this.outputPortMap.selection);
  }

  /**
   * Checks if there is input dataset. If not, shows a text message and returns false.
   */
  protected checkDataset(): boolean {
    if (!this.inputPortMap.in.isConnected() ||
      !(this.inputPortMap.in.getPackage() as SubsetPackage).hasDataset()) {
      this.dataset = null;
      this.coverText = 'No Dataset';
      this.updateNoDatasetOutput();
      return false;
    }
    this.dataset = (this.inputPortMap.in.getPackage() as SubsetPackage).getDataset() as TabularDataset;
    if (this.dataset.getHash() !== this.lastDatasetHash) {
      this.onDatasetChange();
      this.lastDatasetHash = this.dataset.getHash();
    }
    this.coverText = '';
    return true;
  }

  protected createPorts() {
    this.inputPorts = [
      new SubsetInputPort({
        data: {
          id: 'in',
          node: this,
        },
        store: this.$store,
      }),
    ];
    this.outputPorts = [
      new SubsetOutputPort({
        data: {
          id: 'selection',
          node: this,
          isSelection: true,
        },
        store: this.$store,
      }),
      new SubsetOutputPort({
        data: {
          id: 'out',
          node: this,
        },
        store: this.$store,
      }),
    ];
  }

  protected created() {
    this.serializationChain.push(() => {
      return {
        selection: this.selection.serialize(),
      };
    });
    this.deserializationChain.push(nodeSave => {
      const save = nodeSave as VisualizationSave;
      this.selection = new SubsetSelection(save.selection);
    });
  }

  /**
   * Performs updates on dataset change, such as re-selecting plotting columns.
   * @abstract
   */
  protected onDatasetChange() {
    console.error(`onDatasetChange() is not implemented for ${this.NODE_TYPE}`);
  }

  protected get columnSelectOptions() {
    return getColumnSelectOptions(this.dataset);
  }
}
