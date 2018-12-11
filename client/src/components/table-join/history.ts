import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import TableJoin, { TableJoinMode } from './table-join';

enum TableJoinEventType {
  SELECT_MODE = 'setMode',
  SELECT_LEFT_COLUMN = 'setLeftColumn',
  SELECT_RIGHT_COLUMN = 'setRightColumn',
}

export const selectModeEvent = (node: TableJoin, mode: TableJoinMode, prevMode: TableJoinMode):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    TableJoinEventType.SELECT_MODE,
    'select mode',
    node,
    node.setMode,
    mode,
    prevMode,
  );
};

export const selectLeftColumnEvent = (node: TableJoin, column: number, prevColumn: number): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    TableJoinEventType.SELECT_LEFT_COLUMN,
    'select left column',
    node,
    node.setLeftColumn,
    column,
    prevColumn,
  );
};

export const selectRightColumnEvent = (node: TableJoin, column: number, prevColumn: number): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    TableJoinEventType.SELECT_RIGHT_COLUMN,
    'select right column',
    node,
    node.setRightColumn,
    column,
    prevColumn,
  );
};
