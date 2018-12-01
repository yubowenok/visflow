import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import ParallelCoordinates from './parallel-coordinates';
import { getColumnListInputType } from '@/components/column-list/column-list';

enum ParallelCoordinatesEventType {
  SELECT_COLUMNS = 'setColumns',
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
