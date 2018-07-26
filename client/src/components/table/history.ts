import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import Table from './table';

enum TableEventType {
  SELECT_COLUMNS = 'select-columns',
}

export const selectColumnsEvent = (node: Table, columns: number[], prevColumns: number[]):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    TableEventType.SELECT_COLUMNS,
    'select columns',
    node,
    node.setColumns,
    columns,
    prevColumns,
  );
};
