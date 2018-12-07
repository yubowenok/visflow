import { Component } from 'vue-property-decorator';

import ConstantsList from '@/components/constants-list/constants-list';
import { Node, injectNodeTemplate } from '@/components/node';
import template from './constants-generator.html';
import { ConstantsPackage } from '@/data/package';
import { ConstantsOutputPort, SubsetInputPort } from '@/components/port';
import ColumnSelect from '@/components/column-select/column-select';
import { getColumnSelectOptions } from '@/data/util';
import TabularDataset from '@/data/tabular-dataset';
import { ValueType } from '@/data/parser';
import { valueDisplay } from '@/common/util';
import * as history from './history';

enum ConstantsGeneratorMode {
  INPUT = 'input',
  EXTRACT = 'extract',
}

interface ConstantsGeneratorSave {
  column: number | null;
  inputConstants: string[];
  distinct: boolean;
  sort: boolean;
}

@Component({
  template: injectNodeTemplate(template),
  components: {
    ConstantsList,
    ColumnSelect,
  },
})
export default class ConstantsGenerator extends Node {
  // ConstantsGenerator may initiate propagation if it is not extracting constants.
  public isPropagationSource = true;

  protected NODE_TYPE = 'constants-generator';
  protected DEFAULT_WIDTH = 120;
  protected RESIZABLE = true;

  // Typing port map
  protected inputPortMap: { [id: string]: SubsetInputPort } = {};
  protected outputPortMap: { [id: string]: ConstantsOutputPort } = {};

  private inputConstants: string[] = [];
  private column: number | null = null;
  private extractedConstants: string[] = [];
  private distinct = false;
  private sort = false;

  /**
   * When the input port is connected to a subset the generator runs in extract mode.
   */
  get mode(): ConstantsGeneratorMode {
    return this.inputPortMap.in.isConnected() ? ConstantsGeneratorMode.EXTRACT : ConstantsGeneratorMode.INPUT;
  }

  get constantsDisplayText(): string {
    const constants = this.mode === ConstantsGeneratorMode.INPUT ? this.inputConstants : this.extractedConstants;
    return constants.map(val => valueDisplay(val, this.columnType)).join(', ');
  }

  get columnSelectOptions(): SelectOption[] {
    return getColumnSelectOptions(this.inputPortMap.in.getSubsetPackage().getDataset());
  }

  get columnType(): ValueType {
    if (this.column === null || !this.inputPortMap.in.hasPackage()) {
      return ValueType.STRING;
    }
    const dataset = this.inputPortMap.in.getSubsetPackage().getDataset() as TabularDataset;
    return dataset.getColumnType(this.column);
  }

  public setInputConstants(constants: string[]) {
    this.inputConstants = constants;
    this.updateAndPropagate();
  }

  public setColumn(column: number | null) {
    this.column = column;
    this.updateAndPropagate();
  }

  public setDistinct(value: boolean) {
    this.distinct = value;
    this.updateAndPropagate();
  }

  public setSort(value: boolean) {
    this.sort = value;
    this.updateAndPropagate();
  }

  protected created() {
    this.serializationChain.push((): ConstantsGeneratorSave => ({
      column: this.column,
      inputConstants: this.inputConstants,
      distinct: this.distinct,
      sort: this.sort,
    }));
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
      new ConstantsOutputPort({
        data: {
          id: 'out',
          node: this,
          isMultiple: true,
        },
        store: this.$store,
      }),
    ];
  }

  protected update() {
    let pkg: ConstantsPackage;
    if (this.mode === ConstantsGeneratorMode.INPUT) {
      pkg = new ConstantsPackage(this.inputConstants);
    } else {
      pkg = this.extract();
    }
    this.outputPortMap.out.updatePackage(pkg);
  }

  protected isUpdateNecessary(): boolean {
    if (this.mode === ConstantsGeneratorMode.EXTRACT) {
      const port = this.inputPortMap.in;
      return port.isPackageUpdated() || port.isConnectionUpdated();
    }
    // Update is necessary if the ConstantsGenerator is not extracting and it has been newly created.
    // After creaion, the update will be triggered by UI and is thus always necessary.
    return true;
  }

  protected updateAndPropagate() {
    this.update();
    this.portUpdated(this.outputPortMap.out);
  }

  private extract(): ConstantsPackage {
    const pkg = new ConstantsPackage();
    if (this.column === null) {
      return pkg;
    }
    const subsetPkg = this.inputPortMap.in.getSubsetPackage();
    const dataset = subsetPkg.getDataset() as TabularDataset;
    const constants = subsetPkg.getItemIndices().map(itemIndex => dataset.getCell(itemIndex, this.column as number));
    pkg.addConstants(constants);
    if (this.distinct) {
      pkg.unique();
    }
    if (this.sort) {
      pkg.sort();
    }
    this.extractedConstants = pkg.getConstants().map(val => val.toString());
    return pkg;
  }

  private onInputConstants(constants: string[], prevConstants: string[]) {
    this.commitHistory(history.inputConstantsEvent(this, constants, prevConstants));
    this.setInputConstants(constants);
  }

  private onSelectColumn(column: number | null, prevColumn: number | null) {
    this.commitHistory(history.selectColumnEvent(this, column, prevColumn));
    this.setColumn(column);
  }

  private onToggleDistinct(value: boolean) {
    this.commitHistory(history.toggleDistinctEvent(this, value));
    this.setDistinct(value);
  }

  private onToggleSort(value: boolean) {
    this.commitHistory(history.toggleSortEvent(this, value));
    this.setSort(value);
  }
}
