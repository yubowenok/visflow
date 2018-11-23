
import { Component } from 'vue-property-decorator';
import _ from 'lodash';

import template from './aggregation.html';
import { injectNodeTemplate } from '../node';
import { SubsetNode } from '../subset-node';
import FormSelect from '@/components/form-select/form-select';
import ColumnSelect from '@/components/column-select/column-select';
import { SubsetInputPort } from '../port';
import TabularDataset from '@/data/tabular-dataset';
import { ValueType } from '@/data/parser';
import { valueComparator } from '@/data/util';
import { SubsetPackage } from '@/data/package';
import * as history from './history';

export enum AggregationMode {
  SUM = 'sum',
  AVERAGE = 'average',
  COUNT = 'count',
  MINIMUM = 'minimum',
  MAXIMUM = 'maximum',
}
interface AggregationSave {
  column: number | null;
  groupByColumn: number | null;
  mode: AggregationMode;
}

@Component({
  template: injectNodeTemplate(template),
  components: {
    FormSelect,
    ColumnSelect,
  },
})
export default class Aggregation extends SubsetNode {
  public isDataMutated = true;

  protected NODE_TYPE = 'aggregation';
  protected DEFAULT_WIDTH = 120;
  protected RESIZABLE = true;

  private mode: AggregationMode = AggregationMode.SUM;
  private column: number | null = null;
  private groupByColumn: number | null = null;

  private warningMessage = '';

  get aggregationModeOptions(): SelectOption[] {
    return [
      { label: 'Sum', value: AggregationMode.SUM },
      { label: 'Average', value: AggregationMode.AVERAGE },
      { label: 'Count', value: AggregationMode.COUNT },
      { label: 'Minimum', value: AggregationMode.MINIMUM },
      { label: 'Maximum', value: AggregationMode.MAXIMUM },
    ];
  }

  get columnName(): string {
    return this.dataset && this.column !== null ? this.getDataset().getColumnName(this.column) : '';
  }

  get groupByColumnName(): string {
    return this.dataset && this.groupByColumn !== null ?
      this.getDataset().getColumnName(this.groupByColumn) : '';
  }

  public setColumn(column: number) {
    this.column = column;
    this.updateAndPropagate();
  }

  public setGroupByColumn(column: number | null) {
    this.groupByColumn = column;
    this.updateAndPropagate();
  }

  public setMode(mode: AggregationMode) {
    this.mode = mode;
    this.updateAndPropagate();
  }

  protected update() {
    if (!this.checkDataset()) {
      return;
    }
    if (this.column === null) {
      this.coverText = 'No column';
      this.forwardSubset(this.inputPortMap.in as SubsetInputPort, this.outputPortMap.out);
      return;
    }
    this.aggregate();
  }

  protected onDatasetChange() {
    this.column = null;
    this.groupByColumn = null;
  }

  protected created() {
    this.serializationChain.push((): AggregationSave => ({
      mode: this.mode,
      column: this.column,
      groupByColumn: this.groupByColumn,
    }));
  }

  private isAggregationNumerical(): boolean {
    return this.mode === AggregationMode.SUM || this.mode === AggregationMode.AVERAGE;
  }

  private aggregate() {
    const dataset = this.dataset as TabularDataset;
    const column = this.column as number;
    const columnType = dataset.getColumnType(column);
    const columnName = dataset.getColumnName(column);
    if (this.isAggregationNumerical() && columnType !== ValueType.INT && columnType !== ValueType.FLOAT) {
      this.warningMessage = `${this.mode} aggregation only applies on numerical columns`;
      return;
    }
    this.warningMessage = '';

    const pkg = this.inputPortMap.in.getSubsetPackage();
    const items = pkg.getItemIndices();
    const aggregator: { [group: string]: number | string } = {};
    const counter: { [group: string]: number } = {};

    const groups = this.groupByColumn !== null ?
      dataset.getDomainValues(this.groupByColumn, items, true) : ['all'];
    for (const group of groups) {
      aggregator[group] = 0;
      counter[group] = 0;
      if (this.mode === AggregationMode.MAXIMUM) {
        aggregator[group] = -Infinity;
      } else if (this.mode === AggregationMode.MINIMUM) {
        aggregator[group] = Infinity;
      }
    }
    const comparator = valueComparator(columnType);
    items.forEach(itemIndex => {
      const value = dataset.getCell(itemIndex, column);
      const group = this.groupByColumn !== null ? dataset.getCell(itemIndex, this.groupByColumn) : 'all';
      counter[group]++;
      if (this.mode === AggregationMode.SUM ||
        this.mode === AggregationMode.AVERAGE) {
        (aggregator[group] as number) += value as number;
      } else if (this.mode === AggregationMode.MAXIMUM && comparator(value, aggregator[group]) > 0 ||
        this.mode === AggregationMode.MINIMUM && comparator(value, aggregator[group]) < 0) {
        aggregator[group] = value;
      }
    });

    for (const group of groups) {
      if (this.mode === AggregationMode.AVERAGE) {
        (aggregator[group] as number) /= counter[group];
      } else if (this.mode === AggregationMode.COUNT) {
        aggregator[group] = counter[group];
      }
    }

    const columns = ['group', `${this.mode}(${columnName})`];
    const rows = groups.map(group => [group, aggregator[group]]);
    this.outputPortMap.out.updatePackage(new SubsetPackage(TabularDataset.fromColumnsAndRows(columns, rows)));
  }

  private onSelectAggregationMode(mode: AggregationMode, prevMode: AggregationMode) {
    this.commitHistory(history.selectModeEvent(this, mode, prevMode));
    this.setMode(mode);
  }

  private onSelectColumn(column: number, prevColumn: number) {
    this.commitHistory(history.selectColumnEvent(this, column, prevColumn));
    this.setColumn(column);
  }

  private onSelectGroupByColumn(column: number | null, prevColumn: number | null) {
    this.commitHistory(history.selectGroupByColumnEvent(this, column, prevColumn));
    this.setGroupByColumn(column);
  }
}
