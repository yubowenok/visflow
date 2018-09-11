/**
 * Provides all the subset node methods, but without typing helpers. This is not intended to be a base class to
 * inherit. Use SubsetNode instead, which provides typing helpers. Without typing helpers, fetching datasets/packages
 * can be tedious in requiring type cast, e.g. from Package to SubsetPackage.
 */
import { Component } from 'vue-property-decorator';
import { Node } from '@/components/node';
import TabularDataset from '@/data/tabular-dataset';
import { SubsetPackage } from '@/data/package';
import { SubsetInputPort, SubsetOutputPort } from '@/components/port';
import { getColumnSelectOptions, isNumericalType } from '@/data/util';

interface SubsetNodeSave {
  lastDatasetHash: string;
}

@Component
export default class SubsetNodeBase extends Node {
  protected NODE_TYPE = 'subset-node';
  protected dataset: TabularDataset | null = null;
  protected lastDatasetHash: string = '';

  public hasDataset(): boolean {
    return this.dataset !== null;
  }

  // Typing helper method
  public getDataset(): TabularDataset {
    return this.dataset as TabularDataset;
  }

  public getSubsetInputPort(): SubsetInputPort {
    return this.inputPortMap.in as SubsetInputPort;
  }

  public getSubsetOutputPort(): SubsetOutputPort {
    return this.outputPortMap.out as SubsetOutputPort;
  }

  protected created() {
    this.serializationChain.push((): SubsetNodeSave => {
      return {
        lastDatasetHash: this.lastDatasetHash,
      };
    });
  }

  protected createInputPorts() {
    this.inputPorts = [
      new SubsetInputPort({
        data: {
          id: 'in',
          node: this,
        },
        store: this.$store,
      }),
    ];
  }

  protected createOutputPorts() {
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
   * Performs updates on dataset change, such as re-selecting plotting columns.
   * When this function is called, this.dataset is guaranteed to be defined.
   * @abstract
   */
  protected onDatasetChange() {
    console.error(`onDatasetChange() is not implemented for ${this.NODE_TYPE}`);
  }

  protected get columnSelectOptions() {
    return getColumnSelectOptions(this.dataset);
  }

  protected get numericalColumnSelectOptions() {
    return getColumnSelectOptions(this.dataset, column => isNumericalType(column.type));
  }

  protected forwardSubset(input: SubsetInputPort, output: SubsetOutputPort) {
    output.updatePackage(input.getSubsetPackage().clone());
  }

  protected updateAndPropagate() {
    this.update();
    this.propagate();
  }

  /**
   * Propagates the node's update, assuming there is one output "out".
   */
  protected propagate() {
    this.portUpdated(this.outputPortMap.out);
  }

  /**
   * Updates the output ports when there is no input dataset.
   */
  protected updateNoDatasetOutput() {
    this.outputPortMap.out.clear();
  }
}
