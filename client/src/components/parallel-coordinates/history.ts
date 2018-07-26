import { HistoryNodeEvent, nodeEvent } from '@/store/history/types';
import ParallelCoordinates from './parallel-coordinates';

enum ParallelCoordinatesEventType {
  SELECT_COLUMNS = 'select-columns',
}

export const selectColumnsEvent = (node: ParallelCoordinates, columns: number[], prevColumns: number[]):
  HistoryNodeEvent => {
  return nodeEvent(
    ParallelCoordinatesEventType.SELECT_COLUMNS,
    'select columns',
    node,
    { columns, prevColumns },
  );
};

const undoSelectColumns = (evt: HistoryNodeEvent) => {
  (evt.node as ParallelCoordinates).setColumns(evt.data.prevColumns);
};

const redoSelectColumns = (evt: HistoryNodeEvent) => {
  (evt.node as ParallelCoordinates).setColumns(evt.data.columns);
};

export const undo = (evt: HistoryNodeEvent): boolean => {
  switch (evt.type) {
    case ParallelCoordinatesEventType.SELECT_COLUMNS:
      undoSelectColumns(evt);
      break;
    default:
      return false;
  }
  return true;
};

export const redo = (evt: HistoryNodeEvent): boolean => {
  switch (evt.type) {
    case ParallelCoordinatesEventType.SELECT_COLUMNS:
      redoSelectColumns(evt);
      break;
    default:
      return false;
  }
  return true;
};
