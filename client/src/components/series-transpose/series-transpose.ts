
import { Component } from 'vue-property-decorator';
import _ from 'lodash';

import template from './series-transpose.html';
import { injectNodeTemplate } from '../node';
import { SubsetNode } from '../subset-node';
import FormInput from '@/components/form-input/form-input';
import ColumnSelect from '@/components/column-select/column-select';
import ColumnList from '@/components/column-list/column-list';
import TabularDataset, { TabularRows } from '@/data/tabular-dataset';
import { SubsetPackage } from '@/data/package';
import * as history from './history';

interface SeriesTransposeSave {
  keyColumn: number | null;
  seriesColumns: number[];
  seriesColumnName: string;
  valueColumnName: string;
}

@Component({
  template: injectNodeTemplate(template),
  components: {
    FormInput,
    ColumnSelect,
    ColumnList,
  },
})
export default class SeriesTranspose extends SubsetNode {
  public isDataMutated = true;

  protected NODE_TYPE = 'series-transpose';
  protected DEFAULT_WIDTH = 100;
  protected RESIZABLE = true;

  private keyColumn: number | null = null;
  private seriesColumns: number[] = [];
  private seriesColumnName = 'series';
  private valueColumnName = 'value';

  private warningMessage = '';

  get keyColumnName(): string {
    return this.dataset && this.keyColumn !== null ? this.getDataset().getColumnName(this.keyColumn) : '';
  }

  public setKeyColumn(column: number | null) {
    this.keyColumn = column;
    this.updateAndPropagate();
  }

  public setSeriesColumns(columns: number[]) {
    this.seriesColumns = columns;
    this.updateAndPropagate();
  }

  public setSeriesColumnName(name: string) {
    this.seriesColumnName = name;
    this.updateAndPropagate();
  }

  public setValueColumnName(name: string) {
    this.valueColumnName = name;
    this.updateAndPropagate();
  }

  protected update() {
    if (!this.checkDataset()) {
      return;
    }
    if (this.keyColumn === null) {
      this.coverText = 'No key column';
      this.updateNoDatasetOutput();
      return;
    }
    if (!this.seriesColumns.length) {
      this.coverText = 'No series column';
      this.updateNoDatasetOutput();
      return;
    }
    this.transpose();
  }

  protected onDatasetChange() {
    this.keyColumn = null;
    this.seriesColumns = [];
  }

  protected created() {
    this.serializationChain.push((): SeriesTransposeSave => ({
      keyColumn: this.keyColumn,
      seriesColumns: this.seriesColumns,
      seriesColumnName: this.seriesColumnName,
      valueColumnName: this.valueColumnName,
    }));
  }

  private transpose() {
    const dataset = this.dataset as TabularDataset;
    const keyColumn = this.keyColumn as number;

    this.warningMessage = '';
    if (dataset.hasDuplicates(keyColumn)) {
      this.warningMessage = 'The key column has duplicates';
    }

    const columns = [dataset.getColumnName(keyColumn), this.seriesColumnName, this.valueColumnName];
    const rows: TabularRows = [];
    _.range(dataset.numRows()).forEach(itemIndex => {
      const key = dataset.getCell(itemIndex, keyColumn);
      this.seriesColumns.forEach(columnIndex => {
        rows.push([
          key,
          dataset.getColumnName(columnIndex), // series
          dataset.getCell(itemIndex, columnIndex), // value
        ]);
      });
    });
    const outputDataset = TabularDataset.fromColumnsAndRows(columns, rows);
    this.outputPortMap.out.updatePackage(new SubsetPackage(outputDataset));
  }

  private onSelectKeyColumn(column: number | null, prevColumn: number | null) {
    this.commitHistory(history.selectKeyColumnEvent(this, column, prevColumn));
    this.setKeyColumn(column);
  }

  private onSelectSeriesColumns(columns: number[], prevColumns: number[]) {
    this.commitHistory(history.selectSeriesColumnsEvent(this, columns, prevColumns));
    this.setSeriesColumns(columns);
  }

  private onInputSeriesColumnName(name: string, prevName: string) {
    this.commitHistory(history.inputSeriesColumnNameEvent(this, name, prevName));
    this.setSeriesColumnName(name);
  }

  private onInputValueColumnName(name: string, prevName: string) {
    this.commitHistory(history.inputValueColumnNameEvent(this, name, prevName));
    this.setValueColumnName(name);
  }
}
