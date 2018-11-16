
import { Component } from 'vue-property-decorator';
import _ from 'lodash';

import ns from '@/store/namespaces';
import template from './loopback-control.html';
import { injectNodeTemplate } from '../node';
import { SubsetOutputPort } from '../port';
import { DatasetInfo, GetDatasetOptions } from '@/store/dataset/types';
import { SubsetNode } from '../subset-node';

interface LoopbackControlSave {
  items: number[];
}

@Component({
  template: injectNodeTemplate(template),
  components: {

  },
})
export default class LoopbackControl extends SubsetNode {
  public isPropagationSource = true;
  public isInputOutputDisconnected = true;

  protected NODE_TYPE = 'loopback-control';
  protected DEFAULT_HEIGHT = 35;
  protected REVERSE_INPUT_OUTPUT_PORTS = true;

  @ns.user.State('username') private username!: string;
  @ns.dataset.Action('getDataset') private dispatchGetDataset!: (options: GetDatasetOptions) => Promise<string>;

  private items: number[] = [];

  // Marks whether we should propagate at least once from this loopback control.
  // This is necessary during deserialization when the loopback control carries a subset of items but does not have
  // their input tabular dataset yet to propagate.
  private toPropagate = false;

  protected created() {
    this.serializationChain.push((): LoopbackControlSave => {
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

  protected update() {
    // Nothing to do during diagram edit, as a loopback control only propagates the output when the user presses
    // the release button.

    // However during deserialization, the loopback control must propagate at least once after it receives the
    // tabular dataset.
    const inputPort = this.inputPortMap.in;
    if (inputPort.hasPackage() && inputPort.getSubsetPackage().getDataset() && this.toPropagate) {
      this.toPropagate = false;
      this.releaseOutput();
    }
    // TODO: There is a caveat that when the loopback control is disconnected from its input,
    // during regular diagram editing it would remember its dataset.
    // However if the diagram is then saved and loaded, during deserialization there is no way for the loopback control
    // to recover the dataset without being connected to an input.
    // This may be fixed by letting the loopback control remember the dataset and fetch the dataset itself when needed.
  }

  protected createOutputPorts() {
    this.outputPorts = [
      new SubsetOutputPort({
        data: {
          id: 'out',
          node: this,
          isMultiple: true,
          reverseOutputDirection: true,
        },
        store: this.$store,
      }),
    ];
  }

  /**
   * Computes the output subset and saves it on the output port.
   * However, it does not release the subset.
   */
  private computeOutput() {
    const inputPort = this.inputPortMap.in;
    const outputPort = this.outputPortMap.out;
    if (!inputPort.hasPackage()) {
      this.updateNoDatasetOutput();
      return;
    }
    const pkg = inputPort.getSubsetPackage();
    this.items = pkg.getItemIndices();
    const dataset = pkg.getDataset();
    if (!dataset) {
      this.updateNoDatasetOutput();
      return;
    }
    outputPort.updatePackage(pkg.clone());
  }

  private releaseOutput() {
    this.computeOutput();
    this.propagate();
  }
}
