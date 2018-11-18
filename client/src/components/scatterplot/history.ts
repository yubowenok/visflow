import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import Scatterplot from './scatterplot';

enum ScatterplotEventType {
  SELECT_X_COLUMN = 'select-x-column',
  SELECT_Y_COLUMN = 'select-y-column',
  TOGGLE_TRANSITION_DISABLED = 'toggle-transition-disabled',
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

export const toggleTransitionDisabledEvent = (node: Scatterplot, value: boolean): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ScatterplotEventType.TOGGLE_TRANSITION_DISABLED,
    'toggle disable transition',
    node,
    node.setTransitionDisabled,
    value,
    !value,
  );
};
