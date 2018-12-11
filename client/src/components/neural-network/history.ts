import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import NeuralNetwork, { NeuralNetworkType } from './neural-network';

enum NeuralNetworkEventType {
  SELECT_NEURAL_NETWORK_TYPE = 'setNeuralNetworkType',
  SELECT_FEATURES = 'setFeatures',
  SELECT_TARGET = 'setTarget',
  TOGGLE_OUTPUT_EACH_EPOCH = 'setOutputEachEpoch',
  INPUT_EPOCH_INTERVAL = 'setEpochInterval',
  INPUT_BATCH_SIZE = 'setBatchSize',
  INPUT_PERCEPTRON_HIDDEN_LAYER_NUMBER = 'setPerceptronHiddenLayerNumber',
  INPUT_PERCEPTRON_HIDDEN_LAYER_SIZE = 'setPerceptronHiddenLayerSize',
  INPUT_LEARNING_RATE = 'setLearningRate',
}

export const selectNeuralNetworkTypeEvent = (node: NeuralNetwork, type: NeuralNetworkType, prevType: NeuralNetworkType):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    NeuralNetworkEventType.SELECT_NEURAL_NETWORK_TYPE,
    'select neural network type',
    node,
    node.setNeuralNetworkType,
    type,
    prevType,
  );
};

export const selectFeaturesEvent = (node: NeuralNetwork, features: number[], prevFeatures: number[]):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    NeuralNetworkEventType.SELECT_FEATURES,
    'select features',
    node,
    node.setFeatures,
    features,
    prevFeatures,
  );
};

export const selectTargetEvent = (node: NeuralNetwork, target: number | null, prevTarget: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    NeuralNetworkEventType.SELECT_TARGET,
    'select target',
    node,
    node.setTarget,
    target,
    prevTarget,
  );
};

export const toggleOutputEachEpoch = (node: NeuralNetwork, value: boolean): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    NeuralNetworkEventType.TOGGLE_OUTPUT_EACH_EPOCH,
    'output each epoch',
    node,
    node.setOutputEachEpoch,
    value,
    !value,
  );
};

export const inputEpochIntervalEvent = (node: NeuralNetwork, interval: number, prevInterval: number):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    NeuralNetworkEventType.INPUT_EPOCH_INTERVAL,
    'input epoch interval',
    node,
    node.setEpochInterval,
    interval,
    prevInterval,
  );
};

export const inputBatchSize = (node: NeuralNetwork, size: number, prevSize: number):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    NeuralNetworkEventType.INPUT_BATCH_SIZE,
    'input batch size',
    node,
    node.setBatchSize,
    size,
    prevSize,
  );
};

export const inputPerceptronHiddenLayerNumber = (node: NeuralNetwork, value: number, prevValue: number):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    NeuralNetworkEventType.INPUT_PERCEPTRON_HIDDEN_LAYER_NUMBER,
    'input hidden layer number',
    node,
    node.setPerceptronHiddenLayerNumber,
    value,
    prevValue,
  );
};

export const inputPerceptronHiddenLayerSize = (node: NeuralNetwork, size: number, prevSize: number):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    NeuralNetworkEventType.INPUT_PERCEPTRON_HIDDEN_LAYER_SIZE,
    'input hidden layer size',
    node,
    node.setPerceptronHiddenLayerSize,
    size,
    prevSize,
  );
};

export const inputLearningRateEvent = (node: NeuralNetwork, rate: number, prevRate: number):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    NeuralNetworkEventType.INPUT_LEARNING_RATE,
    'input learning rate',
    node,
    node.setLearningRate,
    rate,
    prevRate,
  );
};
