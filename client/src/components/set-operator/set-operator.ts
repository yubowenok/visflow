import { Component } from 'vue-property-decorator';

import { SubsetNode } from '@/components/subset-node';
import { injectNodeTemplate } from '@/components/node';
import template from './set-operator.html';
import FormSelect from '@/components/form-select/form-select';
import { SubsetPackage } from '@/data/package';
import { SubsetInputPort } from '@/components/port';
import * as history from './history';
import TabularDataset from '@/data/tabular-dataset';

export enum SetOperatorMode {
  UNION = 'union',
  INTERSECTION = 'intersection',
  DIFFERENCE = 'difference',
}

interface SetOperatorSave {
  mode: SetOperatorMode;
}

@Component({
  template: injectNodeTemplate(template),
  components: {
    FormSelect,
  },
})
export default class SetOperator extends SubsetNode {
  protected NODE_TYPE = 'set-operator';

  private mode: SetOperatorMode = SetOperatorMode.UNION;

  get modeOptions(): SelectOption[] {
    return [
      { label: 'Union', value: SetOperatorMode.UNION },
      { label: 'Intersection', value: SetOperatorMode.INTERSECTION },
      { label: 'Difference', value: SetOperatorMode.DIFFERENCE },
    ];
  }

  public setMode(mode: SetOperatorMode) {
    this.mode = mode;
    this.updateAndPropagate();
  }

  protected createInputPorts() {
    this.inputPorts = [
      new SubsetInputPort({
        data: {
          id: 'in',
          node: this,
          isMultiple: true,
        },
        store: this.$store,
      }),
    ];
  }

  protected onDatasetChange() {
    // nothing
  }

  protected created() {
    this.serializationChain.push((): SetOperatorSave => ({
      mode: this.mode,
    }));
  }

  protected update() {
    if (!this.checkDataset()) {
      return;
    }
    if (!this.checkDatasetCompatibility()) {
      return;
    }
    this.runOperation();
  }

  /**
   * The dataset of a set operator is set to the first input connection that provides a dataset.
   */
  protected checkDataset(): boolean {
    if (this.hasNoDataset()) {
      this.dataset = null;
      this.coverText = 'No Dataset';
      this.updateNoDatasetOutput();
      return false;
    }
    const pkgs = this.inputPortMap.in.getSubsetPackageList() as SubsetPackage[];
    for (const pkg of pkgs) {
      if (pkg.hasDataset()) {
        this.dataset = pkg.getDataset() as TabularDataset;
        break;
      }
    }
    this.coverText = '';
    return true;
  }

  /**
   * Since a set operator may have multiple input, dataset existence check is special.
   */
  protected hasNoDataset(): boolean {
    if (!this.inputPortMap.in.isConnected()) {
      return true;
    }
    const pkgs = this.inputPortMap.in.getSubsetPackageList() as SubsetPackage[];
    for (const pkg of pkgs) {
      if (pkg.hasDataset()) {
        return false;
      }
    }
    return true;
  }

  /**
   * Only allows subsets from the same tabular dataset to be processed.
   */
  private checkDatasetCompatibility() {
    const pkgs = (this.inputPortMap.in.getPackageList() as SubsetPackage[]).filter(pkg => pkg.hasDataset());
    const datasetHashes: Set<string> = new Set();
    for (const pkg of pkgs) {
      datasetHashes.add((pkg.getDataset() as TabularDataset).getHash());
    }
    if (datasetHashes.size !== 1) {
      this.coverText = 'datasets mismatch';
      this.updateNoDatasetOutput();
      return false;
    }
    this.coverText = '';
    return true;
  }

  private runOperation() {
    let pkg: SubsetPackage;
    switch (this.mode) {
      default:
      case SetOperatorMode.UNION:
        pkg = this.union();
        break;
      case SetOperatorMode.INTERSECTION:
        pkg = this.intersection();
        break;
      case SetOperatorMode.DIFFERENCE:
        pkg = this.difference();
        break;
    }
    this.outputPortMap.out.updatePackage(pkg);
  }

  /**
   * Computes the union of connected input packages. If two packages share an item, their visuals will be merged, where
   * the package coming from a latter edge has higher priority in its visuals.
   */
  private union(): SubsetPackage {
    const pkgs = this.inputPortMap.in.getSubsetPackageList();
    const unionPkg = new SubsetPackage(this.dataset as TabularDataset, false);
    for (const pkg of pkgs) {
      pkg.getItems().forEach(item => {
        unionPkg.addItem(item);
      });
    }
    return unionPkg;
  }

  /**
   * Computes the intersection of connected input packages. Intersected data items' visuals will be merged,
   * where the package coming from a latter edge has higher priority in its visuals.
   */
  private intersection(): SubsetPackage {
    const pkgs = this.inputPortMap.in.getSubsetPackageList();
    // Count the occurrences of each item index. An item is in the intersection if its #occurrences equals pkgs.length.
    const count: { [index: number]: number } = {};
    for (const pkg of pkgs) {
      pkg.getItemIndices().forEach(index => count[index] = index in count ? count[index] + 1 : 1);
    }
    const intersectionPkg = new SubsetPackage(this.dataset as TabularDataset, false);
    for (const pkg of pkgs) {
      pkg.getItems().forEach(item => {
        if (count[item.index] === pkgs.length) {
          intersectionPkg.addItem(item);
        }
      });
    }
    return intersectionPkg;
  }

  /**
   * Computes the difference of the connected input packages. The output package is the first package minus the union
   * of all the other packages.
   */
  private difference(): SubsetPackage {
    const pkgs = this.inputPortMap.in.getSubsetPackageList();
    const differencePkg = pkgs[0].clone();
    for (const pkg of pkgs) {
      if (pkg === pkgs[0]) {
        continue;
      }
      pkg.getItems().forEach(item => differencePkg.removeItem(item));
    }
    return differencePkg;
  }

  private onSelectMode(mode: SetOperatorMode, prevMode: SetOperatorMode) {
    this.commitHistory(history.selectModeEvent(this, mode, prevMode));
    this.setMode(mode);
  }
}
