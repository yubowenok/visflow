import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import Clustering, { ClusteringAlgorithm } from './clustering';

enum ClusteringEventType {
  SELECT_ALGORITHM = 'setAlgorithm',
  SELECT_COLUMNS = 'setColumns',
  INPUT_KMEANS_K = 'setKMeansK',
  INPUT_KMEANS_ITERATION_INTERVAL = 'setKMeansIterationInterval',
}

export const selectAlgorithmEvent = (node: Clustering, algorithm: ClusteringAlgorithm,
                                     prevAlgorithm: ClusteringAlgorithm):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ClusteringEventType.SELECT_ALGORITHM,
    'select clustering algorithm',
    node,
    node.setAlgorithm,
    algorithm,
    prevAlgorithm,
  );
};

export const selectColumnsEvent = (node: Clustering, columns: number[], prevColumns: number[]):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ClusteringEventType.SELECT_COLUMNS,
    'select column',
    node,
    node.setColumns,
    columns,
    prevColumns,
  );
};

export const inputKMeansKEvent = (node: Clustering, k: number, prevK: number):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ClusteringEventType.INPUT_KMEANS_K,
    'input k',
    node,
    node.setKMeansK,
    k,
    prevK,
  );
};

export const inputKMeansIterationIntervalEvent = (node: Clustering, interval: number, prevInterval: number):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ClusteringEventType.INPUT_KMEANS_ITERATION_INTERVAL,
    'input iteration interval',
    node,
    node.setKMeansIterationInterval,
    interval,
    prevInterval,
  );
};
