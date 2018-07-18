import { Component } from 'vue-property-decorator';
import { Node, injectNodeTemplate } from '@/components/node';
import TabularDataset from '@/data/tabular-dataset';
import { SubsetPackage } from '@/data/package';
import { SubsetInputPort, SubsetOutputPort } from '@/components/port';
import { getColumnSelectOptions } from '@/data/util';

interface SubsetNodeSave {
  lastDatasetHash: string;
}

@Component({
  template: injectNodeTemplate(''),
})
export default class SubsetNode extends Node {
  protected NODE_TYPE = 'subset-node';
  protected dataset: TabularDataset | null = null;
  protected lastDatasetHash: string = '';

  // Overwrite port typings
  protected inputPortMap: { [id: string]: SubsetInputPort } = {};
  protected outputPortMap: { [id: string]: SubsetOutputPort } = {};

  protected created() {
    this.serializationChain.push((): SubsetNodeSave => {
      return {
        lastDatasetHash: this.lastDatasetHash,
      };
    });
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
          id: 'out',
          node: this,
        },
        store: this.$store,
      }),
    ];
  }

  /**
   * Checks if there is no input dataset.
   */
  protected hasNoDataset(): boolean {
    return !this.inputPortMap.in.isConnected() ||
      !(this.inputPortMap.in.getPackage() as SubsetPackage).hasDataset();
  }

  /**
   * Checks if there is no input dataset, and if so, shows a text message and returns false.
   */
  protected checkDataset(): boolean {
    if (this.hasNoDataset()) {
      this.dataset = null;
      this.coverText = 'No Dataset';
      this.updateNoDatasetOutput();
      return false;
    }
    this.dataset = (this.inputPortMap.in.getPackage() as SubsetPackage).getDataset() as TabularDataset;
    // Check if we have switched from one dataset to another dataset. Datasets must not be undefined and must
    // have a valid hash value. Changing hash from '' (no data) does not trigger onDatasetChange(). This is
    // to preserve node state such as column selection.
    if (this.dataset.getHash() !== this.lastDatasetHash) {
      this.onDatasetChange();
      this.lastDatasetHash = this.dataset.getHash();
    }
    this.coverText = '';
    return true;
  }

  /**
   * Updates the output ports when there is no input dataset.
   */
  protected updateNoDatasetOutput() {
    this.outputPortMap.out.clear();
  }

  /**
   * Performs updates on dataset change, such as re-selecting plotting columns.
   * When this function is called, this.dataset is guaranteed to be defined.
   * @abstract
   */
  protected onDatasetChange() {
    console.error(`onDatasetChange() is not implemented for ${this.NODE_TYPE}`);
  }

  // Typing helper method
  protected getDataset(): TabularDataset {
    return this.dataset as TabularDataset;
  }

  protected get columnSelectOptions() {
    return getColumnSelectOptions(this.dataset);
  }

  protected forwardSubset(input: SubsetInputPort, output: SubsetOutputPort) {
    output.updatePackage(input.getSubsetPackage().clone());
  }
}
