
import { Component } from 'vue-property-decorator';
import _ from 'lodash';
import * as synaptic from 'synaptic';

import template from './neural-network.html';
import { injectNodeTemplate } from '../node';
import { SubsetNode } from '../subset-node';
import FormInput from '@/components/form-input/form-input';
import FormSelect from '@/components/form-select/form-select';
import ColumnSelect from '@/components/column-select/column-select';
import ColumnList from '@/components/column-list/column-list';
import { SubsetInputPort } from '../port';
import TabularDataset from '@/data/tabular-dataset';
import { SubsetPackage } from '@/data/package';
import * as history from './history';
import { ValueType } from '@/data/parser';

const EPOCH_INTERVAL_MS = 1000;
const TRAIN_ITERATIONS = 1000;
const BATCH_SIZE = 100;

export enum NeuralNetworkType {
  PERCEPTRON = 'perceptron',
}

interface NeuralNetworkSave {
  neuralNetworkType: NeuralNetworkType;
  features: number[];
  target: number | null;
  epochInterval: number;
  learningRate: number;
  batchSize: number;
  serializedNetwork: object;
  outputEachEpoch: boolean;
  perceptronOptions: PerceptronOptions;
}

interface PerceptronOptions {
  hiddenLayerNumber: number;
  hiddenLayerSize: number;
}

@Component({
  template: injectNodeTemplate(template),
  components: {
    FormInput,
    FormSelect,
    ColumnSelect,
    ColumnList,
  },
})
export default class NeuralNetwork extends SubsetNode {
  public isDataMutated = true;

  protected NODE_TYPE = 'neural-network';
  protected DEFAULT_WIDTH = 120;
  protected RESIZABLE = true;
  protected HAS_SETTINGS = true;

  private neuralNetworkType: NeuralNetworkType = NeuralNetworkType.PERCEPTRON;
  private features: number[] = [];
  private target: number | null = null;
  private trainingTimer: NodeJS.Timer | null = null;
  private epochInterval = EPOCH_INTERVAL_MS;
  private outputEachEpoch = true;
  private learningRate = .2;
  private batchSize = BATCH_SIZE; // TODO

  private isFirstUpdate = true;
  private network: synaptic.Network = new synaptic.Architect.Perceptron(1, 0, 1);
  private serializedNetwork: object = {};

  // preprocessed column domains generated on network creation
  private columnDomains: Array<Array<number | string>> = [];

  private perceptronOptions: PerceptronOptions = {
    hiddenLayerNumber: 1,
    hiddenLayerSize: 1,
  };

  private isTraining = false;
  // first subset item index in the next batch
  private batchHead = 0;

  private warningMessage = '';

  get neuralNetworkTypeOptions(): SelectOption[] {
    return [
      { label: 'Perceptron', value: NeuralNetworkType.PERCEPTRON },
    ];
  }

  get targetName(): string {
    return this.dataset && this.target !== null ? this.dataset.getColumnName(this.target) : '';
  }

  get featureNames(): string {
    return this.dataset ? this.features.map(feature =>
      this.getDataset().getColumnName(feature)).join(', ') : '';
  }

  public setNeuralNetworkType(type: NeuralNetworkType) {
    this.neuralNetworkType = type;
  }

  public setFeatures(features: number[]) {
    this.features = features;
    this.createNetwork();
  }

  public setTarget(target: number | null) {
    this.target = target;
    this.createNetwork();
  }

  public setBatchSize(size: number) {
    this.batchSize = size;
  }

  public setLearningRate(rate: number) {
    this.learningRate = rate;
  }

  public setEpochInterval(interval: number) {
    this.epochInterval = interval;
  }

  public setOutputEachEpoch(value: boolean) {
    this.outputEachEpoch = value;
  }

  public setPerceptronHiddenLayerNumber(value: number) {
    this.perceptronOptions.hiddenLayerNumber = value;
    this.createNetwork();
  }

  public setPerceptronHiddenLayerSize(size: number) {
    this.perceptronOptions.hiddenLayerSize = size;
    this.createNetwork();
  }

