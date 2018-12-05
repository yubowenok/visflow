import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import ParallelCoordinates from './parallel-coordinates';
import { getColumnListInputType } from '@/components/column-list/column-list';

enum ParallelCoordinatesEventType {
  SELECT_COLUMNS = 'setColumns',
  TOGGLE_AXIS_MARGIN = 'setAxisMargin',
  TOGGLE_USE_DATASET_RANGE = 'setUseDatasetRange',
}

export const selectColumnsEvent = (node: ParallelCoordinates, columns: number[], prevColumns: number[]):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ParallelCoordinatesEventType.SELECT_COLUMNS,
    getColumnListInputType(columns, prevColumns),
    node,
    node.setColumns,
    columns,
    prevColumns,
  );
};

export const toggleAxisMarginEvent = (node: ParallelCoordinates, value: boolean): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ParallelCoordinatesEventType.TOGGLE_AXIS_MARGIN,
    'toggle axis margin',
    node,
    node.setAxisMargin,
    value,
    !value,
  );
};

export const toggleUseDatasetRangeEvent = (node: ParallelCoordinates, value: boolean): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ParallelCoordinatesEventType.TOGGLE_USE_DATASET_RANGE,
    'toggle use dataset range',
    node,
    node.setUseDatasetRange,
    value,
    !value,
  );
};
