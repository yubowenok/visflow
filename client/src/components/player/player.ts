import { Component } from 'vue-property-decorator';
import _ from 'lodash';

import template from './player.html';
import { injectNodeTemplate } from '../node';
import { SubsetNode } from '../subset-node';
import ColumnSelect from '@/components/column-select/column-select';
import { isNumericalType, valueComparator } from '@/data/util';
import TabularDataset from '@/data/tabular-dataset';

interface PlayerSave {
  column: number | null;
  currentTimeIndex: number;
}

@Component({
  template: injectNodeTemplate(template),
  components: {
    ColumnSelect,
  },
})
export default class Player extends SubsetNode {
  protected NODE_TYPE = 'player';
  protected DEFAULT_WIDTH = 80;
  protected DEFAULT_HEIGHT = 60;
  protected RESIZABLE = true;

  private column: number = 0;
  private isPlaying = false;
  private currentTimeIndex = 0;
  private timeValues: Array<string | number> = [];

  get currentTime(): number | string | undefined {
    return this.timeValues[this.currentTimeIndex];
  }

  protected created() {
    this.serializationChain.push((): PlayerSave => ({
      column: this.column,
      currentTimeIndex: this.currentTimeIndex,
    }));
  }

  protected update() {
    if (!this.checkDataset()) {
      return;
    }
    this.computeTimeValues();
    this.output();
  }

  protected onDatasetChange() {
    this.findDefaultColumn();
    this.currentTimeIndex = 0;
  }

  private computeTimeValues() {
    const pkg = this.inputPortMap.in.getSubsetPackage();
    const dataset = pkg.getDataset() as TabularDataset;
    this.timeValues = dataset.getDomainValues(this.column, pkg.getItemIndices(), true);
  }

  private output() {
    const pkg = this.inputPortMap.in.getSubsetPackage().clone();
    const dataset = pkg.getDataset() as TabularDataset;
    const columnType = dataset.getColumnType(this.column);
    const currentTime = this.timeValues[this.currentTimeIndex] as (string | number);
    const comparator = valueComparator(columnType);
    pkg.filterItems(item => {
      const value = dataset.getCell(item, this.column);
      return comparator(value, currentTime) === 0;
    });
    const outputPort = this.outputPortMap.out;
    outputPort.updatePackage(pkg);
    this.portUpdated(outputPort);
  }

  private findDefaultColumn() {
    if (!this.hasDataset()) {
      return;
    }
    const dataset = this.getDataset();
    const numericalColumns = dataset.getColumns().filter(column => isNumericalType(column.type));
    this.column = numericalColumns[0].index;
  }

  private onSelectColumn(column: number, prevColumn: number) {

  }

  private play() {
    this.isPlaying = true;
  }

  private pause() {
    this.isPlaying = false;
  }

  private stop() {
    this.isPlaying = false;
  }

  private next() {
    this.currentTimeIndex++;
    if (this.currentTimeIndex === this.timeValues.length) {
      this.currentTimeIndex--;
    }
    this.output();
    this.propagate();
  }

  private previous() {
    this.currentTimeIndex--;
    if (this.currentTimeIndex < 0) {
      this.currentTimeIndex++;
    }
    this.output();
    this.propagate();
  }
}
