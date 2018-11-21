import { Component, Watch } from 'vue-property-decorator';
import _ from 'lodash';

import template from './player.html';
import ColumnSelect from '@/components/column-select/column-select';
import FormInput from '@/components/form-input/form-input';
import FormSlider from '@/components/form-slider/form-slider';
import { injectNodeTemplate } from '../node';
import { SubsetNode } from '../subset-node';
import { isNumericalType, valueComparator } from '@/data/util';
import TabularDataset from '@/data/tabular-dataset';

const SECOND_MS = 1000;
const FRAME_INTERVAL_MS = 100; // 10 frames per second

interface PlayerSave {
  column: number | null;
  currentTimeIndex: number;
  framesPerSecond: number;
}

@Component({
  template: injectNodeTemplate(template),
  components: {
    ColumnSelect,
    FormInput,
    FormSlider,
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
  private playTimer: NodeJS.Timer | null = null;

  // how many time values are played per second
  private framesPerSecond = 1;

  get currentTime(): number | string | undefined {
    return this.timeValues[this.currentTimeIndex];
  }

  public setFramesPerSecond(value: number) {
    this.framesPerSecond = value;
  }

  public setCurrentTimeIndex(value: number) {
    this.currentTimeIndex = value;
  }

  protected created() {
    this.serializationChain.push((): PlayerSave => ({
      column: this.column,
      currentTimeIndex: this.currentTimeIndex,
      framesPerSecond: this.framesPerSecond,
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

  private play() {
    this.clearTimer();
    this.isPlaying = true;
    const tickPerSecond = SECOND_MS / FRAME_INTERVAL_MS;
    let stepSize = Math.floor(this.framesPerSecond / tickPerSecond);
    let interval = FRAME_INTERVAL_MS;
    if (stepSize === 0) { // play speed is very slow, fewer than 10 frames per second
      stepSize = 1;
      interval = SECOND_MS / this.framesPerSecond;
    }
    this.playTimer = setInterval(() => {
      this.next(stepSize);
    }, interval);
  }

  private pause() {
    this.isPlaying = false;
    this.clearTimer();
  }

  private stop() {
    this.isPlaying = false;
    this.clearTimer();
    this.currentTimeIndex = 0;
  }

  private clearTimer() {
    if (this.playTimer !== null) {
      clearInterval(this.playTimer);
    }
  }

  private next(step?: number) {
    step = step || 1;
    this.currentTimeIndex += step;
    if (this.currentTimeIndex >= this.timeValues.length) {
      this.currentTimeIndex = this.timeValues.length - 1;
      this.clearTimer();
      this.isPlaying = false;
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

  private onFramesPerSecondChange() {

  }

  private onCurrentTimeIndexChange(value: number) {
    this.currentTimeIndex = value;
    this.output();
    this.propagate();
  }

  private onSelectTimeColumn(column: number, prevColumn: number) {

  }
}