  protected createInputPorts() {
    this.inputPorts = [
      new SubsetInputPort({
        data: {
          id: 'in', // train
          node: this,
        },
        store: this.$store,
      }),
      new SubsetInputPort({
        data: {
          id: 'inTest',
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
    if (!this.features.length) {
      this.coverText = 'No features';
      this.updateNoDatasetOutput();
      return;
    }
    if (this.target === null) {
      this.coverText = 'No target';
      this.updateNoDatasetOutput();
      return;
    }

    // Create network at least once on first update
    if (this.isFirstUpdate) {
      this.createNetwork();
      this.isFirstUpdate = false;
    }

    this.generateDomains();
    this.test();
  }

  protected onDatasetChange() {
    this.features = this.updateColumnsOnDatasetChange(this.features);
    this.createNetwork();
  }

  protected created() {
    this.serializationChain.push((): NeuralNetworkSave => ({
      neuralNetworkType: this.neuralNetworkType,
      features: this.features,
      target: this.target,
      learningRate: this.learningRate,
      epochInterval: this.epochInterval,
      serializedNetwork: this.network.toJSON(),
      batchSize: this.batchSize,
      outputEachEpoch: this.outputEachEpoch,
      perceptronOptions: this.perceptronOptions,
    }));
    this.deserializationChain.push(nodeSave => {
      const save = nodeSave as NeuralNetworkSave;
      this.network = synaptic.Network.fromJSON(save.serializedNetwork);
      this.isFirstUpdate = false; // Use deserialized network and avoid recreation.
    });
  }

  private binarize(value: number | string, domain: Array<number | string>): number[] {
    const valueIndex = domain.indexOf(value);
    const binarized = new Array(domain.length).fill(0);
    binarized[valueIndex] = 1;
    return binarized;
  }

  /**
   * Returns a normalized value of a cell.
   */
  private normalize(column: number, itemIndex: number, dataset: TabularDataset): number[] {
    const domain = this.columnDomains[column];
    if (dataset.getColumnType(column) === ValueType.STRING) {
      return this.binarize(dataset.getCell(itemIndex, column), domain);
    } else {
      const value = dataset.getCell(itemIndex, column) as number;
      const [min, max] = domain as [number, number];
      return [min === max ? 0 : (value - min) / (max - min)];
    }
  }

  private normalizeTrainInput(itemIndex: number): number[] {
    const values: number[] = [];
    for (const column of this.features) {
      values.push.apply(values, this.normalize(column, itemIndex, this.getDataset()));
    }
    return values;
  }

  private normalizeTrainOutput(itemIndex: number): number[] {
    return this.normalize(this.target as number, itemIndex, this.getDataset());
  }

  private normalizeTestInput(itemIndex: number, features: number[]): number[] {
    const testDataset = this.inputPortMap.inTest.getSubsetPackage().getDataset() as TabularDataset;
    const values: number[] = [];
    for (const column of features) {
      values.push.apply(values, this.normalize(column, itemIndex, testDataset));
    }
    return values;
  }

  private train() {
    const trainer = new synaptic.Trainer(this.network);
    const pkg = this.inputPortMap.in.getSubsetPackage();
    const trainingData = pkg.getItemIndices().map(itemIndex => ({
      input: this.normalizeTrainInput(itemIndex),
      output: this.normalizeTrainOutput(itemIndex),
    }));
    trainer.train(trainingData, {
      rate: this.learningRate,
      iterations: TRAIN_ITERATIONS,
    });
    if (this.outputEachEpoch) {
      this.test();
      this.propagate();
    }
  }

  private startTraining() {
    this.isTraining = true;
    if (this.trainingTimer !== null) {
      clearInterval(this.trainingTimer);
    }
    this.trainingTimer = setInterval(this.train, this.epochInterval);
  }

  private pauseTraining() {
    this.isTraining = false;
    if (this.trainingTimer !== null) {
      clearInterval(this.trainingTimer);
    }
  }

  private test() {
    if (!this.inputPortMap.inTest.isConnected()) {
      this.updateNoDatasetOutput();
      return;
    }
    const pkg = this.inputPortMap.inTest.getSubsetPackage();
    if (!pkg.hasDataset()) {
      this.updateNoDatasetOutput();
      return;
    }
    this.warningMessage = '';

    const testDataset = pkg.getDataset() as TabularDataset;
    const dataset = this.getDataset();
    const features = this.features.map(column => dataset.getColumnName(column))
      .map(columnName => {
        const index = testDataset.getColumnIndex(columnName);
        if (index === -1) {
          this.warningMessage = `column ${columnName} not found in test dataset`;
        }
        return index;
      });

    const target = this.target as number;
    const targetType = dataset.getColumnType(target);
    const columns = testDataset.getColumns().map(column => column.name).concat('predicted');
    const rows = pkg.getItemIndices().map(itemIndex => {
      const input = this.normalizeTestInput(itemIndex, features as number[]);
      const result = this.network.activate(input);
      let predicted: string | number = '';
      if (targetType === ValueType.STRING) { // map binarized to string
        const maxIndex = result.indexOf(_.max(result) as number);
        predicted = this.columnDomains[target][maxIndex];
      } else {
        const [min, max] = this.columnDomains[target] as [number, number];
        predicted = min === max ? min : result[0] * (max - min) + min;
      }
      return testDataset.getRow(itemIndex).concat(predicted);
    });
    const newDataset = TabularDataset.fromColumnsAndRows(columns, rows);
    this.updateOutput(new SubsetPackage(newDataset));
  }

  /**
   * Resets and recreates the network.
   */
  private createNetwork() {
    this.isTraining = false;
    if (this.trainingTimer !== null) {
      clearInterval(this.trainingTimer);
    }
    this.generateDomains();
    if (this.neuralNetworkType === NeuralNetworkType.PERCEPTRON) {
      this.createPerceptron();
    }
  }

  private createPerceptron() {
    const dataset = this.getDataset();

    const inputLayers: number[] = [0];
    const hiddenLayers = new Array(this.perceptronOptions.hiddenLayerNumber)
      .fill(this.perceptronOptions.hiddenLayerSize);
    const outputLayers: number[] = [1];

    for (const column of this.features) {
      const domain = this.columnDomains[column];
      if (dataset.getColumnType(column) === ValueType.STRING) {
        inputLayers[0] += domain.length;
      } else {
        inputLayers[0]++;
      }
    }

    if (dataset.getColumnType(this.target as number) === ValueType.STRING) {
      // need binarization for categorical values
      outputLayers[0] = dataset.getDomain(this.target as number).length;
    }

    const layers = inputLayers.concat(hiddenLayers).concat(outputLayers);
    this.network = new synaptic.Architect.Perceptron(...layers);
  }

  private generateDomains() {
    const dataset = this.getDataset();
    this.columnDomains = dataset.getColumns().map(column => dataset.getDomain(column.index));
  }

  private onSelectNeuralNetworkType(type: NeuralNetworkType, prevType: NeuralNetworkType) {
    this.commitHistory(history.selectNeuralNetworkTypeEvent(this, type, prevType));
    this.setNeuralNetworkType(type);
  }

  private onSelectFeatures(features: number[], prevFeatures: number[]) {
    this.commitHistory(history.selectFeaturesEvent(this, features, prevFeatures));
    this.setFeatures(features);
  }

  private onSelectTarget(target: number | null, prevTarget: number | null) {
    this.commitHistory(history.selectTargetEvent(this, target, prevTarget));
    this.setTarget(target);
  }

  private onToggleOutputEachEpoch(value: boolean) {
    this.commitHistory(history.toggleOutputEachEpoch(this, value));
    this.setOutputEachEpoch(value);
  }

  private onInputBatchSize(size: number, prevSize: number) {
    this.commitHistory(history.inputBatchSize(this, size, prevSize));
    this.setBatchSize(size);
  }

  private onInputEpochInterval(interval: number, prevInterval: number) {
    this.commitHistory(history.inputEpochIntervalEvent(this, interval, prevInterval));
    this.setEpochInterval(interval);
  }

  private onInputPerceptronHiddenLayerNumber(value: number, prevValue: number) {
    this.commitHistory(history.inputPerceptronHiddenLayerNumber(this, value, prevValue));
    this.setPerceptronHiddenLayerNumber(value);
  }

  private onInputPerceptronHiddenLayerSize(size: number, prevSize: number) {
    this.commitHistory(history.inputPerceptronHiddenLayerSize(this, size, prevSize));
    this.setPerceptronHiddenLayerSize(size);
  }

  private onInputLearningRate(rate: number, prevRate: number) {
    this.commitHistory(history.inputLearningRateEvent(this, rate, prevRate));
    this.setLearningRate(rate);
  }
}
