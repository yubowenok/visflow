
import { Component } from 'vue-property-decorator';
import _ from 'lodash';

import ns from '@/store/namespaces';
import template from './data-reservoir.html';
import { injectNodeTemplate } from '../node';
import { SubsetOutputPort } from '../port';
import { GetDatasetOptions } from '@/store/dataset/types';
import { SubsetNode } from '../subset-node';
import * as history from './history';

interface DataReservoirSave {
  items: number[];
}

@Component({
  template: injectNodeTemplate(template),
})
export default class DataReservoir extends SubsetNode {
  // public isPropagationSource = true;
  public isInputOutputDisconnected = true;

  protected NODE_TYPE = 'data-reservoir';
  protected DEFAULT_HEIGHT = 40;
  // protected REVERSE_INPUT_OUTPUT_PORTS = true;

  @ns.user.State('username') private username!: string;
  @ns.dataset.Action('getDataset') private dispatchGetDataset!: (options: GetDatasetOptions) => Promise<string>;

  private items: number[] = [];
  private heldItems: number[] = [];

  // Whether the output is different from what was last released
  private isOutputChanged = false;

  // Marks whether we should propagate at least once from this data reservoir.
  // This is necessary during deserialization when the data reservoir carries a subset of items but does not have
  // their input tabular dataset yet to propagate.
  private toPropagate = false;

  public setItems(items: number[]) {
    this.setOutputSubset(items);
    this.items = items;
    this.propagate();
  }

  protected created() {
    this.serializationChain.push((): DataReservoirSave => {
      return {
        items: this.items,
      };
    });
    this.deserializationChain.push(() => {
      if (this.items.length) {
        this.toPropagate = true;
      }
    });
  }

  protected onDatasetChange() {
  }

  protected update() {
    if (!this.checkDataset()) {
      return;
    }
    // A data reservoir only propagates the output when the user presses the release button.
    // Yet we also compute output to visually indicate changes on the output.
    this.checkOutputChange();

    // However during deserialization, the data reservoir must propagate at least once after it receives the
    // tabular dataset.
    if (this.toPropagate) {
      this.toPropagate = false;
      this.setItems(this.items);
    }
    // TODO: There is a caveat that when the data reservoir is disconnected from its input,
    // during regular diagram editing it would remember its dataset.
    // However if the diagram is then saved and loaded, during deserialization there is no way for the data reservoir
    // to recover the dataset without being connected to an input.
    // This may be fixed by letting the data reservoir remember the dataset and fetch the dataset itself when needed.
  }

  protected createOutputPorts() {
    this.outputPorts = [
      new SubsetOutputPort({
        data: {
          id: 'out',
          node: this,
          isMultiple: true,
        },
        store: this.$store,
      }),
    ];
  }

  /**
   * Computes and returns the output subset.
   */
  private computeOutput(): number[] {
    const inputPort = this.inputPortMap.in;
    if (!inputPort.hasPackage()) {
      return [];
    }
    const pkg = inputPort.getSubsetPackage();
    const dataset = pkg.getDataset();
    if (!dataset) {
      return [];
    }
    return pkg.getItemIndices();
  }

  /**
   * Computes the output subset and saves it on the output port.
   * However, it does not release the subset.
   */
  private updateOutput(items: number[]) {
    const inputPort = this.inputPortMap.in;
    if (!items.length) {
      if (!inputPort.hasPackage() || !inputPort.getSubsetPackage().hasDataset()) {
        this.updateNoDatasetOutput();
      }
      return;
    }
    const pkg = inputPort.getSubsetPackage();
    this.outputPortMap.out.updatePackage(pkg.clone());
  }

  /**
   * Sets the output subset to the given subset.
   * This is used by undo.
   */
  private setOutputSubset(items: number[]) {
    const inputPort = this.inputPortMap.in;
    if (!inputPort.hasPackage() || !inputPort.getSubsetPackage().hasDataset()) {
      this.updateNoDatasetOutput();
      return;
    }
    const pkg = inputPort.getSubsetPackage();
    this.outputPortMap.out.updatePackage(pkg.subset(items));
  }

  private releaseOutput() {
    const prevItems = this.items.concat();
    this.items = this.computeOutput();

    this.updateOutput(this.items);
    this.propagate();
    this.isOutputChanged = false;
    this.commitHistory(history.releaseOutputEvent(this, this.items, prevItems));
  }

  private checkOutputChange() {
    this.heldItems = this.computeOutput();
    this.isOutputChanged = !_.isEqual(this.heldItems, this.items);
  }

  private clearOutput() {
    this.updateNoDatasetOutput();
    this.propagate();
    this.commitHistory(history.clearOutputEvent(this, this.items));
  }
}
