import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import Scatterplot from './scatterplot';

enum ScatterplotEventType {
  SELECT_X_COLUMN = 'setXColumn',
  SELECT_Y_COLUMN = 'setYColumn',
  TOGGLE_TRANSITION_DISABLED = 'setTransitionDisabled',
  TOGGLE_USE_DATASET_RANGE = 'setUseDatasetRange',
  TOGGLE_AXIS_MARGIN = 'setAxisMargin',
  TOGGLE_X_AXIS_TICKS_VISIBLE = 'setXAxisTicksVisible',
  TOGGLE_Y_AXIS_TICKS_VISIBLE = 'setYAxisTicksVisible',
  TOGGLE_TRANSPARENT_BACKGROUND = 'setTransparentBackground',
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

export const toggleUseDatasetRangeEvent = (node: Scatterplot, value: boolean): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ScatterplotEventType.TOGGLE_USE_DATASET_RANGE,
    'toggle use dataset range',
    node,
    node.setUseDatasetRange,
    value,
    !value,
  );
};

export const toggleAxisMarginEvent = (node: Scatterplot, value: boolean): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ScatterplotEventType.TOGGLE_AXIS_MARGIN,
    'toggle axis margin',
    node,
    node.setAxisMargin,
    value,
    !value,
  );
};

export const toggleXAxisTicksVisibleEvent = (node: Scatterplot, value: boolean):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ScatterplotEventType.TOGGLE_X_AXIS_TICKS_VISIBLE,
    'toggle X axis ticks',
    node,
    node.setXAxisTicksVisible,
    value,
    !value,
  );
};

export const toggleYAxisTicksVisibleEvent = (node: Scatterplot, value: boolean):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ScatterplotEventType.TOGGLE_Y_AXIS_TICKS_VISIBLE,
    'toggle Y axis ticks',
    node,
    node.setYAxisTicksVisible,
    value,
    !value,
  );
};

export const toggleTransparentBackgroundEvent = (node: Scatterplot, value: boolean): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ScatterplotEventType.TOGGLE_TRANSPARENT_BACKGROUND,
    'toggle transparent background',
    node,
    node.setTransparentBackground,
    value,
    !value,
  );
};
