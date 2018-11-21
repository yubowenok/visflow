
import { Component } from 'vue-property-decorator';
import _ from 'lodash';

import ns from '@/store/namespaces';
import template from './aggregation.html';
import { injectNodeTemplate } from '../node';
import { SubsetNode } from '../subset-node';
import FormSelect from '@/components/form-select/form-select';
import ColumnSelect from '@/components/column-select/column-select';
import { SubsetInputPort } from '../port';

enum AggregationMode {
  SUM = 'sum',
  AVERAGE = 'average',
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

  get aggregationModeOptions(): SelectOption[] {
    return [
      { label: 'Sum', value: AggregationMode.SUM },
      { label: 'Average', value: AggregationMode.AVERAGE },
    ];
  }

  get columnName(): string {
    return this.dataset && this.column !== null ? this.getDataset().getColumnName(this.column) : '';
  }

  get groupByColumnName(): string {
    return this.dataset && this.groupByColumn !== null ?
      this.getDataset().getColumnName(this.groupByColumn) : '';
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

  protected created() {
    this.serializationChain.push((): AggregationSave => ({
      mode: this.mode,
      column: this.column,
      groupByColumn: this.groupByColumn,
    }));
  }

  private aggregate() {

  }

  private onSelectAggregationMode(mode: AggregationMode, prevMode: AggregationMode) {

  }

  private onSelectColumn(column: number, prevColumn: number) {

  }

  private onSelectGroupByColumn(column: number | null, prevColumn: number | null) {

  }
}
