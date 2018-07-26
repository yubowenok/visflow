import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import ParallelCoordinates from './parallel-coordinates';

enum ParallelCoordinatesEventType {
  SELECT_COLUMNS = 'select-columns',
}

export const selectColumnsEvent = (node: ParallelCoordinates, columns: number[], prevColumns: number[]):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ParallelCoordinatesEventType.SELECT_COLUMNS,
    'select columns',
    node,
    node.setColumns,
    columns,
    prevColumns,
  );
};
