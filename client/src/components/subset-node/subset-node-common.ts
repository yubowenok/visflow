/**
 * Provides all common subset node methods, but without typing helpers. This is not intended to be a base class to
 * inherit. Use SubsetNode instead, which provides typing helpers. Without typing helpers, fetching datasets/packages
 * can be tedious in requiring type cast, e.g. from Package to SubsetPackage.
 *
 * A common subset node assumes one input subset port and one output subset port.
 */
import { Component } from 'vue-property-decorator';
import SubsetNodeBase from './subset-node-base';
import TabularDataset from '@/data/tabular-dataset';
import { SubsetPackage } from '@/data/package';
import { SubsetInputPort, SubsetOutputPort } from '@/components/port';
import { getColumnSelectOptions, isNumericalType } from '@/data/util';

interface SubsetNodeSave {
  lastDatasetHash: string;
}

@Component
export default class SubsetNodeCommon extends SubsetNodeBase {
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

  /**
   * Returns null if a column index is out of the new dataset's columns range.
   */
  protected updateColumnOnDatasetChange(column: number | null): number | null {
    return this.updateColumnOnDatasetChangeBase(column, this.dataset);
  }

  /**
   * Returns the columns that are still inside the dataset's columns range.
   */
  protected updateColumnsOnDatasetChange(columns: number[]): number[] {
    return columns
      .map(column => this.updateColumnOnDatasetChange(column))
      .filter(column => column !== null) as number[];
  }
}
