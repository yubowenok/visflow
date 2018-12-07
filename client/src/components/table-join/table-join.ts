
import { Component } from 'vue-property-decorator';
import _ from 'lodash';

import template from './table-join.html';
import { injectNodeTemplate } from '../node';
import FormSelect from '@/components/form-select/form-select';
import ColumnSelect from '@/components/column-select/column-select';
import { SubsetInputPort } from '../port';
import TabularDataset, { TabularRow, TabularRows } from '@/data/tabular-dataset';
import { SubsetPackage } from '@/data/package';
import { SubsetNodeBase } from '../subset-node';
import * as history from './history';
import { getColumnSelectOptions } from '@/data/util';

export enum TableJoinMode {
  INNER = 'inner',
  LEFT = 'left',
  RIGHT = 'right',
  FULL = 'full',
}

interface TableJoinSave {
  mode: TableJoinMode;
  leftColumn: number | null;
  rightColumn: number | null;
  lastLeftDatasetHash: string;
  lastRightDatasetHash: string;
}

@Component({
  template: injectNodeTemplate(template),
  components: {
    FormSelect,
    ColumnSelect,
  },
})
export default class TableJoin extends SubsetNodeBase {
  public isDataMutated = true;

  protected NODE_TYPE = 'table-join';
  protected DEFAULT_WIDTH = 120;
  protected RESIZABLE = true;

  private mode: TableJoinMode = TableJoinMode.INNER;
  private leftColumn: number | null = null;
  private rightColumn: number | null = null;

  private leftDataset: TabularDataset | null = null;
  private rightDataset: TabularDataset | null = null;
  private lastLeftDatasetHash: string = '';
  private lastRightDatasetHash: string = '';

  get joinModeOptions(): SelectOption[] {
    return [
      { label: 'Inner', value: TableJoinMode.INNER },
      { label: 'Left', value: TableJoinMode.LEFT },
      { label: 'Right', value: TableJoinMode.RIGHT },
      { label: 'Full', value: TableJoinMode.FULL },
    ];
  }

  get leftColumnName(): string {
    return this.leftDataset && this.leftColumn !== null ? this.leftDataset.getColumnName(this.leftColumn) : '';
  }

  get rightColumnName(): string {
    return this.rightDataset && this.rightColumn !== null ? this.rightDataset.getColumnName(this.rightColumn) : '';
  }

  get leftColumnSelectOptions() {
    return getColumnSelectOptions(this.leftDataset);
  }

  get rightColumnSelectOptions() {
    return getColumnSelectOptions(this.rightDataset);
  }

  public setMode(mode: TableJoinMode) {
    this.mode = mode;
    this.updateAndPropagate();
  }

  public setLeftColumn(column: number) {
    this.leftColumn = column;
    this.updateAndPropagate();
  }

  public setRightColumn(column: number) {
    this.rightColumn = column;
    this.updateAndPropagate();
  }

  protected update() {
    if (!this.checkDataset()) {
      return;
    }
    if (this.leftColumn === null || this.rightColumn === null) {
      this.coverText = 'No column';
      this.updateNoDatasetOutput();
      return;
    }
    this.join();
  }

  protected createInputPorts() {
    this.inputPorts = [
      new SubsetInputPort({
        data: {
          id: 'inLeft',
          node: this,
        },
        store: this.$store,
      }),
      new SubsetInputPort({
        data: {
          id: 'inRight',
          node: this,
        },
        store: this.$store,
      }),
    ];
  }

  protected created() {
    this.serializationChain.push((): TableJoinSave => ({
      mode: this.mode,
      leftColumn: this.leftColumn,
      rightColumn: this.rightColumn,
      lastLeftDatasetHash: this.lastLeftDatasetHash,
      lastRightDatasetHash: this.lastRightDatasetHash,
    }));
  }

  private checkDataset(): boolean {
    if (!this.checkLeftDataset() || !this.checkRightDataset()) {
      return false;
    }
    this.coverText = '';
    return true;
  }

  private hasNoLeftDataset(): boolean {
    return !this.inputPortMap.inLeft.isConnected() ||
      !(this.inputPortMap.inLeft.getPackage() as SubsetPackage).hasDataset();
  }

  private hasNoRightDataset(): boolean {
    return !this.inputPortMap.inRight.isConnected() ||
      !(this.inputPortMap.inRight.getPackage() as SubsetPackage).hasDataset();
  }

  private onLeftDatasetChange() {
    this.leftColumn = this.updateColumnOnDatasetChangeBase(this.leftColumn, this.leftDataset);
  }

  private onRightDatasetChange() {
    this.rightColumn = this.updateColumnOnDatasetChangeBase(this.rightColumn, this.rightDataset);
  }

