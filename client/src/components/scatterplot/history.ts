import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import Scatterplot from './scatterplot';

enum ScatterplotEventType {
  SELECT_X_COLUMN = 'select-x-column',
  SELECT_Y_COLUMN = 'select-y-column',
}

export const selectXColumnEvent = (node: Scatterplot, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ScatterplotEventType.SELECT_X_COLUMN,
    'select X column',
    node,
    node.setXColumn,
    column,
    prevColumn,
  );
};

export const selectYColumnEvent = (node: Scatterplot, column: number | null, prevColumn: number | null):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ScatterplotEventType.SELECT_Y_COLUMN,
    'select Y column',
    node,
    node.setYColumn,
    column,
    prevColumn,
  );
};
