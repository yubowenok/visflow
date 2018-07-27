import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import Table from './table';
import { getColumnListInputType } from '@/components/column-list/column-list';

enum TableEventType {
  SELECT_COLUMNS = 'select-columns',
}

export const selectColumnsEvent = (node: Table, columns: number[], prevColumns: number[]):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    TableEventType.SELECT_COLUMNS,
    getColumnListInputType(columns, prevColumns),
    node,
    node.setColumns,
    columns,
    prevColumns,
  );
};
