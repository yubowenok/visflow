import { HistoryNodeEvent, nodeEvent } from '@/store/history/types';
import Table from './table';

enum TableEventType {
  SELECT_COLUMNS = 'select-columns',
}

export const selectColumnsEvent = (node: Table, columns: number[], prevColumns: number[]): HistoryNodeEvent => {
  return nodeEvent(
    TableEventType.SELECT_COLUMNS,
    'select columns',
    node,
    { columns, prevColumns },
  );
};

const undoSelectColumns = (evt: HistoryNodeEvent) => {
  (evt.node as Table).setColumns(evt.data.prevColumns);
};

const redoSelectColumns = (evt: HistoryNodeEvent) => {
  (evt.node as Table).setColumns(evt.data.columns);
};

export const undo = (evt: HistoryNodeEvent): boolean => {
  switch (evt.type) {
    case TableEventType.SELECT_COLUMNS:
      undoSelectColumns(evt);
      break;
    default:
      return false;
  }
  return true;
};

export const redo = (evt: HistoryNodeEvent): boolean => {
  switch (evt.type) {
    case TableEventType.SELECT_COLUMNS:
      redoSelectColumns(evt);
      break;
    default:
      return false;
  }
  return true;
};
