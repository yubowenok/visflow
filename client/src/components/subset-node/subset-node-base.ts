/**
 * A subset node interface assuming one subset output.
 */
import { Component } from 'vue-property-decorator';
import { Node } from '../node';
import TabularDataset from '@/data/tabular-dataset';
import { SubsetPackage } from '@/data/package';
import { SubsetInputPort, SubsetOutputPort } from '@/components/port';
import { getColumnSelectOptions, isNumericalType } from '@/data/util';

@Component
export default class SubsetNodeBase extends Node {

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

  /**
   * Forwards an input subset to an output subset.
   */
  protected forwardSubset(input: SubsetInputPort, output: SubsetOutputPort) {
    output.updatePackage(input.getSubsetPackage().clone());
  }

  /**
   * Updates the package of the output port "out".
   */
  protected updateOutput(pkg: SubsetPackage) {
    this.outputPortMap.out.updatePackage(pkg);
  }

  /**
   * Returns null if a column index is out of the given dataset's columns range.
   */
  protected updateColumnOnDatasetChangeBase(column: number | null, dataset: TabularDataset | null): number | null {
    if (column === null) {
      return null;
    }
    if (!dataset) {
      return column; // if there is no dataset, keep the original column
    }
    return column < dataset.numColumns() ? column : null;
  }
}
