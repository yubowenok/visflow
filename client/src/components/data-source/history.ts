import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import { DatasetInfo } from '@/store/dataset/types';
import DataSource from '@/components/data-source/data-source';

enum DataSourceEventType {
  SET_DATASET_INFO = 'setDatasetInfo',
}

// TODO: This event potentially triggers onDatasetChange handler on downflow nodes and may result in
// node options such as column selections being reset.
export const setDatasetInfoEvent = (node: DataSource, datasetInfo: DatasetInfo | null,
                                    prevDatasetInfo: DatasetInfo | null): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    DataSourceEventType.SET_DATASET_INFO,
    'load dataset',
    node,
    node.setDatasetInfo,
    datasetInfo,
    prevDatasetInfo,
  );
};