  private checkLeftDataset(): boolean {
    if (this.hasNoLeftDataset()) {
      this.leftDataset = null;
      this.coverText = 'No Left Dataset';
      this.updateNoDatasetOutput();
      return false;
    }
    this.leftDataset = (this.inputPortMap.inLeft.getPackage() as SubsetPackage).getDataset() as TabularDataset;
    if (this.leftDataset.getHash() !== this.lastLeftDatasetHash) {
      this.onLeftDatasetChange();
      this.lastLeftDatasetHash = this.leftDataset.getHash();
    }
    return true;
  }

  private checkRightDataset(): boolean {
    if (this.hasNoRightDataset()) {
      this.rightDataset = null;
      this.coverText = 'No Right Dataset';
      this.updateNoDatasetOutput();
      return false;
    }
    this.rightDataset = (this.inputPortMap.inRight.getPackage() as SubsetPackage).getDataset() as TabularDataset;
    if (this.rightDataset.getHash() !== this.lastRightDatasetHash) {
      this.onRightDatasetChange();
      this.lastRightDatasetHash = this.rightDataset.getHash();
    }
    return true;
  }

  private join() {
    const leftColumn = this.leftColumn as number;
    const rightColumn = this.rightColumn as number;
    const leftPkg = (this.inputPortMap.inLeft as SubsetInputPort).getSubsetPackage();
    const rightPkg = (this.inputPortMap.inRight as SubsetInputPort).getSubsetPackage();
    const leftDataset = this.leftDataset as TabularDataset;
    const rightDataset = this.rightDataset as TabularDataset;
    const leftValueMap = this.generateValueMap(leftPkg, leftColumn);
    const rightValueMap = this.generateValueMap(rightPkg, rightColumn);

    const values: string[] = (this.mode !== TableJoinMode.RIGHT ? _.keys(leftValueMap) : [])
      .concat(this.mode !== TableJoinMode.LEFT ? _.keys(rightValueMap) : []);
    const rows: TabularRows = [];
    values.forEach(value => {
      const leftIndices: Array<number | null> = value in leftValueMap ? leftValueMap[value] : [];
      const rightIndices: Array<number | null> = value in rightValueMap ? rightValueMap[value] : [];
      // Clear the values so that each distinct value is only processed once.
      leftValueMap[value] = rightValueMap[value] = [];

      if ((this.mode === TableJoinMode.LEFT || this.mode === TableJoinMode.FULL) && !rightIndices.length) {
        rightIndices.push(null);
      }
      if ((this.mode === TableJoinMode.RIGHT || this.mode === TableJoinMode.FULL) && !leftIndices.length) {
        leftIndices.push(null);
      }

      leftIndices.forEach(leftIndex => {
        rightIndices.forEach(rightIndex => {
          if (leftIndex === null && rightIndex === null) {
            return;
          }
          const row: TabularRow = [value];
          for (let i = 0; i < leftDataset.numColumns(); i++) {
            if (i === leftColumn) {
              continue;
            }
            row.push(leftIndex !== null ? leftDataset.getCell(leftIndex, i) : '');
          }
          for (let j = 0; j < rightDataset.numColumns(); j++) {
            if (j === rightColumn) {
              continue;
            }
            row.push(rightIndex !== null ? rightDataset.getCell(rightIndex, j) : '');
          }
          rows.push(row);
        });
      });
    });
    const columns = [this.leftColumnName]
      .concat(leftDataset.getColumns().filter(column => column.index !== leftColumn).map(column => column.name))
      .concat(rightDataset.getColumns().filter(column => column.index !== rightColumn).map(column => column.name));
    const newDataset = TabularDataset.fromColumnsAndRows(columns, rows);
    this.updateOutput(new SubsetPackage(newDataset));
  }

  /**
   * Places each item index at its join column's value.
   */
  private generateValueMap(pkg: SubsetPackage, column: number): { [value: string]: number[] } {
    const map: { [value: string]: number[] } = {};
    const dataset = pkg.getDataset() as TabularDataset;
    pkg.getItemIndices().forEach(itemIndex => {
      const value = dataset.getCell(itemIndex, column);
      if (!(value in map)) {
        map[value] = [];
      }
      map[value].push(itemIndex);
    });
    return map;
  }

  private onSelectMode(mode: TableJoinMode, prevMode: TableJoinMode) {
    this.commitHistory(history.selectModeEvent(this, mode, prevMode));
    this.setMode(mode);
  }

  private onSelectLeftColumn(column: number, prevColumn: number) {
    this.commitHistory(history.selectLeftColumnEvent(this, column, prevColumn));
    this.setLeftColumn(column);
  }

  private onSelectRightColumn(column: number, prevColumn: number) {
    this.commitHistory(history.selectRightColumnEvent(this, column, prevColumn));
    this.setRightColumn(column);
  }
}
