import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import Clustering, { ClusteringAlgorithm } from './clustering';

enum ClusteringEventType {
  SELECT_ALGORITHM = 'setAlgorithm',
  SELECT_COLUMNS = 'setColumns',
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
