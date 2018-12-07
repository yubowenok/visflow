import { Component, Watch } from 'vue-property-decorator';
import _ from 'lodash';

import template from './series-player.html';
import ColumnSelect from '@/components/column-select/column-select';
import FormInput from '@/components/form-input/form-input';
import FormSlider from '@/components/form-slider/form-slider';
import { injectNodeTemplate } from '../node';
import { SubsetNode } from '../subset-node';
import { isNumericalType } from '@/data/util';
import TabularDataset from '@/data/tabular-dataset';
import * as history from './history';

const SECOND_MS = 1000;
const FRAME_INTERVAL_MS = 40; // 25 frames per second

interface SeriesPlayerSave {
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
export default class SeriesPlayer extends SubsetNode {
  protected NODE_TYPE = 'series-player';
  protected DEFAULT_WIDTH = 80;
  protected DEFAULT_HEIGHT = 60;
  protected RESIZABLE = true;

  private column: number = 0;
  private isPlaying = false;
  private currentTimeIndex = 0;
  private timeValues: Array<string | number> = [];
  private playTimer: NodeJS.Timer | null = null;

  // Time index when the play starts.
  private startTimeIndex: number = 0;

  /**
   * Used for speed optimization. When the current data items differ from the last received data items,
   * time domain values are recomputed.
   */
  private lastItems: number[] | null = null;
  /**
   * Preprocessed data items grouped into corresponding timestamps.
   */
  private itemsByTime: number[][] = [];

  // how many time values are played per second
  private framesPerSecond = 1;

  get currentTime(): number | string | undefined {
    return this.timeValues[this.currentTimeIndex];
  }

  public setTimeColumn(column: number) {
    this.column = column;
    this.updateAndPropagate();
  }

  public setFramesPerSecond(value: number) {
    this.framesPerSecond = value;
  }

  public setCurrentTimeIndex(value: number) {
    this.currentTimeIndex = value;
    this.updateAndPropagate();
  }

  protected created() {
    this.serializationChain.push((): SeriesPlayerSave => ({
      column: this.column,
      currentTimeIndex: this.currentTimeIndex,
      framesPerSecond: this.framesPerSecond,
    }));
  }

  protected update() {
    if (!this.checkDataset()) {
      return;
    }
    this.preprocessTimeValues();
    this.output();
  }

  protected onDatasetChange() {
    this.findDefaultColumn();
    this.currentTimeIndex = 0;
    this.lastItems = null;
  }

  private preprocessTimeValues() {
    const pkg = this.inputPortMap.in.getSubsetPackage();
    const items = pkg.getItemIndices();
    if (_.isEqual(items, this.lastItems)) {
      return; // performance optimization: skip time domain computation if items do not change
    }
    this.lastItems = items;
    const dataset = pkg.getDataset() as TabularDataset;
    this.timeValues = dataset.getDomainValues(this.column, items, true);

    const timeValueMap: { [value: string]: number } = {};
    this.timeValues.forEach((value, index) => timeValueMap[value] = index);
    this.itemsByTime = this.timeValues.map(() => []);
    items.forEach(itemIndex => {
      const value = dataset.getCell(itemIndex, this.column);
      this.itemsByTime[timeValueMap[value]].push(itemIndex);
    });
  }

  private output() {
    const pkg = this.inputPortMap.in.getSubsetPackage();
    const outputPort = this.outputPortMap.out;
    outputPort.updatePackage(pkg.subset(this.itemsByTime[this.currentTimeIndex]));
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
    if (this.isPlaying) {
      return;
    }
    this.startTimeIndex = this.currentTimeIndex;
    this.isPlaying = true;

    const tickPerSecond = SECOND_MS / FRAME_INTERVAL_MS;
    let stepSize = Math.floor(this.framesPerSecond / tickPerSecond);
    let interval = FRAME_INTERVAL_MS;
    if (stepSize === 0) { // play speed is very slow, fewer than the standard frame rate
      stepSize = 1;
      interval = SECOND_MS / this.framesPerSecond;
    }

    const startTime = new Date().getTime();
    this.playTimer = setInterval(() => {
      const timeIndex = this.incrementTime(stepSize);
      let intendedTimeIndex = this.startTimeIndex +
        Math.floor((new Date().getTime() - startTime) / SECOND_MS * this.framesPerSecond);
      intendedTimeIndex = Math.min(intendedTimeIndex, this.timeValues.length - 1);
      // in case computation is slow, always jumps to the latest time
      this.currentTimeIndex = Math.max(timeIndex, intendedTimeIndex);

      this.updateAndPropagate();
    }, interval);
  }

  private pause() {
    this.stopPlaying();
    if (this.currentTimeIndex === this.startTimeIndex) {
      return;
    }
    this.updateCurrentTimeIndex(this.currentTimeIndex, this.startTimeIndex, 'play');
  }

  private stop() {
    this.stopPlaying();
    if (this.currentTimeIndex === 0) {
      return;
    }
    this.updateCurrentTimeIndex(0, this.currentTimeIndex, 'stop');
  }

  private clearTimer() {
    if (this.playTimer !== null) {
      clearInterval(this.playTimer);
      this.isPlaying = false;
    }
  }

  /**
   * Computes the next time index given a step size.
   */
  private incrementTime(step: number): number {
    let timeIndex = this.currentTimeIndex;
    timeIndex += step;
    if (timeIndex >= this.timeValues.length) {
      timeIndex = this.timeValues.length - 1;
    }
    if (timeIndex === this.timeValues.length - 1) {
      this.clearTimer();
    }
    return timeIndex;
  }

  private next() {
    const timeIndex = this.incrementTime(1);
    if (timeIndex === this.currentTimeIndex) {
      return;
    }
    this.updateCurrentTimeIndex(timeIndex, this.currentTimeIndex, 'next');
  }

  private previous() {
    let timeIndex = this.currentTimeIndex;
    timeIndex--;
    if (timeIndex < 0) {
      timeIndex++;
    }
    if (timeIndex === this.currentTimeIndex) {
      return;
    }
    this.updateCurrentTimeIndex(timeIndex, this.currentTimeIndex, 'previous');
  }

  /**
   * Records an event that updates the current time index to a new value.
   * This also changes the current time index to the new value (if it is not that value before).
   */
  private updateCurrentTimeIndex(value: number, prevValue: number, message: string) {
    this.commitHistory(history.setCurrentTimeIndexEvent(this, value, prevValue, message));
    this.setCurrentTimeIndex(value);
  }

  private stopPlaying() {
    this.isPlaying = false;
    this.clearTimer();
  }

  private onFramesPerSecondChange(value: number, prevValue: number) {
    this.commitHistory(history.inputFramesPerSecondEvent(this, value, prevValue));
    this.setFramesPerSecond(value);
  }

  private onSliderCurrentTimeIndexChange(value: number, prevValue: number) {
    this.commitHistory(history.setCurrentTimeIndexEvent(this, value, prevValue, 'slide time'));
    this.setCurrentTimeIndex(value);
  }

  private onSelectTimeColumn(column: number, prevColumn: number) {
    this.commitHistory(history.selectTimeColumnEvent(this, column, prevColumn));
    this.setTimeColumn(column);
  }
}
