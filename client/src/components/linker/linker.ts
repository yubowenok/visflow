/**
 * A combination of constants generator (extractor) and a filter. This is used to cross-reference two
 * heterogeneous tables.
 */
import { Component } from 'vue-property-decorator';

import template from './linker.html';
import ColumnSelect from '@/components/column-select/column-select';
import { SubsetInputPort } from '@/components/port';
import { SubsetNode } from '@/components/subset-node';
import { injectNodeTemplate } from '@/components/node';
import ConstantsList from '@/components/constants-list/constants-list';
import { valueDisplay } from '@/common/util';
import { ValueType } from '@/data/parser';
import TabularDataset from '@/data/tabular-dataset';
import { ConstantsPackage, SubsetPackage } from '@/data/package';
import { getColumnSelectOptions } from '@/data/util';
import * as history from './history';

interface LinkerSave {
  extractColumn: number | null;
  filterColumn: number | null;
  lastFilteredDatasetHash: string;
}

@Component({
  template: injectNodeTemplate(template),
  components: {
    ColumnSelect,
    ConstantsList,
  },
})
export default class Linker extends SubsetNode {
  protected NODE_TYPE = 'linker';
  protected RESIZABLE = true;
  protected DEFAULT_WIDTH = 120;

  // Id column of the first table.
  protected extractColumn: number | null = null;
  // Id column of the second table (the table to be filtered).
  protected filterColumn: number | null = null;

  private constants: string[] = [];
  private lastFilteredDatasetHash = '';
  private filteredDataset: TabularDataset | null = null;

  get extractColumnType(): ValueType {
    if (this.extractColumn === null || !this.dataset) {
      return ValueType.STRING;
    }
    return this.getDataset().getColumnType(this.extractColumn);
  }

  get extractColumnName(): string {
    if (this.extractColumn === null || !this.dataset) {
      return '(no extract column)';
    }
    return this.getDataset().getColumnName(this.extractColumn);
  }

  get constantsDisplayText(): string {
    return this.constants.map(val => valueDisplay(val, this.extractColumnType)).join(', ');
  }

  get filterColumnSelectOptions() {
    return getColumnSelectOptions(this.filteredDataset);
  }

  public setExtractColumn(column: number | null) {
    this.extractColumn = column;
    this.updateAndPropagate();
  }

  public setFilterColumn(column: number | null) {
    this.filterColumn = column;
    this.updateAndPropagate();
  }

  protected onDatasetChange() {
    // nothing
  }

  /**
   * Overwrites hasNodeDataset() as linker has two subset inputs.
   */
  protected hasNoDataset(): boolean {
    return !this.hasExtractedDataset() && !this.hasFilteredDataset();
  }

  /**
   * Overwrites checkDataset() as linker has two subset inputs.
   */
  protected checkDataset(): boolean {
    const extractedDataset = this.hasExtractedDataset() ?
      (this.inputPortMap.in.getPackage() as SubsetPackage).getDataset() as TabularDataset : null;
    const filteredDataset = this.hasFilteredDataset() ?
      (this.inputPortMap.filteredIn.getPackage() as SubsetPackage).getDataset() as TabularDataset : null;
    if (extractedDataset) {
      this.dataset = extractedDataset;
      if (this.dataset.getHash() !== this.lastDatasetHash) {
        this.onDatasetChange();
        this.lastDatasetHash = this.dataset.getHash();
      }
    } else {
      this.dataset = null;
    }
    if (filteredDataset) {
      this.filteredDataset = filteredDataset;
      if (this.filteredDataset.getHash() !== this.lastFilteredDatasetHash) {
        this.onDatasetChange();
        this.lastFilteredDatasetHash = this.filteredDataset.getHash();
      }
    } else {
      this.filteredDataset = null;
    }
    if (this.hasNoDataset()) {
      this.coverText = 'No Dataset';
      this.updateNoDatasetOutput();
      return false;
    }
    this.coverText = '';
    return true;
  }

  protected created() {
    this.serializationChain.push((): LinkerSave => ({
      extractColumn: this.extractColumn,
      filterColumn: this.filterColumn,
      lastFilteredDatasetHash: this.lastFilteredDatasetHash,
    }));
  }

  protected createInputPorts() {
    this.inputPorts = [
      new SubsetInputPort({ // Provide constants
        data: {
          id: 'in',
          node: this,
        },
        store: this.$store,
      }),
      new SubsetInputPort({
        data: {
          id: 'filteredIn',
          node: this,
        },
        store: this.$store,
      }),
    ];
  }

  protected update() {
    if (!this.checkDataset()) {
      return;
    }
    this.extract();
    const subsetPkg = this.filter();
    this.outputPortMap.out.updatePackage(subsetPkg);
  }

  private extract() {
    const pkg = new ConstantsPackage();
    if (this.extractColumn === null) {
      return pkg;
    }
    if (!this.inputPortMap.in.hasPackage()) {
      this.constants = [];
      return;
    }
    const subsetPkg = this.inputPortMap.in.getSubsetPackage();
    const dataset = subsetPkg.getDataset() as TabularDataset;
    const constants = subsetPkg.getItemIndices().map(itemIndex => dataset.getCell(itemIndex,
      this.extractColumn as number));
    pkg.addConstants(constants);
    // Linker always makes the extracted constants unique as duplicates are irrelevant for filtering.
    pkg.unique();
    this.constants = pkg.getConstants().map(val => val.toString());
  }

  private filter(): SubsetPackage {
    if (this.filteredDataset === null) {
      return new SubsetPackage();
    }
    const pkg = this.inputPortMap.filteredIn.getSubsetPackage().clone();
    if (this.filterColumn === null) {
      return pkg;
    }
    const dataset = this.getFilteredDataset();
    const patterns = new Set(this.constants);
    pkg.filterItems(item => {
      const value = dataset.getCell(item, this.filterColumn as number).toString();
      return patterns.has(value);
    });
    return pkg;
  }

  // Typing helper method
  private getFilteredDataset(): TabularDataset {
    return this.filteredDataset as TabularDataset;
  }

  private onSelectExtractColumn(column: number, prevColumn: number | null) {
    this.setExtractColumn(column);
    this.commitHistory(history.selectExtractColumnEvent(this, column, prevColumn));
  }

  private onSelectFilterColumn(column: number, prevColumn: number | null) {
    this.setFilterColumn(column);
    this.commitHistory(history.selectFilterColumnEvent(this, column, prevColumn));
  }

  private hasExtractedDataset(): boolean {
    return this.inputPortMap.in.isConnected() &&
      (this.inputPortMap.in.getPackage() as SubsetPackage).hasDataset();
  }

  private hasFilteredDataset(): boolean {
    return this.inputPortMap.filteredIn.isConnected() &&
      (this.inputPortMap.filteredIn.getPackage() as SubsetPackage).hasDataset();
  }
}
